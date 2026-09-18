import { describe, expect, test } from "vitest";
import { calibrationBins, causalSentence, outcomeSentence, PREFIX, runSummaryText, soundSentence, whatIfSentences } from "../../src/ui/debrief/copy";
import type { CounterfactualResult, RunSummary } from "../../src/engine";

const arm = (overrides: Partial<RunSummary> = {}): RunSummary => ({
  meanScore: 47,
  medianMetrics: { nationalSecurity: 60, economy: 52, publicTrust: 44, innovation: 48, socialStability: 45, systemicRisk: 42, cooperation: 46, stateCapacity: 38 },
  seriousIncidentShare: 0.31,
  endings: { "dependent-state": 1 },
  ...overrides,
});

const result: CounterfactualResult = {
  runs: 1000, profile: "contested", scenarioId: "open-weight-release", asPlayedChoiceId: "A", newChoiceId: "B",
  asPlayed: arm(),
  changed: arm({ meanScore: 47.6, seriousIncidentShare: 0.24, medianMetrics: { ...arm().medianMetrics, innovation: 44, nationalSecurity: 62 } }),
};

describe("copy rules (spec Section 14)", () => {
  const everySentence = [
    ...whatIfSentences(result, "The Open-Weight Release", "Welcome the release", "Negotiate evaluation access"),
    ...whatIfSentences({ ...result, changed: result.asPlayed }, "The Open-Weight Release", "A", "B"),
    soundSentence(true, 1, 4), soundSentence(false, 4, 4),
    causalSentence("An attack", 0.22, 0.3), causalSentence("An attack", 0.3, 0.2), causalSentence("An attack", 0.2, 0.2),
    outcomeSentence("An attack", 0.38, true), outcomeSentence("An attack", 0.38, false),
  ];

  test("every simulated statistic is prefixed \"Under this game's assumptions\"", () => {
    for (const sentence of everySentence) expect(sentence.startsWith(PREFIX), sentence).toBe(true);
  });

  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
  });

  test("a causal link is always shown with the probability change it produced", () => {
    expect(causalSentence("the 2029 attack", 0.22, 0.3)).toBe(`${PREFIX}, this decision raised the odds of “the 2029 attack” from 22% to 30%.`);
    expect(causalSentence("the 2029 attack", 0.3, 0.2)).toContain("lowered the odds");
  });

  test("the what-if result follows the spec's phrasing: incidents, then the metrics that moved", () => {
    const [incidents, metrics, score] = whatIfSentences(result, "The Open-Weight Release", "Welcome the release", "Negotiate evaluation access");
    expect(incidents).toContain("moved serious incidents from 31% of runs to 24%");
    expect(metrics).toContain("lowered median Innovation by 4 points");
    expect(metrics).toContain("raised median National Security by 2 points");
    expect(score).toContain("rose by 0.6");
  });
});

describe("calibration bins", () => {
  test("group forecasts into five ranges with the observed frequency of each", () => {
    const bins = calibrationBins([
      { forecast: 0.1, outcome: 0 }, { forecast: 0.15, outcome: 1 },
      { forecast: 0.5, outcome: 1 },
      { forecast: 0.9, outcome: 1 }, { forecast: 1, outcome: 1 },
    ]);
    expect(bins).toEqual([
      { label: "0–20%", forecast: 12.5, observed: 50, count: 2 },
      { label: "40–60%", forecast: 50, observed: 100, count: 1 },
      { label: "80–100%", forecast: 95, observed: 100, count: 2 },
    ]);
  });
});

describe("the run summary", () => {
  test("is plain text a tester can paste, with no network involved", () => {
    const text = runSummaryText({
      seedCode: "K7Q2-M9XD", ending: "The Fortress", endingScore: 48.2, brier: 0.231,
      decisions: [{ turn: 1, scenario: "The Attribution Gap", choice: "C", forecast: 35, outcome: 0, boughtInfo: true, investedIn: "evaluation" }],
    });
    expect(text).toContain("Seed code: K7Q2-M9XD");
    expect(text).toContain("1. The Attribution Gap: option C; forecast 35% (did not happen); bought analysis; invested in Evaluation science");
  });
});
