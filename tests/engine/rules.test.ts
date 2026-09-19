import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type Content, type GameState } from "../../src/engine";
import { bandHalfWidth } from "../../src/engine/display";
import { oddsOf } from "../../src/engine/resolve";
import { first, fixture, playThrough, playTurn } from "./fixture";

/** Finds a seed whose opening state satisfies a predicate, so tests can pin a world. */
function seedWhere(predicate: (state: GameState) => boolean, content: Content = fixture): GameState {
  for (let i = 0; i < 5000; i++) {
    const state = createGame(`search-${i}`, content);
    if (predicate(state)) return state;
  }
  throw new Error("No seed satisfies the predicate");
}

const withMetrics = (state: GameState, metrics: Partial<GameState["metrics"]>): GameState => ({
  ...state,
  metrics: { ...state.metrics, ...metrics },
});

const attackFires = (state: GameState) => playThrough(state, fixture, first).at(-1)!.outcomes.find((o) => o.eventId === "attack")!.fired;

describe("estimate bands", () => {
  // The exact half-width stays inside the engine: it would give away State Capacity (DECISIONS.md, B45).
  test.each([[0, 30], [40, 20], [100, 5]])("at State Capacity %i the half-width is %i", (capacity, halfWidth) => {
    expect(bandHalfWidth(withMetrics(createGame("BAND", fixture), { stateCapacity: capacity }))).toBe(halfWidth);
  });

  test.each([[40, 20], [100, 5]])("at State Capacity %i the shown band spans %i either side, rounded outwards", (capacity, halfWidth) => {
    for (let i = 0; i < 50; i++) {
      const view = displayed(withMetrics(createGame(`span-${i}`, fixture), { stateCapacity: capacity, systemicRisk: 50, cooperation: 50 }));
      for (const { low, high } of Object.values(view.estimates)) {
        expect(high - low).toBeGreaterThanOrEqual(2 * halfWidth);
        expect(high - low).toBeLessThan(2 * halfWidth + 2);
      }
    }
  });

  test("the band always contains the true value, and is stable within a turn", () => {
    for (let i = 0; i < 200; i++) {
      const state = createGame(`band-${i}`, fixture);
      const { low, high } = displayed(state).estimates.systemicRisk;
      expect(low).toBeLessThanOrEqual(state.metrics.systemicRisk);
      expect(high).toBeGreaterThanOrEqual(state.metrics.systemicRisk);
      expect(displayed(state)).toEqual(displayed(state));
    }
  });

  test("State Capacity shows only as a label", () => {
    const at = (capacity: number) => displayed(withMetrics(createGame("LABEL", fixture), { stateCapacity: capacity })).stateCapacity;
    expect([at(34), at(35), at(64), at(65)]).toEqual(["Thin", "Adequate", "Adequate", "Strong"]);
  });
});

describe("truth stays in the engine", () => {
  const sentinel = { systemicRisk: 37.123, cooperation: 61.457, stateCapacity: 43.891 };
  /** Plays to just after the decision, when the turn context holds the most. */
  const midTurn = (metrics: Partial<GameState["metrics"]>) => {
    const state = reduce(withMetrics(createGame("HIDDEN", fixture), metrics), { type: "FORECAST", value: 0.5 }, fixture);
    return reduce(state, { type: "DECIDE", choiceId: "B" }, fixture);
  };

  test("displayed() exposes no true hidden value before the debrief", () => {
    const state = midTurn(sentinel);
    expect(state.current!.oddsAtTheTime.length).toBeGreaterThan(0);

    const view = displayed(state);
    const json = JSON.stringify(view);
    for (const value of Object.values(sentinel)) expect(json).not.toContain(String(value));
    expect(view.truth).toBeUndefined();
    expect(view.debrief).toBeUndefined();
    expect(view.current!.oddsAtTheTime).toEqual([]);
    expect(json).not.toContain("cyberOffenceLed");
  });

  // A leak need not be the raw number. A field computed from a hidden value without
  // rounding moves when that value moves, however slightly, and so gives it away.
  test("no displayed field moves with a hidden value", () => {
    const baseline = displayed(midTurn(sentinel));
    for (const key of Object.keys(sentinel) as (keyof typeof sentinel)[]) {
      expect(displayed(midTurn({ ...sentinel, [key]: sentinel[key] + 1e-6 })), key).toEqual(baseline);
    }
  });

  test("the debrief unlocks the truth", () => {
    const final = playThrough(createGame("UNLOCK", fixture), fixture, first).at(-1)!;
    const view = displayed(final);
    expect(view.truth?.metrics).toEqual(final.metrics);
    expect(view.truth?.world).toEqual(final.world);
    expect(view.debrief?.endingId).toBeDefined();
  });
});

