import { describe, expect, test } from "vitest";
import { createGame, type GameState } from "../../src/engine";
import { composites } from "../../src/engine/resolve";
import { brier, endingScore, luckDelta, luckTag, resolveEnding, scoreImpact } from "../../src/engine/scoring";
import { first, fixture, playThrough } from "./fixture";

const withMetrics = (state: GameState, metrics: Partial<GameState["metrics"]>): GameState => ({
  ...state,
  metrics: { ...state.metrics, ...metrics },
});

describe("Brier score", () => {
  test("matches a hand calculation", () => {
    // (0.7-1)^2 + (0.2-0)^2 + (0.5-1)^2 + (0.9-0)^2 = 0.09 + 0.04 + 0.25 + 0.81 = 1.19; / 4 = 0.2975
    expect(brier([
      { forecast: 0.7, outcome: 1 }, { forecast: 0.2, outcome: 0 },
      { forecast: 0.5, outcome: 1 }, { forecast: 0.9, outcome: 0 },
    ])).toBeCloseTo(0.2975, 10);
  });

  test("always answering 50% scores exactly 0.25", () => {
    const final = playThrough(createGame("BRIER", fixture), fixture, first).at(-1)!;
    expect(final.debrief!.brier).toBeCloseTo(0.25, 10);
    expect(final.debrief!.forecasts).toHaveLength(final.history.length);
    expect(Object.keys(final.debrief!.adviserBrier).sort()).toEqual(["chen", "harcourt", "okafor", "shah"]);
  });
});

describe("composites and the ending score", () => {
  const state = withMetrics(createGame("SCORE", fixture), {
    nationalSecurity: 60, stateCapacity: 45, systemicRisk: 30,     // control = (60 + 45 + 70) / 3
    economy: 55, innovation: 40, socialStability: 52,              // prosperity = 147 / 3
    publicTrust: 48,
  });

  test("composites follow spec Section 10", () => {
    expect(composites(state.metrics)).toEqual({ control: 175 / 3, prosperity: 49, legitimacy: 48 });
  });

  test("the ending score is the mean of the three composites (decision 1)", () => {
    expect(endingScore(state.metrics)).toBeCloseTo((175 / 3 + 49 + 48) / 3, 10);
  });

  test("scoreImpact is the ending score's gradient", () => {
    const effects = { nationalSecurity: -10, publicTrust: -4, systemicRisk: 5, cooperation: 9 };
    const moved = withMetrics(state, {
      nationalSecurity: 50, publicTrust: 44, systemicRisk: 35, cooperation: state.metrics.cooperation + 9,
    });
    expect(scoreImpact(effects)).toBeCloseTo(endingScore(moved.metrics) - endingScore(state.metrics), 10);
  });
});

describe("endings", () => {
  const ending = (metrics: Partial<GameState["metrics"]>, flags: string[] = []) =>
    resolveEnding({ ...withMetrics(createGame("ENDING", fixture), metrics), flags }, fixture).id;
  const high = { nationalSecurity: 70, stateCapacity: 70, systemicRisk: 20, economy: 70, innovation: 70, socialStability: 70 };
  const low = { nationalSecurity: 30, stateCapacity: 30, systemicRisk: 60, economy: 30, innovation: 30, socialStability: 30 };

  test("the four quadrants", () => {
    expect(ending(high)).toBe("responsible");
    expect(ending({ ...high, economy: 30, innovation: 30, socialStability: 30 })).toBe("fortress");
    expect(ending({ ...low, economy: 70, innovation: 70, socialStability: 70 })).toBe("deregulated");
    expect(ending(low)).toBe("dependent");
  });

  test("a higher-priority ending overrides the quadrants", () => {
    expect(ending(high, ["prohibited"])).toBe("unknown-frontier");
  });

  test("exactly one ending is always chosen", () => {
    expect(ending({ ...high, nationalSecurity: 55, stateCapacity: 55, systemicRisk: 45 })).toBeDefined();
  });
});

describe("luck", () => {
  test("a harmful event that fires against the odds reads as unlucky; one that misses reads as fortunate", () => {
    const harm = { kind: "event" as const, id: "attack", probability: 0.3, impact: -2 };
    expect(luckDelta([{ ...harm, happened: true }])).toBeCloseTo(-1.4);
    expect(luckDelta([{ ...harm, happened: false }])).toBeCloseTo(0.6);
  });

  test("the four tags", () => {
    expect([luckTag(true, true), luckTag(true, false), luckTag(false, true), luckTag(false, false)]).toEqual([
      "sound and fortunate", "sound and unlucky", "risky and fortunate", "risky and unlucky",
    ]);
  });

  test("luck reads the frozen odds, not odds recomputed from a later state", () => {
    const final = playThrough(createGame("LUCK", fixture), fixture, first).at(-1)!;
    const s1 = final.debrief!.luck.find((l) => l.scenarioId === "s1")!;
    const attack = s1.links.find((l) => l.id === "attack")!;
    expect(attack.probability).toBe(final.history[0]!.oddsAtTheTime.find((o) => o.eventId === "attack")!.probability);
    expect(attack.happened).toBe(final.outcomes.find((o) => o.eventId === "attack")!.fired);
    expect(s1.fortunate).toBe(!attack.happened);
  });
});
