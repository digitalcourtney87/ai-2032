import { describe, expect, test } from "vitest";
import { createGame, type Condition, type Content } from "../../src/engine";
import {
  allHold,
  chanceOf,
  contentConditionProblems,
  dependsOnHidden,
  expressionProblems,
  holds,
  isEmptyCondition,
  isSupportedProbabilityExpression,
  priorChance,
} from "../../src/engine/conditions";
import { loadContent } from "../../src/content/load";
import { applyOverrides } from "../../src/content/overrides";
import { first, fixture, playThrough } from "./fixture";

const nested: Condition[] = [{
  any: [
    { seedFact: "cyberOffenceLed" },
    { seedFact: "bioUpliftReal" },
  ],
}];
const repeatedFact: Condition[] = [
  { seedFact: "cyberOffenceLed" },
  { seedFact: "cyberOffenceLed" },
];
const repeatedDraw: Condition[] = [
  { draw: { key: "same", probability: 30 } },
  { draw: { key: "same", probability: 30 } },
];
const sameKeyDifferentThreshold: Condition[] = [
  { draw: { key: "same", probability: 30 } },
  { draw: { key: "same", probability: 70 } },
];
const supported: Condition[] = [
  { seedFact: "cyberOffenceLed", not: true },
  { draw: { key: "other", probability: 40 } },
];
const observableAny: Condition[] = [{
  any: [
    { metric: { key: "publicTrust", op: ">=", value: 50 } },
    { track: { key: "evaluation", minLevel: 2 } },
  ],
}];

describe("empty condition objects", () => {
  test("an object with no predicate is empty, even when only not is set", () => {
    expect(isEmptyCondition({})).toBe(true);
    expect(isEmptyCondition({ not: true })).toBe(true);
    expect(isEmptyCondition({ seedFact: "cyberOffenceLed" })).toBe(false);
    expect(isEmptyCondition({ seedFact: "cyberOffenceLed", not: true })).toBe(false);
  });
});

describe("hidden dependence and the supported probability subset", () => {
  test("finds hidden facts nested inside alternatives, which a shallow scan misses", () => {
    expect(dependsOnHidden(nested)).toBe(true);
    expect(dependsOnHidden(observableAny)).toBe(false);
    expect(dependsOnHidden(supported)).toBe(true);
    expect(dependsOnHidden([])).toBe(false);
  });

  test("accepts a non-empty conjunction of distinct plain hidden atoms", () => {
    expect(isSupportedProbabilityExpression(supported)).toBe(true);
    expect(isSupportedProbabilityExpression([{ seedFact: "bioUpliftReal" }])).toBe(true);
  });

  test("rejects nested alternatives, observables, mixed atoms, empties and repeats", () => {
    expect(isSupportedProbabilityExpression(nested)).toBe(false);
    expect(isSupportedProbabilityExpression(observableAny)).toBe(false);
    expect(isSupportedProbabilityExpression([{ seedFact: "cyberOffenceLed", metric: { key: "economy", op: ">=", value: 1 } }])).toBe(false);
    expect(isSupportedProbabilityExpression([{ seedFact: "cyberOffenceLed", draw: { key: "x", probability: 10 } }])).toBe(false);
    expect(isSupportedProbabilityExpression([])).toBe(false);
    expect(isSupportedProbabilityExpression([{}])).toBe(false);
    expect(isSupportedProbabilityExpression(repeatedFact)).toBe(false);
    expect(isSupportedProbabilityExpression(repeatedDraw)).toBe(false);
    expect(isSupportedProbabilityExpression(sameKeyDifferentThreshold)).toBe(false);
  });
});

describe("expressionProblems by use", () => {
  test("probability expressions reject the plan's nested and repeated cases", () => {
    expect(expressionProblems(nested, "probability").join("\n")).toMatch(/nested|unsupported/);
    expect(expressionProblems(repeatedFact, "probability").join("\n")).toMatch(/cyberOffenceLed/);
    expect(expressionProblems(repeatedDraw, "probability").join("\n")).toMatch(/same/);
    expect(expressionProblems(supported, "probability")).toEqual([]);
  });

  test("luck expressions reject hidden nesting and repeats, and keep purely observable conditions", () => {
    expect(expressionProblems(nested, "luck").length).toBeGreaterThan(0);
    expect(expressionProblems(repeatedFact, "luck").length).toBeGreaterThan(0);
    expect(expressionProblems(observableAny, "luck")).toEqual([]);
    expect(expressionProblems(supported, "luck")).toEqual([]);
    expect(expressionProblems([], "luck")).toEqual([]);
  });

  test("truth-only expressions keep recursive alternatives and reject empty objects", () => {
    expect(expressionProblems(nested, "truth")).toEqual([]);
    expect(expressionProblems([{ not: true }], "truth")).toEqual(["empty condition"]);
    expect(expressionProblems([], "truth")).toEqual([]);
  });
});