describe("clamping", () => {
  test("metrics stay in 0..100 under extreme effects", () => {
    const extreme = structuredClone(fixture);
    const choice = extreme.scenarios[0]!.choices[0]!;
    choice.visibleEffects = { nationalSecurity: 1000, economy: -1000 };
    choice.hiddenEffects = { systemicRisk: 1000, stateCapacity: -1000 };
    const next = playTurn(createGame("CLAMP", extreme), extreme, "A");
    expect(next.metrics).toMatchObject({ nationalSecurity: 100, economy: 0, systemicRisk: 100, stateCapacity: 0 });
  });

  test.each([[1000, 95], [-1000, 2]])("event odds under a %i-point modifier clamp to %i%%", (delta, expected) => {
    const state = createGame("ODDS", fixture);
    const attack = state.queue.find((q) => q.eventId === "attack")!;
    expect(oddsOf(attack, { ...state, oddsModifiers: { attack: delta } }, fixture)).toBe(expected);
  });
});

describe("political capital", () => {
  // Opening capital is 5. Choice A costs 2, leaving 3; choice D in s2 costs 0.
  test("income is 5 a turn and carry-over is capped at 3", () => {
    const start = createGame("PC", fixture);
    expect(start.politicalCapital).toBe(5);
    const afterA = playTurn(start, fixture, "A");            // 5 - 2 = 3 carried, +5
    expect(afterA.politicalCapital).toBe(8);
    const hoarder = playTurn({ ...start, politicalCapital: 9 }, fixture, "A"); // 7 left, capped to 3, +5
    expect(hoarder.politicalCapital).toBe(8);
  });

  test("Public Trust at 60 or above adds 1; at 40 or below takes 1", () => {
    const start = createGame("TRUST", fixture);
    expect(playTurn(withMetrics(start, { publicTrust: 60 }), fixture, "A").politicalCapital).toBe(9);
    expect(playTurn(withMetrics(start, { publicTrust: 40 }), fixture, "A").politicalCapital).toBe(7);
    expect(playTurn(withMetrics(start, { publicTrust: 59 }), fixture, "A").politicalCapital).toBe(8);
  });

  test("Economy at 65 or above makes restrictive options cost 1 more", () => {
    // Drift (+1) applies before the next turn's prices are set: 64 becomes 65.
    const quiet = seedWhere((s) => playTurn(s, fixture, "A").current!.scenarioId === "s2");
    const next = playTurn(withMetrics(quiet, { economy: 64 }), fixture, "A");
    const costs = Object.fromEntries(next.current!.choices.map((c) => [c.id, c.cost]));
    expect(costs).toEqual({ A: 2, B: 5, C: 3, D: 0, E: 2 });    // only B is restrictive: 4 + 1
  });

  test("the boom surcharge applies before the policy-window discount", () => {
    const struck = seedWhere((s) => playTurn(s, fixture, "A").current!.scenarioId === "incident");
    const next = playTurn(withMetrics(struck, { economy: 64 }), fixture, "A");
    const costs = Object.fromEntries(next.current!.choices.map((c) => [c.id, c.cost]));
    expect(costs).toEqual({ A: 1, B: 2, C: 4 });                // B: 3+1-2, C: 5+1-2
  });

  test("a public incident opens a two-turn window: restrictive options in its domain cost 2 less, minimum 1", () => {
    const start = seedWhere(attackFires);
    const states = playThrough(start, fixture, first);
    const interrupt = states.find((s) => s.current?.scenarioId === "incident" && s.phase === "forecast")!;
    expect(interrupt.current!.isInterrupt).toBe(true);
    expect(interrupt.policyWindows).toEqual([{ domain: "cyber", turnsLeft: 2 }]);
    const costs = Object.fromEntries(interrupt.current!.choices.map((c) => [c.id, c.cost]));
    expect(costs).toEqual({ A: 1, B: 1, C: 3 });               // B: 3-2, C: 5-2, A is not restrictive

    // The window covers two turns and then closes.
    const turnsWithWindow = new Set(states.filter((s) => s.policyWindows.length > 0).map((s) => s.turn));
    expect(turnsWithWindow.size).toBe(2);
  });

  test("an unaffordable option cannot be chosen", () => {
    let state = { ...createGame("POOR", fixture), politicalCapital: 3 };
    state = { ...state, current: { ...state.current!, choices: state.current!.choices.map((c) => ({ ...c, status: c.cost > 3 ? "unaffordable" as const : c.status })) } };
    state = reduce(state, { type: "FORECAST", value: 0.5 }, fixture);
    expect(() => reduce(state, { type: "DECIDE", choiceId: "C" }, fixture)).toThrow();
  });
});

