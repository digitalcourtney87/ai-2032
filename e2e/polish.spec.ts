// Phase 7 gate: an automated accessibility pass (axe) reports no violations at any
// impact, best-practice rules included, and the same seed code reproduces an
// identical run start to finish.
// Also: the seed round-trips through the URL, the facilitator editor shares its
// edits by link, and the game is fully keyboard operable.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LABEL, openAllPanels, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";

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
    await page.getByRole("button", { name: "Compare with your advisers" }).click();
    await expectNoSeriousViolations(page, "forecast with the advisers' estimates shown");
    await page.getByText("Look again at the briefing and your advisers").click();
    await expectNoSeriousViolations(page, "forecast with the briefing recap open");
    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await page.getByRole("button", { name: /^Commission analysis/ }).click();
    await expectNoSeriousViolations(page, "decision");
    await page.getByText("Look again at the briefing and your advisers").click();
    await expectNoSeriousViolations(page, "decision with the briefing recap open");
    await page.locator('input[name="choice"]:enabled').first().check();
    await expectNoSeriousViolations(page, "decision with a choice previewed");
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await expectNoSeriousViolations(page, "investment");
    await page.locator('input[name="track"]:enabled').first().check();
    await expectNoSeriousViolations(page, "investment ladder with a track selected");
    await page.getByRole("button", { name: LABEL.investIn }).click();
    await expectNoSeriousViolations(page, "news");
    await page.getByText("What these measures mean").click();
    await expect(page.getByText(/each turn adds \d+ Political Capital/)).toBeVisible();
    await expectNoSeriousViolations(page, "news with the measures explained");
    await page.getByRole("button", { name: LABEL.next }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
    await expectNoSeriousViolations(page, "first-decision pause");
    await page.getByRole("button", { name: "Stop here" }).click();
    await expectNoSeriousViolations(page, "first-decision pause with Stop here open");
    await page.getByRole("button", { name: LABEL.keepGoing }).click();

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
    await openAllPanels(page);                                               // scan every panel, not only the open ones
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);   // the one-time pause after turn 1
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await focusOn(/^Keep going$/);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
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
  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await overflows("forecast");
  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await overflows("decision");
  await page.locator('input[name="choice"]:enabled').first().check();
  await overflows("decision with a choice previewed");
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await page.locator('input[name="track"]:enabled').first().check();
  await overflows("investment");
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await overflows("news");
  await page.goto("/?seed=PHONE-2");
  await page.getByRole("button", { name: LABEL.start }).click();
  await playTurn(page, { stopAtPause: true });
  await overflows("first-decision pause");
  await page.getByRole("button", { name: "Stop here" }).click();
  await overflows("first-decision pause with Stop here open");
  await page.getByRole("button", { name: LABEL.keepGoing }).click();
  await playToDebrief(page);
  await openAllPanels(page);
  await overflows("debrief");
  await expectNoMotion(page, "debrief with every panel open");
});

// ---------------------------------------------------------------- the public-audience redesign: the Phase 15 sweep
// Every state Phases 9 to 14 added, scanned by axe in light and dark; the new screens
// at phone width, where nothing may scroll sideways or move under reduced motion; the
// debrief as it opens, fully open and fully closed; focus rings and the pause card by keyboard.

/** Hooks the sweep steers by, confirmed before Task 15.1. If an earlier phase named one differently, change it here only. */
const FRIEND = "Play the same world as a friend";                // Phase 9: the title's seed disclosure
const COMPARE = "Compare with your advisers";                     // Phase 10: the forecast's reveal button
const COMPARED = /^You said \d+%\. Your advisers/;                // Phase 10: the sentence the reveal adds
const RECAP = "#briefing-recap";                                  // Phase 10: BriefingRecap's <details>
const PREVIEW = /^If you choose option [A-Z]$/;                   // Phase 11: ChoicePreview's heading once an option is picked
const STOP_PANEL = "#stop-here";                                  // Phase 12: the panel that Stop here opens

/**
 * Waits two frames, then for every running transition or finite animation to finish,
 * so axe never scores a half-faded element. An endless animation is skipped, not awaited.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const finite = document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
}

/** Opens the briefing recap on the current step. */
async function openBriefingRecap(page: Page) {
  const recap = page.locator(RECAP);
  await recap.locator(":scope > summary").click();
  await expect(recap).toHaveJSProperty("open", true);
}

/**
 * A first-time visitor's path: the bare title, the friend disclosure, then turn 1
 * with every new affordance used, ending on the pause card with Stop here open.
 * Calls `at` in each state.
 */
