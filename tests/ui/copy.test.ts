import { describe, expect, test } from "vitest";
import {
  BRIER_GLOSS, calibrationBins, causalSentence, compositeSentence, DEFEND_PROMPT, DISCUSSION_PROMPTS, leastLikelyOutcome, linkSentence, outcomeSentence,
  pivotalDecision, pivotSentence, PREFIX, profileShareSentence, runSummaryText, soundSentence, standing, TALK_INTRO, tallySentence, tagText,
  TEASER, whatIfEndingCaption, whatIfEndingRows, whatIfSentences,
} from "../../src/ui/debrief/copy";
import { createGame, displayed, reduce, type CounterfactualResult, type GameState, type LuckLink, type RunSummary } from "../../src/engine";
import { loadContent } from "../../src/content";

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
    pivotSentence(-2.1), pivotSentence(1.5), pivotSentence(0),
    linkSentence(3, "The Biology Result", 0, 0.3), linkSentence(3, "The Biology Result", 0.3, 0.3), linkSentence(3, "The Biology Result", 0.4, 0.2),
    whatIfEndingCaption(1000),
    tallySentence(["Sound and fortunate", "Sound and unlucky", "Risky and fortunate", "Sound and fortunate"]),
    compositeSentence({ control: 61.7, prosperity: 48.2, legitimacy: 55 }),
  ];
  // Lines that state no simulated statistic, so they carry no prefix, but still never pass a verdict.
  const everyOtherLine = [
    ...DISCUSSION_PROMPTS, DEFEND_PROMPT, TALK_INTRO, BRIER_GLOSS, ...Object.values(TEASER),
    profileShareSentence({ benign: 30, contested: 40, hard: 30 }),
  ];

  test("every simulated statistic is prefixed \"Under this game's assumptions\"", () => {
    for (const sentence of everySentence) expect(sentence.startsWith(PREFIX), sentence).toBe(true);
  });

  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of [...everySentence, ...everyOtherLine]) {
      expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
    }
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

// ---------------------------------------------------------------- the debrief for everyone (Phase 13)

type Luck = { delta: number; links: LuckLink[] };
const link = (id: string, probability: number, happened: boolean): LuckLink => ({ kind: "event", id, probability, happened, impact: -3 });
const luck = (delta: number, links: LuckLink[] = []): Luck => ({ delta, links });
const TRACKS = ["evaluation", "provenance", "diplomacy", "defensiveCyber"] as const;

describe("a decision to argue about", () => {
  test("is the decision the dice went against most", () => {
    expect(pivotalDecision({ luck: [luck(0.5), luck(-1.2), luck(-3.4), luck(2.6)] })).toBe(2);
  });

  test("is the luckiest decision when no decision was unlucky", () => {
    expect(pivotalDecision({ luck: [luck(0.5), luck(0), luck(2.6), luck(1)] })).toBe(2);
  });

  test("breaks ties by taking the earlier decision, so it never depends on anything but the debrief", () => {
    expect(pivotalDecision({ luck: [luck(-2), luck(-2)] })).toBe(0);
    expect(pivotalDecision({ luck: [luck(0), luck(0)] })).toBe(0);
    expect(pivotalDecision({ luck: [] })).toBe(0);
  });

  test("is described by which way the dice fell, never by whether the choice was good", () => {
    expect(pivotSentence(-2.1)).toBe(`${PREFIX}, no other decision had its chance events go against you more than this one.`);
    expect(pivotSentence(1.5)).toBe(`${PREFIX}, none of your decisions was unlucky, and no other decision had its chance events go your way more than this one.`);
    expect(pivotSentence(0)).toContain("no decision was clearly lucky or unlucky");
  });

  test("on a real run, is the decision with the lowest luck delta", () => {
    const content = loadContent();
    let state: GameState = createGame("GLANCE-1", content);
    while (state.phase !== "debrief") {
      if (state.phase === "forecast") state = reduce(state, { type: "FORECAST", value: 0.5 }, content);
      else if (state.phase === "decide") state = reduce(state, { type: "DECIDE", choiceId: state.current!.choices.find((c) => c.status === "available")!.id }, content);
      else if (state.phase === "invest") state = reduce(state, { type: "INVEST", track: TRACKS.find((t) => state.tracks[t] < 3)! }, content);
      else state = reduce(state, { type: "ADVANCE" }, content);
    }
    const debrief = displayed(state).debrief!;
    const deltas = debrief.luck.map((l) => l.delta);
    const pivotal = deltas[pivotalDecision(debrief)]!;
    if (Math.min(...deltas) < 0) expect(pivotal).toBe(Math.min(...deltas));
    else expect(Math.abs(pivotal)).toBe(Math.max(...deltas.map(Math.abs)));
    expect(pivotalDecision(debrief)).toBe(pivotalDecision(structuredClone(debrief)));
    const outcome = leastLikelyOutcome(debrief);
    expect(outcome).not.toBeNull();
    expect(outcome!.link.probability).toBeGreaterThan(0);
    expect(outcome!.link.probability).toBeLessThan(1);
  });
});

