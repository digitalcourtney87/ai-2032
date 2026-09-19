// Phase 7 gate: an automated accessibility pass (axe) reports no violations at any
// impact, best-practice rules included, and the same seed code reproduces an
// identical run start to finish.
// Also: the seed round-trips through the URL, the facilitator editor shares its
// edits by link, and the game is fully keyboard operable.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LABEL, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";

async function summaryOf(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Show as JSON" }).click();
  return page.getByLabel("Run summary", { exact: true }).innerText();
}

// ---------------------------------------------------------------- reproducibility

test("the same seed code and the same actions reproduce an identical run, start to finish", async ({ browser }) => {
  const runs: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const page = await (await browser.newContext()).newPage();
    await startGame(page, "REPRODUCE-ME");
    await playToDebrief(page, { prefer: "B", track: "Diplomacy", forecast: 35 });
    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });  // rankings arrive from the worker
    const tags = await page.getByTestId("luck-tag").allInnerTexts();
    runs.push(JSON.stringify({ summary: await summaryOf(page), ending: await page.getByRole("heading", { level: 1 }).innerText(), tags }));
    await page.context().close();
  }
  expect(runs[0]).toBe(runs[1]);
  expect(runs[0]).toContain("REPRODUCE-ME");
});

test("the seed code round-trips through the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: LABEL.start }).click();                 // no code entered: a new one is generated
  const seed = new URL(page.url()).searchParams.get("seed");
  expect(seed).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  const assessment = await page.getByRole("region", { name: "Assessment" }).innerText();

  await page.goto(page.url());                                              // the shared link
  await expect(page.getByLabel(/^Seed code/)).toHaveValue(seed!);
  await page.getByRole("button", { name: LABEL.start }).click();
  expect(await page.getByRole("region", { name: "Assessment" }).innerText()).toBe(assessment);
});

// ---------------------------------------------------------------- facilitator mode

test("the facilitator panel is hidden from players", async ({ page }) => {
  await page.goto("/?seed=PLAYER");
  await expect(page.getByRole("heading", { name: "Facilitator settings" })).toHaveCount(0);
});

test("a facilitator's edits travel in the participant link and show up in the debrief", async ({ page }) => {
  await page.goto("/?facilitator=1&seed=WORKSHOP");
  await expect(page.getByRole("heading", { name: "Facilitator settings" })).toBeVisible();
  await page.getByText("Base odds of events").click();
  const attackOdds = page.locator("#event-infra-attack-whenTrue");
  await expect(attackOdds).toHaveValue("50");
  await attackOdds.fill("90");
  await expect(page.getByText(/1 number edited/)).toBeVisible();

  const link = await page.getByTestId("participant-link").innerText();
  expect(link).toContain("seed=WORKSHOP");
  expect(link).toContain("cfg=");
  expect(link).not.toContain("facilitator");

  await page.goto(link);                                                     // what a participant opens
  await expect(page.getByText("This session uses edited assumptions.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Facilitator settings" })).toHaveCount(0);
  await page.getByRole("button", { name: LABEL.start }).click();
  expect(new URL(page.url()).searchParams.get("cfg")).toBeTruthy();          // the edits stay in the URL beside the seed
  await playToDebrief(page);
  await page.getByText("View assumptions").click();
  await page.getByLabel("The decision to change").selectOption({ index: 0 });
  await expect(page.getByText(/Disruptive AI-enabled attack on UK critical infrastructure/).first()).toBeVisible();
});

// ---------------------------------------------------------------- accessibility

/**
 * No axe violations at any impact, with axe's best-practice rules as well as WCAG 2.2 AA.
 * heading-order and page-has-heading-one are best-practice rules: they are what checks that
 * heading levels never skip and that each screen has one h1. The name is kept because later phases call it.
 */
async function expectNoSeriousViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(results.violations.map((v) => `${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations on any screen (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/?facilitator=1&seed=AXE-RUN");
    await page.getByText("Base odds of events").click();
    await expectNoSeriousViolations(page, "title and facilitator panel");

    await page.getByRole("button", { name: LABEL.start }).click();
    await expectNoSeriousViolations(page, "briefing");
    await page.getByText("Real-world evidence behind this fictional scenario").click();
    await expectNoSeriousViolations(page, "briefing with evidence open");

    await page.getByRole("button", { name: LABEL.continueToForecast }).click();
    await expectNoSeriousViolations(page, "forecast");
    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await page.getByRole("button", { name: /^Commission analysis/ }).click();
    await expectNoSeriousViolations(page, "decision");
    await page.locator('input[name="choice"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await expectNoSeriousViolations(page, "investment");
    await page.locator('input[name="track"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.investIn }).click();
    await expectNoSeriousViolations(page, "news");
    await page.getByRole("button", { name: LABEL.next }).click();

    await playUntil(page, "The Deepfake Election");
    await expectNoSeriousViolations(page, "crisis briefing");
    await toDecision(page);
    await expectNoSeriousViolations(page, "crisis decision");
    await page.locator('input[name="choice"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await page.locator('input[name="track"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.investIn }).click();
    await page.getByRole("button", { name: LABEL.next }).click();

    await playToDebrief(page);
    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
    await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
    await expect(page.getByTestId("what-if-result")).toBeVisible();
    await page.getByText("View assumptions").click();
    await expectNoSeriousViolations(page, "debrief");
  });
}

test("a whole turn can be played with the keyboard alone", async ({ page }) => {
  await page.goto("/?seed=KEYBOARD");
  const press = async (key: string, times = 1) => { for (let i = 0; i < times; i++) await page.keyboard.press(key); };
  const focusOn = async (name: RegExp) => {
    for (let i = 0; i < 60; i++) {
      await press("Tab");
      const label = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText || document.activeElement?.getAttribute("aria-label") || "");
      if (name.test(label)) return;
    }
    throw new Error(`Could not reach ${name} by keyboard`);
  };

  await focusOn(new RegExp(`^${LABEL.start}$`));
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();      // focus follows the player to each new step
  await focusOn(new RegExp(`^${LABEL.continueToForecast}$`));
  await press("Enter");

  await press("Tab");                                                        // the slider is the first control on the step
  await expect(page.getByRole("slider")).toBeFocused();
  await press("ArrowLeft", 15);
  await expect(page.getByRole("button", { name: "Lock in 35%" })).toBeVisible();
  await focusOn(/^Lock in 35%$/);
  await press("Enter");

  await focusOn(/^Commission analysis/);
  await press("Tab");                                                        // into the option group
  await press("Space");
  await expect(page.locator('input[name="choice"]:checked')).toHaveCount(1);
  await focusOn(LABEL.confirm);
  await press("Enter");

  await press("Tab");
  await press("Space");
  await focusOn(LABEL.investIn);
  await press("Enter");
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await focusOn(LABEL.next);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Attribution Gap");
});

test("reduced motion is honoured, and no screen scrolls sideways on a phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 740 });
  const overflows = async (where: string) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, where).toBeLessThanOrEqual(0);
  };
  await page.goto("/?facilitator=1&seed=PHONE");
  await overflows("title");
  const duration = await page.getByRole("button", { name: LABEL.start }).evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.001);

  await page.getByRole("button", { name: LABEL.start }).click();
  await overflows("briefing");
  await toDecision(page);
  await overflows("decision");
  await page.goto("/?seed=PHONE-2");
  await page.getByRole("button", { name: LABEL.start }).click();
  await playTurn(page);
  await playToDebrief(page);
  await overflows("debrief");
});
