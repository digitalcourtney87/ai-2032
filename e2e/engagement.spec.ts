// Public-audience redesign (docs/ui-engagement-handoff.md, DECISIONS.md section F).
// New behaviour is tested here; the older gates keep their own spec files.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
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
  const RECAP = "Look again at the briefing and your advisers";
  const COMPARE = "Compare with your advisers";

  const toForecast = async (page: Page) => {
    await page.getByRole("button", { name: LABEL.continueToForecast }).click();
    await expect(page.getByRole("slider")).toBeVisible();
  };

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

  test("the advisers' estimates stay hidden until the player compares, then sit on the slider's own scale", async ({ page }) => {
    await startGame(page, "FORECAST-1");
    await toForecast(page);
    await expect(page.getByRole("heading", { level: 2, name: "How likely do you think this is?" })).toBeVisible();
    await expect(page.getByText("We will find out by December 2029.")).toBeVisible();
    await expect(page.getByTestId("adviser-mark")).toHaveCount(0);
    await expect(page.getByText(/^You said/)).toHaveCount(0);

    const slider = page.getByRole("slider");
    await slider.fill("35");
    await expect(slider).toHaveAttribute("aria-valuetext", "35%, unlikely");

    const compare = page.getByRole("button", { name: COMPARE });
    await expect(compare).toHaveAttribute("aria-expanded", "false");
    await compare.click();
    await expect(compare).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("adviser-mark")).toHaveCount(4);
    await expect(page.getByText(/^You said 35%\. Your advisers (range from \d+% to \d+%|all say \d+%)\.$/)).toBeVisible();
    const estimates = page.getByRole("list", { name: "Your advisers’ estimates" }).getByRole("listitem");
    await expect(estimates).toHaveCount(4);

    // A mark sits where the thumb's centre would be: pressing the track under a mark sets that estimate.
    const first = Number((await estimates.first().innerText()).match(/(\d+)%/)![1]);
    const mark = (await page.getByTestId("adviser-mark").first().boundingBox())!;
    const track = (await slider.boundingBox())!;
    await slider.click({ position: { x: mark.x + mark.width / 2 - track.x, y: track.height / 2 } });
    expect(Math.abs(Number(await slider.inputValue()) - first)).toBeLessThanOrEqual(1);

    // Moving the slider afterwards changes the forecast, not what the player first said.
    await slider.fill("60");
    await expect(page.getByText(/^You said 35%\./)).toBeVisible();
    await page.getByRole("button", { name: "Lock in 60%" }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("Lock in works without comparing", async ({ page }) => {
    await startGame(page, "FORECAST-2");
    await toForecast(page);
    await page.getByRole("slider").fill("70");
    await page.getByRole("button", { name: "Lock in 70%" }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("by keyboard: the slider comes first after the title, then Compare, then Lock in", async ({ page }) => {
    await startGame(page, "FORECAST-KEYS");
    await toForecast(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("slider")).toBeFocused();
    for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "35%, unlikely");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: COMPARE })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("adviser-mark")).toHaveCount(4);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Lock in 35%" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("comparing before moving the slider does not claim a guess", async ({ page }) => {
    await startGame(page, "FORECAST-3");
    await toForecast(page);
    await page.getByRole("button", { name: COMPARE }).click();
    await expect(page.getByText(/^Under this game's assumptions, these are your advisers' own estimates/)).toBeVisible();
    await expect(page.getByText(/^You compared before moving the slider\. Your advisers (range from \d+% to \d+%|all say \d+%)\.$/)).toBeVisible();
    await expect(page.getByText(/^You said/)).toHaveCount(0);
    // Moving the slider afterwards does not rewrite what the player had done when they compared.
    await page.getByRole("slider").fill("40");
    await expect(page.getByText(/^You compared before moving the slider\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Lock in 40%" })).toBeVisible();
  });

  test("the final question says the game settles it", async ({ page }) => {
    await startGame(page, "FINAL-Q");
    await playUntil(page, "The 2032 Threshold");
    await toForecast(page);
    await expect(page.getByText(/^We would only find out by October 2034, after the game ends/)).toBeVisible();
  });

  test("in forced colours the track and the marks' stems are still drawn", async ({ page }) => {
    await startGame(page, "FORCED-1");
    await toForecast(page);
    const slider = page.getByRole("slider");
    await slider.fill("0"); // the thumb sits at the left end, clear of the stretch of track checked below
    await page.getByRole("button", { name: COMPARE }).click();
    await page.emulateMedia({ forcedColors: "active" });
    await slider.scrollIntoViewIfNeeded();

    // Each check photographs a small area, hides the element, and photographs it again.
    // Identical pictures mean forced colours had already painted the element out.
    const drawn = async (element: Locator, clip: { x: number; y: number; width: number; height: number }) => {
      const shown = await page.screenshot({ clip });
      await element.evaluate((node) => { (node as HTMLElement).style.visibility = "hidden"; });
      const hidden = await page.screenshot({ clip });
      await element.evaluate((node) => { (node as HTMLElement).style.visibility = ""; });
      return !shown.equals(hidden);
    };
    const track = (await slider.boundingBox())!;
    // By id, not by role: a role locator no longer finds the slider once it is hidden.
    expect(await drawn(page.locator("#forecast"), { x: track.x + track.width * 0.6, y: track.y + track.height / 2 - 4, width: track.width * 0.3, height: 8 })).toBe(true);
    const stem = page.getByTestId("adviser-mark").first().locator(":scope > span").last();
    const stemBox = (await stem.boundingBox())!;
    expect(await drawn(stem, { x: stemBox.x - 1, y: stemBox.y, width: stemBox.width + 2, height: stemBox.height })).toBe(true);
  });

  test("the briefing can be read again, folded, on the forecast and decision steps", async ({ page }) => {
    await startGame(page, "RECAP-1");
    const stances = await page.getByRole("region", { name: "Advisers" }).locator("article blockquote").allInnerTexts();
    expect(stances).toHaveLength(4);

    await toForecast(page);
    const recap = page.locator("#briefing-recap");
    await expect(recap).not.toHaveAttribute("open");
    await recap.getByText(RECAP).click();
    await expect(recap.locator("article blockquote")).toHaveText(stances);
    await expect(recap.getByText(/Puts the chance at \d+%/)).toHaveCount(0); // no estimates before the player's own forecast
    await expect(recap.getByText(/^Under this game’s assumptions, these are their forecasts for this turn’s question: /)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Assessment" })).toHaveCount(1);

    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await expect(recap).not.toHaveAttribute("open"); // a new step, so a new, folded recap
    await recap.getByText(RECAP).click();
    await expect(recap.locator("article blockquote")).toHaveText(stances);
    await expect(recap.getByText(/Puts the chance at \d+%/)).toHaveCount(4); // the forecast is locked now
    await expect(recap.getByText(/^Under this game’s assumptions, these are their forecasts for this turn’s question: /)).toBeVisible(); // what the chance is of
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("nothing scrolls sideways on a phone with the estimates or the recap open", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await startGame(page, "PHONE-FORECAST");
    await toForecast(page);
    await page.getByRole("button", { name: COMPARE }).click();
    await page.getByText(RECAP).click();
    expect(await overflow(), "forecast with the estimates and the recap open").toBeLessThanOrEqual(0);

    // The decision step with the recap open adds the split, four cards and their estimates.
    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await page.getByText(RECAP).click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    expect(await overflow(), "decision with the recap open").toBeLessThanOrEqual(0);
  });

  test("the rail's past Briefing step opens the folded briefing", async ({ page }) => {
    await startGame(page, "RECAP-2");
    const rail = page.getByRole("navigation", { name: "Steps in this turn" });
    await expect(rail.getByRole("link")).toHaveCount(0); // nothing to go back to on the briefing itself

    await toForecast(page);
    const link = rail.getByRole("link", { name: /Briefing/ });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24); // WCAG 2.2 target size
    await link.click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    await expect(page.locator("#briefing-recap > summary")).toBeFocused();

    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await rail.getByRole("link", { name: /Briefing/ }).click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    await expect(page.locator("#briefing-recap > summary")).toBeFocused();
    // The skip link leads to the step itself, which on this step is not the briefing.
    await expect(page.getByRole("link", { name: "Skip to the main content" })).toHaveCount(1);
  });
});

// ---------------------------------------------------------------- Phase 11: decision, investment and consequences

test.describe("decision, investment and consequences", () => {
  test("choosing an option previews the Political Capital it would leave", async ({ page }) => {
    await startGame(page, "PREVIEW-E2E");
    await toDecision(page);
    await expect(page.getByText("Choose an option to see what it would cost.")).toBeVisible();
    const capital = Number((await page.getByLabel(/^\d+ Political Capital$/).getAttribute("aria-label"))!.split(" ")[0]);
    const option = page.locator('input[name="choice"]:enabled').first();
    const id = (await option.getAttribute("id"))!.replace("choice-", "");
    const cost = Number(/Cost:\s*(\d+) Political Capital/.exec(await page.locator(`#choice-${id}-detail`).innerText())![1]);

    await option.check();
    await expect(page.getByText(`Option ${id}: Political Capital ${capital} → ${capital - cost} (costs ${cost}).`)).toBeVisible();
    await expect(page.getByRole("heading", { name: `If you choose option ${id}` })).toBeVisible();
    await expect(page.getByText("plans do not always work out", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: `Confirm option ${id}` })).toBeEnabled();
  });

  test("on a desktop, the Political Capital an option would leave is in view as soon as it is picked", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await startGame(page, "PREVIEW-DESKTOP");
    await toDecision(page);
    await page.locator('input[name="choice"]:enabled').first().check();
    await expect(page.getByText(/^Option [A-E]: Political Capital \d+ → \d+/)).toBeInViewport();
    await expect(page.getByRole("button", { name: LABEL.confirm })).toBeInViewport();
  });
});