describe("frozen odds", () => {
  test("a DecisionRecord keeps the odds as they were at decision time", () => {
    let state = reduce(createGame("FROZEN-ODDS", fixture), { type: "FORECAST", value: 0.3 }, fixture);
    const before = oddsOf(state.queue.find((q) => q.eventId === "attack")!, state, fixture) / 100;
    state = reduce(state, { type: "DECIDE", choiceId: "B" }, fixture);
    const frozen = state.current!.oddsAtTheTime.find((o) => o.eventId === "attack")!;
    expect(frozen.before).toBeCloseTo(before);
    expect(frozen.probability).toBeCloseTo(before - 0.06);      // choice B: attack odds -6 points

    const final = playThrough(state, fixture, first).at(-1)!;
    expect(final.history[0]!.oddsAtTheTime).toEqual(state.current!.oddsAtTheTime);
  });

  test("an event queued by the decision is recorded with the odds it then faced", () => {
    let state = reduce(createGame("QUEUED-ODDS", fixture), { type: "FORECAST", value: 0.3 }, fixture);
    state = reduce(state, { type: "DECIDE", choiceId: "C" }, fixture);
    expect(state.current!.oddsAtTheTime.find((o) => o.eventId === "delay")).toEqual({ eventId: "delay", before: 0, probability: 0.2 });
  });
});

describe("standing investment", () => {
  test("a track bonus applies once per level gained, and drift still applies", () => {
    const start = createGame("INVEST", fixture);
    const next = playTurn(start, fixture, "B", "evaluation");   // B has no State Capacity effect
    expect(next.tracks.evaluation).toBe(1);
    expect(next.metrics.stateCapacity).toBe(40 + 4 - 2);
    const again = playTurn(next, fixture, "D", "diplomacy");
    expect(again.metrics.stateCapacity).toBe(42 - 2);            // no repeat of the level-1 bonus
    expect(again.metrics.cooperation).toBe(45 - 1 + 4 - 1);
  });

  test("a choice can raise a track itself", () => {
    expect(playTurn(createGame("TRACK", fixture), fixture, "D", "defensiveCyber").tracks.defensiveCyber).toBe(2);
  });

  test("the final decision takes no investment", () => {
    const states = playThrough(createGame("NO-INVEST", fixture), fixture, first);
    const finalRecord = states.at(-1)!.history.at(-1)!;
    expect(finalRecord.scenarioId).toBe("final");
    expect(finalRecord.investedIn).toBeNull();
    expect(states.at(-1)!.history.slice(0, -1).every((r) => r.investedIn !== null)).toBe(true);
  });

  test("an option unlocks only when its investment threshold is met", () => {
    const quiet = seedWhere((s) => playTurn(s, fixture, "A").current!.scenarioId === "s2");
    const statusOfE = (s2: GameState) => s2.current!.choices.find((c) => c.id === "E")!.status;

    const unprepared = playTurn(quiet, fixture, "A", "provenance");
    expect(statusOfE(unprepared)).toBe("locked");
    expect(() => reduce(reduce(unprepared, { type: "FORECAST", value: 0.5 }, fixture), { type: "DECIDE", choiceId: "E" }, fixture)).toThrow();
    expect(playTurn(unprepared, fixture, "A").history.at(-1)!.lockedChoiceIds).toEqual(["E"]);

    const prepared = playTurn(quiet, fixture, "A", "evaluation");   // Evaluation science reaches level 1
    expect(statusOfE(prepared)).toBe("available");
    expect(playTurn(prepared, fixture, "E").history.at(-1)).toMatchObject({ choiceId: "E", lockedChoiceIds: [] });
  });
});

