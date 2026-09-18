import { describe, expect, test } from "vitest";
import { counterfactual, createGame, reduce, soundness, type GameState } from "../../src/engine";
import { loadContent } from "../../src/content/load";
import { deepFreeze, first, fixture, nextAction, playThrough } from "./fixture";

/** Plays a fixture game with the first option each turn, keeping the state at every decision. */
function playedGame(seedCode: string) {
  const decisionStates: GameState[] = [];
  let state = createGame(seedCode, fixture);
  while (state.phase !== "debrief") {
    if (state.phase === "decide") decisionStates.push(state);
    state = reduce(state, nextAction(state, first), fixture);
  }
  return { final: state, decisionStates };
}

describe("counterfactual reruns (spec Section 11)", () => {
  const { final } = playedGame("WHAT-IF");
  const context = { profile: final.world.profile, baseSeed: final.world.seed };

  test("are deterministic", () => {
    const run = () => counterfactual(final.history, 0, "C", 200, fixture, context);
    expect(run()).toEqual(run());
  });

  test("changing nothing changes nothing: both arms replay the same history on the same seeds", () => {
    const same = counterfactual(final.history, 0, final.history[0]!.choiceId, 300, fixture, context);
    expect(same.changed).toEqual(same.asPlayed);
  });

  test("a changed decision moves the outcome in the direction its effects imply", () => {
    // Fixture s1: option A has no effect on attack odds; option C cuts them by 10 points and adds National Security +4.
    const result = counterfactual(final.history, 0, "C", 1000, fixture, context);
    expect(result).toMatchObject({ runs: 1000, scenarioId: "s1", asPlayedChoiceId: "A", newChoiceId: "C", profile: context.profile });
    expect(result.changed.seriousIncidentShare).toBeLessThan(result.asPlayed.seriousIncidentShare);
    expect(result.changed.medianMetrics.nationalSecurity).toBeGreaterThan(result.asPlayed.medianMetrics.nationalSecurity);
    expect(result.changed.medianMetrics.innovation).toBeLessThan(result.asPlayed.medianMetrics.innovation);
  });

  test("reruns stay inside the player's world profile", () => {
    for (const profile of ["benign", "hard"] as const) {
      const result = counterfactual(final.history, 0, "C", 400, fixture, { profile, baseSeed: 1 });
      expect(result.profile).toBe(profile);
    }
    const benign = counterfactual(final.history, 0, "C", 1500, fixture, { profile: "benign", baseSeed: 1 });
    const hard = counterfactual(final.history, 0, "C", 1500, fixture, { profile: "hard", baseSeed: 1 });
    expect(hard.asPlayed.seriousIncidentShare).toBeGreaterThan(benign.asPlayed.seriousIncidentShare);
  });

  test("ending shares sum to one and never mutate the history", () => {
    const history = deepFreeze(structuredClone(final.history));
    const result = counterfactual(history, 1, "D", 200, fixture, context);
    for (const arm of [result.asPlayed, result.changed]) {
      expect(Object.values(arm.endings).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });

  test("an out-of-range decision is refused", () => {
    expect(() => counterfactual(final.history, 99, "A", 10, fixture, context)).toThrow();
  });
});

describe("sound decisions (DECISIONS.md, decision 6)", () => {
  const { final, decisionStates } = playedGame("SOUND");

  test("every option that was open is valued, best first, deterministically", () => {
    const estimates = soundness(decisionStates[0]!, 150, fixture);
    const open = decisionStates[0]!.current!.choices.filter((c) => c.status === "available").map((c) => c.id);
    expect(estimates.map((e) => e.choiceId).sort()).toEqual(open.sort());
    for (let i = 1; i < estimates.length; i++) expect(estimates[i - 1]!.expectedScore).toBeGreaterThanOrEqual(estimates[i]!.expectedScore);
    expect(soundness(decisionStates[0]!, 150, fixture)).toEqual(estimates);
  });

  test("the verdict does not depend on the hidden world the player happened to be in", () => {
    // Two games on different seeds reach the same observable first decision, so they get the same ranking.
    const a = soundness(playedGame("SEED-A").decisionStates[0]!, 400, fixture).map((e) => e.choiceId);
    const b = soundness(playedGame("SEED-B").decisionStates[0]!, 400, fixture).map((e) => e.choiceId);
    expect(a.slice(0, 2).sort()).toEqual(b.slice(0, 2).sort());
  });

  test("the verdict on an early decision cannot be changed by a later one", () => {
    const early = decisionStates[0]!;
    const before = soundness(early, 200, fixture);
    expect(final.history.length).toBeGreaterThan(1);                        // later decisions were taken
    expect(soundness(early, 200, fixture)).toEqual(before);
  });

  test("there is one decision state per decision, and the input is never mutated", () => {
    expect(decisionStates).toHaveLength(final.history.length);
    expect(() => soundness(deepFreeze(structuredClone(decisionStates[1]!)), 50, fixture)).not.toThrow();
  });
});

describe("the debrief budget on the real content (handoff Phase 6 gate)", () => {
  const content = loadContent();
  const final = playThrough(createGame("BUDGET", content), content, first).at(-1)!;

  test("1,000 counterfactual reruns finish well inside 3 seconds", () => {
    const started = performance.now();
    const result = counterfactual(final.history, 1, "C", 1000, content, { profile: final.world.profile, baseSeed: final.world.seed });
    const elapsed = performance.now() - started;
    expect(result.runs).toBe(1000);
    expect(elapsed).toBeLessThan(3000);
  });
});
