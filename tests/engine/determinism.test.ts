import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce } from "../../src/engine";
import { mulberry32 } from "../../src/engine/rng";
import { METRIC_KEYS } from "../../src/engine/resolve";
import { deepFreeze, first, fixture, nextAction, playThrough, type Policy } from "./fixture";

describe("determinism", () => {
  test("the same seed and actions give a byte-identical final state across 100 runs", () => {
    const play = () => JSON.stringify(playThrough(createGame("TEST-SEED", fixture), fixture, { ...first, buyInfo: true }).at(-1));
    const reference = play();
    for (let run = 1; run < 100; run++) expect(play()).toBe(reference);
  });

  test("seed codes ignore case and surrounding whitespace", () => {
    expect(createGame("  workshop-7 ", fixture).world).toEqual(createGame("WORKSHOP-7", fixture).world);
  });

  test("different seeds give different worlds", () => {
    const worlds = new Set(Array.from({ length: 50 }, (_, i) => JSON.stringify(createGame(`seed-${i}`, fixture).world)));
    expect(worlds.size).toBeGreaterThan(40);
  });
});

describe("purity", () => {
  test("reduce and displayed never mutate their inputs", () => {
    const content = deepFreeze(structuredClone(fixture));
    let state = deepFreeze(createGame("FROZEN", content));
    while (state.phase !== "debrief") {
      displayed(state);
      state = deepFreeze(reduce(state, nextAction(state, { ...first, buyInfo: true }), content));
    }
    expect(displayed(state).truth).toBeDefined();
  });

  test("an illegal action throws and leaves no trace", () => {
    const state = deepFreeze(createGame("ILLEGAL", fixture));
    expect(() => reduce(state, { type: "ADVANCE" }, fixture)).toThrow();
    expect(() => reduce(state, { type: "DECIDE", choiceId: "A" }, fixture)).toThrow();
    expect(() => reduce(state, { type: "FORECAST", value: 1.2 }, fixture)).toThrow();
    expect(() => reduce(state, { type: "FORECAST", value: Number.NaN }, fixture)).toThrow();
  });
});

describe("no wall clock", () => {
  test("engine source never touches Math.random, Date, crypto or performance", () => {
    // Vite's raw glob reads the source files without needing Node's type definitions.
    const sources = import.meta.glob<string>("../../src/engine/*.ts", { query: "?raw", import: "default", eager: true });
    const banned = [/\bMath\.random\b/, /\bDate\b/, /\bcrypto\b/, /\bperformance\b/];
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(7);
    for (const [file, source] of Object.entries(sources)) {
      // Comments may name the banned APIs; code may not.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const pattern of banned) expect(code, `${file} matches ${pattern}`).not.toMatch(pattern);
    }
  });
});

describe("property: random legal play", () => {
  test("1,000 seeds never throw, never produce NaN, and always reach exactly one ending", () => {
    for (let seed = 0; seed < 1000; seed++) {
      // The test's own choices come from the seeded generator too, so a failure reproduces.
      let rng = seed + 1;
      const pick = <T,>(items: T[]): T => {
        const draw = mulberry32(rng);
        rng = draw.state;
        return items[Math.floor(draw.value * items.length)]!;
      };
      const policy: Policy = {
        choose: (_state, ids) => pick(ids),
        invest: (_state, tracks) => pick(tracks),
        forecast: pick([0.05, 0.3, 0.5, 0.8]),
        buyInfo: pick([true, false]),
      };
      const states = playThrough(createGame(`property-${seed}`, fixture), fixture, policy);
      const final = states.at(-1)!;

      for (const state of states) {
        for (const key of METRIC_KEYS) {
          expect(Number.isFinite(state.metrics[key]), `seed ${seed}: ${key}`).toBe(true);
          expect(state.metrics[key]).toBeGreaterThanOrEqual(0);
          expect(state.metrics[key]).toBeLessThanOrEqual(100);
        }
        expect(state.politicalCapital).toBeGreaterThanOrEqual(0);
      }
      // Two scripted scenarios, one interrupt or false alarm, and the final decision.
      expect(final.history).toHaveLength(fixture.sequence.length + 1);
      expect(final.history.filter((r) => r.scenarioId === "incident" || r.scenarioId === "false-alarm")).toHaveLength(1);
      expect(fixture.endings.map((e) => e.id)).toContain(final.debrief?.endingId);
      expect(Number.isFinite(final.debrief?.brier)).toBe(true);
    }
  });
});
