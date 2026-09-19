// Labels and formatting shared by the screens. Plain functions, no state.

import type { AdviserId, Condition, Domain, Effects, EvidenceStrength, Lever, MetricKey, Profile, SeedFact, Severity, Track } from "../engine";

export const METRIC_LABEL: Record<MetricKey, string> = {
  nationalSecurity: "National Security",
  economy: "Economy",
  publicTrust: "Public Trust",
  innovation: "Innovation",
  socialStability: "Social Stability",
  systemicRisk: "Systemic AI Risk",
  cooperation: "International Cooperation",
  stateCapacity: "State Capacity",
};

export const METRIC_MEANING: Record<MetricKey, string> = {
  nationalSecurity: "Resilience to cyber, biological and strategic threats",
  economy: "Productivity, investment, growth",
  publicTrust: "Confidence in government and AI institutions",
  innovation: "UK ability to build and adopt advanced AI",
  socialStability: "Employment, inequality, information integrity",
  systemicRisk: "Accumulated likelihood of a severe incident",
  cooperation: "Willingness of allies and labs to act with the UK",
  stateCapacity: "Government ability to understand and respond",
};

export const LEVER_LABEL: Record<Lever, string> = {
  evaluationAccess: "Evaluation access",
  marketAccess: "Market access",
  procurement: "Procurement",
  domesticLaw: "Domestic law",
  publicInvestment: "Public investment",
  convening: "Convening and alliances",
  restriction: "Restriction",
  wait: "Wait",
};

export const TRACK_LABEL: Record<Track, string> = {
  evaluation: "Evaluation science",
  provenance: "Provenance infrastructure",
  diplomacy: "Diplomacy",
  defensiveCyber: "Defensive cyber",
};

/** The four standing-investment tracks, in display order. */
export const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

/**
 * Spec Section 5, as far as the content implements it: what a level opens beyond its
 * per-level bonus (the bonus itself comes from `pub.trackBonuses`, see `trackBonusText`).
 * `applies` tells the investment ladder whether a remaining turn can still use it:
 * "unlock" reads the options in content that name this track and level; "final" is the
 * final decision; "standing" has no single turn, so the ladder shows no status for it.
 * Diplomacy level 2 ("joint evaluations") is not listed because no content implements
 * it, and no damage or odds numbers appear before the debrief (DECISIONS.md, F11).
 */
export interface TrackMilestone {
  level: 2 | 3;
  text: string;
  applies: "unlock" | "final" | "standing";
}

export const TRACK_MILESTONES: Record<Track, TrackMilestone[]> = {
  evaluation: [
    { level: 2, text: "Stronger unannounced evaluations", applies: "standing" },
    { level: 3, text: "A government incident-response model in an unscheduled crisis", applies: "unlock" },
  ],
  provenance: [{ level: 2, text: "Rapid authentication in a crisis about disputed media", applies: "unlock" }],
  diplomacy: [{ level: 3, text: "A credible coordinated pause in the final decision", applies: "final" }],
  defensiveCyber: [{ level: 2, text: "Lower odds of cyber events, and less damage when they happen", applies: "standing" }],
};

export const EVIDENCE_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
  speculative: "Speculative",
  mixed: "Mixed",
};

export const EVIDENCE_MEANING: Record<EvidenceStrength, string> = {
  strong: "Several independent sources or observed real-world effects",
  moderate: "Credible evidence, real-world implications unclear",
  weak: "Limited studies, simulations or contested findings",
  speculative: "Mainly theoretical",
  mixed: "Credible sources point in different directions",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  moderate: "Moderate",
  high: "High",
  veryHigh: "Very high",
  catastrophic: "Catastrophic",
  unknown: "Unknown",
};

export const ADVISER_ORDER: AdviserId[] = ["shah", "harcourt", "chen", "okafor"];

/** Every metric in one fixed reading order: the five exact ones, the two estimates, then State Capacity. */
export const METRIC_ORDER: MetricKey[] = [
  "nationalSecurity", "economy", "publicTrust", "innovation", "socialStability",
  "systemicRisk", "cooperation", "stateCapacity",
];

/** The five metrics the Director sees exactly. The other three are an estimate band or a label. */
export const EXACT_METRICS = ["nationalSecurity", "economy", "publicTrust", "innovation", "socialStability"] as const;
export type ExactMetric = (typeof EXACT_METRICS)[number];
export const isExactMetric = (metric: MetricKey): metric is ExactMetric => (EXACT_METRICS as readonly MetricKey[]).includes(metric);

