import { describe, expect, test } from "vitest";
import { createGame, type GameState } from "../../src/engine";
import { keyedInt, keyedUniform, mulberry32 } from "../../src/engine/rng";
import { fixture, playThrough, type Policy } from "./fixture";

const SEEDS = Array.from({ length: 4000 }, (_, i) => `world-${i}`);
const share = (count: number) => count / SEEDS.length;

const attackOutcome = (final: GameState) => final.outcomes.find((o) => o.eventId === "attack")!;
const play = (seed: string, policy: Policy) => playThrough(createGame(seed, fixture), fixture, policy).at(-1)!;

describe("the generator", () => {
  test("mulberry32 is a pure step: same state in, same value and next state out", () => {
    expect(mulberry32(12345)).toEqual(mulberry32(12345));
    expect(mulberry32(12345).state).not.toBe(12345);
  });

  test("keyed draws are uniform on [0, 1) and independent of call order", () => {
    const draws = SEEDS.map((_, i) => keyedUniform(i, "event:attack"));
    expect(Math.min(...draws)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...draws)).toBeLessThan(1);
    expect(draws.reduce((a, b) => a + b, 0) / draws.length).toBeCloseTo(0.5, 1);
    expect(share(draws.filter((d) => d < 0.2).length)).toBeCloseTo(0.2, 1);
    keyedUniform(7, "something else");
    expect(keyedUniform(3, "event:attack")).toBe(draws[3]);
  });

  test("keyedInt covers its whole range, ends included", () => {
    const values = new Set(SEEDS.map((_, i) => keyedInt(i, "when:x", 2, 5)));
    expect([...values].sort()).toEqual([2, 3, 4, 5]);
  });
});

describe("shared dice (DECISIONS.md, decision 10)", () => {
  // Two participants on one seed who act differently in ways that leave an event's
  // odds alone must see that event resolve identically.
  test("unrelated actions never change how an event falls", () => {
    const plain: Policy = { choose: () => "A", invest: () => "evaluation", forecast: 0.2 };
    // `busy` forecasts differently, buys information and invests elsewhere. None of that touches the attack's odds.
    const busy: Policy = { choose: () => "A", invest: () => "provenance", forecast: 0.9, buyInfo: true };
    for (const seed of SEEDS.slice(0, 500)) {
      const a = attackOutcome(play(seed, plain));
      const b = attackOutcome(play(seed, busy));
      expect(b.fired, seed).toBe(a.fired);
      expect(b.probability).toBe(a.probability);
    }
  });

  test("lowering an event's odds never makes it more likely to fire on the same seed", () => {
    const exposed: Policy = { choose: (_s, ids) => (ids.includes("A") ? "A" : ids[0]!) };
    const protectedPolicy: Policy = { choose: (s, ids) => (s.current!.scenarioId === "s1" ? "C" : ids.includes("A") ? "A" : ids[0]!) };
    let prevented = 0;
    for (const seed of SEEDS.slice(0, 1000)) {
      const bare = attackOutcome(play(seed, exposed));
      const guarded = attackOutcome(play(seed, protectedPolicy));
      expect(guarded.probability).toBeLessThan(bare.probability);
      if (guarded.fired) expect(bare.fired, seed).toBe(true);
      if (bare.fired && !guarded.fired) prevented++;
    }
    expect(prevented).toBeGreaterThan(0);                       // the 10-point cut prevents some attacks
  });
});

describe("the world seed", () => {
  const worlds = SEEDS.map((seed) => createGame(seed, fixture).world);

  test("profiles are drawn 30 / 40 / 30", () => {
    expect(share(worlds.filter((w) => w.profile === "benign").length)).toBeCloseTo(0.3, 1);
    expect(share(worlds.filter((w) => w.profile === "contested").length)).toBeCloseTo(0.4, 1);
    expect(share(worlds.filter((w) => w.profile === "hard").length)).toBeCloseTo(0.3, 1);
  });

  test("facts follow their profile's odds", () => {
    const hard = worlds.filter((w) => w.profile === "hard");
    const benign = worlds.filter((w) => w.profile === "benign");
    expect(hard.filter((w) => w.cyberOffenceLed).length / hard.length).toBeCloseTo(0.75, 1);
    expect(benign.filter((w) => w.cyberOffenceLed).length / benign.length).toBeCloseTo(0.25, 1);
    expect(benign.filter((w) => w.foreignPostureOpen).length / benign.length).toBeCloseTo(0.7, 1);
  });

  test("an event fires about as often as its stated odds", () => {
    const finals = SEEDS.slice(0, 2000).map((seed) => play(seed, { choose: () => "A" }));
    const offenceLed = finals.filter((f) => f.world.cyberOffenceLed).map(attackOutcome);
    const defenceLed = finals.filter((f) => !f.world.cyberOffenceLed).map(attackOutcome);
    expect(offenceLed.filter((o) => o.fired).length / offenceLed.length).toBeCloseTo(0.5, 1);
    expect(defenceLed.filter((o) => o.fired).length / defenceLed.length).toBeCloseTo(0.15, 1);
  });
});

describe("evidence reliability (DECISIONS.md, decision 5)", () => {
  const openingSignalIsRight = (state: GameState) => state.current!.signalLeansTrue === state.world.cyberOffenceLed;

  test("a Moderate briefing points the right way about 75% of the time", () => {
    const right = SEEDS.filter((seed) => openingSignalIsRight(createGame(seed, fixture))).length;
    expect(share(right)).toBeCloseTo(0.75, 1);
  });

  test("Thin State Capacity silently costs 10 points of reliability", () => {
    const thin = structuredClone(fixture);
    thin.config.startingMetrics.stateCapacity = 20;
    const right = SEEDS.filter((seed) => openingSignalIsRight(createGame(seed, thin))).length;
    expect(share(right)).toBeCloseTo(0.65, 1);
  });

  test("a purchased signal is a second, independent draw at the capacity label's reliability", () => {
    let right = 0;
    let disagreed = 0;
    for (const seed of SEEDS) {
      const final = play(seed, { choose: () => "A", buyInfo: true });
      const [briefing, purchase] = [final.intel.find((i) => i.source === "briefing")!, final.intel.find((i) => i.source === "purchase")!];
      if (purchase.leansTrue === final.world.cyberOffenceLed) right++;
      if (purchase.leansTrue !== briefing.leansTrue) disagreed++;
    }
    expect(share(right)).toBeCloseTo(0.75, 1);                  // State Capacity 40 is Adequate
    expect(disagreed).toBeGreaterThan(0);
  });

  test("advisers' forecasts track the true odds with their bias, and never reveal a fact", () => {
    const state = createGame("ADVISERS", fixture);
    const { harcourt, chen } = state.current!.adviserForecasts;
    expect(harcourt).toBeGreaterThan(chen);                     // +0.15 against -0.08, noise is 0.08 at most
    for (const value of Object.values(state.current!.adviserForecasts)) {
      expect(value).toBeGreaterThanOrEqual(0.02);
      expect(value).toBeLessThanOrEqual(0.98);
    }
  });
});
