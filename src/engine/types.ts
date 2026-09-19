// The engine's data model: spec Section 12, plus the extensions logged in
// DECISIONS.md. Additions to the spec's types are marked "ext" with the decision
// that introduced them. Nothing here may import from the UI.

export type MetricKey =
  | "nationalSecurity" | "economy" | "publicTrust"
  | "innovation" | "socialStability"          // shown exactly
  | "systemicRisk" | "cooperation"             // shown as an estimate with a band
  | "stateCapacity";                           // shown as a label only

export type CompositeKey = "control" | "prosperity" | "legitimacy";

export type Lever =
  | "evaluationAccess" | "marketAccess" | "procurement"
  | "domesticLaw" | "publicInvestment" | "convening"
  | "restriction" | "wait";

export type Track = "evaluation" | "provenance" | "diplomacy" | "defensiveCyber";
export type TrackLevel = 0 | 1 | 2 | 3;
export type Profile = "benign" | "contested" | "hard";
export type AdviserId = "shah" | "harcourt" | "chen" | "okafor";
export type Domain = "cyber" | "bio" | "labour" | "information" | "frontier";
export type EvidenceStrength = "strong" | "moderate" | "weak" | "speculative" | "mixed";
export type Severity = "moderate" | "high" | "veryHigh" | "catastrophic" | "unknown";
export type CapacityLabel = "Thin" | "Adequate" | "Strong";

/** Signed changes to metrics, in points on the 0..100 scale. */
export type Effects = Partial<Record<MetricKey, number>>;

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

/**
 * A test against the game state. Every field that is present must hold.
 * A list of conditions is a conjunction.
 */
export interface Condition {
  metric?: { key: MetricKey; op: ">=" | "<="; value: number };
  track?: { key: Track; minLevel: 1 | 2 | 3 };
  flag?: string;
  seedFact?: SeedFact;
  /** ext (B2): tests a composite, so endings can be pure data. */
  composite?: { key: CompositeKey; op: ">=" | "<="; value: number };
  /**
   * ext (B4): a yes/no fact fixed by the seed and this key, true with the given
   * percentage chance. Every condition that names the same key agrees.
   */
  draw?: { key: string; probability: number };
  /** ext: at least one of these holds ("strategic or unresolved" in the Unknown Frontier ending). */
  any?: Condition[];
  /** ext (B5): negates the whole condition ("if transitional", "if artefact"). */
  not?: boolean;
}

/**
 * Chance of an event, in percentage points, before decision and track modifiers.
 * The spec's two forms, plus state-dependent cases for the final decision.
 */
export type BaseProbability =
  | Record<Profile, number>
  | { fact: SeedFact; whenTrue: number; whenFalse: number }
  | { cases: { when: Condition[]; probability: number }[]; otherwise: number };

/** ext (B6): how content asks for an event. Delays count scripted scenarios, so
 *  authored timing survives wherever the interrupt lands. 0 resolves this turn. */
export interface QueueSpec {
  eventId: string;
  minDelay: number;
  maxDelay: number;
  /** Defaults to the registry's base. "certain" is a scheduled consequence: no roll, no clamp. */
  baseProbability?: BaseProbability | "certain";
}

/** An event waiting in state. `earliestTurn`, `latestTurn` and `rollTurn` count
 *  scripted scenarios (see QueueSpec). The base is resolved to a number at queue time. */
export interface QueuedEvent {
  eventId: string;
  earliestTurn: number;
  latestTurn: number;
  /** ext (B3): the one turn on which this event rolls, fixed by a keyed draw. */
  rollTurn: number;
  baseProbability: number | "certain";
  sourceChoiceId: string | null;
  sourceScenarioId: string | null;
}

/** ext (decision 5): a directional statement about something hidden. */
export interface SignalSpec {
  about: Condition[];
  leansTrue: string;
  leansFalse: string;
}

