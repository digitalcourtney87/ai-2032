// Shared condition inspection: truth versus the supported probability subset.
// Validation and chance/luck evaluation use these rules so content cannot name
// an expression the debrief cannot correctly explain.

import type { Condition, Content } from "./types";

export type ConditionUse = "truth" | "probability" | "luck";

function presentKeys(condition: Condition): (keyof Condition)[] {
  return (Object.keys(condition) as (keyof Condition)[]).filter((key) => key !== "not" && condition[key] !== undefined);
}

/** A node with no predicate. `{ not: true }` is empty: it names nothing to negate. */
export function isEmptyCondition(condition: Condition): boolean {
  return presentKeys(condition).length === 0;
}

function hiddenIdentity(condition: Condition): string | null {
  if (condition.seedFact) return condition.seedFact;
  if (condition.draw) return condition.draw.key;
  return null;
}

/** Recursively true if any node names a seed fact or keyed draw. */
export function dependsOnHidden(conditions: Condition[]): boolean {
  return conditions.some((condition) =>
    condition.seedFact !== undefined
    || condition.draw !== undefined
    || (condition.any !== undefined && dependsOnHidden(condition.any)),
  );
}

/** Exactly one seed fact or keyed draw, optional `not`, and nothing else. */
function isPlainHiddenAtom(condition: Condition): boolean {
  const keys = presentKeys(condition);
  return keys.length === 1 && (keys[0] === "seedFact" || keys[0] === "draw");
}

/**
 * A non-empty conjunction of distinct plain hidden atoms. The same draw key is
 * one identity even when the thresholds differ.
 */
export function isSupportedProbabilityExpression(conditions: Condition[]): boolean {
  if (conditions.length === 0) return false;
  const seen = new Set<string>();
  for (const condition of conditions) {
    const id = hiddenIdentity(condition);
    if (!isPlainHiddenAtom(condition) || !id || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

function emptyProblems(conditions: Condition[]): string[] {
  const problems: string[] = [];
  const walk = (nodes: Condition[]) => {
    for (const condition of nodes) {
      if (isEmptyCondition(condition)) problems.push("empty condition");
      if (condition.any) walk(condition.any);
    }
  };
  walk(conditions);
  return problems;
}

/**
 * Problems for one expression. Empty arrays stay legal for truth and luck
 * (unconditional). Probability-bearing forecasts must be a supported conjunction.
 */
export function expressionProblems(conditions: Condition[], use: ConditionUse): string[] {
  const problems = emptyProblems(conditions);
  if (use === "truth") return problems;
  if (use === "luck" && !dependsOnHidden(conditions)) return problems;
  if (isSupportedProbabilityExpression(conditions)) return problems;

  const seen = new Set<string>();
  for (const condition of conditions) {
    if (condition.any !== undefined) {
      problems.push("nested hidden alternatives are not a supported probability expression");
      continue;
    }
    if (!isPlainHiddenAtom(condition)) {
      problems.push("unsupported probabilistic condition");
      continue;
    }
    const id = hiddenIdentity(condition)!;
    if (seen.has(id)) problems.push(`repeated hidden identity "${id}"`);
    seen.add(id);
  }
  if (conditions.length === 0) problems.push("unsupported probabilistic condition");
  return problems;
}

function add(problems: string[], path: string, use: ConditionUse, conditions: Condition[] | undefined): void {
  if (!conditions) return;
  for (const message of expressionProblems(conditions, use)) problems.push(`${path}: ${message}`);
}

/** Every condition-bearing site, classified by whether the caller needs truth or probability. */
export function contentConditionProblems(content: Content): string[] {
  const problems: string[] = [];

  for (const scenario of content.scenarios) {
    const where = `scenario ${scenario.id}`;
    if (Array.isArray(scenario.forecast.resolution)) {
      add(problems, `${where} forecast.resolution`, "probability", scenario.forecast.resolution);
    }
    if (scenario.briefingSignal) add(problems, `${where} briefingSignal.about`, "truth", scenario.briefingSignal.about);
    for (const [adviser, view] of Object.entries(scenario.adviserViews)) {
      view.memory?.forEach((entry, index) => {
        add(problems, `${where} adviserViews.${adviser}.memory[${index}].when`, "truth", entry.when);
      });
    }
    for (const choice of scenario.choices) {
      const at = `${where} choice ${choice.id}`;
      add(problems, `${at} requires`, "truth", choice.requires);
      add(problems, `${at} succeedsWhen`, "truth", choice.succeedsWhen);
      choice.conditionalEffects.forEach((effect, index) => {
        add(problems, `${at} conditionalEffects[${index}].when`, "luck", effect.when);
      });
      choice.probabilityModifiers.forEach((modifier, index) => {
        add(problems, `${at} probabilityModifiers[${index}].when`, "truth", modifier.when);
      });
    }
  }

  for (const event of content.events) {
    const at = `event ${event.id}`;
    event.conditionalEffects.forEach((effect, index) => {
      add(problems, `${at} conditionalEffects[${index}].when`, "truth", effect.when);
    });
    event.mitigations.forEach((mitigation, index) => {
      add(problems, `${at} mitigations[${index}].when`, "truth", mitigation.when);
    });
    if (event.base && typeof event.base === "object" && "cases" in event.base) {
      event.base.cases.forEach((entry, index) => {
        add(problems, `${at} base.cases[${index}].when`, "truth", entry.when);
      });
    }
    if (event.reveal) {
      add(problems, `${at} reveal.about`, "truth", event.reveal.about);
      if (event.reveal.weakened) add(problems, `${at} reveal.weakened.when`, "truth", event.reveal.weakened.when);
    }
  }

  for (const ending of content.endings) add(problems, `ending ${ending.id}.when`, "truth", ending.when);
  return problems;
}
