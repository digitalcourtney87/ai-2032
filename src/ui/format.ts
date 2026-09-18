// Labels and formatting shared by the screens. Plain functions, no state.

import type { AdviserId, Effects, EvidenceStrength, Lever, MetricKey, Severity, Track } from "../engine";

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

/** Spec Section 5: what each track gives per level and what it unlocks. */
export const TRACK_DETAIL: Record<Track, { perLevel: string; unlocks: string[] }> = {
  evaluation: {
    perLevel: "State Capacity +4 per level",
    unlocks: ["Level 2: stronger unannounced evaluations", "Level 3: a government incident-response model in crisis turns"],
  },
  provenance: { perLevel: "Public Trust +1 per level", unlocks: ["Level 2: rapid authentication in an information crisis"] },
  diplomacy: {
    perLevel: "International Cooperation +4 per level",
    unlocks: ["Level 2: joint evaluations", "Level 3: a credible coordinated pause in the final decision"],
  },
  defensiveCyber: { perLevel: "National Security +2 per level", unlocks: ["Level 2: lowers the odds of cyber events and halves their damage"] },
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2027-09" becomes "September 2027". */
export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year ?? ""}`.trim();
}

export const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`.replace("-", "−"));

/** "National Security +4, Innovation −3". An empty set reads as "No immediate visible effect". */
export function formatEffects(effects: Effects): string {
  const parts = (Object.keys(effects) as MetricKey[]).map((key) => `${METRIC_LABEL[key]} ${signed(effects[key] ?? 0)}`);
  return parts.length > 0 ? parts.join(", ") : "No immediate visible effect";
}

export const percent = (probability: number) => `${Math.round(probability * 100)}%`;

/** A fresh, shareable seed code such as "K7Q2-M9XD". Generated here, never in the engine. */
export function newSeedCode(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32: no I, L, O or U
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}