async function walkFirstTurn(page: Page, seedCode: string, at: (where: string) => Promise<void>) {
  await page.goto("/");                                                        // no seed, no facilitator panel
  await at("title");
  await page.locator("summary", { hasText: FRIEND }).click();
  await expect(page.getByLabel(/^Seed code/)).toBeVisible();
  await at("title with the friend disclosure open");
  await page.getByLabel(/^Seed code/).fill(seedCode);
  await page.getByRole("button", { name: LABEL.start }).click();
  await at("briefing");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await at("forecast");
  await page.getByRole("slider").fill("65");                                 // the compared sentence names the guess
  await page.getByRole("button", { name: COMPARE }).click();
  await expect(page.getByText(COMPARED).first()).toBeVisible();
  await at("forecast with advisers revealed");
  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  await page.locator('input[name="choice"]:enabled').first().check();
  await expect(page.getByRole("heading", { name: PREVIEW })).toBeVisible();
  await expect(page.getByRole("button", { name: LABEL.confirm })).toBeEnabled();   // the render is settled: no mid-fade, no disabled Confirm
  await at("decision with a preview");
  await openBriefingRecap(page);
  await at("decision with the briefing recap open");

  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await page.locator('input[name="track"]:enabled').first().check();
  await at("investment ladder");
  await page.getByRole("button", { name: LABEL.investIn }).click();

  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await at("news");
  await page.getByRole("button", { name: LABEL.next }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
  await at("pause card");
  await page.getByRole("button", { name: "Stop here" }).click();
  await expect(page.locator(STOP_PANEL)).toBeVisible();
  await at("pause card with Stop here open");
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations on the redesigned opening and first turn (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await walkFirstTurn(page, "AXE-NEW1", async (where) => {
      await settle(page);
      await expectNoSeriousViolations(page, where);
    });
  });
}

/** States scanned by axe on the phone walk; every state on it is checked for overflow and motion. */
const PHONE_AXE = new Set(["title", "decision with a preview", "news", "pause card", "pause card with Stop here open"]);

async function expectNoSidewaysScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, where).toBeLessThanOrEqual(0);
}

/** Under prefers-reduced-motion nothing may transition, animate or smooth-scroll for 1 ms or more. */
async function expectNoMotion(page: Page, where: string) {
  const moving = await page.evaluate(() => {
    const longest = (list: string) =>
      Math.max(...list.split(",").map((part) => parseFloat(part) * (part.trim().endsWith("ms") ? 0.001 : 1)));
    const found: string[] = [];
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      const style = getComputedStyle(element);
      const animated = style.animationName !== "none" && longest(style.animationDuration) >= 0.001;
      if (animated || longest(style.transitionDuration) >= 0.001) {
        found.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} "${element.getAttribute("class") ?? ""}"`);
      }
    }
    for (const animation of document.getAnimations()) {
      const duration = animation.effect?.getTiming().duration;
      if (typeof duration === "number" && duration >= 1) found.push(`a running animation of ${duration} ms`);
    }
    if (getComputedStyle(document.documentElement).scrollBehavior !== "auto") found.push("smooth scrolling on <html>");
    return found;
  });
  expect(moving, where).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`on a phone the redesigned screens pass axe, never scroll sideways and hold still under reduced motion (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 740 });
    await walkFirstTurn(page, "PHONE-NEW1", async (where) => {
      await expectNoSidewaysScroll(page, `phone ${where}`);
      await page.setViewportSize({ width: 320, height: 740 });                    // WCAG 2.2 reflow width (1.4.10)
      await expectNoSidewaysScroll(page, `320 ${where}`);
      await page.setViewportSize({ width: 360, height: 740 });
      await expectNoMotion(page, `phone ${where}`);
      if (PHONE_AXE.has(where)) await expectNoSeriousViolations(page, `phone ${where}`);
    });
  });
}

/** Closes every collapsible debrief panel: the mirror of openAllPanels in e2e/play.ts. */
async function closeAllPanels(page: Page) {
  const openPanels = page.getByTestId("debrief").locator('h2 > button[aria-expanded="true"]');
  for (let i = 0; i < 20 && (await openPanels.count()) > 0; i++) await openPanels.first().click();
  await expect(openPanels).toHaveCount(0);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations in the redesigned debrief, as it opens, fully open and fully closed (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await startGame(page, "AXE-DEBRIEF");
    await playToDebrief(page);
    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 2, name: /At a glance/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Talk it over/ })).toBeVisible();
    const closed = page.getByTestId("debrief").locator('h2 > button[aria-expanded="false"]');
    expect(await closed.count(), "the reference panels start closed").toBeGreaterThan(0);
    await settle(page);
    await expectNoSeriousViolations(page, "debrief as it opens");

    await openAllPanels(page);
    await expect(page.getByRole("img", { name: /^Calibration chart/ })).toBeVisible();
    await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
    await expect(page.getByTestId("what-if-result")).toBeVisible();
    await settle(page);
    await expectNoSeriousViolations(page, "debrief with every panel open");

    await closeAllPanels(page);
    await expect(page.getByRole("img", { name: /^Calibration chart/ })).toHaveCount(0);
    await settle(page);
    await expectNoSeriousViolations(page, "debrief with every panel closed");
  });
}

