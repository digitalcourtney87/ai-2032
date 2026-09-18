// What-if reruns and the "sound decision" rollouts behind the luck tags
// (spec Section 11; DECISIONS.md, decision 6).
//
// Both are model output, not findings. Every number produced here must reach the
// player prefixed "Under this game's assumptions".

import { hashString, keyedInt } from "./rng";
import { createGameInWorld, reduce } from "./reduce";
import { findEvent, findScenario, METRIC_KEYS, resolveBase } from "./resolve";
import { endingScore } from "./scoring";
import { drawWorld } from "./seed";
import { playOut } from "./simulate";
import type {
  Action,
  Content,
  CounterfactualResult,
  DecisionRecord,
  GameState,
  MetricKey,
  OptionEstimate,
  Profile,
  RunSummary,
  Track,
  WorldSeed,
} from "./types";

const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

// ---------------------------------------------------------------- replaying a history

/** The option nearest in stance to the one wanted, among those on offer. Unlocked options have no stance and rank last. */
function nearestAvailable(state: GameState, content: Content, wantedId: string): string {
  const ctx = state.current!;
  const scenario = findScenario(content, ctx.scenarioId);
  const available = ctx.choices.filter((c) => c.status === "available").map((c) => c.id);
  if (available.includes(wantedId)) return wantedId;
  const stanceOf = (id: string) => scenario.choices.find((c) => c.id === id)?.stance;
  const wanted = stanceOf(wantedId) ?? 2;
  const ranked = available
    .map((id) => ({ id, gap: Math.abs((stanceOf(id) ?? 99) - wanted), stance: stanceOf(id) ?? 99 }))
    .sort((a, b) => a.gap - b.gap || a.stance - b.stance);
  const best = ranked[0];
  if (!best) throw new Error(`No affordable option in "${scenario.id}"`);
  return best.id;
}

/**
 * The next action when replaying a player's history in a fresh world. A scenario
 * the player never met (a different interrupt variant) borrows their interrupt
 * decision, matched by option letter and then by stance.
 */
function replayAction(state: GameState, content: Content, history: DecisionRecord[], changeAt: number, newChoiceId: string | null): Action {
  const ctx = state.current!;
  const index = history.findIndex((r) => r.scenarioId === ctx.scenarioId);
  const record = history[index] ?? history.find((r) => !content.sequence.includes(r.scenarioId));
  switch (state.phase) {
    case "forecast":
      return { type: "FORECAST", value: record?.forecast ?? 0.5 };
    case "decide": {
      if (record?.boughtInfo && ctx.canBuyInfo && !ctx.boughtInfo) return { type: "BUY_INFO" };
      const wanted = index === changeAt && newChoiceId !== null ? newChoiceId : record?.choiceId ?? "A";
      return { type: "DECIDE", choiceId: nearestAvailable(state, content, wanted) };
    }
    case "invest": {
      const wanted = record?.investedIn ?? "evaluation";
      const start = TRACKS.indexOf(wanted);
      const track = TRACKS.map((_, step) => TRACKS[(start + step) % TRACKS.length]!).find((t) => state.tracks[t] < 3);
      if (!track) throw new Error("Every track is full");
      return { type: "INVEST", track };
    }
    default:
      return { type: "ADVANCE" };
  }
}

function replay(world: WorldSeed, content: Content, history: DecisionRecord[], changeAt: number, newChoiceId: string | null): GameState {
  let state = createGameInWorld(world, `what-if-${world.seed}`, content);
  while (state.phase !== "debrief") state = reduce(state, replayAction(state, content, history, changeAt, newChoiceId), content);
  return state;
}

