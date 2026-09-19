// Sentence builders for the play screens (briefing and forecast). The copy rules
// of spec Section 14 apply to them as they do to the debrief's builders.

import { describe, expect, test } from "vitest";
import { adviserRange, capitalise, estimateLine, initials, resolvesLine, verbalChance } from "../../src/ui/copy";
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
