import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import {
  boomNote, capacityLine, capitalLine, capitalRulesLine, chosenLine, DECISION_INTRO, estimatesNowLine, FINDINGS_CAVEAT, investmentPointLine,
  LADDER_CAPTION, ladderIntro, levelHaveLine, measuredCaption, measuredRowText, MILESTONE_STATUS, NO_STATED_EFFECT, OFFICIALS_EXPECT,
  openQuestionLine, PREVIEW_PROMPT, previewCaveat, previewRowText, previewSummary, spentLine, thisTurnLine, trackLevelsLine, unaffordableLine,
  unchangedLine, windowNote, windowOpenedNote,
} from "../../src/ui/copy";
import type { ChoicePreview } from "../../src/ui/preview";

const pub = publicContent(loadContent());
const PREFIX = "Under this game's assumptions";
const VERDICT = /\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i;

const preview = (overrides: Partial<ChoicePreview> = {}): ChoicePreview => ({
  id: "C", text: "Market access conditional on evaluation.", cost: 4, status: "available", capitalNow: 5, capitalAfter: 1,
  rows: [], unlock: null, ...overrides,
});

describe("decision copy", () => {
  test("the live summary gives the capital before and after, and the cost", () => {
    expect(previewSummary(preview())).toBe("Option C: Political Capital 5 → 1 (costs 4).");
    expect(previewSummary(null)).toBe("Choose an option to see what it would cost.");
    expect(previewSummary(preview({ status: "unaffordable", cost: 6, capitalAfter: null }))).toBe("Option C: Costs 6; you have 5. Choose another option.");
  });

  test("exact metrics show their current value; estimates and the label show only the stated change", () => {
    expect(previewRowText({ metric: "nationalSecurity", delta: 4, now: 52 })).toBe("National Security +4 (now 52)");
    expect(previewRowText({ metric: "innovation", delta: -3, now: 50 })).toBe("Innovation −3 (now 50)");
    expect(previewRowText({ metric: "cooperation", delta: 5, now: null })).toBe("International Cooperation +5 (an estimate, with no exact figure)");
    expect(previewRowText({ metric: "stateCapacity", delta: 2, now: null })).toBe("State Capacity +2 (shown only as a label)");
  });

  test("the caveat reads with or without a selection, and drops the investment on the final decision", () => {
    expect(previewCaveat(false)).toBe(
      "Officials' expectations are not promises: plans do not always work out. Other effects are not shown, and background change, events and this turn's investment also move the numbers.",
    );
    expect(previewCaveat(true)).not.toContain("investment");
    expect(PREVIEW_PROMPT).toContain("Choose an option above");
    expect(unaffordableLine(4, 3)).toBe("Costs 4; you have 3.");
    expect(levelHaveLine(1)).toBe("You have level 1.");
  });

  test("price notes say which way prices moved, for how long, and take their numbers from the published rules", () => {
    expect(windowNote("cyber", 2, pub.rules)).toBe(
      "Some options here cost 2 less Political Capital than usual (never below 1) this turn and next, because a public incident in cyber security has made restrictions easier to pass. The costs shown already include this.",
    );
    expect(windowNote("bio", 1, pub.rules)).toContain("(never below 1) this turn only, because");
    expect(boomNote(pub.rules)).toBe(
      "Under this game's assumptions, the economy is booming (Economy 65 or above), so some of the more restrictive options cost 1 more Political Capital than usual. The costs shown already include this.",
    );
  });
});