/** ext (B2): the event registry entry. */
export interface EventDef {
  id: string;
  title: string;
  domain: Domain;
  /** The first severe event to fire triggers the incident interrupt. */
  severe: boolean;
  /** Opens a policy window in its domain. */
  publicIncident: boolean;
  base?: BaseProbability | "certain";
  /** Queued at game start. Absolute scripted-scenario numbers, 1-based. */
  initial?: { earliestTurn: number; latestTurn: number };
  effects: Effects;
  conditionalEffects: { when: Condition[]; effects: Effects; headline?: string }[];
  /** Damage multipliers, for example Defensive cyber level 2 halving cyber damage. */
  mitigations: { when: Condition[]; factor: number }[];
  /** Standing investment shifting the odds, in percentage points. */
  trackModifiers: { track: Track; minLevel: 1 | 2 | 3; delta: number }[];
  flagsAdded: string[];
  /** A delayed finding about something hidden, right with the stated reliability (%). */
  reveal?: SignalSpec & { reliability: number; weakened?: { when: Condition[]; reliability: number } };
  /** What the world noticed. null keeps the event out of the news. */
  headline: string | null;
  /** The crisis variant to run if this is the first severe event. */
  interruptScenarioId?: string;
}

export interface Choice {
  id: string;
  text: string;
  lever: Lever;
  politicalCost: number;
  restrictive: boolean;                        // policy-window pricing
  /** ext (decision 2): 1 = most permissive. Omitted on investment-unlocked options. */
  stance?: number;
  visibleEffects: Effects;
  hiddenEffects: Effects;
  probabilityModifiers: { eventId: string; delta: number; when?: Condition[] }[];
  conditionalEffects: { when: Condition[]; effects: Effects }[];
  trackChange?: { key: Track; delta: 1 } | null;
  flagsAdded: string[];
  flagsRemoved: string[];
  queues: QueueSpec[];
  requires: Condition[];                       // unlock rules
  /** ext: an option that can fail. The cost is paid either way (Scenario 2 B, the final decision). */
  succeedsWhen?: Condition[];
  onFailure?: { effects: Effects; flagsAdded: string[]; queues: QueueSpec[]; headline: string };
  /** ext: what the world noticed about this decision. */
  headline: string;
}

export interface AdviserView {
  stance: string;
  recommends: string;
  /** ext (B12): lines that recall earlier decisions. The first whose conditions hold is shown. */
  memory?: { when: Condition[]; line: string }[];
}

export interface Scenario {
  id: string;
  date: string;                                // "2027-09"
  title: string;
  briefing: string;
  isCrisis: boolean;
  domain: Domain;
  evidenceStrength: EvidenceStrength;
  severity: Severity;
  forecast: { question: string; resolvesBy: string; resolution: Condition[] | { eventId: string } };
  /** ext (decision 5): replaces the spec's `infoPurchase.fact`. Information purchase
   *  draws a second signal on the same subject. Crisis turns never sell information. */
  briefingSignal?: SignalSpec;
  adviserViews: Record<AdviserId, AdviserView>;
  choices: Choice[];
  evidencePanel: {
    known: string;
    unknown: string;
    whyItMatters: string;
    sources: { label: string; url: string; reviewed: string }[];
  };
}

export interface Adviser {
  id: AdviserId;
  name: string;
  role: string;
  lens: string;
  bias: string;
  /** Shift applied to the true probability, on the 0..1 scale. */
  forecastBias: { default: number; byDomain?: Partial<Record<Domain, number>>; whenEvidenceThin?: number };
  /** Half-width of the uniform noise added to each forecast, on the 0..1 scale. */
  noise: number;
}

export interface Ending {
  id: string;
  title: string;
  text: string;
  /** Higher wins when several endings qualify. */
  priority: number;
  when: Condition[];
  /** Spec Section 15, plus `why`: the spec's "Why read it" column. */
  furtherReading: { label: string; url: string; type: string; stance: "supports" | "challenges" | "context"; why: string; reviewed: string }[];
}

