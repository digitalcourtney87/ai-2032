// The headless runner: plays whole games with no interface, for the balance
// harness (Rule 7), the option-value analysis (Rules 4 and 5) and, from Phase 6,
// luck-tag rollouts and counterfactuals.
//
// Every choice a bot makes is a keyed draw on the game's seed, so a simulated
// game is as reproducible as a played one and strategies can be compared on
// identical dice (DECISIONS.md, B16).

import { hashString, keyedInt, keyedUniform } from "./rng";
import { createGameInWorld, reduce } from "./reduce";
import { findScenario } from "./resolve";
import { endingScore } from "./scoring";
import { drawWorld, SEED_FACTS } from "./seed";
import type { Action, Content, GameState, Profile, SeedFact, SimResult, Strategy, Track } from "./types";

/** The three fixed strategies of Rule 7, plus the neutral policy used for rollouts (decision 6). */
export type BotKind = Strategy | "neutral";

/** Forces particular choices: scenario id to choice id. Used to value one option at a time. */
export type Overrides = Record<string, string>;

const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];
export const STRATEGIES: Strategy[] = ["permissive", "middle", "restrictive"];
export const PROFILES: Profile[] = ["benign", "contested", "hard"];

// ---------------------------------------------------------------- bot decisions

/**
 * Fixed strategies choose by authored stance rank and ignore investment-unlocked
 * options (decision 2). If the target rank is unaffordable, the nearest affordable
 * rank is taken, preferring the strategy's own direction.
 */
function chooseByStance(state: GameState, content: Content, strategy: Strategy): string {
  const ctx = state.current!;
  const scenario = findScenario(content, ctx.scenarioId);
  const ranked = scenario.choices
    .filter((c) => c.stance !== undefined)
    .map((c) => ({ id: c.id, stance: c.stance!, available: ctx.choices.find((o) => o.id === c.id)?.status === "available" }));
  const top = ranked.length;

  let target: number;
  if (strategy === "permissive") target = 1;
  else if (strategy === "restrictive") target = top;
  else if (top % 2 === 1) target = (top + 1) / 2;
  else target = top / 2 + (keyedUniform(state.world.seed, `bot:middle:${state.turn}`) < 0.5 ? 0 : 1);

  const lean = strategy === "permissive" ? -1 : 1;
  const best = ranked
    .filter((c) => c.available)
    .sort((a, b) => Math.abs(a.stance - target) - Math.abs(b.stance - target) || lean * (b.stance - a.stance))[0];
  if (!best) throw new Error(`No affordable option in "${scenario.id}"`);
  return best.id;
}

/** The neutral policy: a seeded-random pick among every legal option, unlocked ones included. */
function chooseAtRandom(state: GameState, salt: string): string {
  const available = state.current!.choices.filter((c) => c.status === "available");
  return available[keyedInt(state.world.seed, `bot:neutral:${salt}:${state.turn}`, 0, available.length - 1)]!.id;
}

/**
 * All bots share one seeded-random investment sequence, so comparisons isolate the
 * decision posture. The draw is over all four tracks; a full track passes the point
 * to the next open one, so sequences differ only where they are forced to.
 */
function chooseTrack(state: GameState): Track {
  const drawn = keyedInt(state.world.seed, `bot:invest:${state.turn}`, 0, TRACKS.length - 1);
  for (let step = 0; step < TRACKS.length; step++) {
    const track = TRACKS[(drawn + step) % TRACKS.length]!;
    if (state.tracks[track] < 3) return track;
  }
  throw new Error("Every track is full");
}

function botAction(state: GameState, content: Content, bot: BotKind, overrides: Overrides, salt: string): Action {
  switch (state.phase) {
    case "forecast":
      return { type: "FORECAST", value: 0.5 };
    case "decide": {
      const ctx = state.current!;
      const forced = overrides[ctx.scenarioId];
      if (forced && ctx.choices.find((c) => c.id === forced)?.status === "available") return { type: "DECIDE", choiceId: forced };
      return { type: "DECIDE", choiceId: bot === "neutral" ? chooseAtRandom(state, salt) : chooseByStance(state, content, bot) };
    }
    case "invest":
      return { type: "INVEST", track: chooseTrack(state) };
    default:
      return { type: "ADVANCE" };
  }
}

// ---------------------------------------------------------------- playing games

/** Plays on from any state to the debrief. */
export function playOut(start: GameState, content: Content, bot: BotKind, overrides: Overrides = {}, salt = ""): GameState {
  let state = start;
  while (state.phase !== "debrief") state = reduce(state, botAction(state, content, bot, overrides, salt), content);
  return state;
}

/** One whole game on a numeric seed, optionally inside a forced profile. */
export function playSeed(seed: number, content: Content, bot: BotKind, profile?: Profile, overrides: Overrides = {}): GameState {
  const world = drawWorld(seed, content.config, profile);
  return playOut(createGameInWorld(world, `sim-${seed}`, content), content, bot, overrides);
}

// ---------------------------------------------------------------- Rule 7: the balance test

export interface BalanceRow {
  profile: Profile;
  runs: number;
  /** Share of runs in which each strategy gave the best ending score. Ties split the credit. */
  winShare: Record<Strategy, number>;
  meanScore: Record<Strategy, number>;
}

