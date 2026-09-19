// Public-audience redesign (docs/ui-engagement-handoff.md, DECISIONS.md section F).
// New behaviour is tested here; the older gates keep their own spec files.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LABEL, finishTurn, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";

// ---------------------------------------------------------------- the opening (dilemma first)

/** A phone, the reviewer's window and a laptop: the first decision must be on the first screen of each. */
const FIRST_SCREENS = [
  { width: 375, height: 667 },
  { width: 726, height: 900 },
  { width: 1280, height: 800 },
];

/** A facilitator's link with one edited probability (the same edit polish.spec.ts makes), so the title shows its notice. */
const FACILITATOR_LINK = "/?seed=WORKSHOP&cfg=eyJldmVudHMiOnsiaW5mcmEtYXR0YWNrIjp7IndoZW5UcnVlIjo5MH19fQ";

for (const viewport of FIRST_SCREENS) {
  test(`the first decision is on the first screen at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const url of ["/", "/?seed=FRIEND-01", FACILITATOR_LINK]) {        // plain, a friend's link, a facilitator's link
      await page.goto(url);
      await page.evaluate(async () => { await document.fonts.ready; });     // measure the real type, not the fallback
      const box = await page.getByRole("button", { name: LABEL.start }).boundingBox();
      expect(box, url).not.toBeNull();
      expect(box!.y, `${url}: top of the button`).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, `${url}: bottom of the button`).toBeLessThanOrEqual(viewport.height);
      expect(box!.x + box!.width, `${url}: right edge of the button`).toBeLessThanOrEqual(viewport.width);
    }
  });
}

test("the opening leads with the dilemma and counts the decisions from the content", async ({ page }) => {
  await startGame(page, "COUNT-1");                                         // the game's own count, from the header
  const total = /^Turn 1 of (\d+)/.exec(await page.getByText(/^Turn 1 of \d+/).innerText())?.[1];
  expect(total).toBeTruthy();

  await page.goto("/");
  await expect(page.getByText(/^AI could make us healthier, wealthier and safer\./)).toBeVisible();
  await expect(page.getByText(new RegExp(`^About 25 minutes for ${total} decisions\\.`))).toBeVisible();
  // One line per decision: the static list must change when the content does.
  await expect(page.getByRole("region", { name: "What you will face" }).getByRole("listitem")).toHaveCount(Number(total));
  await expect(page.getByText("The Frontier Technology Risk Unit and its advisers are fictional.")).toBeVisible();
});

test("the seed code waits in a disclosure, and the first decision plays the code it holds", async ({ page }) => {
  await page.goto("/");
  const seedField = page.getByLabel(/^Seed code/);
  await expect(seedField).toBeHidden();
  await page.getByText("Play the same world as a friend").click();
  await seedField.fill("FRIEND-02");
  await expect(seedField).toBeVisible();                                   // typing does not close the disclosure
  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("seed")).toBe("FRIEND-02");

  await page.goto("/?seed=FRIEND-01");                                     // a friend's link opens it, filled in
  await expect(seedField).toBeVisible();
  await expect(seedField).toHaveValue("FRIEND-01");
  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("seed")).toBe("FRIEND-01");
});

test("Play again brings focus back to the title heading", async ({ page }) => {
  const title = page.getByRole("heading", { level: 1, name: "AI 2032" });
  await page.goto("/");
  await page.evaluate(async () => { await document.fonts.ready; });        // React has rendered and run its effects
  await expect(title).toBeVisible();
  // A first visit leaves focus alone: focusing the h1 by script on load draws the focus ring round the name.
  expect(await page.evaluate(() => document.activeElement === document.body), "first visit: focus stays on the page").toBe(true);

  await startGame(page, "FOCUS-1");
  await playToDebrief(page);
  await page.getByRole("button", { name: /^Play (again|a new world)$/ }).click();   // Phase 13 renames it "Play a new world"
  await expect(title).toBeFocused();
});

// ---------------------------------------------------------------- print-production labels

/**
 * Width and state labels such as "720pt" or "48mm", and figure numbers such as "Fig. 01".
 * Case-insensitive: innerText applies CSS text-transform, so an uppercase label reads "FIG. 01".
 */
const PRINT_LABELS = [/\b\d+\s?(pt|mm)\b/i, /\bFig\.\s?\w+/i];

/**
 * Only rendered text counts: innerText skips hidden elements and closed disclosures.
 * Some plates have a figure number drawn into the artwork itself; those are pixels, not text.
 */
async function expectNoPrintLabels(page: Page, where: string) {
  const text = await page.locator("body").innerText();
  for (const pattern of PRINT_LABELS) expect(text, `${where} shows ${pattern}`).not.toMatch(pattern);
}

test("no screen shows print-production labels", async ({ page }) => {
  await page.goto("/?seed=LABELS-1");
  await expectNoPrintLabels(page, "title");

  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  await expectNoPrintLabels(page, "briefing");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expectNoPrintLabels(page, "forecast");

  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  await expectNoPrintLabels(page, "decision");

  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await expectNoPrintLabels(page, "investment");

  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expectNoPrintLabels(page, "consequences");

  await startGame(page, "LABELS-1");                                         // the helpers play the rest
  await playToDebrief(page);
  await expectNoPrintLabels(page, "debrief");
});

// ---------------------------------------------------------------- readable labels

/** Every piece of rendered text, chart ticks included, whose computed size is under 12px (Tailwind's text-xs). */
async function expectNoTextUnder12px(page: Page, where: string) {
  const tiny = await page.evaluate(() => {
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      const text = node.textContent?.trim();
      if (!text || !element || !element.checkVisibility()) continue;       // hidden, or inside a closed disclosure
      const box = element.getBoundingClientRect();
      if (box.bottom + window.scrollY <= 0) continue;                      // the chart library's measuring span, parked off the page
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 12) found.push(`${size}px "${text.slice(0, 40)}"`);
    }
    return found;
  });
  expect(tiny, `${where}: text under 12px`).toEqual([]);
}

test("no text in the game is smaller than 12px", async ({ page }) => {
  await page.goto("/?facilitator=1&seed=LABELS-1");                         // the facilitator panel sits on the title
  await page.getByText("Base odds of events").click();
  await expectNoTextUnder12px(page, "title and facilitator panel");

  await page.getByRole("button", { name: LABEL.start }).click();
  await page.getByText("Real-world evidence behind this fictional scenario").click();
  await expectNoTextUnder12px(page, "briefing with evidence open");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expectNoTextUnder12px(page, "forecast");

  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await page.getByRole("button", { name: /^Commission analysis/ }).click();
  await expectNoTextUnder12px(page, "decision with analysis");

  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await expectNoTextUnder12px(page, "investment");

  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expectNoTextUnder12px(page, "consequences");

  await startGame(page, "LABELS-1");
  await playTurn(page);                                                     // turn 2's briefing lists what turn 1 told you
  await expectNoTextUnder12px(page, "second briefing");
  await playUntil(page, "The Deepfake Election");                          // a crisis turn shows the clock
  await expectNoTextUnder12px(page, "crisis briefing");
  await toDecision(page);
  await expectNoTextUnder12px(page, "crisis decision");
  await finishTurn(page);
  await playToDebrief(page);
  await expectNoTextUnder12px(page, "debrief");
});

test("the title screen has no steps rail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AI 2032" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

// ---------------------------------------------------------------- sharing a link

/** The same words describe the page to search engines and to link previews in chat apps. */
const DESCRIPTION =
  "A browser game about the benefits and dangers of AI. Govern as a fictional UK official from 2026 to 2032 and see what might change your mind. About 25 minutes.";

test("a shared link carries a plain description for link previews", async ({ page }) => {
  await page.goto("/");
  const meta = (attribute: string) => page.locator(`head > meta[${attribute}]`);
  await expect(meta('name="description"')).toHaveAttribute("content", DESCRIPTION);
  await expect(meta('property="og:title"')).toHaveAttribute("content", "AI 2032");
  await expect(meta('property="og:description"')).toHaveAttribute("content", DESCRIPTION);
  await expect(meta('property="og:type"')).toHaveAttribute("content", "website");
});

// ---------------------------------------------------------------- Phase 10: briefing and forecast

test.describe("briefing and forecast", () => {
  /** The same bar as Phase 8's expectNoSeriousViolations in polish.spec.ts (DECISIONS B42): no violations at any impact, best-practice rules included. */
  const expectAxeClean = async (page: Page, where: string) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(results.violations.map((v) => `${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
  };

  test("each adviser says what they care about and what they back, and every open option shows who backs it", async ({ page }) => {
    await startGame(page, "BRIEF-1");
    const cards = page.getByRole("region", { name: "Advisers" }).getByRole("article");
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card.getByRole("heading", { level: 3 })).toBeVisible();
      await expect(card).toContainText("Cares about:");
      await expect(card).toContainText(/Backs option [A-E]: /);
    }
    await expect(page.getByText("Adviser file")).toHaveCount(0);
    await expect(page.getByText(/Recommends option/)).toHaveCount(0);

    const split = page.getByRole("region", { name: "Who backs what" });
    await expect(split.getByRole("listitem")).toHaveCount(4);
    await expect(split.getByText(/^(Backed by .+|No adviser backs this option)\.$/)).toHaveCount(4);
    // The lever and the visible effects are on the decision step; the briefing no longer repeats them.
    await expect(page.getByText(/Convening and alliances/)).toHaveCount(0);

    await expect(page.getByRole("region", { name: "Assessment" }).getByRole("heading", { name: "What your analysts think" })).toBeVisible();
  });

  test("earlier reports are folded behind a count on the briefing", async ({ page }) => {
    await startGame(page, "BRIEF-2");
    await playTurn(page);
    const summary = page.getByText(/^What you have been told so far \(\d+ reports?\)$/);
    await expect(summary).toBeVisible();
    await expect(page.getByText(/Turn 1 · Briefing assessment/i)).toBeHidden();
    await summary.click();
    await expect(page.getByText(/Turn 1 · Briefing assessment/i)).toBeVisible();
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await expectAxeClean(page, `briefing with earlier reports open (${colorScheme})`);
    }
  });
});
