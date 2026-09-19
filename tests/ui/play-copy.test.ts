// Sentence builders for the play screens (briefing and forecast). The copy rules
// of spec Section 14 apply to them as they do to the debrief's builders.

import { describe, expect, test } from "vitest";
import {
  adviserRange,
  ASSESSMENT_CAVEAT,
  backersLine,
  backsLine,
  capitalise,
  estimateLine,
  ESTIMATES_CAPTION,
  forecastRecap,
  initials,
  listOf,
  PAUSE_HEADING,
  PREPARED_UNBACKED,
  remainingLine,
  resolvesLine,
  STILL_OPEN_NOTE,
  stopHereNote,
  THINK_IT_OVER,
  titlePaceLine,
  verbalChance,
  WHAT_NEXT_NOTE,
  whoBacksWhat,
  worldLink,
} from "../../src/ui/copy";
import { loadContent, publicContent } from "../../src/content";

const pub = publicContent(loadContent());
const scenario = (id: string) => {
  const found = pub.scenarios[id];
  if (!found) throw new Error(`No scenario ${id}`);
  return found;
};

describe("verbalChance: the words beside the slider", () => {
  test.each([
    [0, "certain not to happen"],
    [1, "almost certainly not"],
    [5, "almost certainly not"],
    [6, "unlikely"],
    [35, "unlikely"],
    [39, "unlikely"],
    [40, "a toss-up"],
    [50, "a toss-up"],
    [60, "a toss-up"],
    [61, "likely"],
    [94, "likely"],
    [95, "almost certain"],
    [99, "almost certain"],
    [100, "certain to happen"],
  ])("%i%% reads as %s", (percent, words) => {
    expect(verbalChance(percent)).toBe(words);
  });

  test("the bands mirror each other around 50%", () => {
    const mirror: Record<string, string> = {
      "certain not to happen": "certain to happen",
      "almost certainly not": "almost certain",
      unlikely: "likely",
      "a toss-up": "a toss-up",
      likely: "unlikely",
      "almost certain": "almost certainly not",
      "certain to happen": "certain not to happen",
    };
    for (let percent = 0; percent <= 100; percent++) expect(verbalChance(100 - percent), `${percent}`).toBe(mirror[verbalChance(percent)]);
  });

  test("a value off the 0 to 100 scale is refused", () => {
    expect(() => verbalChance(-1)).toThrow(RangeError);
    expect(() => verbalChance(101)).toThrow(RangeError);
    expect(() => verbalChance(Number.NaN)).toThrow(RangeError);
  });

  test("capitalise makes a label of it", () => {
    expect(capitalise(verbalChance(1))).toBe("Almost certainly not");
  });
});

describe("adviserRange: the sentence shown after comparing", () => {
  test("states the player's guess, then the lowest and highest adviser estimate", () => {
    expect(adviserRange(35, [0.52, 0.68, 0.47, 0.54])).toBe("You said 35%. Your advisers range from 47% to 68%.");
  });

  test("rounds estimates as the list beside it does", () => {
    expect(adviserRange(50, [0.29, 0.57])).toBe("You said 50%. Your advisers range from 29% to 57%.");
  });

  test("says so when every adviser gives the same number", () => {
    expect(adviserRange(10, [0.4, 0.4, 0.4, 0.4])).toBe("You said 10%. Your advisers all say 40%.");
  });

  test("a player who compares before moving the slider is not told they said 50%", () => {
    expect(adviserRange(null, [0.52, 0.68, 0.47, 0.54])).toBe("You compared before moving the slider. Your advisers range from 47% to 68%.");
  });

  test("needs at least one estimate", () => {
    expect(() => adviserRange(50, [])).toThrow();
  });
});

describe("resolvesLine: when the answer is known", () => {
  test("a scripted question names its month", () => {
    expect(resolvesLine("2029-12", false)).toBe("We will find out by December 2029.");
  });

  test("the final question, which would resolve after the game, is settled by the game's simulation (DECISIONS B10)", () => {
    expect(scenario("threshold-2032").resolvesBy).toBe("2034-10");
    expect(resolvesLine("2034-10", true)).toBe(
      "We would only find out by October 2034, after the game ends, so the game's simulation settles it when you finish.",
    );
    // On that turn "the model" is the AI system in the question, so the line never says it.
    expect(resolvesLine("2034-10", true)).not.toMatch(/\bmodel\b/);
  });
});