describe("investment and consequences copy", () => {
  test("the ladder's numbers are derived, the level change is spelt out, and every status has words", () => {
    expect(ladderIntro(pub.totalTurns - 1, 12, 3)).toContain("You have 7 points in the whole game and 12 levels to fill");
    expect(thisTurnLine(1)).toBe("This turn: level 1 → 2. Takes effect when the turn ends.");
    expect(MILESTONE_STATUS.outOfReach).toBe("too few turns left to reach this level in time");
    expect(MILESTONE_STATUS.standing).toBeNull();
  });

  test("the investment names where the point went; the level changes are listed on their own", () => {
    expect(investmentPointLine("evaluation")).toBe("You put this turn's investment point into Evaluation science.");
    expect(trackLevelsLine([{ track: "evaluation", from: 0, to: 1 }, { track: "defensiveCyber", from: 0, to: 1 }])).toBe(
      "Standing investment: Evaluation science level 0 → 1; Defensive cyber level 0 → 1.",
    );
  });

  test("a policy window opened this turn says how long it lasts, capped at the turns left", () => {
    expect(windowOpenedNote("bio", 2, pub.rules)).toBe(
      "After this public incident in biosecurity, some options in that area will cost 2 less Political Capital (never below 1) for the next 2 turns. Restrictions are easiest to pass after harm.",
    );
    expect(windowOpenedNote("bio", 1, pub.rules)).toContain("(never below 1) next turn.");
  });

  test("measured changes, capital and estimates", () => {
    expect(measuredRowText({ metric: "economy", before: 50, after: 51, delta: 1 })).toBe("Economy: 50 → 51 (+1)");
    expect(unchangedLine(["publicTrust", "innovation"])).toBe("No change: Public Trust, Innovation.");
    expect(capitalLine({ leftAfterSpending: 3, nextTurn: 8 })).toBe("Political Capital: 3 left after this turn's spending; 8 to start the next turn.");
    expect(capitalRulesLine(pub.rules)).toBe(
      "Under this game's assumptions, each turn adds 5 Political Capital; at most 3 unspent points carry over; Public Trust at 60 or above adds 1, and at 40 or below takes 1 away.",
    );
    expect(estimatesNowLine({ low: 7, mid: 27, high: 46 }, { low: 9, mid: 28, high: 47 })).toContain("Systemic AI Risk is now estimated at 7–46");
    expect(measuredCaption(true)).not.toContain("investment");
  });

  test("the open question uses the player's own forecast and the question's date", () => {
    expect(openQuestionLine({ forecast: 0.35, question: "Chance of an attack by 2029.", resolvesBy: "2029-12" })).toBe(
      "You forecast 35%. Chance of an attack by 2029. It resolves by December 2029; you will see how it turned out in the debrief.",
    );
  });
});

describe("copy rules (DECISIONS.md, F12)", () => {
  const statistics = [
    DECISION_INTRO, OFFICIALS_EXPECT, NO_STATED_EFFECT, LADDER_CAPTION, measuredCaption(false), measuredCaption(true), boomNote(pub.rules),
    capacityLine("Adequate", "Thin"), estimatesNowLine({ low: 1, mid: 2, high: 3 }, { low: 1, mid: 2, high: 3 }), capitalRulesLine(pub.rules),
  ];
  const everything = [
    ...statistics, PREVIEW_PROMPT, previewSummary(preview()), previewSummary(null), previewCaveat(false), previewCaveat(true),
    windowNote("frontier", 2, pub.rules), windowNote("frontier", 1, pub.rules), ladderIntro(7, 12, 1), thisTurnLine(0),
    ...Object.values(MILESTONE_STATUS).filter((s): s is string => s !== null), chosenLine("A", "Voluntary pact."),
    spentLine({ id: "A", text: "", costPaid: 2, boughtAnalysis: true }, 1), investmentPointLine("evaluation"),
    trackLevelsLine([{ track: "defensiveCyber", from: 0, to: 1 }]), FINDINGS_CAVEAT, windowOpenedNote("bio", 2, pub.rules),
    windowOpenedNote("bio", 1, pub.rules), capitalLine({ leftAfterSpending: 3, nextTurn: 8 }),
  ];

  test("every caption over simulated figures begins \"Under this game's assumptions\"", () => {
    for (const sentence of statistics) expect(sentence.startsWith(PREFIX), sentence).toBe(true);
  });

  test("no sentence calls a decision right or wrong", () => {
    for (const sentence of everything) expect(sentence).not.toMatch(VERDICT);
  });
});
