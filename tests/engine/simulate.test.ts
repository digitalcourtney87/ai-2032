import { describe, expect, test } from "vitest";
import { simulate } from "../../src/engine";
import { hashString } from "../../src/engine/rng";
import { balanceForProfile, optionValues, playSeed, STRATEGIES } from "../../src/engine/simulate";
import { fixture } from "./fixture";

const stanceOf = (scenarioId: string, choiceId: string) =>
  fixture.scenarios.find((s) => s.id === scenarioId)!.choices.find((c) => c.id === choiceId)!.stance;
const topStance = (scenarioId: string) =>
  Math.max(...fixture.scenarios.find((s) => s.id === scenarioId)!.choices.map((c) => c.stance ?? 0));

describe("the fixed strategies (DECISIONS.md, decision 2)", () => {
  const seeds = Array.from({ length: 200 }, (_, i) => hashString(`strategy:${i}`));

  test("always-permissive takes the lowest stance rank on offer", () => {
    for (const seed of seeds) {
      for (const record of playSeed(seed, fixture, "permissive").history) expect(stanceOf(record.scenarioId, record.choiceId)).toBe(1);
    }
  });

  test("always-restrictive takes the highest rank it can afford, and the top rank when it can", () => {
    let topPicks = 0;
    let decisions = 0;
    for (const seed of seeds) {
      for (const record of playSeed(seed, fixture, "restrictive").history) {
        decisions++;
        if (stanceOf(record.scenarioId, record.choiceId) === topStance(record.scenarioId)) topPicks++;
      }
    }
    expect(topPicks / decisions).toBeGreaterThan(0.8);
  });

  test("always-middle takes a middle rank, splitting evenly between the two middles of four", () => {
    const s1Picks = seeds.map((seed) => playSeed(seed, fixture, "middle").history[0]!.choiceId);
    expect(new Set(s1Picks)).toEqual(new Set(["B", "D"]));                       // stances 2 and 3 of 4
    const shareB = s1Picks.filter((id) => id === "B").length / s1Picks.length;
    expect(shareB).toBeGreaterThan(0.35);
    expect(shareB).toBeLessThan(0.65);
  });

  test("no fixed strategy ever takes an investment-unlocked option", () => {
    for (const seed of seeds) {
      for (const strategy of STRATEGIES) {
        for (const record of playSeed(seed, fixture, strategy).history) expect(stanceOf(record.scenarioId, record.choiceId)).toBeDefined();
      }
    }
  });

  test("all bots share one investment sequence, so comparisons isolate the decision posture", () => {
    for (const seed of seeds.slice(0, 50)) {
      const sequences = STRATEGIES.map((s) => playSeed(seed, fixture, s));
      const turns = (i: number) => new Map(sequences[i]!.history.map((r) => [r.turn, r.investedIn]));
      // The same turn draws the same track for every bot, unless that track is already full
      // (fixture choice D raises Defensive cyber itself) or the interrupt landed on a different turn.
      for (const [turn, track] of turns(0)) {
        const other = turns(2).get(turn);
        if (track === null || other === null || other === undefined) continue;
        const full = sequences.some((g) => g.tracks[track] === 3 || g.tracks[other] === 3);
        if (!full) expect(other, `seed ${seed} turn ${turn}`).toBe(track);
      }
    }
  });
});

describe("the headless runner", () => {
  test("is deterministic", () => {
    expect(JSON.stringify(playSeed(42, fixture, "middle"))).toBe(JSON.stringify(playSeed(42, fixture, "middle")));
    expect(simulate("permissive", 50, fixture)).toEqual(simulate("permissive", 50, fixture));
  });

  test("a forced profile is respected and changes nothing else about the seed", () => {
    for (const profile of ["benign", "contested", "hard"] as const) expect(playSeed(7, fixture, "neutral", profile).world.profile).toBe(profile);
  });

  test("an override forces one decision and leaves the rest to the policy", () => {
    const forced = playSeed(11, fixture, "permissive", undefined, { s1: "C" });
    expect(forced.history[0]!.choiceId).toBe("C");
    expect(forced.history.slice(1).every((r) => stanceOf(r.scenarioId, r.choiceId) === 1)).toBe(true);
  });

  test("simulate() reports a mean score and ending shares that sum to one", () => {
    const result = simulate("restrictive", 200, fixture);
    expect(result).toMatchObject({ strategy: "restrictive", runs: 200 });
    expect(result.meanScore).toBeGreaterThan(0);
    expect(Object.values(result.endings).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe("the balance measures", () => {
  test("win shares sum to one in every profile, with ties splitting the credit", () => {
    const row = balanceForProfile("contested", 300, fixture);
    expect(STRATEGIES.reduce((sum, s) => sum + row.winShare[s], 0)).toBeCloseTo(1, 10);
  });

  test("option values cover every base option in every profile and fact slice", () => {
    const values = optionValues(100, fixture);
    const baseOptions = fixture.scenarios.flatMap((s) => s.choices.filter((c) => c.stance !== undefined)).length;
    expect(values).toHaveLength(baseOptions);
    const s1 = values.find((v) => v.scenarioId === "s1" && v.choiceId === "A")!;
    for (const cell of ["benign", "contested", "hard", "cyberOffenceLed:true", "cyberOffenceLed:false"] as const) {
      expect(Number.isFinite(s1.meanScore[cell]), cell).toBe(true);
    }
  });
});
