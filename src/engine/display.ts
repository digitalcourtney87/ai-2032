// displayed(state) is the only place noise bands and the State Capacity label are
// applied, so true values never leak into the interface (handoff invariant 3).
//
// The noise is a keyed draw on (seed, turn, metric): pure, stable for the whole
// turn however often the screen renders, and fresh each turn (DECISIONS.md, B8).

import { keyedUniform } from "./rng";
import { capacityLabel } from "./resolve";
import type { DisplayedState, Estimate, GameState } from "./types";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Spec Section 5: half-width = 30 - 0.25 x State Capacity. Engine-internal: the exact
 * number would give State Capacity away, so only the rounded band leaves (DECISIONS.md, B43).
 */
export function bandHalfWidth(state: GameState): number {
  return state.display.bandBase - state.display.bandPerCapacityPoint * state.metrics.stateCapacity;
}

function estimate(state: GameState, key: "systemicRisk" | "cooperation"): Estimate {
  const halfWidth = bandHalfWidth(state);
  const noise = (keyedUniform(state.world.seed, `noise:${state.turn}:${key}`) * 2 - 1) * halfWidth;
  const mid = state.metrics[key] + noise;
  // Rounding outwards keeps the true value inside the band.
  return {
    low: clamp(Math.floor(mid - halfWidth)),
    mid: clamp(Math.round(mid)),
    high: clamp(Math.ceil(mid + halfWidth)),
  };
}

export function displayed(state: GameState): DisplayedState {
  const { metrics } = state;
  // The frozen odds are true probabilities, so they stay out of view until the debrief.
  const current = state.current ? { ...state.current, oddsAtTheTime: [] } : null;
  return {
    turn: state.turn,
    phase: state.phase,
    seedCode: state.seedCode,
    exact: {
      nationalSecurity: metrics.nationalSecurity,
      economy: metrics.economy,
      publicTrust: metrics.publicTrust,
      innovation: metrics.innovation,
      socialStability: metrics.socialStability,
    },
    estimates: {
      systemicRisk: estimate(state, "systemicRisk"),
      cooperation: estimate(state, "cooperation"),
    },
    stateCapacity: capacityLabel(metrics.stateCapacity, state.display),
    politicalCapital: state.politicalCapital,
    tracks: { ...state.tracks },
    policyWindows: state.policyWindows.map((w) => ({ ...w })),
    current,
    headlines: [...state.headlines],
    intel: state.intel.map((report) => ({ ...report })),
    ...(state.debriefUnlocked && state.debrief
      ? { truth: { metrics: { ...metrics }, world: { ...state.world } }, debrief: state.debrief, history: state.history }
      : {}),
  };
}