describe("the interrupt", () => {
  test("a run is always scripted scenarios + exactly one interrupt, whichever way the dice fall", () => {
    const withAttack = playThrough(seedWhere(attackFires), fixture, first).at(-1)!;
    const without = playThrough(seedWhere((s) => !attackFires(s)), fixture, first).at(-1)!;
    expect(withAttack.history.map((r) => r.scenarioId)).toContain("incident");
    expect(without.history.map((r) => r.scenarioId)).toEqual(["s1", "s2", "false-alarm", "final"]);
    expect(withAttack.history).toHaveLength(4);
  });

  test("the interrupt takes the next turn and later scenarios shift by one", () => {
    const early = seedWhere((s) => {
      const final = playThrough(s, fixture, first).at(-1)!;
      return final.history[1]?.scenarioId === "incident";
    });
    expect(playThrough(early, fixture, first).at(-1)!.history.map((r) => r.scenarioId)).toEqual(["s1", "incident", "s2", "final"]);
  });

  test("crisis turns never sell information", () => {
    const states = playThrough(createGame("CRISIS", fixture), fixture, first);
    for (const state of states) {
      if (state.current && ["incident", "false-alarm"].includes(state.current.scenarioId)) expect(state.current.canBuyInfo).toBe(false);
    }
  });

  test("mitigation halves event damage", () => {
    const start = seedWhere((s) => s.queue.find((q) => q.eventId === "attack")!.rollTurn === 1 && attackFires(s));
    const bare = playTurn(start, fixture, "A", "evaluation");
    const hardened = playTurn({ ...start, tracks: { ...start.tracks, defensiveCyber: 2 } }, fixture, "A", "evaluation");
    // Hardened odds are 10 points lower, so the attack may not fire at all; when it does, damage is halved.
    const fired = hardened.outcomes.find((o) => o.eventId === "attack")!.fired;
    expect(bare.metrics.nationalSecurity).toBe(50 - 10);
    expect(hardened.metrics.nationalSecurity).toBe(fired ? 50 - 5 : 50);
  });
});

describe("options that can fail", () => {
  test("the cost is paid, the effects are not, and the failure outcome applies", () => {
    const afterS1 = seedWhere((s) => playTurn(s, fixture, "A").current!.scenarioId === "s2");
    const s2 = withMetrics(playTurn(afterS1, fixture, "A"), { cooperation: 30 });
    const capitalBefore = s2.politicalCapital;
    const next = playTurn(s2, fixture, "B");
    expect(next.history.at(-1)).toMatchObject({ choiceId: "B", succeeded: false, costPaid: 4 });
    expect(next.metrics.nationalSecurity).toBe(s2.metrics.nationalSecurity);
    expect(next.metrics.publicTrust).toBe(s2.metrics.publicTrust - 1);
    expect(next.flags).toContain("talks-failed");
    expect(next.headlines[0]).toBe("Talks collapse.");
    expect(next.politicalCapital).toBe(Math.min(capitalBefore - 4, 3) + 5);
  });
});

describe("scheduled consequences", () => {
  test("a certain event fires on schedule and reveals a finding", () => {
    const afterS1 = seedWhere((s) => playTurn(s, fixture, "A").current!.scenarioId === "s2" && !attackFires(s));
    const afterS2 = playTurn(playTurn(afterS1, fixture, "A"), fixture, "A");      // s2 A queues the study
    expect(afterS2.queue.some((q) => q.eventId === "study")).toBe(true);
    const afterAlarm = playTurn(afterS2, fixture, "A");                          // interrupt: nothing scripted rolls
    expect(afterAlarm.queue.some((q) => q.eventId === "study")).toBe(true);
    const final = playTurn(afterAlarm, fixture, "A");
    expect(final.outcomes.find((o) => o.eventId === "study")).toMatchObject({ fired: true, probability: 1 });
    expect(final.intel.filter((i) => i.source === "reveal")).toHaveLength(1);
    expect(final.flags).toContain("study-done");
  });

  test("hidden conditional effects follow the world's facts", () => {
    const real = seedWhere((s) => s.world.bioUpliftReal && playTurn(s, fixture, "A").current!.scenarioId === "s2");
    const marginal = seedWhere((s) => !s.world.bioUpliftReal && playTurn(s, fixture, "A").current!.scenarioId === "s2");
    const play = (start: GameState) => {
      const s2 = playTurn(start, fixture, "A");
      return { before: s2.metrics, after: playTurn(s2, fixture, "C").metrics };
    };
    expect(play(real).after.nationalSecurity - play(real).before.nationalSecurity).toBe(3);
    expect(play(marginal).after.publicTrust - play(marginal).before.publicTrust).toBe(-3);
  });
});
