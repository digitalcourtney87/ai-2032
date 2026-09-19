// Phase 8 regressions: bugs found while planning the public-audience redesign.
// Each test failed before its fix landed.

import { expect, test } from "@playwright/test";
import { finishTurn, LABEL, scenarioTitle, startGame, toDecision } from "./play";

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