/** Every tunable rule and number. Facilitator overrides patch this and the event bases. */
export interface GameConfig {
  startingMetrics: Record<MetricKey, number>;
  drift: Record<MetricKey, number>;
  /** `weight` and fact odds are percentages. */
  profiles: Record<Profile, { weight: number; facts: Record<SeedFact, number> }>;
  politicalCapital: {
    perTurn: number;
    carryCap: number;
    trustBonusAt: number;
    trustPenaltyAt: number;
    infoCost: number;
    windowTurns: number;
    windowDiscount: number;
    windowMinCost: number;
    boomEconomyAt: number;
    boomSurcharge: number;
  };
  band: { base: number; perCapacityPoint: number };
  capacityLabels: { adequateFrom: number; strongFrom: number };
  /** Chance (%) the briefing points the right way, by rating. */
  evidenceReliability: Record<EvidenceStrength, number>;
  thinEvidencePenalty: number;
  /** Chance (%) a purchased signal is right, by capacity label. */
  infoReliability: Record<CapacityLabel, number>;
  oddsClamp: { min: number; max: number };
  /** Applied once each time a track gains a level. */
  trackBonuses: Record<Track, Effects>;
  /** Runs before the final decision if no severe event has interrupted play. */
  falseAlarmScenarioId: string;
  legitimacyBacklash: { below: number; text: string };
}

export interface Content {
  config: GameConfig;
  /** Scripted scenario ids in order. The last is the final decision. */
  sequence: string[];
  /** Scripted scenarios plus every interrupt variant. */
  scenarios: Scenario[];
  events: EventDef[];
  advisers: Adviser[];
  endings: Ending[];
}

/** Odds frozen at decision time (handoff invariant 4). `before` is the chance just
 *  before the decision; `probability` is the chance the player then faced. Both 0..1. */
export interface OddsRecord {
  eventId: string;
  probability: number;
  before: number;
}

export interface DecisionRecord {
  scenarioId: string;
  choiceId: string;
  forecast: number;                            // 0 to 1
  adviserForecasts: Record<string, number>;
  boughtInfo: boolean;
  investedIn: Track | null;                    // null on the final decision (decision 3)
  oddsAtTheTime: OddsRecord[];
  /** ext: bookkeeping the debrief needs. */
  turn: number;
  succeeded: boolean;
  costPaid: number;
  /** Options that stayed locked this turn, for the "What you never saw" panel. */
  lockedChoiceIds: string[];
}

/** One chance outcome linked to a decision. `impact` is its effect on the ending score if it happens. */
export interface LuckLink {
  kind: "event" | "fact";
  id: string;
  /** For a fact link: the hidden conditions the effect depended on. */
  when?: Condition[];
  probability: number;
  happened: boolean;
  impact: number;
}

/** Computed once at the final ADVANCE, and shown only after the debrief unlocks. */
export interface DebriefSummary {
  endingId: string;
  composites: Record<CompositeKey, number>;
  endingScore: number;
  /** Legitimacy fell below the backlash threshold: the ending gains a closing paragraph. */
  backlash: boolean;
  forecasts: { scenarioId: string; turn: number; forecast: number; outcome: 0 | 1; adviserForecasts: Record<string, number> }[];
  brier: number;
  adviserBrier: Record<string, number>;
  luck: { scenarioId: string; turn: number; choiceId: string; links: LuckLink[]; delta: number; fortunate: boolean }[];
  /** Every briefing assessment, purchased analysis and finding the player received, marked right or wrong. */
  intel: IntelReview[];
  /** Forecast questions that were about a latent fact, so the world panel can show them beside it. */
  factForecasts: { scenarioId: string; fact: SeedFact; forecast: number }[];
}

export type ChoiceStatus = "available" | "locked" | "unaffordable";
export type Phase = "forecast" | "decide" | "invest" | "advance" | "debrief";

/** Everything about the turn in progress that is fixed when the turn begins. */
export interface TurnContext {
  scenarioId: string;
  isInterrupt: boolean;
  isFinal: boolean;
  choices: { id: string; cost: number; status: ChoiceStatus }[];
  adviserForecasts: Record<AdviserId, number>;
  /** The line in which each adviser recalls an earlier decision, resolved here because it depends on hidden flags. */
  adviserMemory: Record<AdviserId, string | null>;
  /** Which briefing sentence is shown. null when the scenario has no signal. */
  signalLeansTrue: boolean | null;
  canBuyInfo: boolean;
  forecast: number | null;
  boughtInfo: boolean;
  choiceId: string | null;
  investedIn: Track | null;
  oddsAtTheTime: OddsRecord[];
}

