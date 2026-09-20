import { describe, expect, test } from "vitest";
import type { CounterfactualResult, GameState, OptionEstimate } from "../../src/engine";
import {
  CalculationCancelledError,
  createDebriefCalculations,
} from "../../src/ui/debrief/calculations";
import type { WorkerRequest, WorkerResponse } from "../../src/workers/counterfactual.protocol";
import type { Overrides } from "../../src/content";

const overrides: Overrides = { weights: { hard: 60 } };
const estimatesA: OptionEstimate[][] = [[{ choiceId: "A", expectedScore: 50 }]];
const estimatesB: OptionEstimate[][] = [[{ choiceId: "B", expectedScore: 40 }]];
const whatIfResult: CounterfactualResult = {
  runs: 40,
  profile: "contested",
  scenarioId: "s1",
  asPlayedChoiceId: "A",
  newChoiceId: "B",
  asPlayed: {
    meanScore: 47,
    medianMetrics: {
      nationalSecurity: 50, economy: 50, publicTrust: 50, innovation: 50,
      socialStability: 50, systemicRisk: 20, cooperation: 45, stateCapacity: 40,
    },
    seriousIncidentShare: 0.2,
    endings: { fortress: 1 },
  },
  changed: {
    meanScore: 48,
    medianMetrics: {
      nationalSecurity: 52, economy: 50, publicTrust: 50, innovation: 48,
      socialStability: 50, systemicRisk: 20, cooperation: 45, stateCapacity: 40,
    },
    seriousIncidentShare: 0.1,
    endings: { fortress: 1 },
  },
};
const whatIfArgs = {
  history: [],
  changeAt: 0,
  newChoiceId: "B",
  runs: 40,
  profile: "contested" as const,
  baseSeed: 1,
};

class FakeWorker extends EventTarget {
  readonly posted: WorkerRequest[] = [];
  terminateCount = 0;
  postMessageImpl?: (message: WorkerRequest) => void;

  postMessage(message: WorkerRequest) {
    this.posted.push(message);
    this.postMessageImpl?.(message);
  }

  terminate() {
    this.terminateCount += 1;
  }

  emit(response: WorkerResponse) {
    this.dispatchEvent(new MessageEvent("message", { data: response }));
  }

  emitError(message: string) {
    this.dispatchEvent(new ErrorEvent("error", { message }));
  }

  emitMessageError() {
    this.dispatchEvent(new MessageEvent("messageerror"));
  }
}

function harness(createWorker?: () => FakeWorker) {
  const workers: FakeWorker[] = [];
  const calculations = createDebriefCalculations({
    overrides,
    createWorker: createWorker ?? (() => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    }),
  });
  return { calculations, workers };
}

function configured(calculations: ReturnType<typeof createDebriefCalculations>, workers: FakeWorker[]) {
  const pending = calculations.soundness([] as GameState[], 10);
  const worker = workers[0]!;
  expect(worker.posted).toEqual([{ id: 0, kind: "configure", overrides }]);
  worker.emit({ id: 0, kind: "configured" });
  return pending;
}