describe("the least likely thing that happened", () => {
  test("is the happened link with the lowest odds, across every decision", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("a", 0.4, true), link("b", 0.1, false)]), luck(0, [link("c", 0.2, true)])] });
    expect(outcome).toEqual({ index: 1, link: link("c", 0.2, true) });
  });

  test("ignores certainties, which were never a matter of chance", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("scheduled", 1, true), link("a", 0.7, true)])] });
    expect(outcome?.link.id).toBe("a");
  });

  test("falls back to the likeliest thing that did not happen", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("a", 0.3, false)]), luck(0, [link("b", 0.8, false)])] });
    expect(outcome).toEqual({ index: 1, link: link("b", 0.8, false) });
  });

  test("is null when no decision was tied to a chance event", () => {
    expect(leastLikelyOutcome({ luck: [luck(0), luck(0)] })).toBeNull();
  });

  test("prefers an event to a hidden fact, which does not read as something that happened", () => {
    const fact: LuckLink = { kind: "fact", id: "f", when: [], probability: 0.1, happened: true, impact: -3 };
    expect(leastLikelyOutcome({ luck: [luck(0, [fact, link("a", 0.4, true)])] })?.link.id).toBe("a");
    expect(leastLikelyOutcome({ luck: [luck(0, [fact])] })?.link.id).toBe("f");
  });

  test("names the decision it was linked to with the change in odds, never as fate", () => {
    expect(linkSentence(3, "The Biology Result", 0, 0.3)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, raised its odds from 0% to 30%.`);
    expect(linkSentence(3, "The Biology Result", 0.4, 0.2)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, lowered its odds from 40% to 20%.`);
    expect(linkSentence(3, "The Biology Result", 0.3, 0.3)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, left its odds unchanged at 30%.`);
  });
});

describe("how the replays ended", () => {
  test("lists every ending either arm reached, most common first", () => {
    const rows = whatIfEndingRows({
      ...result,
      asPlayed: arm({ endings: { "dependent-state": 0.6, "the-fortress": 0.4 } }),
      changed: arm({ endings: { "dependent-state": 0.3, "responsible-ai-power": 0.7 } }),
    });
    expect(rows).toEqual([
      { endingId: "responsible-ai-power", asPlayed: 0, changed: 0.7 },
      { endingId: "dependent-state", asPlayed: 0.6, changed: 0.3 },
      { endingId: "the-fortress", asPlayed: 0.4, changed: 0 },
    ]);
  });

  test("is captioned as the model's output", () => {
    expect(whatIfEndingCaption(1000)).toBe(`${PREFIX}, how the 1,000 replays ended, with your choices and with the change`);
  });
});

describe("decision quality in plain words", () => {
  test("a standing is sound in the top two, and waits for the rankings", () => {
    const ranking = [{ choiceId: "B", expectedScore: 52 }, { choiceId: "A", expectedScore: 50 }, { choiceId: "C", expectedScore: 47 }];
    expect(standing(ranking, "A")).toEqual({ rank: 2, of: 3, sound: true });
    expect(standing(ranking, "C")).toEqual({ rank: 3, of: 3, sound: false });
    expect(standing(undefined, "A")).toBeNull();
    expect(standing(ranking, "Z")).toBeNull();
  });

  test("a tag reads as the spec's four tags do", () => {
    expect(tagText({ rank: 1, of: 4, sound: true }, false)).toBe("Sound and unlucky");
    expect(tagText({ rank: 4, of: 4, sound: false }, true)).toBe("Risky and fortunate");
  });

  test("the tally counts each tag in a fixed order and leaves out tags nobody earned", () => {
    expect(tallySentence(["Risky and unlucky", "Sound and fortunate", "Sound and fortunate"]))
      .toBe(`${PREFIX}, of your 3 decisions, 2 were sound and fortunate and 1 risky and unlucky.`);
    expect(tallySentence(["Sound and fortunate"])).toBe(`${PREFIX}, of your 1 decision, 1 was sound and fortunate.`);
  });

  test("the composites are named in words a newcomer can follow", () => {
    expect(compositeSentence({ control: 61.7, prosperity: 48.2, legitimacy: 55 })).toBe(
      `${PREFIX}, the country finished on 62 out of 100 for control (security, the state's capacity and low systemic AI risk), 48 for prosperity (economy, innovation and social stability) and 55 for legitimacy (public trust). Most endings depend on whether control and prosperity each reached 55.`,
    );
  });
});

describe("the world's odds are read from the published weights", () => {
  test("the bundled weights read 30, 40 and 30", () => {
    expect(profileShareSentence({ benign: 30, contested: 40, hard: 30 })).toBe(
      "The game draws a benign world 30% of the time, a contested one 40% and a hard one 30%, then draws each fact below from that world’s odds.",
    );
  });

  test("a facilitator's weights are shown as shares of their total", () => {
    expect(profileShareSentence({ benign: 50, contested: 40, hard: 30 })).toContain("a benign world 42% of the time, a contested one 33% and a hard one 25%");
  });
});

describe("talking it over", () => {
  test("the prompts are open questions, and none would be counted as a numbered decision line if copied", () => {
    expect(DISCUSSION_PROMPTS.length).toBeGreaterThanOrEqual(4);
    for (const prompt of DISCUSSION_PROMPTS) {
      expect(prompt.endsWith("?"), prompt).toBe(true);
      expect(prompt).not.toMatch(/^\d\./);
    }
    expect(DEFEND_PROMPT).toBe("Would you defend this choice, knowing how it turned out?");
  });
});
