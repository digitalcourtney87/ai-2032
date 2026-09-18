// Scoring: Brier scores, the ending, and the luck half of the luck tags.
//
// Luck reads the odds frozen in each DecisionRecord and never recomputes them
// from a later state (handoff invariant 4). Whether a decision was "sound" needs
// simulated rollouts and arrives with the counterfactual worker in Phase 6.

import { keyedUniform } from "./rng";
import { allHold, composites, findEvent, findScenario } from "./resolve";
import type {
  Condition,
  Content,
  DebriefSummary,
  DecisionRecord,
  Effects,
  Ending,
  GameConfig,
  GameState,
  LuckLink,
  MetricKey,
  Profile,
} from "./types";

const PROFILES: Profile[] = ["benign", "contested", "hard"];

// ---------------------------------------------------------------- ending

/** DECISIONS.md, decision 1: the equal-weighted mean of the three composites. */
export function endingScore(metrics: Record<MetricKey, number>): number {
  const { control, prosperity, legitimacy } = composites(metrics);
  return (control + prosperity + legitimacy) / 3;
}

/** How much one point of each metric moves the ending score. */
const SCORE_WEIGHT: Record<MetricKey, number> = {
  nationalSecurity: 1 / 9, stateCapacity: 1 / 9, systemicRisk: -1 / 9,
  economy: 1 / 9, innovation: 1 / 9, socialStability: 1 / 9,
  publicTrust: 1 / 3,
  cooperation: 0,
};

export function scoreImpact(effects: Effects): number {
  return (Object.keys(effects) as MetricKey[]).reduce((sum, key) => sum + SCORE_WEIGHT[key] * (effects[key] ?? 0), 0);
}

export function resolveEnding(state: GameState, content: Content): Ending {
  const qualifying = content.endings.filter((ending) => allHold(ending.when, state));
  const best = qualifying.sort((a, b) => b.priority - a.priority)[0];
  if (!best) throw new Error("No ending matches the final state");
  return best;
}

// ---------------------------------------------------------------- forecasts

export function brier(pairs: { forecast: number; outcome: 0 | 1 }[]): number {
  if (pairs.length === 0) return 0;
  return pairs.reduce((sum, p) => sum + (p.forecast - p.outcome) ** 2, 0) / pairs.length;
}

/**
 * How a turn's forecast question resolved. An event that was never queued (the
 * final decision's "if deployed" question when the player did not deploy)
 * resolves by a keyed draw at the odds frozen in the record (DECISIONS.md, B10).
 */
export function forecastOutcome(record: DecisionRecord, state: GameState, content: Content): 0 | 1 {
  const { resolution } = findScenario(content, record.scenarioId).forecast;
  if (Array.isArray(resolution)) return allHold(resolution, state) ? 1 : 0;
  const outcome = state.outcomes.find((o) => o.eventId === resolution.eventId);
  if (outcome) return outcome.fired ? 1 : 0;
  const frozen = record.oddsAtTheTime.find((o) => o.eventId === resolution.eventId)?.probability ?? 0;
  return keyedUniform(state.world.seed, `event:${resolution.eventId}`) < frozen ? 1 : 0;
}

// ---------------------------------------------------------------- luck

/** The chance of a hidden-fact condition as the player could know it: the published prior. */
function priorChance(conditions: Condition[], config: GameConfig): number {
  const totalWeight = PROFILES.reduce((sum, p) => sum + config.profiles[p].weight, 0);
  return PROFILES.reduce((sum, profile) => {
    const inProfile = conditions.reduce((product, c) => {
      let chance = 1;
      if (c.seedFact) chance *= config.profiles[profile].facts[c.seedFact] / 100;
      if (c.draw) chance *= c.draw.probability / 100;
      return product * (c.not ? 1 - chance : chance);
    }, 1);
    return sum + (config.profiles[profile].weight / totalWeight) * inProfile;
  }, 0);
}

const dependsOnHiddenFact = (conditions: Condition[]) => conditions.some((c) => c.seedFact || c.draw);

/** Every chance outcome linked to a decision: what it faced, and what was drawn. */
export function luckLinks(record: DecisionRecord, state: GameState, content: Content): LuckLink[] {
  const links: LuckLink[] = [];
  for (const odds of record.oddsAtTheTime) {
    const outcome = state.outcomes.find((o) => o.eventId === odds.eventId && o.turn >= record.turn);
    if (!outcome) continue;
    const impact = scoreImpact(findEvent(content, odds.eventId).effects);
    links.push({ kind: "event", id: odds.eventId, probability: odds.probability, happened: outcome.fired, impact });
  }
  const choice = findScenario(content, record.scenarioId).choices.find((c) => c.id === record.choiceId);
  if (choice && record.succeeded) {
    choice.conditionalEffects.forEach((conditional, index) => {
      if (!dependsOnHiddenFact(conditional.when)) return;
      links.push({
        kind: "fact",
        id: `${record.scenarioId}:${record.choiceId}:${index}`,
        probability: priorChance(conditional.when, content.config),
        happened: allHold(conditional.when, state),
        impact: scoreImpact(conditional.effects),
      });
    });
  }
  return links;
}

/** Realised minus expected impact on the ending score. At or above zero reads as fortunate. */
export function luckDelta(links: LuckLink[]): number {
  return links.reduce((sum, link) => sum + ((link.happened ? 1 : 0) - link.probability) * link.impact, 0);
}

export function luckTag(sound: boolean, fortunate: boolean): string {
  return `${sound ? "sound" : "risky"} and ${fortunate ? "fortunate" : "unlucky"}`;
}

// ---------------------------------------------------------------- the debrief summary

/** Computed once, at the final ADVANCE, while content is to hand. */
export function buildDebrief(state: GameState, content: Content): DebriefSummary {
  const forecasts = state.history.map((record) => ({
    scenarioId: record.scenarioId,
    turn: record.turn,
    forecast: record.forecast,
    outcome: forecastOutcome(record, state, content),
    adviserForecasts: record.adviserForecasts,
  }));
  const adviserBrier: Record<string, number> = {};
  for (const adviser of content.advisers) {
    adviserBrier[adviser.id] = brier(
      forecasts.map((f) => ({ forecast: f.adviserForecasts[adviser.id] ?? 0.5, outcome: f.outcome })),
    );
  }
  const parts = composites(state.metrics);
  return {
    endingId: resolveEnding(state, content).id,
    composites: parts,
    endingScore: endingScore(state.metrics),
    backlash: parts.legitimacy < content.config.legitimacyBacklash.below,
    forecasts,
    brier: brier(forecasts),
    adviserBrier,
    luck: state.history.map((record) => {
      const links = luckLinks(record, state, content);
      const delta = luckDelta(links);
      return { scenarioId: record.scenarioId, turn: record.turn, choiceId: record.choiceId, links, delta, fortunate: delta >= 0 };
    }),
  };
}