describe("contentConditionProblems walks every consumer with a location", () => {
  const withChoiceEffect = (when: Condition[]): Content => {
    const content = structuredClone(fixture);
    const choice = content.scenarios[0]!.choices[0]!;
    choice.conditionalEffects = [{ when, effects: { economy: 1 } }];
    return content;
  };

  test("rejects nested hidden alternatives as a forecast or as a hidden choice effect", () => {
    const forecast = structuredClone(fixture);
    forecast.scenarios[0]!.forecast.resolution = nested;
    expect(contentConditionProblems(forecast).some((p) => p.includes("forecast.resolution") && p.includes(forecast.scenarios[0]!.id))).toBe(true);

    const hidden = withChoiceEffect(nested);
    const messages = contentConditionProblems(hidden);
    expect(messages.some((p) => p.includes("conditionalEffects") && p.includes(hidden.scenarios[0]!.id))).toBe(true);
  });

  test("rejects repeated hidden identities in those same sites", () => {
    const forecast = structuredClone(fixture);
    forecast.scenarios[0]!.forecast.resolution = repeatedFact;
    expect(contentConditionProblems(forecast).join("\n")).toMatch(/cyberOffenceLed/);

    const hidden = withChoiceEffect(repeatedDraw);
    expect(contentConditionProblems(hidden).join("\n")).toMatch(/same/);
  });

  test("keeps nested alternatives valid on a truth-only ending", () => {
    const content = structuredClone(fixture);
    content.endings[0]!.when = nested;
    expect(contentConditionProblems(content)).toEqual([]);
  });

  test("rejects empty condition objects with the ending or choice path", () => {
    const ending = structuredClone(fixture);
    ending.endings[0]!.when = [{ not: true }];
    expect(contentConditionProblems(ending).join("\n")).toMatch(new RegExp(`${ending.endings[0]!.id}.*empty condition`));

    const choice = withChoiceEffect([{}]);
    expect(contentConditionProblems(choice).join("\n")).toMatch(/conditionalEffects.*empty condition/);
  });

  test("does not treat empty condition arrays as empty objects", () => {
    const content = structuredClone(fixture);
    content.scenarios[0]!.choices[0]!.requires = [];
    content.scenarios[0]!.choices[0]!.succeedsWhen = [];
    expect(contentConditionProblems(content)).toEqual([]);
  });

  test("the bundled content uses only supported sites", () => {
    expect(contentConditionProblems(loadContent())).toEqual([]);
  });
});

describe("truth evaluation", () => {
  const state = createGame("COND-HOLD", fixture);
  const frontier: Condition = {
    any: [{ seedFact: "sandbaggingStrategic" }, { flag: "sandbagging-resolved", not: true }],
  };

  test("fields on a node are conjoined; any is recursive; not negates the node", () => {
    const flagged = { ...state, flags: ["sandbagging-resolved"] };
    expect(holds({ flag: "sandbagging-resolved" }, flagged)).toBe(true);
    expect(holds({ flag: "sandbagging-resolved", not: true }, flagged)).toBe(false);
    expect(allHold([], state)).toBe(true);
  });

  test("truth-only nested alternatives resolve recursively", () => {
    const strategic = { ...state, world: { ...state.world, sandbaggingStrategic: true }, flags: ["sandbagging-resolved"] };
    const unresolved = { ...state, world: { ...state.world, sandbaggingStrategic: false }, flags: [] };
    const resolved = { ...state, world: { ...state.world, sandbaggingStrategic: false }, flags: ["sandbagging-resolved"] };
    expect(holds(frontier, strategic)).toBe(true);
    expect(holds(frontier, unresolved)).toBe(true);
    expect(holds(frontier, resolved)).toBe(false);
  });
});

