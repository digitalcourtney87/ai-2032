// Helpers that play the game the way a person does: by role and visible label.
// Nothing here reaches into the engine or the page's state.

import { expect, type Page } from "@playwright/test";

export type TrackName = "Evaluation science" | "Provenance infrastructure" | "Diplomacy" | "Defensive cyber";

export async function startGame(page: Page, seedCode: string) {
  await page.goto(`/?seed=${encodeURIComponent(seedCode)}`);
  await page.getByRole("button", { name: "Begin" }).click();
}

export const scenarioTitle = (page: Page) => page.getByRole("heading", { level: 1 }).innerText();

/** From a briefing to the decision step. */
export async function toDecision(page: Page, forecast = 50) {
  await page.getByRole("button", { name: "Continue to your forecast" }).click();
  await page.getByRole("slider").fill(String(forecast));
  await page.getByRole("button", { name: /^Lock in/ }).click();
  await expect(page.getByRole("group", { name: "Your decision" })).toBeVisible();
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
  await page.getByRole("button", { name: /^Confirm option/ }).click();

  const invest = page.getByRole("group", { name: "Standing investment" });
  if (await invest.isVisible()) {
    const wanted = page.getByRole("radio", { name: new RegExp(`^${plan.track ?? "Evaluation science"}`) });
    const track = (await wanted.isEnabled()) ? wanted : page.locator('input[name="track"]:enabled').first();
    await track.check();
    await page.getByRole("button", { name: /^Invest in/ }).click();
  }
  await expect(page.getByRole("heading", { name: "What the world noticed" })).toBeVisible();
  await page.getByRole("button", { name: /^(Next briefing|Read your debrief)$/ }).click();
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
  while (!(await page.getByText("Your record").isVisible())) taken.push(await playTurn(page, plan));
  return taken;
}
