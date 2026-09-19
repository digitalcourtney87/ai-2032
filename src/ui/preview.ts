// What the Decision screen can say about an option before it is confirmed. Pure, and
// fed only what the player can already see: the displayed state and the public
// scenario. It never reads hidden effects, odds or true values (handoff invariant 3).

import type { PublicRules, PublicScenario } from "../content";
import type { ChoiceStatus, DisplayedState, Domain, MetricKey, Track } from "../engine";
import { effectRows, isExactMetric } from "./format";

export interface PreviewRow {
  metric: MetricKey;
  /** The stated change: what officials expect, not a promise. */
  delta: number;
  /** The current value, for the five exact metrics only. null for an estimate or a label. */
  now: number | null;
}

export interface ChoicePreview {
  id: string;
  text: string;
  /** The price this turn, after any boom surcharge or policy-window discount. */
  cost: number;
  status: ChoiceStatus;
  capitalNow: number;
  /** Political Capital left after paying. null when the option cannot be chosen. */
  capitalAfter: number | null;
  rows: PreviewRow[];
  unlock: { track: Track; level: number } | null;
}

/** The preview of one option, or null if the scenario has no such option. */
export function choicePreview(view: DisplayedState, scenario: PublicScenario, choiceId: string): ChoicePreview | null {
  const option = view.current?.choices.find((o) => o.id === choiceId);
  const choice = scenario.choices.find((c) => c.id === choiceId);
  if (!option || !choice) return null;
  return {
    id: choice.id,
    text: choice.text,
    cost: option.cost,
    status: option.status,
    capitalNow: view.politicalCapital,
    capitalAfter: option.status === "available" ? view.politicalCapital - option.cost : null,
    rows: effectRows(choice.visibleEffects).map(({ metric, delta }) => ({ metric, delta, now: isExactMetric(metric) ? view.exact[metric] : null })),
    unlock: choice.unlock ? { track: choice.unlock.track, level: choice.unlock.level } : null,
  };
}

export interface PricingNotes {
  /** The policy window open in this scenario's area, if any. */
  window: { domain: Domain; turnsLeft: number } | null;
  /** The economy is at or above the boom threshold, so some options that restrict AI cost more. */
  boom: boolean;
}

/** Why this turn's prices may differ from usual. The prices themselves are already in `view.current.choices`. */
export function pricingNotes(view: DisplayedState, scenario: PublicScenario, rules: PublicRules): PricingNotes {
  const here = view.policyWindows.filter((w) => w.domain === scenario.domain);
  const turnsLeft = Math.max(0, ...here.map((w) => w.turnsLeft));
  return {
    window: here.length > 0 ? { domain: scenario.domain, turnsLeft } : null,
    boom: view.exact.economy >= rules.boomEconomyAt,
  };
}