describe("the estimates list and the marks", () => {
  test("estimateLine gives a name and a whole percentage", () => {
    expect(estimateLine("Dr Maya Shah", 0.52)).toBe("Dr Maya Shah: 52%");
  });

  test("initials drop a title, and every adviser's initials differ", () => {
    expect(initials("Dr Maya Shah")).toBe("MS");
    expect(initials("James Harcourt")).toBe("JH");
    const all = pub.advisers.map((a) => initials(a.name));
    expect(new Set(all).size).toBe(pub.advisers.length);
  });
});

describe("advisers", () => {
  test("backsLine names the option and its text, or the option alone", () => {
    expect(backsLine("A", "Voluntary incident-reporting pact with developers and insurers.")).toBe(
      "Backs option A: Voluntary incident-reporting pact with developers and insurers.",
    );
    expect(backsLine("A")).toBe("Backs option A.");
  });

  test("listOf joins names the British way, with no serial comma", () => {
    expect(listOf([])).toBe("");
    expect(listOf(["Dr Maya Shah"])).toBe("Dr Maya Shah");
    expect(listOf(["Dr Maya Shah", "Amelia Chen"])).toBe("Dr Maya Shah and Amelia Chen");
    expect(listOf(["A", "B", "C"])).toBe("A, B and C");
  });

  test("backersLine covers an option nobody backs", () => {
    expect(backersLine(["Dr Maya Shah", "Amelia Chen"])).toBe("Backed by Dr Maya Shah and Amelia Chen.");
    expect(backersLine([])).toBe("No adviser backs this option.");
  });

  test("an option opened by investment that nobody backs is not described as rejected", () => {
    expect(PREPARED_UNBACKED).toBe("Your advisers' recommendations do not include this option.");
    expect(backersLine([], true)).toBe(PREPARED_UNBACKED);
    expect(backersLine(["Dr Maya Shah"], true)).toBe("Backed by Dr Maya Shah.");
  });
});

describe("whoBacksWhat: one row per open option", () => {
  test("lists every open option in order, with its backers in adviser order, including options nobody backs", () => {
    const s = scenario("attribution-gap");
    const rows = whoBacksWhat(s, s.choices, pub.advisers);
    expect(rows.map((r) => [r.id, r.backers])).toEqual([
      ["A", ["Dr Maya Shah", "Amelia Chen"]],
      ["B", []],
      ["C", ["James Harcourt"]],
      ["D", ["David Okafor"]],
    ]);
    expect(rows[0]!.text).toBe(s.choices[0]!.text);
  });

  test("marks an option opened by investment", () => {
    const s = scenario("deepfake-election");
    const rows = whoBacksWhat(s, s.choices, pub.advisers);
    expect(rows.find((r) => r.id === "E")?.prepared).toBe(true);
    expect(rows.find((r) => r.id === "A")?.prepared).toBe(false);
  });

  test("no adviser in any scenario backs an option that can be locked, so the split always names all four", () => {
    for (const s of Object.values(pub.scenarios)) {
      const open = s.choices.filter((c) => c.unlock === null);
      const named = whoBacksWhat(s, open, pub.advisers).flatMap((r) => r.backers);
      expect(named.length, s.id).toBe(pub.advisers.length);
    }
  });
});

