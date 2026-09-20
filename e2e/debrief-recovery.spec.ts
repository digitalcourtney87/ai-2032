// Recovery of debrief calculations: injected worker failures, retry, session
// isolation, and configuration of the real built worker.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LABEL, playToDebrief, playTurn, startGame } from "./play";

const SOUNDNESS_UNAVAILABLE = "We couldn’t compare your decisions. Try again.";
const SOUNDNESS_RETRY = "Retry decision comparison";
const WHAT_IF_UNAVAILABLE = "We couldn’t complete the rerun. Try again.";
const WHAT_IF_RETRY = "Retry rerun";
const VALID_CFG = "eyJldmVudHMiOnsiaW5mcmEtYXR0YWNrIjp7IndoZW5UcnVlIjo5MH19fQ";
const ZERO_CFG = "eyJ3ZWlnaHRzIjp7ImJlbmlnbiI6MCwiY29udGVzdGVkIjowLCJoYXJkIjowfX0";

interface WorkerControl {
  failSoundness: boolean;
  failWhatIf: boolean;
  failNative: boolean;
  holdCalculations: boolean;
  posted: { id: number; kind: string; overrides?: unknown }[];
  lastSoundness: { choiceId: string; expectedScore: number }[][] | null;
  created: number;
  terminated: number;
  lateReply: ((data: unknown) => void) | null;
}

declare global {
  interface Window {
    __debriefWorkers?: WorkerControl;
    __unhandledRejections?: string[];
  }
}

const ADAPTER = `
(() => {
  const RealWorker = window.Worker;
  const control = {
    failSoundness: false,
    failWhatIf: false,
    failNative: false,
    holdCalculations: false,
    posted: [],
    lastSoundness: null,
    created: 0,
    terminated: 0,
    lateReply: null,
  };
  window.__debriefWorkers = control;
  window.__unhandledRejections = [];
  window.addEventListener("unhandledrejection", (event) => {
    window.__unhandledRejections.push(String(event.reason && event.reason.message ? event.reason.message : event.reason));
  });
  window.Worker = class extends EventTarget {
    constructor(scriptURL, options) {
      super();
      this._inner = new RealWorker(scriptURL, options);
      control.created += 1;
      const self = this;
      control.lateReply = (data) => self.dispatchEvent(new MessageEvent("message", { data }));
      const forward = (event) => {
        if (event.data && event.data.kind === "soundness") {
          control.lastSoundness = JSON.parse(JSON.stringify(event.data.estimates));
        }
        self.dispatchEvent(new MessageEvent("message", { data: event.data }));
      };
      this._inner.onmessage = forward;
      this._inner.addEventListener("error", (event) => {
        self.dispatchEvent(new ErrorEvent("error", { message: event.message }));
      });
      this._inner.addEventListener("messageerror", () => {
        self.dispatchEvent(new MessageEvent("messageerror"));
      });
    }
    postMessage(message) {
      control.posted.push(message);
      if (control.failSoundness && message.kind === "soundness") {
        control.failSoundness = false;
        queueMicrotask(() => this.dispatchEvent(new MessageEvent("message", {
          data: { id: message.id, kind: "error", message: "injected soundness error" },
        })));
        return;
      }
      if (control.failWhatIf && message.kind === "whatIf") {
        control.failWhatIf = false;
        queueMicrotask(() => this.dispatchEvent(new MessageEvent("message", {
          data: { id: message.id, kind: "error", message: "injected what-if error" },
        })));
        return;
      }
      if (control.failNative) {
        control.failNative = false;
        this._inner.terminate();
        queueMicrotask(() => this.dispatchEvent(new ErrorEvent("error", { message: "injected native failure" })));
        return;
      }
      if (control.holdCalculations && message.kind !== "configure") return;
      this._inner.postMessage(message);
    }
    terminate() {
      control.terminated += 1;
      this._inner.terminate();
    }
  };
})();
`;

async function installAdapter(page: Page) {
  await page.addInitScript({ content: ADAPTER });
}

async function control(page: Page) {
  return page.evaluate(() => window.__debriefWorkers!);
}

async function unhandled(page: Page) {
  return page.evaluate(() => window.__unhandledRejections ?? []);
}