describe("supported chance", () => {
  const state = createGame("COND-CHANCE", fixture);
  const facts = fixture.config.profiles[state.world.profile].facts;

  test("within-profile chance is the product of each atom's marginal", () => {
    expect(chanceOf([{ seedFact: "cyberOffenceLed" }], state, fixture.config)).toBeCloseTo(facts.cyberOffenceLed / 100);
    expect(chanceOf([{ seedFact: "cyberOffenceLed", not: true }], state, fixture.config)).toBeCloseTo(1 - facts.cyberOffenceLed / 100);
    expect(chanceOf([
      { seedFact: "cyberOffenceLed" },
      { seedFact: "bioUpliftReal" },
    ], state, fixture.config)).toBeCloseTo((facts.cyberOffenceLed / 100) * (facts.bioUpliftReal / 100));
    expect(chanceOf([{ draw: { key: "same", probability: 30 } }], state, fixture.config)).toBeCloseTo(0.3);
  });

  test("the published prior is the weighted sum of within-profile conjunctions, not a product of averages", () => {
    expect(priorChance([{ seedFact: "cyberOffenceLed" }], fixture.config)).toBeCloseTo(0.5);
    // Profile-correlated product: 0.21625. Averaging first then multiplying would give 0.1825.
    expect(priorChance([
      { seedFact: "cyberOffenceLed" },
      { seedFact: "bioUpliftReal" },
    ], fixture.config)).toBeCloseTo(0.21625);
    expect(priorChance([{ seedFact: "cyberOffenceLed", not: true }], fixture.config)).toBeCloseTo(0.5);
  });

  test("direct probability calls reject nested alternatives and repeated identities", () => {
    expect(() => chanceOf(nested, state, fixture.config)).toThrow(/unsupported/);
    expect(() => chanceOf(repeatedFact, { ...state, world: { ...state.world, profile: "hard" } }, fixture.config)).toThrow(/unsupported/);
    expect(() => priorChance(repeatedFact, fixture.config)).toThrow(/unsupported/);
    expect(() => priorChance(repeatedDraw, fixture.config)).toThrow(/unsupported/);
    expect(() => chanceOf(observableAny, state, fixture.config)).toThrow(/unsupported/);
  });
});

describe("authored outputs stay on the Task 0 baseline", () => {
  const content = loadContent();

  test("every authored forecast chance matches the supported within-profile product", () => {
    const state = createGame("WORKSHOP", content);
    const facts = content.config.profiles[state.world.profile].facts;
    for (const scenario of content.scenarios) {
      const resolution = scenario.forecast.resolution;
      if (!Array.isArray(resolution)) continue;
      const expected = resolution.reduce((product, condition) => {
        const chance = condition.seedFact
          ? facts[condition.seedFact] / 100
          : condition.draw!.probability / 100;
        return product * (condition.not ? 1 - chance : chance);
      }, 1);
      expect(chanceOf(resolution, state, content.config), scenario.id).toBeCloseTo(expected);
    }
  });

  test.each([
    ["WORKSHOP", "deregulated-frontier", 44.333333333333336],
    ["WORKSHOP-9", "deregulated-frontier", 40.55555555555555],
    ["K7Q2-M9XD", "deregulated-frontier", 45.444444444444436],
    ["STALE-PICK", "dependent-state", 44.333333333333336],
    ["FINAL-RAIL", "deregulated-frontier", 50.11111111111111],
  ] as const)("%s keeps its ending and score", (seed, ending, score) => {
    const final = playThrough(createGame(seed, content), content, first).at(-1)!;
    expect(final.debrief!.endingId).toBe(ending);
    expect(final.debrief!.endingScore).toBeCloseTo(score);
  });

  test("facilitator-edited weights and facts keep the edited WORKSHOP ending", () => {
    const edited = applyOverrides(content, { weights: { hard: 60 }, facts: { benign: { cyberOffenceLed: 5 } } });
    const final = playThrough(createGame("WORKSHOP", edited), edited, first).at(-1)!;
    expect(final.debrief!.endingId).toBe("deregulated-frontier");
    expect(final.debrief!.endingScore).toBeCloseTo(41.77777777777778);
  });
});