/** Something the player was told about a hidden fact. Stores what was said, never whether it was right. */
export interface IntelReport {
  turn: number;
  scenarioId: string;
  source: "briefing" | "purchase" | "reveal";
  leansTrue: boolean;
  text: string;
  /** For a delayed finding: the event that delivered it. */
  eventId?: string;
}

/** Shown only in the debrief: a report the player received, and whether it pointed the right way. */
export interface IntelReview extends IntelReport {
  correct: boolean;
  /** The latent fact the report was about, when it was about one. */
  fact: SeedFact | null;
}

/** The record of one event resolving. `probability` is the chance it faced when it rolled, 0..1. */
export interface EventOutcome {
  eventId: string;
  turn: number;
  probability: number;
  fired: boolean;
  sourceChoiceId: string | null;
  sourceScenarioId: string | null;
}

export interface GameState {
  turn: number;
  world: WorldSeed;
  rngState: number;
  metrics: Record<MetricKey, number>;          // true values; the UI reads displayed(state) instead
  tracks: Record<Track, TrackLevel>;
  politicalCapital: number;
  policyWindows: { domain: Domain; turnsLeft: number }[];
  flags: string[];
  queue: QueuedEvent[];
  history: DecisionRecord[];
  headlines: string[];
  // ext: everything below is bookkeeping the spec's model leaves implicit.
  seedCode: string;
  /** 1-based number of the current or most recent scripted scenario. */
  slot: number;
  phase: Phase;
  current: TurnContext | null;
  /** Sum of decision modifiers per event, in percentage points. */
  oddsModifiers: Record<string, number>;
  outcomes: EventOutcome[];
  intel: IntelReport[];
  pendingInterrupt: string | null;
  interruptPlayed: boolean;
  debriefUnlocked: boolean;
  debrief: DebriefSummary | null;
  /** Display rules copied from config so that displayed(state) needs nothing else. */
  display: { bandBase: number; bandPerCapacityPoint: number; adequateFrom: number; strongFrom: number };
}

export type Action =
  | { type: "FORECAST"; value: number }
  | { type: "BUY_INFO" }
  | { type: "DECIDE"; choiceId: string }
  | { type: "INVEST"; track: Track }
  | { type: "ADVANCE" };

/** No half-width: unrounded, it would reveal State Capacity (DECISIONS.md, B43). */
export interface Estimate {
  low: number;
  mid: number;
  high: number;
}

/** The only view of the game a component may render (handoff invariant 3). */
export interface DisplayedState {
  turn: number;
  phase: Phase;
  seedCode: string;
  exact: Record<"nationalSecurity" | "economy" | "publicTrust" | "innovation" | "socialStability", number>;
  estimates: Record<"systemicRisk" | "cooperation", Estimate>;
  stateCapacity: CapacityLabel;
  politicalCapital: number;
  tracks: Record<Track, TrackLevel>;
  policyWindows: { domain: Domain; turnsLeft: number }[];
  current: TurnContext | null;
  headlines: string[];
  intel: IntelReport[];
  /** Present only once the debrief has unlocked. */
  truth?: { metrics: Record<MetricKey, number>; world: WorldSeed };
  debrief?: DebriefSummary;
  history?: DecisionRecord[];
}

/** The three fixed strategies of Rule 7: always most permissive, always middle, always most restrictive. */
export type Strategy = "permissive" | "middle" | "restrictive";

export interface SimResult {
  strategy: Strategy;
  runs: number;
  meanScore: number;
  /** Share of runs reaching each ending, by ending id. */
  endings: Record<string, number>;
}

/** What a batch of reruns looked like. Model output, never a finding. */
export interface RunSummary {
  meanScore: number;
  medianMetrics: Record<MetricKey, number>;
  /** Share of runs in which any severe event fired. */
  seriousIncidentShare: number;
  /** Share of runs reaching each ending, by ending id. */
  endings: Record<string, number>;
}

/** One decision changed, everything else replayed as the player played it, on the same fresh seeds. */
export interface CounterfactualResult {
  runs: number;
  profile: Profile;
  scenarioId: string;
  asPlayedChoiceId: string;
  newChoiceId: string;
  asPlayed: RunSummary;
  changed: RunSummary;
}

/** An option's expected ending score, judged only on what the player could have known. */
export interface OptionEstimate {
  choiceId: string;
  expectedScore: number;
}