async function expectAxeClean(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(results.violations.map((v) => `${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
}

async function playUntilFinalTurn(page: Page, seedCode: string) {
  await startGame(page, seedCode);
  for (let turn = 1; turn <= 7; turn++) await playTurn(page);
}

async function awaitSoundnessReady(page: Page) {
  await expect(page.getByTestId("debrief")).toBeVisible();
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId("luck-tag")).toHaveCount(8);
  await expect.poll(async () => page.evaluate(() => window.__debriefWorkers?.lastSoundness?.length ?? 0)).toBe(8);
}

async function soundnessEstimates(page: Page) {
  return page.evaluate(() => window.__debriefWorkers!.lastSoundness);
}

test("soundness and What-if recover from injected calculation errors without an unhandled rejection", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installAdapter(page);
  await playUntilFinalTurn(page, "RECOVERY-1");
  await page.evaluate(() => { window.__debriefWorkers!.failSoundness = true; });
  await playTurn(page);
  await expect(page.getByTestId("debrief")).toBeVisible();
  await expect(page.getByText(SOUNDNESS_UNAVAILABLE)).toBeVisible();
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0);
  await expect(page.getByTestId("luck-tag")).toHaveCount(0);

  await page.getByRole("button", { name: SOUNDNESS_RETRY }).click();
  await awaitSoundnessReady(page);
  await expect(page.getByText(SOUNDNESS_UNAVAILABLE)).toHaveCount(0);

  await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
  await expect(page.getByTestId("what-if-result")).toBeVisible({ timeout: 3000 });

  await page.evaluate(() => { window.__debriefWorkers!.failWhatIf = true; });
  await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
  await expect(page.getByText(WHAT_IF_UNAVAILABLE)).toBeVisible();
  await expect(page.getByText("Previous result for this comparison.")).toBeVisible();
  await expect(page.getByTestId("what-if-result")).toBeVisible();

  await page.getByRole("button", { name: WHAT_IF_RETRY }).click();
  await expect(page.getByText(WHAT_IF_UNAVAILABLE)).toHaveCount(0, { timeout: 3000 });
  await expect(page.getByTestId("what-if-result")).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(await unhandled(page)).toEqual([]);
});

test("a native worker failure is retryable and a later session ignores a late reply", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installAdapter(page);
  await playUntilFinalTurn(page, "RECOVERY-2");
  await page.evaluate(() => { window.__debriefWorkers!.failNative = true; });
  await playTurn(page);
  await expect(page.getByTestId("debrief")).toBeVisible();
  await expect(page.getByText(SOUNDNESS_UNAVAILABLE)).toBeVisible();

  await page.getByRole("button", { name: SOUNDNESS_RETRY }).click();
  await awaitSoundnessReady(page);

  await page.evaluate(() => { window.__debriefWorkers!.holdCalculations = true; });
  await page.getByRole("button", { name: "Play a new world" }).click();
  await expect(page.getByRole("heading", { name: "AI 2032", level: 1 })).toBeVisible();
  const afterReset = await control(page);
  expect(afterReset.terminated).toBeGreaterThan(0);

  await page.evaluate(() => {
    window.__debriefWorkers!.lateReply?.({
      id: 99,
      kind: "soundness",
      estimates: [[{ choiceId: "ZZ-STALE-RANK", expectedScore: 99 }]],
    });
    window.__debriefWorkers!.holdCalculations = false;
  });

  await page.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(page);
  await awaitSoundnessReady(page);
  await expect(page.getByText("ZZ-STALE-RANK")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  expect(await unhandled(page)).toEqual([]);
});

test("the built worker uses accepted edits and ignores an all-zero weights link", async ({ page, browser }) => {
  await installAdapter(page);
  await page.goto(`/?seed=RECOVERY-3&cfg=${VALID_CFG}`);
  await expect(page.getByText("This session uses edited assumptions.")).toBeVisible();
  await page.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(page);
  await awaitSoundnessReady(page);

  const valid = await control(page);
  const configure = valid.posted.find((message) => message.kind === "configure");
  expect(configure?.overrides).toEqual({ events: { "infra-attack": { whenTrue: 90 } } });
  const editedEstimates = await soundnessEstimates(page);
  expect(editedEstimates?.length).toBe(8);

  const published = await browser.newPage();
  await installAdapter(published);
  await published.goto("/?seed=RECOVERY-3");
  await published.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(published);
  await awaitSoundnessReady(published);
  const publishedEstimates = await soundnessEstimates(published);
  expect(publishedEstimates).not.toEqual(editedEstimates);
  await published.close();

  const sameEdit = await browser.newPage();
  await installAdapter(sameEdit);
  await sameEdit.goto(`/?seed=RECOVERY-3&cfg=${VALID_CFG}`);
  await sameEdit.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(sameEdit);
  await awaitSoundnessReady(sameEdit);
  expect(await soundnessEstimates(sameEdit)).toEqual(editedEstimates);
  await sameEdit.close();

  await page.goto(`/?seed=RECOVERY-4&cfg=${ZERO_CFG}`);
  await expect(page.getByRole("heading", { name: "AI 2032", level: 1 })).toBeVisible();
  await expect(page.getByText("This session uses edited assumptions.")).toHaveCount(0);
  await page.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(page);
  await awaitSoundnessReady(page);
  const rejected = await control(page);
  expect(rejected.posted.find((message) => message.kind === "configure")?.overrides).toEqual({});
  const rejectedEstimates = await soundnessEstimates(page);

  const baseline = await browser.newPage();
  await installAdapter(baseline);
  await baseline.goto("/?seed=RECOVERY-4");
  await baseline.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(baseline);
  await awaitSoundnessReady(baseline);
  expect(await soundnessEstimates(baseline)).toEqual(rejectedEstimates);
  await baseline.close();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe is clean on recoverable debrief errors (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await installAdapter(page);
    await playUntilFinalTurn(page, `RECOVERY-AXE-${colorScheme}`);
    await page.evaluate(() => { window.__debriefWorkers!.failSoundness = true; });
    await playTurn(page);
    await expect(page.getByText(SOUNDNESS_UNAVAILABLE)).toBeVisible();
    await expectAxeClean(page, `soundness error ${colorScheme}`);

    await page.evaluate(() => { window.__debriefWorkers!.failWhatIf = true; });
    await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
    await expect(page.getByText(WHAT_IF_UNAVAILABLE)).toBeVisible();
    await expectAxeClean(page, `what-if error ${colorScheme}`);

    await page.setViewportSize({ width: 360, height: 740 });
    await expectAxeClean(page, `what-if error ${colorScheme} phone`);

    await page.getByRole("button", { name: WHAT_IF_RETRY }).focus();
    await expect(page.getByRole("button", { name: WHAT_IF_RETRY })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText(WHAT_IF_UNAVAILABLE)).toHaveCount(0, { timeout: 3000 });
  });
}