describe("debrief calculation lifecycle", () => {
  test("two calls before ready share one worker and wait for configure", async () => {
    const { calculations, workers } = harness();
    const first = calculations.soundness([] as GameState[], 10);
    const second = calculations.soundness([] as GameState[], 20);
    expect(workers).toHaveLength(1);
    expect(workers[0]!.posted).toEqual([{ id: 0, kind: "configure", overrides }]);

    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    expect(workers[0]!.posted.slice(1)).toEqual([
      { id: 1, kind: "soundness", decisionStates: [], rollouts: 10 },
      { id: 2, kind: "soundness", decisionStates: [], rollouts: 20 },
    ]);

    workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    workers[0]!.emit({ id: 2, kind: "soundness", estimates: estimatesB });
    await expect(first).resolves.toEqual(estimatesA);
    await expect(second).resolves.toEqual(estimatesB);
  });

  test("responses arriving in reverse order still match their requests", async () => {
    const { calculations, workers } = harness();
    const first = calculations.soundness([] as GameState[], 10);
    const second = calculations.whatIf(whatIfArgs);
    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[0]!.emit({ id: 2, kind: "whatIf", result: whatIfResult, milliseconds: 17 });
    workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    await expect(first).resolves.toEqual(estimatesA);
    await expect(second).resolves.toEqual({ result: whatIfResult, milliseconds: 17 });
  });

  test("a calculation error rejects only that request; later work can succeed", async () => {
    const { calculations, workers } = harness();
    const failed = calculations.soundness([] as GameState[], 10);
    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[0]!.emit({ id: 1, kind: "error", message: "soundness failed" });
    await expect(failed).rejects.toThrow("soundness failed");

    const retry = calculations.whatIf(whatIfArgs);
    expect(workers).toHaveLength(1);
    await Promise.resolve();
    workers[0]!.emit({ id: 2, kind: "whatIf", result: whatIfResult, milliseconds: 4 });
    await expect(retry).resolves.toEqual({ result: whatIfResult, milliseconds: 4 });
  });

  test("a constructor throw rejects the caller and leaves no stranded request", async () => {
    const calculations = createDebriefCalculations({
      overrides,
      createWorker: () => { throw new Error("no worker"); },
    });
    await expect(calculations.soundness([] as GameState[], 10)).rejects.toThrow("no worker");
    await expect(calculations.whatIf(whatIfArgs)).rejects.toThrow("no worker");
  });

  test("a postMessage throw rejects the caller", async () => {
    const { calculations, workers } = harness();
    const pending = calculations.soundness([] as GameState[], 10);
    workers[0]!.postMessageImpl = () => { throw new Error("post failed"); };
    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    await expect(pending).rejects.toThrow("post failed");
  });

  test("a native error rejects in-flight work and a later retry reconfigures", async () => {
    const { calculations, workers } = harness();
    const first = calculations.soundness([] as GameState[], 10);
    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[0]!.emitError("worker crashed");
    await expect(first).rejects.toThrow(/worker crashed/);
    expect(workers[0]!.terminateCount).toBe(1);

    const retry = calculations.soundness([] as GameState[], 10);
    expect(workers).toHaveLength(2);
    expect(workers[1]!.posted).toEqual([{ id: 0, kind: "configure", overrides }]);
    workers[1]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[1]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    await expect(retry).resolves.toEqual(estimatesA);
  });

  test("messageerror also invalidates the worker", async () => {
    const { calculations, workers } = harness();
    const first = calculations.soundness([] as GameState[], 10);
    workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[0]!.emitMessageError();
    await expect(first).rejects.toThrow(/messageerror|transport/i);
    expect(workers[0]!.terminateCount).toBe(1);

    const retry = calculations.whatIf(whatIfArgs);
    expect(workers).toHaveLength(2);
    workers[1]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[1]!.emit({ id: 1, kind: "whatIf", result: whatIfResult, milliseconds: 9 });
    await expect(retry).resolves.toMatchObject({ milliseconds: 9 });
  });

  test("a configure failure sends no calculation and rejects every waiter", async () => {
    const { calculations, workers } = harness();
    const first = calculations.soundness([] as GameState[], 10);
    const second = calculations.whatIf(whatIfArgs);
    workers[0]!.emit({ id: 0, kind: "error", message: "bad configuration" });
    await expect(first).rejects.toThrow("bad configuration");
    await expect(second).rejects.toThrow("bad configuration");
    expect(workers[0]!.posted.some((message) => message.kind !== "configure")).toBe(false);
    expect(workers[0]!.terminateCount).toBe(1);

    const retry = calculations.soundness([] as GameState[], 10);
    expect(workers).toHaveLength(2);
    workers[1]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    workers[1]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    await expect(retry).resolves.toEqual(estimatesA);
  });

  test("dispose during configure cancels waiters and terminates once", async () => {
    const { calculations, workers } = harness();
    const pending = calculations.soundness([] as GameState[], 10);
    calculations.dispose();
    calculations.dispose();
    await expect(pending).rejects.toBeInstanceOf(CalculationCancelledError);
    expect(workers[0]!.terminateCount).toBe(1);
    await expect(calculations.soundness([] as GameState[], 10)).rejects.toBeInstanceOf(CalculationCancelledError);
  });

  test("dispose during a calculation cancels it and ignores a late reply", async () => {
    const { calculations, workers } = harness();
    const pending = configured(calculations, workers);
    calculations.dispose();
    workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    await expect(pending).rejects.toBeInstanceOf(CalculationCancelledError);
    expect(workers[0]!.terminateCount).toBe(1);
  });

  test("a late reply from an old worker cannot settle a new session", async () => {
    const stale = harness();
    const leftover = stale.calculations.soundness([] as GameState[], 10);
    stale.workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    stale.calculations.dispose();
    await expect(leftover).rejects.toBeInstanceOf(CalculationCancelledError);

    const fresh = harness();
    const next = fresh.calculations.soundness([] as GameState[], 10);
    stale.workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesB });
    fresh.workers[0]!.emit({ id: 0, kind: "configured" });
    await Promise.resolve();
    fresh.workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    await expect(next).resolves.toEqual(estimatesA);
  });

  test("a duplicate response settles the promise only once", async () => {
    const { calculations, workers } = harness();
    const pending = configured(calculations, workers);
    workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesA });
    workers[0]!.emit({ id: 1, kind: "soundness", estimates: estimatesB });
    await expect(pending).resolves.toEqual(estimatesA);
  });

  test("an unexpected response kind rejects that request; an unknown id is ignored", async () => {
    const { calculations, workers } = harness();
    const pending = configured(calculations, workers);
    workers[0]!.emit({ id: 99, kind: "soundness", estimates: estimatesB });
    workers[0]!.emit({ id: 1, kind: "whatIf", result: whatIfResult, milliseconds: 1 });
    await expect(pending).rejects.toThrow(/unexpected/i);
  });
});