/** States in the phone walk where the focus check tabs through every control. */
const FOCUS_CHECK = new Set([
  "title with the friend disclosure open",
  "forecast with advisers revealed",
  "decision with a preview",
  "investment ladder",
  "news",
  "pause card with Stop here open",
]);

/**
 * Tabs through up to `stops` controls from the step heading. Each focused control
 * must show an outline with at least 3:1 contrast against the ground behind it
 * (non-negotiable 8; WCAG 1.4.11) and must not sit under a sticky or fixed layer
 * such as the phone's confirm bar (WCAG 2.4.11). axe checks neither.
 */
async function expectFocusRingsVisible(page: Page, where: string, stops = 30) {
  const heading = page.getByRole("heading", { level: 1 });
  if ((await heading.getAttribute("tabindex")) !== null) await heading.focus();
  for (let stop = 1; stop <= stops; stop++) {
    await page.keyboard.press("Tab");
    const problem = await page.evaluate(async () => {
      // Two frames first: under reduced motion every property still takes a 0.01 ms transition.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement) || focused === document.body) return null;
      const name = (focused.innerText || focused.getAttribute("aria-label") || focused.id || focused.tagName).trim().slice(0, 40);

      const box = focused.getBoundingClientRect();
      let layer = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      while (layer && !layer.contains(focused)) {
        const position = getComputedStyle(layer).position;
        if (position === "sticky" || position === "fixed") return `"${name}" is hidden under a ${position} element`;
        layer = layer.parentElement;
      }

      const style = getComputedStyle(focused);
      if (style.outlineStyle === "none" || parseFloat(style.outlineWidth) < 2) return `"${name}" has no visible focus outline`;
      const pen = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const rgba = (colour: string) => {
        pen.clearRect(0, 0, 1, 1);
        pen.fillStyle = colour;
        pen.fillRect(0, 0, 1, 1);
        return Array.from(pen.getImageData(0, 0, 1, 1).data);
      };
      const luminance = (rgb: number[]) =>
        rgb.slice(0, 3).reduce((sum, value, i) => {
          const c = value / 255;
          return sum + (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i]!;
        }, 0);
      let ground = rgba(getComputedStyle(document.body).backgroundColor);
      for (let host = focused.parentElement; host; host = host.parentElement) {
        const colour = rgba(getComputedStyle(host).backgroundColor);
        if (colour[3] === 255) {
          ground = colour;
          break;
        }
      }
      const [light, dark] = [luminance(rgba(style.outlineColor)), luminance(ground)].sort((a, b) => b - a);
      const ratio = (light! + 0.05) / (dark! + 0.05);
      return ratio < 3 ? `"${name}" focus ring contrast ${ratio.toFixed(2)}:1 (needs 3:1)` : null;
    });
    expect(problem, `${where}, tab stop ${stop}`).toBeNull();
  }
}

/** Presses Tab until the focused element's text (or aria-label) matches `name`. */
async function tabTo(page: Page, name: RegExp) {
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.innerText || document.activeElement?.getAttribute("aria-label") || "",
    );
    if (name.test(label)) return;
  }
  throw new Error(`Could not reach ${name} by keyboard`);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`on a phone every focus ring on the redesigned screens shows at 3:1 and is never under the sticky bar (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 740 });
    await walkFirstTurn(page, "FOCUS-NEW1", async (where) => {
      if (FOCUS_CHECK.has(where)) await expectFocusRingsVisible(page, `phone ${where}`);
    });
  });
}

test("the pause card's Stop here opens, closes and leads back to the start from the keyboard alone", async ({ page }) => {
  await startGame(page, "KEYBOARD-PAUSE");
  await playTurn(page, { stopAtPause: true });
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(LABEL.pauseHeading);
  await expect(heading).toBeFocused();

  const stop = page.getByRole("button", { name: "Stop here" });
  await tabTo(page, /^Stop here$/);
  await page.keyboard.press("Enter");
  await expect(stop).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(STOP_PANEL)).toBeVisible();
  await expect(stop).toBeFocused();                                            // opening the panel leaves focus where it was
  await page.keyboard.press("Space");
  await expect(stop).toHaveAttribute("aria-expanded", "false");                // and Space closes it again
  await expect(page.locator(STOP_PANEL)).toHaveCount(0);

  await page.keyboard.press("Enter");
  await tabTo(page, /^Copy link to this world$/);                               // the panel's controls come next in tab order
  await tabTo(page, /^Back to the start$/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();         // focus comes back to the title's h1, not <body>
});
