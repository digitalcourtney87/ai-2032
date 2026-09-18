// Phase 6 gate: 1,000-run counterfactuals complete in under 3 seconds without
// freezing the UI, and the calibration panel matches a hand-checked Brier score
// on a scripted run.

import { expect, test, type Page } from "@playwright/test";
import { playTurn, startGame } from "./play";

const FORECASTS = [10, 80, 35, 60, 25, 90, 5, 70];
const TAGS = ["Sound and fortunate", "Sound and unlucky", "Risky and fortunate", "Risky and unlucky"];

/** A scripted run: fixed forecasts, the first open option each turn. */
async function scriptedRun(page: Page, seedCode: string) {
  await startGame(page, seedCode);
  for (const forecast of FORECASTS) await playTurn(page, { forecast });
  await expect(page.getByText("Your record")).toBeVisible();
}

test("the debrief has the six panels of spec Section 11", async ({ page }) => {
  await scriptedRun(page, "DEBRIEF-1");
  for (const title of ["The world you were in", "Calibration", "Decision quality versus luck", "Governance record", "What you never saw", "What if"]) {
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeVisible();
  }
});

test("the Brier score shown matches a hand calculation from the forecasts shown", async ({ page }) => {
  await scriptedRun(page, "DEBRIEF-2");
  const rows = page.getByTestId("forecast-row");
  await expect(rows).toHaveCount(8);

  const pairs = await rows.evaluateAll((elements) =>
    elements.map((el) => ({ forecast: Number((el as HTMLElement).dataset.forecast), outcome: Number((el as HTMLElement).dataset.outcome) })));
  expect(pairs.map((p) => Math.round(p.forecast * 100))).toEqual(FORECASTS);         // the run recorded what was entered

  const byHand = pairs.reduce((sum, p) => sum + (p.forecast - p.outcome) ** 2, 0) / pairs.length;
  expect(await page.getByTestId("brier").innerText()).toBe(byHand.toFixed(3));
  await expect(page.getByRole("img", { name: /^Calibration chart/ })).toBeVisible();
});

test("every decision gets one of the four luck tags, and never a verdict of right or wrong", async ({ page }) => {
  await scriptedRun(page, "DEBRIEF-3");
  const tags = page.getByTestId("luck-tag");
  await expect(tags).toHaveCount(8);
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
  for (const tag of await tags.allInnerTexts()) expect(TAGS).toContain(tag);

  const reviews = (await page.getByTestId("decision-review").allInnerTexts()).join(" ");
  expect(reviews).not.toMatch(/\b(right|wrong|correct|mistake)\b/i);
  expect(reviews).toContain("Under this game's assumptions");
});

test("1,000 what-if reruns finish in under 3 seconds and the page stays responsive", async ({ page }) => {
  await scriptedRun(page, "DEBRIEF-4");
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });

  // Count animation frames on the main thread while the worker runs.
  await page.evaluate(() => {
    const w = window as unknown as { frames: number };
    w.frames = 0;
    const tick = () => { w.frames++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  const started = Date.now();
  await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
  const result = page.getByTestId("what-if-result");
  await expect(result).toBeVisible({ timeout: 3000 });
  const wallClock = Date.now() - started;

  expect(wallClock).toBeLessThan(3000);
  expect(Number(await result.getAttribute("data-milliseconds"))).toBeLessThan(3000);
  const frames = await page.evaluate(() => (window as unknown as { frames: number }).frames);
  expect(frames).toBeGreaterThan(wallClock / 100);                        // the main thread kept painting: it was never blocked for long

  const sentences = await result.locator("p").allInnerTexts();
  for (const sentence of sentences.slice(0, -1)) expect(sentence.startsWith("Under this game's assumptions")).toBe(true);
  expect(sentences.at(-1)).toContain("This is the model's output, not a finding.");

  await page.getByText("View assumptions").click();
  await expect(page.getByText("These numbers are design assumptions, not forecasts.")).toBeVisible();
});

test("the run summary can be copied, and nothing is sent anywhere", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const requests: string[] = [];
  await scriptedRun(page, "DEBRIEF-5");
  page.on("request", (request) => requests.push(request.url()));

  await page.getByRole("button", { name: "Copy run summary" }).click();
  await expect(page.getByText("Copied as text.")).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("Seed code: DEBRIEF-5");
  expect(clipboard.split("\n").filter((line) => /^\d\./.test(line))).toHaveLength(8);
  expect(requests.filter((url) => !url.startsWith("http://localhost"))).toEqual([]);
});
