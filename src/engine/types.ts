// The data model from spec Section 12, transcribed as written.
// Phase 1 extends it with the additions logged in DECISIONS.md (event registry,
// stance ranks, briefing signals, condition negation). Nothing here may import
// from the UI, and nothing here may depend on wall-clock time or platform randomness.

export type MetricKey =
  | "nationalSecurity" | "economy" | "publicTrust"
  | "innovation" | "socialStability"          // shown exactly
  | "systemicRisk" | "cooperation"             // shown as an estimate with a band
  | "stateCapacity";                           // shown as a label only

export type Lever =
  | "evaluationAccess" | "marketAccess" | "procurement"
  | "domesticLaw" | "publicInvestment" | "convening"
  | "restriction" | "wait";

export type Track = "evaluation" | "provenance" | "diplomacy" | "defensiveCyber";
export type Profile = "benign" | "contested" | "hard";
export type AdviserId = "shah" | "harcourt" | "chen" | "okafor";
export type Domain = "cyber" | "bio" | "labour" | "information" | "frontier";

export interface WorldSeed {
  seed: number;
  profile: Profile;
  cyberOffenceLed: boolean;
  bioUpliftReal: boolean;
  sandbaggingStrategic: boolean;
  labourShockStructural: boolean;
  foreignPostureOpen: boolean;
}

export type SeedFact = keyof Omit<WorldSeed, "seed" | "profile">;

export interface Condition {
  metric?: { key: MetricKey; op: ">=" | "<="; value: number };
  track?: { key: Track; minLevel: 1 | 2 | 3 };
  flag?: string;
  seedFact?: SeedFact;
}

export interface QueuedEvent {
  eventId: string;
  earliestTurn: number;
  latestTurn: number;
  baseProbability: Record<Profile, number> | { whenTrue: number; whenFalse: number; fact: SeedFact };
  sourceChoiceId: string;
}

export interface Choice {
  id: string;
  text: string;
  lever: Lever;
  politicalCost: number;
  restrictive: boolean;                        // policy-window pricing
  visibleEffects: Partial<Record<MetricKey, number>>;
  hiddenEffects: Partial<Record<MetricKey, number>>;
  probabilityModifiers: { eventId: string; delta: number }[];
  conditionalEffects: { when: Condition[]; effects: Partial<Record<MetricKey, number>> }[];
  trackChange?: { key: Track; delta: 1 } | null;
  flagsAdded: string[];
  flagsRemoved: string[];
  queues: QueuedEvent[];
  requires: Condition[];                       // unlock rules
}

export interface Scenario {
  id: string;
  date: string;                                // "2027-09"
  title: string;
  briefing: string;
  isCrisis: boolean;
  domain: Domain;
  evidenceStrength: "strong" | "moderate" | "weak" | "speculative" | "mixed";
  severity: "moderate" | "high" | "veryHigh" | "catastrophic" | "unknown";
  forecast: { question: string; resolvesBy: string; resolution: Condition[] | { eventId: string } };
  infoPurchase?: { fact: SeedFact };
  adviserViews: Record<AdviserId, { stance: string; recommends: string }>;
  choices: Choice[];
  evidencePanel: {
    known: string;
    unknown: string;
    whyItMatters: string;
    sources: { label: string; url: string; reviewed: string }[];
  };
}

export interface DecisionRecord {
  scenarioId: string;
  choiceId: string;
  forecast: number;                            // 0 to 1
  adviserForecasts: Record<string, number>;
  boughtInfo: boolean;
  investedIn: Track;
  oddsAtTheTime: { eventId: string; probability: number }[];
}

export interface GameState {
  turn: number;
  world: WorldSeed;
  rngState: number;
  metrics: Record<MetricKey, number>;          // true values; the UI reads displayed(state) instead
  tracks: Record<Track, 0 | 1 | 2 | 3>;
  politicalCapital: number;
  policyWindows: { domain: Domain; turnsLeft: number }[];
  flags: string[];
  queue: QueuedEvent[];
  history: DecisionRecord[];
  headlines: string[];
}

export type Action =
  | { type: "FORECAST"; value: number }
  | { type: "BUY_INFO" }
  | { type: "DECIDE"; choiceId: string }
  | { type: "INVEST"; track: Track }
  | { type: "ADVANCE" };

// Placeholders, filled in during Phase 1 (engine) and Phase 3 (simulate).
export interface Content {
  scenarios: Scenario[];
}
export type DisplayedState = Record<string, unknown>;
export type Strategy = "permissive" | "middle" | "restrictive";
export type SimResult = Record<string, unknown>;
export type CounterfactualResult = Record<string, unknown>;
