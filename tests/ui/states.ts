// Real game states for the pure UI helpers' tests, built with the engine and the
// real content, plus the hidden-information checks those tests share. Not a test
// file itself (Vitest collects only *.test.ts).

import { reduce, type Content, type GameState, type Track } from "../../src/engine";
import { nextAction, type Policy } from "../engine/fixture";

/** Keys that must never appear in anything a play screen renders (handoff invariant 3). */
export const FORBIDDEN_KEYS = ["halfWidth", "truth", "history", "debrief", "oddsAtTheTime", "succeeded"];

/** Every object key anywhere inside a value. */
export function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => [key, ...keysOf(child)]);
  return [];
}

/** The cheapest open option each turn; investment goes to the first open track in `tracks`. */
export const cheapest = (...tracks: Track[]): Policy => ({
  choose: (state, ids) => [...ids].sort((a, b) => cost(state, a) - cost(state, b))[0]!,
  invest: (_state, open) => tracks.find((t) => open.includes(t)) ?? open[0]!,
});

/** The dearest open option each turn: spends Political Capital down, so later options become unaffordable. */
export const dearest = (...tracks: Track[]): Policy => ({
  choose: (state, ids) => [...ids].sort((a, b) => cost(state, b) - cost(state, a))[0]!,
  invest: (_state, open) => tracks.find((t) => open.includes(t)) ?? open[0]!,
});

const cost = (state: GameState, id: string) => state.current!.choices.find((c) => c.id === id)!.cost;

/** Plays legal actions until `stop` holds. Throws if the game ends first. */
export function advanceUntil(state: GameState, content: Content, policy: Policy, stop: (s: GameState) => boolean): GameState {
  let next = state;
  while (!stop(next)) {
    if (next.phase === "debrief") throw new Error("The game ended before the state was reached");
    next = reduce(next, nextAction(next, policy), content);
  }
  return next;
}

/**
 * The same content with its hidden half changed everywhere: hidden effects, conditional
 * effects and odds modifiers on every option (except those of `spare`, whose resolution
 * a test compares), and every event's base odds. Public fields are untouched.
 */
export function perturbHidden(content: Content, spare: string | null = null): Content {
  const copy = structuredClone(content);
  const bump = (n: number) => Math.min(100, n + 7);
  for (const scenario of copy.scenarios) {
    for (const choice of scenario.choices) {
      choice.probabilityModifiers = [...choice.probabilityModifiers, { eventId: "infra-attack", delta: 17 }];
      if (scenario.id === spare) continue;
      choice.hiddenEffects = { ...choice.hiddenEffects, systemicRisk: (choice.hiddenEffects.systemicRisk ?? 0) + 9, economy: (choice.hiddenEffects.economy ?? 0) - 5 };
      choice.conditionalEffects = [...choice.conditionalEffects, { when: [{ seedFact: "cyberOffenceLed" }], effects: { nationalSecurity: -6 } }];
    }
  }
  for (const event of copy.events) {
    const base = event.base;
    if (base === undefined || base === "certain") continue;
    if ("cases" in base) event.base = { cases: base.cases.map((c) => ({ ...c, probability: bump(c.probability) })), otherwise: bump(base.otherwise) };
    else if ("fact" in base) event.base = { ...base, whenTrue: bump(base.whenTrue), whenFalse: bump(base.whenFalse) };
    else event.base = { benign: bump(base.benign), contested: bump(base.contested), hard: bump(base.hard) };
  }
  return copy;
}
