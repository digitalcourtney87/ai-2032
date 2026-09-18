// Phase 5 gate: both crisis turns render differently from normal turns, and an
// unlocked option appears only when its investment threshold is met.

import { expect, test } from "@playwright/test";
import { finishTurn, playTurn, playUntil, scenarioTitle, startGame, toDecision } from "./play";

const CRISIS_TITLES = ["The Deepfake Election", "The Incident", "The Warning"];

test("a normal turn offers analysis and evidence, and shows no clock", async ({ page }) => {
  await startGame(page, "CRISIS-1");
  expect(await scenarioTitle(page)).toBe("The Attribution Gap");
  await expect(page.getByRole("img", { name: /Simulated clock/ })).toHaveCount(0);
  await expect(page.getByText("Real-world evidence behind this fictional scenario")).toBeVisible();
  await toDecision(page);
  await expect(page.getByRole("button", { name: /^Commission analysis/ })).toBeVisible();
});

test("both crisis turns in a run show the clock, sell no analysis and cut the evidence", async ({ page }) => {
  await startGame(page, "CRISIS-2");
  const crisesSeen: string[] = [];
  for (let turn = 1; turn <= 8; turn++) {
    const title = await scenarioTitle(page);
    const clock = page.getByRole("img", { name: /Simulated clock/ });
    if (CRISIS_TITLES.includes(title)) {
      crisesSeen.push(title);
      await expect(clock).toHaveAccessibleName(/6:00 remaining/);
      await expect(page.getByText("This is a crisis turn.")).toBeVisible();
      await expect(page.getByText(/Your advisers are in open disagreement/)).toBeVisible();
      await expect(page.getByText("Real-world evidence behind this fictional scenario")).toHaveCount(0);
      await toDecision(page);
      await expect(clock).toHaveAccessibleName(/3:00 remaining/);           // the clock steps with the player, not with time
      await expect(page.getByText("No analysis can be commissioned in a crisis.")).toBeVisible();
      await expect(page.getByRole("button", { name: /^Commission analysis/ })).toHaveCount(0);
      await finishTurn(page);
    } else {
      await expect(clock).toHaveCount(0);
      await playTurn(page);
    }
  }
  // Every run has the scripted election crisis and exactly one interrupt.
  expect(crisesSeen).toContain("The Deepfake Election");
  expect(crisesSeen).toHaveLength(2);
});

test("the rapid-authentication option is locked without Provenance level 2", async ({ page }) => {
  await startGame(page, "UNLOCK-1");
  await playUntil(page, "The Deepfake Election", { track: "Evaluation science" });
  await toDecision(page);
  await expect(page.locator("#choice-E")).toBeDisabled();
  await expect(page.getByText("Locked: needs Provenance infrastructure at level 2.")).toBeVisible();
});

test("the same option is open, and listed first, once Provenance reaches level 2", async ({ page }) => {
  await startGame(page, "UNLOCK-1");
  await playUntil(page, "The Deepfake Election", { track: "Provenance infrastructure" });
  await expect(page.getByText("Open to you because you prepared.")).toBeVisible();
  await toDecision(page);
  await expect(page.locator("#choice-E")).toBeEnabled();
  await expect(page.locator('input[name="choice"]').first()).toHaveAttribute("id", "choice-E");
  await expect(page.getByText("Open to you because of your investment in Provenance infrastructure.")).toBeVisible();
});
