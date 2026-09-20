import { describe, expect, test } from "vitest";
import type { Condition, Content } from "../../src/engine";
import {
  contentConditionProblems,
  dependsOnHidden,
  expressionProblems,
  isEmptyCondition,
  isSupportedProbabilityExpression,
} from "../../src/engine/conditions";
import { loadContent } from "../../src/content/load";
import { fixture } from "./fixture";

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
