// Helpers that play the game the way a person does: by role and visible label.
// Nothing here reaches into the engine or the page's state.

import { expect, type Page } from "@playwright/test";

/**
 * Every visible label the helpers and specs steer by, in one place, so a copy
 * change touches this file rather than every spec.
 */
export const LABEL = {
  start: "Try your first decision",
  continueToForecast: "Continue to your forecast",
  lockIn: /^Lock in/,
  decisionGroup: "Your decision",
  confirm: /^Confirm option/,
  investGroup: "Standing investment",
  investIn: /^Invest in/,
  newsHeading: "What the world noticed",
  next: /^(Next briefing|Read your debrief)$/,
} as const;

export type TrackName = "Evaluation science" | "Provenance infrastructure" | "Diplomacy" | "Defensive cyber";

export async function startGame(page: Page, seedCode: string) {
  await page.goto(`/?seed=${encodeURIComponent(seedCode)}`);
  await page.getByRole("button", { name: LABEL.start }).click();
}

export const scenarioTitle = (page: Page) => page.getByRole("heading", { level: 1 }).innerText();

/** From a briefing to the decision step. */
export async function toDecision(page: Page, forecast = 50) {
  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await page.getByRole("slider").fill(String(forecast));
  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
}

export interface TurnPlan {
  /** Option letter to prefer. Falls back to the first option that is open. */
  prefer?: string;
  track?: TrackName;
  forecast?: number;
}

/** Plays one whole turn from its briefing through to the next briefing (or the debrief). Returns the option taken. */
export async function playTurn(page: Page, plan: TurnPlan = {}): Promise<string> {
  await toDecision(page, plan.forecast);
  return finishTurn(page, plan);
}

/** From the decision step to the next briefing (or the debrief). Returns the option taken. */
export async function finishTurn(page: Page, plan: TurnPlan = {}): Promise<string> {
  const preferred = plan.prefer ? page.locator(`#choice-${plan.prefer}`) : null;
  const pick = preferred && (await preferred.isEnabled()) ? preferred : page.locator('input[name="choice"]:enabled').first();
  const taken = (await pick.getAttribute("id"))!.replace("choice-", "");
  await pick.check();
  await page.getByRole("button", { name: LABEL.confirm }).click();

  // Wait for whichever step comes next: the investment, or (after the final decision) the news.
  const invest = page.getByRole("group", { name: LABEL.investGroup });
  const news = page.getByRole("heading", { name: LABEL.newsHeading });
  await expect(invest.or(news).first()).toBeVisible();
  if (await invest.isVisible()) {
    const wanted = page.getByRole("radio", { name: new RegExp(`^${plan.track ?? "Evaluation science"}`) });
    const track = (await wanted.isEnabled()) ? wanted : page.locator('input[name="track"]:enabled').first();
    await track.check();
    await page.getByRole("button", { name: LABEL.investIn }).click();
  }
  await expect(news).toBeVisible();
  await page.getByRole("button", { name: LABEL.next }).click();
  return taken;
}

/** Plays turns until the named scenario's briefing is on screen. */
export async function playUntil(page: Page, title: string, plan: TurnPlan = {}) {
  for (let turn = 0; turn < 8; turn++) {
    if ((await scenarioTitle(page)) === title) return;
    await playTurn(page, plan);
  }
  throw new Error(`Never reached "${title}"`);
}

/** Plays a whole game and returns the options taken, in order. */
export async function playToDebrief(page: Page, plan: TurnPlan = {}): Promise<string[]> {
  const taken: string[] = [];
  const debrief = page.getByTestId("debrief");
  const briefing = page.getByRole("button", { name: LABEL.continueToForecast });
  for (let turn = 0; turn <= 8; turn++) {
    // Wait for the next briefing or the debrief, so a screen transition cannot fool the check.
    await expect(debrief.or(briefing).first()).toBeVisible();
    if (await debrief.isVisible()) return taken;
    taken.push(await playTurn(page, plan));
  }
  throw new Error("Never reached the debrief");
}