// ---------------------------------------------------------------- summarising runs

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function summarise(finals: GameState[], content: Content): RunSummary {
  const severe = new Set(content.events.filter((e) => e.severe).map((e) => e.id));
  const endings: Record<string, number> = {};
  for (const final of finals) endings[final.debrief!.endingId] = (endings[final.debrief!.endingId] ?? 0) + 1 / finals.length;
  const medianMetrics = {} as Record<MetricKey, number>;
  for (const key of METRIC_KEYS) medianMetrics[key] = median(finals.map((f) => f.metrics[key]));
  return {
    meanScore: finals.reduce((sum, f) => sum + endingScore(f.metrics), 0) / finals.length,
    medianMetrics,
    seriousIncidentShare: finals.filter((f) => f.outcomes.some((o) => o.fired && severe.has(o.eventId))).length / finals.length,
    endings,
  };
}

// ---------------------------------------------------------------- what if

/**
 * Reruns the game with one decision changed, across fresh seeds inside the same
 * world profile (spec Section 11). Both arms replay the player's own history on
 * the same seeds, so the difference is the changed decision and nothing else.
 * `context` supplies what a DecisionRecord list cannot: the profile and a base seed (DECISIONS.md, B7).
 */
export function counterfactual(
  history: DecisionRecord[],
  changeAt: number,
  newChoiceId: string,
  runs: number,
  content: Content,
  context: { profile: Profile; baseSeed: number },
): CounterfactualResult {
  const changedRecord = history[changeAt];
  if (!changedRecord) throw new Error(`There is no decision number ${changeAt}`);
  const asPlayed: GameState[] = [];
  const changed: GameState[] = [];
  for (let run = 0; run < runs; run++) {
    const world = drawWorld(hashString(`what-if:${context.baseSeed}:${run}`), content.config, context.profile);
    asPlayed.push(replay(world, content, history, -1, null));
    changed.push(replay(world, content, history, changeAt, newChoiceId));
  }
  return {
    runs,
    profile: context.profile,
    scenarioId: changedRecord.scenarioId,
    asPlayedChoiceId: changedRecord.choiceId,
    newChoiceId,
    asPlayed: summarise(asPlayed, content),
    changed: summarise(changed, content),
  };
}

// ---------------------------------------------------------------- sound decisions

/**
 * Moves a game into a different hidden world, keeping everything the player
 * could observe. Queued events take the new world's base odds and dice.
 */
function reworld(state: GameState, world: WorldSeed, content: Content): GameState {
  const moved: GameState = { ...state, world };
  const queue = state.queue.map((queued) => {
    const base = findEvent(content, queued.eventId).base;
    const earliest = Math.min(Math.max(queued.earliestTurn, state.slot), queued.latestTurn);
    return {
      ...queued,
      baseProbability: base === undefined ? queued.baseProbability : resolveBase(base, moved),
      rollTurn: keyedInt(world.seed, `when:${queued.eventId}`, earliest, queued.latestTurn),
    };
  });
  return { ...moved, queue };
}

/**
 * The expected ending score of every option that was open at a decision, judged
 * only on what the player could have known: worlds are drawn from the published
 * prior, and every later decision is left to the neutral policy. A decision is
 * "sound" if it was among the top two. Best first.
 */
export function soundness(decisionState: GameState, rollouts: number, content: Content): OptionEstimate[] {
  let start = decisionState;
  if (start.phase === "forecast") start = reduce(start, { type: "FORECAST", value: 0.5 }, content);
  if (start.phase !== "decide" || !start.current) throw new Error("Soundness is judged at the moment of decision");

  const options = start.current.choices.filter((c) => c.status === "available").map((c) => c.id);
  const totals = new Map(options.map((id) => [id, 0]));
  for (let rollout = 0; rollout < rollouts; rollout++) {
    const seed = hashString(`sound:${decisionState.world.seed}:${decisionState.turn}:${rollout}`);
    const elsewhere = reworld(start, drawWorld(seed, content.config), content);
    for (const choiceId of options) {
      const decided = reduce(elsewhere, { type: "DECIDE", choiceId }, content);
      totals.set(choiceId, totals.get(choiceId)! + endingScore(playOut(decided, content, "neutral", {}, "sound").metrics));
    }
  }
  return options
    .map((choiceId) => ({ choiceId, expectedScore: totals.get(choiceId)! / rollouts }))
    .sort((a, b) => b.expectedScore - a.expectedScore);
}
