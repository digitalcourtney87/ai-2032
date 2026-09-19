// What the consequences screen may say about the turn that has just resolved. Pure,
// and fed only two displayed states and public content. Three rules keep it honest:
// - what was chosen comes from `before.current`, because on a non-final turn
//   `after.current` is already the next turn;
// - measured changes are the five exact metrics only, with no remainder against the
//   stated effects (a remainder would expose hidden effects; DECISIONS.md, F5);
// - estimates are reported as they stand now, never as a change, and `halfWidth`,
//   `truth`, `debrief` and `history` are never read (handoff invariant 3).

import type { PublicContent } from "../content";
import type { CapacityLabel, DisplayedState, Domain, Track } from "../engine";
import { EXACT_METRICS, TRACKS, type ExactMetric } from "./format";

export interface MeasuredChange {
  metric: ExactMetric;
  before: number;
  after: number;
  delta: number;
}

export interface Band {
  low: number;
  mid: number;
  high: number;
}

export interface TurnConsequences {
  chose: { id: string; text: string; costPaid: number; boughtAnalysis: boolean } | null;
  /** Where this turn's investment point went. Its effect is in `trackChanges`, with any other change. */
  investment: Track | null;
  /**
   * Every track whose level changed, in display order. A rise beyond the investment point
   * can only come from an option's hidden track change, so no cause is named and the
   * screen lists these with the measured changes, never under "Your decision".
   */
  trackChanges: { track: Track; from: number; to: number }[];
  news: { decision: string | null; elsewhere: string[] };
  findings: { title: string | null; text: string }[];
  /** Policy windows opened by this turn's events. Empty on the final turn. */
  windowsOpened: { domain: Domain; turnsLeft: number }[];
  /** All five exact metrics, largest change first; unchanged ones last, in reading order. */
  measured: MeasuredChange[];
  /** null on the final turn: there is no next turn to fund. */
  capital: { leftAfterSpending: number; nextTurn: number } | null;
  capacity: { before: CapacityLabel; after: CapacityLabel } | null;
  estimatesNow: { systemicRisk: Band; cooperation: Band };
  /** null on the final turn: the debrief follows at once. */
  unknown: { forecast: number | null; question: string; resolvesBy: string } | null;
}

const band = ({ low, mid, high }: Band): Band => ({ low, mid, high });

/**
 * `before` is the view captured just before ADVANCE (useGame.ts); `after` is the view
 * now. `resolved` names the turn and scenario that have just resolved.
 */
export function consequencesOf(
  before: DisplayedState,
  after: DisplayedState,
  resolved: { turn: number; scenarioId: string },
  pub: PublicContent,
): TurnConsequences {
  const ctx = before.current;
  const scenario = pub.scenarios[resolved.scenarioId];
  const isFinal = ctx?.isFinal ?? true;
  const picked = ctx?.choiceId ? scenario?.choices.find((c) => c.id === ctx.choiceId) : undefined;
  const invested = ctx?.investedIn ?? null;

  const changes = EXACT_METRICS.map((metric) => ({ metric, before: before.exact[metric], after: after.exact[metric], delta: after.exact[metric] - before.exact[metric] }));
  const survived = before.policyWindows.filter((w) => w.turnsLeft > 1).length;

  return {
    chose: ctx && picked
      ? { id: picked.id, text: picked.text, costPaid: ctx.choices.find((c) => c.id === picked.id)?.cost ?? 0, boughtAnalysis: ctx.boughtInfo }
      : null,
    investment: invested,
    trackChanges: TRACKS.filter((t) => after.tracks[t] !== before.tracks[t]).map((t) => ({ track: t, from: before.tracks[t], to: after.tracks[t] })),
    news: { decision: after.headlines[0] ?? null, elsewhere: after.headlines.slice(1) },
    findings: after.intel
      .filter((r) => r.turn === resolved.turn && r.source === "reveal")
      .map((r) => ({ title: r.eventId ? pub.eventTitles[r.eventId] ?? null : null, text: r.text })),
    // Two incidents in one area open two windows that behave as one, so each area is named once.
    windowsOpened: isFinal
      ? []
      : after.policyWindows.slice(survived).filter((w, i, all) => all.findIndex((x) => x.domain === w.domain) === i).map((w) => ({ domain: w.domain, turnsLeft: w.turnsLeft })),
    // The sort is stable, so unchanged metrics keep their reading order at the end.
    measured: [...changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    capital: isFinal ? null : { leftAfterSpending: before.politicalCapital, nextTurn: after.politicalCapital },
    capacity: before.stateCapacity === after.stateCapacity ? null : { before: before.stateCapacity, after: after.stateCapacity },
    estimatesNow: { systemicRisk: band(after.estimates.systemicRisk), cooperation: band(after.estimates.cooperation) },
    unknown: isFinal || !scenario
      ? null
      : { forecast: ctx?.forecast ?? null, question: scenario.forecastQuestion, resolvesBy: scenario.resolvesBy },
  };
}