export function balanceForProfile(profile: Profile, runs: number, content: Content): BalanceRow {
  const wins: Record<Strategy, number> = { permissive: 0, middle: 0, restrictive: 0 };
  const totals: Record<Strategy, number> = { permissive: 0, middle: 0, restrictive: 0 };
  for (let run = 0; run < runs; run++) {
    const seed = hashString(`balance:${profile}:${run}`);
    const scores = STRATEGIES.map((strategy) => endingScore(playSeed(seed, content, strategy, profile).metrics));
    const best = Math.max(...scores);
    const winners = STRATEGIES.filter((_, i) => scores[i] === best);
    for (const strategy of winners) wins[strategy] += 1 / winners.length;
    STRATEGIES.forEach((strategy, i) => { totals[strategy] += scores[i]!; });
  }
  const per = (tally: Record<Strategy, number>) =>
    Object.fromEntries(STRATEGIES.map((s) => [s, tally[s] / runs])) as Record<Strategy, number>;
  return { profile, runs, winShare: per(wins), meanScore: per(totals) };
}

/**
 * Where a strategy runs away: for each scenario, how much its ending score falls
 * when that one decision is handed to each rival strategy. The largest gaps name
 * the scenarios whose numbers to adjust.
 */
export function runawayScenarios(strategy: Strategy, profile: Profile, runs: number, content: Content): { scenarioId: string; advantage: number }[] {
  const scenarioIds = content.scenarios.map((s) => s.id);
  const gaps = new Map<string, { total: number; count: number }>();
  for (let run = 0; run < runs; run++) {
    const seed = hashString(`balance:${profile}:${run}`);
    const own = playSeed(seed, content, strategy, profile);
    const ownScore = endingScore(own.metrics);
    for (const record of own.history) {
      if (!scenarioIds.includes(record.scenarioId)) continue;
      for (const rival of STRATEGIES.filter((s) => s !== strategy)) {
        const rivalPick = playSeed(seed, content, rival, profile).history.find((r) => r.scenarioId === record.scenarioId)?.choiceId;
        if (!rivalPick || rivalPick === record.choiceId) continue;
        const swapped = endingScore(playSeed(seed, content, strategy, profile, { [record.scenarioId]: rivalPick }).metrics);
        const gap = gaps.get(record.scenarioId) ?? { total: 0, count: 0 };
        gaps.set(record.scenarioId, { total: gap.total + (ownScore - swapped), count: gap.count + 1 });
      }
    }
  }
  return [...gaps].map(([scenarioId, g]) => ({ scenarioId, advantage: g.total / g.count })).sort((a, b) => b.advantage - a.advantage);
}

// ---------------------------------------------------------------- Rules 4 and 5: the value of each option

/** A slice of possible worlds: one profile, or one value of one latent fact (for example "cyberOffenceLed:true"). */
export type WorldCell = Profile | `${SeedFact}:${boolean}`;

export interface OptionValue {
  scenarioId: string;
  choiceId: string;
  stance: number;
  lever: string;
  /**
   * Mean ending score when this option is forced and every other decision is neutral,
   * in each slice of worlds. Fact slices pool the profiles at their prior weights.
   */
  meanScore: Record<WorldCell, number>;
}

/** Values every base option in every world slice, on paired seeds with a neutral policy everywhere else. */
export function optionValues(runs: number, content: Content): OptionValue[] {
  const values: OptionValue[] = [];
  for (const scenario of content.scenarios) {
    for (const choice of scenario.choices.filter((c) => c.stance !== undefined)) {
      const totals = new Map<WorldCell, { sum: number; weight: number }>();
      const tally = (cell: WorldCell, score: number, weight: number) => {
        const t = totals.get(cell) ?? { sum: 0, weight: 0 };
        totals.set(cell, { sum: t.sum + score * weight, weight: t.weight + weight });
      };
      for (const profile of PROFILES) {
        const prior = content.config.profiles[profile].weight;
        for (let run = 0; run < runs; run++) {
          const final = playSeed(hashString(`value:${profile}:${run}`), content, "neutral", profile, { [scenario.id]: choice.id });
          if (final.history.find((r) => r.scenarioId === scenario.id)?.choiceId !== choice.id) continue;
          const score = endingScore(final.metrics);
          tally(profile, score, 1);
          for (const fact of SEED_FACTS) tally(`${fact}:${final.world[fact]}`, score, prior);
        }
      }
      const meanScore = Object.fromEntries([...totals].map(([cell, t]) => [cell, t.sum / t.weight])) as Record<WorldCell, number>;
      values.push({ scenarioId: scenario.id, choiceId: choice.id, stance: choice.stance!, lever: choice.lever, meanScore });
    }
  }
  return values;
}

// ---------------------------------------------------------------- the public entry point

/** Handoff Section 3: plays `runs` games of one strategy across naturally drawn worlds. */
export function simulate(strategy: Strategy, runs: number, content: Content): SimResult {
  const endings: Record<string, number> = {};
  let total = 0;
  for (let run = 0; run < runs; run++) {
    const final = playSeed(hashString(`simulate:${run}`), content, strategy);
    total += final.debrief!.endingScore;
    endings[final.debrief!.endingId] = (endings[final.debrief!.endingId] ?? 0) + 1 / runs;
  }
  return { strategy, runs, meanScore: total / runs, endings };
}