describe("copy rules (spec Section 14) for the play screens", () => {
  const s = scenario("attribution-gap");
  const everySentence = [
    ...Array.from({ length: 101 }, (_, p) => verbalChance(p)),
    adviserRange(35, [0.52, 0.68]),
    adviserRange(10, [0.4, 0.4]),
    adviserRange(null, [0.52, 0.68]),
    resolvesLine("2029-12", false),
    resolvesLine("2034-10", true),
    backersLine([]),
    backersLine([], true),
    backersLine(["Dr Maya Shah"]),
    backsLine("A"),
    ...s.choices.map((c) => backsLine(c.id, c.text)),
    estimateLine("Dr Maya Shah", 0.52),
    ASSESSMENT_CAVEAT,
    ESTIMATES_CAPTION,
    titlePaceLine(pub.totalTurns),
  ];

  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
  });

  test("British spelling in the fixed copy", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(color|favor|honor|center|behavior|defense|analyze|organize|realize|recognize|prioritize|catalog)\b/i);
  });

  test("the caption over the advisers' estimates begins with the prefix (DECISIONS F12)", () => {
    expect(ESTIMATES_CAPTION).toMatch(/^Under this game's assumptions, /);
  });

  test("the title names the length of a run without calling a policy correct", () => {
    expect(titlePaceLine(8)).toBe("About 25 minutes for 8 decisions. The game does not pick a policy for you.");
  });
});

// ---------------------------------------------------------------- Phase 12: the first-decision pause

describe("the first-decision pause", () => {
  const content = publicContent(loadContent());
  const verdict = /\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i;

  test("counts the decisions left from the run length, never a fixed number, and mentions the debrief", () => {
    expect(remainingLine(8, 1)).toBe("Keep going: 7 more decisions, about 20 minutes, then your debrief.");
    expect(remainingLine(content.totalTurns, 1)).toContain(`${content.totalTurns - 1} more decisions`);
    expect(remainingLine(5, 1)).toBe("Keep going: 4 more decisions, about 10 minutes, then your debrief.");
    expect(remainingLine(8, 7)).toBe("Keep going: 1 more decision, about 5 minutes, then your debrief.");
  });

  test("a link to this world keeps the seed and a facilitator's edits, and drops everything else", () => {
    expect(worldLink("https://example.test/ai-2032/", "?seed=OLD1-OLD2&cfg=eyJ3Ijp7fX0&facilitator=1", "K7Q2-M9XD"))
      .toBe("https://example.test/ai-2032/?seed=K7Q2-M9XD&cfg=eyJ3Ijp7fX0");
    expect(worldLink("https://example.test/", "", "K7Q2-M9XD")).toBe("https://example.test/?seed=K7Q2-M9XD");
    expect(worldLink("https://example.test/", "?facilitator=1&utm_source=chat", "K7Q2-M9XD")).toBe("https://example.test/?seed=K7Q2-M9XD");
  });

  test("Stop here offers the world to a friend, from the start, and says it is not saved progress", () => {
    const note = stopHereNote("K7Q2-M9XD");
    expect(note).toContain("K7Q2-M9XD");
    expect(note).toContain("from the first decision");
    expect(note).toContain("compare what you each chose");
    expect(note).toContain("already knowing how it began");
    expect(note).toContain("It is not saved progress");
    expect(forecastRecap(0.35)).toBe("You said 35%.");
  });

  test("no pause sentence gives a verdict, names an interrupt or gives odds", () => {
    const everySentence = [PAUSE_HEADING, remainingLine(8, 1), WHAT_NEXT_NOTE, forecastRecap(0.35), STILL_OPEN_NOTE, stopHereNote("K7Q2-M9XD"), ...THINK_IT_OVER];
    const interrupts = Object.values(content.scenarios).filter((scenario) => !content.sequence.includes(scenario.id));
    expect(interrupts.length).toBeGreaterThan(0);
    for (const sentence of everySentence) {
      expect(sentence, sentence).not.toMatch(verdict);
      expect(sentence, sentence).not.toMatch(/\b(crisis|interrupt|odds|probability)\b/i);
      for (const scenario of interrupts) expect(sentence, sentence).not.toContain(scenario.title);
    }
    // The questions to think over are open questions: nothing on the card answers or scores them.
    for (const question of THINK_IT_OVER) expect(question).toMatch(/\?$/);
    // The only percentage on the card is the player's own forecast.
    expect(everySentence.filter((sentence) => /%/.test(sentence))).toEqual([forecastRecap(0.35)]);
  });
});
