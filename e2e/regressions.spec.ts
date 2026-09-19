// Phase 8 regressions: bugs found while planning the public-audience redesign.
// Each test failed before its fix landed.

import { expect, test } from "@playwright/test";
import { finishTurn, LABEL, playTurn, scenarioTitle, startGame, toDecision } from "./play";

test("commissioning analysis after picking an option it makes unaffordable clears the pick instead of crashing", async ({ page }) => {
  // Seed STALE-PICK: buying analysis and taking C, D and B on turns 1 to 3 leaves
  // exactly 5 Political Capital on turn 4, The Graduate Collapse, where option C costs 5.
  await startGame(page, "STALE-PICK");
  for (const prefer of ["C", "D", "B"]) {
    await toDecision(page);
    await page.getByRole("button", { name: /^Commission analysis/ }).click();
    await finishTurn(page, { prefer });
  }
  expect(await scenarioTitle(page)).toBe("The Graduate Collapse");
  await toDecision(page);
  await page.locator("#choice-C").check();
  await expect(page.getByRole("button", { name: "Confirm option C" })).toBeEnabled();

  await page.getByRole("button", { name: /^Commission analysis/ }).click();         // costs 1, so C is now out of reach
  await expect(page.locator("#choice-C")).toBeDisabled();
  await expect(page.getByRole("button", { name: LABEL.confirm, disabled: false })).toHaveCount(0);
  await expect(page.locator("#choice-C")).not.toBeChecked();
  // The Commission button is gone, so focus moves to the analysis rather than falling to the page.
  await expect(page.getByRole("region", { name: "Commission analysis" }).locator('[tabindex="-1"]')).toBeFocused();

  // The player can still take an option they can afford, and the game goes on.
  expect(await finishTurn(page, { prefer: "D" })).toBe("D");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Graduate Collapse");
});

test("the final turn never lists an investment step, even on its consequences", async ({ page }) => {
  await startGame(page, "FINAL-RAIL");
  const rail = page.getByRole("navigation", { name: "Steps in this turn" });
  for (let turn = 1; turn <= 6; turn++) await playTurn(page);

  // Turn 7 took an investment. Its consequences show while view.current is already the final turn.
  await toDecision(page);
  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expect(rail).toContainText("Investment");
  await page.getByRole("button", { name: LABEL.next }).click();

  expect(await scenarioTitle(page)).toBe("The 2032 Threshold");
  await toDecision(page);
  await expect(rail).not.toContainText("Investment");
  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expect(rail.locator('[aria-current="step"]')).toContainText("Consequences");
  await expect(rail).not.toContainText("Investment");
  await page.getByRole("button", { name: LABEL.next }).click();
  await expect(page.getByTestId("debrief")).toBeVisible();
});
