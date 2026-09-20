// Owns the debrief worker: readiness, one-in-flight session, matching, failure
// and disposal. Callers ask for soundness or a What-if, never a raw send.

import type { Overrides } from "../../content";
import type { CounterfactualResult, DecisionRecord, GameState, OptionEstimate, Profile } from "../../engine";
import type { WorkerRequest, WorkerResponse } from "../../workers/counterfactual.protocol";

export class CalculationCancelledError extends Error {
  constructor(message = "The calculation was cancelled") {
    super(message);
    this.name = "CalculationCancelledError";
  }
}

export function isCalculationCancelled(error: unknown): boolean {
  return error instanceof CalculationCancelledError;
}

export interface WhatIfCalculation {
  history: DecisionRecord[];
  changeAt: number;
  newChoiceId: string;
  runs: number;
  profile: Profile;
  baseSeed: number;
}

export interface WhatIfCalculationAnswer {
  result: CounterfactualResult;
  milliseconds: number;
}

export interface DebriefCalculations {
  soundness(decisionStates: GameState[], rollouts: number): Promise<OptionEstimate[][]>;
  whatIf(request: WhatIfCalculation): Promise<WhatIfCalculationAnswer>;
  dispose(): void;
}

/** Browser-worker-shaped transport. Tests supply an EventTarget adapter. */
export interface CalculationTransport {
  postMessage(message: WorkerRequest): void;
  addEventListener(type: "message" | "error" | "messageerror", listener: (event: Event) => void): void;
  removeEventListener(type: "message" | "error" | "messageerror", listener: (event: Event) => void): void;
  terminate(): void;
}

interface Pending {
  expected: WorkerResponse["kind"];
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

type WorkerBody = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, "id"> : never) : never;

interface Job extends Pending {
  request: WorkerBody;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function defaultWorker(): CalculationTransport {
  return new Worker(new URL("../../workers/counterfactual.worker.ts", import.meta.url), { type: "module" });
}

function messageData(event: Event): WorkerResponse | undefined {
  if (event.type !== "message") return undefined;
  const data = (event as MessageEvent).data;
  return data && typeof data === "object" ? data as WorkerResponse : undefined;
}

export function createDebriefCalculations(options: {
  overrides: Overrides;
  createWorker?: () => CalculationTransport;
}): DebriefCalculations {
  const createWorker = options.createWorker ?? defaultWorker;
  let worker: CalculationTransport | null = null;
  let configured = false;
  let booting = false;
  let nextId = 0;
  let disposed = false;
  let lastFailure: Error | null = null;
  const pending = new Map<number, Pending>();
  const jobs: Job[] = [];

  const cancelled = () => new CalculationCancelledError();

  const finish = (id: number, settle: (entry: Pending) => void) => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    settle(entry);
  };

  const rejectQueued = (error: Error) => {
    const waiting = jobs.splice(0);
    for (const job of waiting) job.reject(error);
  };

  const settleAll = (error: Error) => {
    const waiting = [...pending.values()];
    pending.clear();
    for (const entry of waiting) entry.reject(error);
    rejectQueued(error);
  };

  const unbind = (target: CalculationTransport) => {
    target.removeEventListener("message", onMessage);
    target.removeEventListener("error", onError);
    target.removeEventListener("messageerror", onMessageError);
  };

  const teardown = () => {
    const target = worker;
    worker = null;
    configured = false;
    booting = false;
    nextId = 0;
    if (!target) return;
    unbind(target);
    try {
      target.terminate();
    } catch {
      // Already dead.
    }
  };

  const failTransport = (error: Error) => {
    lastFailure = error;
    settleAll(error);
    teardown();
  };

  const send = (job: Job) => {
    if (!worker) {
      job.reject(lastFailure ?? new Error("The calculation worker failed"));
      return;
    }
    const id = nextId++;
    pending.set(id, job);
    try {
      worker.postMessage({ ...job.request, id } as WorkerRequest);
    } catch (error) {
      pending.delete(id);
      const failure = toError(error);
      if (job.expected === "configured") failTransport(failure);
      else job.reject(failure);
    }
  };

  const flush = () => {
    if (!configured || !worker) return;
    const ready = jobs.splice(0);
    for (const job of ready) send(job);
  };

  const onMessage = (event: Event) => {
    const response = messageData(event);
    if (!response) return;
    const entry = pending.get(response.id);
    if (!entry) return;
    if (response.kind === "error") {
      const error = new Error(response.message);
      if (entry.expected === "configured") {
        failTransport(error);
        return;
      }
      finish(response.id, (waiting) => waiting.reject(error));
      return;
    }
    if (response.kind !== entry.expected) {
      finish(response.id, (waiting) => waiting.reject(new Error(`Unexpected ${response.kind} reply`)));
      return;
    }
    if (response.kind === "configured") {
      configured = true;
      lastFailure = null;
      finish(response.id, (waiting) => waiting.resolve(undefined));
      flush();
      return;
    }
    if (response.kind === "soundness") {
      finish(response.id, (waiting) => waiting.resolve(response.estimates));
      return;
    }
    finish(response.id, (waiting) => waiting.resolve({ result: response.result, milliseconds: response.milliseconds }));
  };

  const onError = (event: Event) => {
    const message = "message" in event && typeof event.message === "string" && event.message
      ? event.message
      : "The calculation worker failed";
    failTransport(new Error(message));
  };

  const onMessageError = () => {
    failTransport(new Error("The calculation worker reported a messageerror"));
  };

  const bind = (target: CalculationTransport) => {
    target.addEventListener("message", onMessage);
    target.addEventListener("error", onError);
    target.addEventListener("messageerror", onMessageError);
  };

  const boot = () => {
    if (worker || booting || disposed) return;
    booting = true;
    lastFailure = null;
    try {
      worker = createWorker();
    } catch (error) {
      booting = false;
      throw toError(error);
    }
    bind(worker);
    send({
      expected: "configured",
      request: { kind: "configure", overrides: options.overrides },
      resolve: () => undefined,
      reject: () => undefined,
    });
  };

  const request = <T,>(expected: WorkerResponse["kind"], body: WorkerBody): Promise<T> => {
    if (disposed) return Promise.reject(cancelled());
    return new Promise<T>((resolve, reject) => {
      jobs.push({ expected, request: body, resolve: resolve as (value: unknown) => void, reject });
      try {
        boot();
        flush();
      } catch (error) {
        const failure = toError(error);
        lastFailure = failure;
        rejectQueued(failure);
      }
    });
  };

  return {
    soundness(decisionStates: GameState[], rollouts: number) {
      return request<OptionEstimate[][]>("soundness", { kind: "soundness", decisionStates, rollouts });
    },
    whatIf(requestArgs: WhatIfCalculation) {
      return request<WhatIfCalculationAnswer>("whatIf", { kind: "whatIf", ...requestArgs });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      settleAll(cancelled());
      teardown();
    },
  };
}