/** A policy area as it reads mid-sentence: "a policy window is open for cyber security". */
export const DOMAIN_LABEL: Record<Domain, string> = {
  cyber: "cyber security",
  bio: "biosecurity",
  labour: "jobs and skills",
  information: "information and elections",
  frontier: "frontier AI",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2027-09" becomes "September 2027". */
export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year ?? ""}`.trim();
}

export const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`.replace("-", "−"));

/** Stated effects as rows in METRIC_ORDER, leaving out zeros. */
export function effectRows(effects: Effects): { metric: MetricKey; delta: number }[] {
  return METRIC_ORDER.flatMap((metric) => {
    const delta = effects[metric];
    return delta === undefined || delta === 0 ? [] : [{ metric, delta }];
  });
}

/**
 * "National Security +4, Innovation −3", in METRIC_ORDER, so an option's card and its
 * preview list the same effects in the same order. An empty set reads as "No immediate visible effect".
 */
export function formatEffects(effects: Effects): string {
  const parts = effectRows(effects).map(({ metric, delta }) => `${METRIC_LABEL[metric]} ${signed(delta)}`);
  return parts.length > 0 ? parts.join(", ") : "No immediate visible effect";
}

/** "State Capacity +4": one track's per-level bonus, from `pub.trackBonuses[track]`. */
export function trackBonusText(bonus: Effects): string {
  return effectRows(bonus).length > 0 ? formatEffects(bonus) : "No bonus";
}

export const percent = (probability: number) => `${Math.round(probability * 100)}%`;

/** A fresh, shareable seed code such as "K7Q2-M9XD". Generated here, never in the engine. */
export function newSeedCode(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32: no I, L, O or U
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

// ---------------------------------------------------------------- the hidden world, named for the debrief


export const PROFILE_LABEL: Record<Profile, string> = { benign: "Benign world", contested: "Contested world", hard: "Hard world" };

export const FACT_LABEL: Record<SeedFact, { name: string; whenTrue: string; whenFalse: string }> = {
  cyberOffenceLed: { name: "Cyber balance", whenTrue: "Offence-led", whenFalse: "Defence-led" },
  bioUpliftReal: { name: "Biological uplift", whenTrue: "Real", whenFalse: "Marginal" },
  sandbaggingStrategic: { name: "Sandbagging cause", whenTrue: "Strategic", whenFalse: "Training artefact" },
  labourShockStructural: { name: "Labour shock", whenTrue: "Structural", whenFalse: "Transitional" },
  foreignPostureOpen: { name: "Foreign posture", whenTrue: "Open to agreement", whenFalse: "Unilateral" },
};

const DRAW_LABEL: Record<string, { text: string; not: string }> = {
  "recording-authentic": { text: "the recording was authentic", not: "the recording was not authentic" },
  "forensics-in-time": { text: "forensics finished before polling day", not: "forensics did not finish before polling day" },
  "authentication-correct": { text: "the authentication result was correct", not: "the authentication result was inaccurate" },
  "alarm-real": { text: "the warning was real", not: "the warning was false" },
};

/** A condition in words, for the published assumptions and the luck panel. */
export function describeCondition(condition: Condition): string {
  const parts: string[] = [];
  if (condition.seedFact) {
    const fact = FACT_LABEL[condition.seedFact];
    parts.push(`${fact.name.toLowerCase()} is ${(condition.not ? fact.whenFalse : fact.whenTrue).toLowerCase()}`);
  }
  if (condition.draw) {
    const label = DRAW_LABEL[condition.draw.key];
    parts.push(label ? (condition.not ? label.not : label.text) : condition.draw.key);
  }
  const negate = condition.not && !condition.seedFact && !condition.draw ? "not: " : "";
  if (condition.metric) parts.push(`${negate}${METRIC_LABEL[condition.metric.key]} ${condition.metric.op === ">=" ? "at or above" : "at or below"} ${condition.metric.value}`);
  if (condition.composite) parts.push(`${negate}${condition.composite.key} ${condition.composite.op === ">=" ? "at or above" : "at or below"} ${condition.composite.value}`);
  if (condition.track) parts.push(`${negate}${TRACK_LABEL[condition.track.key]} at level ${condition.track.minLevel} or above`);
  if (condition.flag !== undefined) parts.push(`${negate}an earlier decision or event`);
  if (condition.any) parts.push(`${negate}${condition.any.map(describeCondition).join(" or ")}`);
  return parts.join(" and ");
}

export const describeConditions = (conditions: Condition[]) => conditions.map(describeCondition).join(", and ");
