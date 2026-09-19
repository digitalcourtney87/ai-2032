// The player-facing view of content. Scenario JSON carries hidden effects,
// probability modifiers and conditions, which no component may render. The
// interface reads scenarios only through this view, which leaves them out.

import type { AdviserId, BaseProbability, Choice, Content, Domain, Effects, EventDef, EvidenceStrength, GameConfig, Lever, Scenario, Severity, Track } from "../engine/types";

export interface PublicChoice {
  id: string;
  text: string;
  lever: Lever;
  visibleEffects: Effects;
  /** For an investment-unlocked option: the track and level that open it. */
  unlock: { track: Track; level: number } | null;
}

export interface PublicScenario {
  id: string;
  date: string;
  title: string;
  briefing: string;
  isCrisis: boolean;
  domain: Domain;
  evidenceStrength: EvidenceStrength;
  severity: Severity;
  forecastQuestion: string;
  resolvesBy: string;
  signal: { leansTrue: string; leansFalse: string } | null;
  advisers: Record<AdviserId, { stance: string; recommends: string }>;
  choices: PublicChoice[];
  evidencePanel: Scenario["evidencePanel"];
}

export interface PublicAdviser {
  id: AdviserId;
  name: string;
  role: string;
  lens: string;
}

function publicScenario(scenario: Scenario): PublicScenario {
  const advisers = {} as PublicScenario["advisers"];
  for (const [id, view] of Object.entries(scenario.adviserViews)) {
    advisers[id as AdviserId] = { stance: view.stance, recommends: view.recommends };
  }
  return {
    id: scenario.id,
    date: scenario.date,
    title: scenario.title,
    briefing: scenario.briefing,
    isCrisis: scenario.isCrisis,
    domain: scenario.domain,
    evidenceStrength: scenario.evidenceStrength,
    severity: scenario.severity,
    forecastQuestion: scenario.forecast.question,
    resolvesBy: scenario.forecast.resolvesBy,
    signal: scenario.briefingSignal
      ? { leansTrue: scenario.briefingSignal.leansTrue, leansFalse: scenario.briefingSignal.leansFalse }
      : null,
    advisers,
    choices: scenario.choices.map((choice) => {
      const gate = choice.requires.find((c) => c.track)?.track;
      return {
        id: choice.id,
        text: choice.text,
        lever: choice.lever,
        visibleEffects: choice.visibleEffects,
        unlock: gate ? { track: gate.key, level: gate.minLevel } : null,
      };
    }),
    evidencePanel: scenario.evidencePanel,
  };
}

export interface PublicEnding {
  id: string;
  title: string;
  text: string;
  furtherReading: Content["endings"][number]["furtherReading"];
}

/**
 * The Political Capital and pricing rules (spec Section 5; DECISIONS.md B30), so
 * the interface can explain a price or an income without hard-coding numbers.
 * Fixed rules, not world state. `infoCost` is exposed on its own, below.
 */
export interface PublicRules {
  perTurn: number;
  carryCap: number;
  trustBonusAt: number;
  trustPenaltyAt: number;
  windowTurns: number;
  windowDiscount: number;
  windowMinCost: number;
  boomEconomyAt: number;
  boomSurcharge: number;
}

function publicRules(rules: GameConfig["politicalCapital"]): PublicRules {
  // Field by field, so nothing added to the config later is published by accident.
  return {
    perTurn: rules.perTurn,
    carryCap: rules.carryCap,
    trustBonusAt: rules.trustBonusAt,
    trustPenaltyAt: rules.trustPenaltyAt,
    windowTurns: rules.windowTurns,
    windowDiscount: rules.windowDiscount,
    windowMinCost: rules.windowMinCost,
    boomEconomyAt: rules.boomEconomyAt,
    boomSurcharge: rules.boomSurcharge,
  };
}

export interface PublicContent {
  scenarios: Record<string, PublicScenario>;
  advisers: PublicAdviser[];
  endings: Record<string, PublicEnding>;
  /** Event names, for headlines already seen and for the debrief. */
  eventTitles: Record<string, string>;
  /** The closing paragraph added to any ending when Legitimacy is below the threshold. */
  backlashText: string;
  /** Scripted scenario ids in order, for dates and progress. */
  sequence: string[];
  infoCost: number;
  totalTurns: number;
  rules: PublicRules;
  /** The bonus each standing-investment level applies once, when it is gained. */
  trackBonuses: Record<Track, Effects>;
}

export function publicContent(content: Content): PublicContent {
  return {
    scenarios: Object.fromEntries(content.scenarios.map((s) => [s.id, publicScenario(s)])),
    advisers: content.advisers.map(({ id, name, role, lens }) => ({ id, name, role, lens })),
    endings: Object.fromEntries(content.endings.map(({ id, title, text, furtherReading }) => [id, { id, title, text, furtherReading }])),
    eventTitles: Object.fromEntries(content.events.map((e) => [e.id, e.title])),
    backlashText: content.config.legitimacyBacklash.text,
    sequence: content.sequence,
    infoCost: content.config.politicalCapital.infoCost,
    totalTurns: content.sequence.length + 1,
    rules: publicRules(content.config.politicalCapital),
    trackBonuses: {
      evaluation: { ...content.config.trackBonuses.evaluation },
      provenance: { ...content.config.trackBonuses.provenance },
      diplomacy: { ...content.config.trackBonuses.diplomacy },
      defensiveCyber: { ...content.config.trackBonuses.defensiveCyber },
    },
  };
}

// ---------------------------------------------------------------- published assumptions

/**
 * The model's assumptions, published in the debrief and nowhere else (spec
 * Sections 6 and 11). This is the hidden half of the content: only the debrief
 * screens may import it, and only after the debrief has unlocked.
 */
export interface Assumptions {
  profiles: GameConfig["profiles"];
  events: Record<string, Pick<EventDef, "title" | "base" | "effects" | "conditionalEffects" | "trackModifiers" | "mitigations">>;
  /** By scenario id: the hidden half of every option. */
  options: Record<string, (Pick<Choice, "id" | "text" | "hiddenEffects" | "conditionalEffects" | "probabilityModifiers" | "succeedsWhen" | "onFailure">
    & { queues: { eventId: string; base: BaseProbability | "certain" | undefined }[] })[]>;
}

export function assumptionsOf(content: Content): Assumptions {
  const eventBase = (id: string) => content.events.find((e) => e.id === id)?.base;
  return {
    profiles: content.config.profiles,
    events: Object.fromEntries(content.events.map((e) => [e.id, {
      title: e.title, base: e.base, effects: e.effects, conditionalEffects: e.conditionalEffects,
      trackModifiers: e.trackModifiers, mitigations: e.mitigations,
    }])),
    options: Object.fromEntries(content.scenarios.map((scenario) => [scenario.id, scenario.choices.map((c) => ({
      id: c.id, text: c.text, hiddenEffects: c.hiddenEffects, conditionalEffects: c.conditionalEffects,
      probabilityModifiers: c.probabilityModifiers, succeedsWhen: c.succeedsWhen, onFailure: c.onFailure,
      queues: c.queues.map((q) => ({ eventId: q.eventId, base: q.baseProbability ?? eventBase(q.eventId) })),
    }))])),
  };
}
