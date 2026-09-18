// The player-facing view of content. Scenario JSON carries hidden effects,
// probability modifiers and conditions, which no component may render. The
// interface reads scenarios only through this view, which leaves them out.

import type { AdviserId, Content, Domain, Effects, EvidenceStrength, Lever, Scenario, Severity, Track } from "../engine/types";

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

export interface PublicContent {
  scenarios: Record<string, PublicScenario>;
  advisers: PublicAdviser[];
  endings: Record<string, PublicEnding>;
  /** The closing paragraph added to any ending when Legitimacy is below the threshold. */
  backlashText: string;
  /** Scripted scenario ids in order, for dates and progress. */
  sequence: string[];
  infoCost: number;
  totalTurns: number;
}

export function publicContent(content: Content): PublicContent {
  return {
    scenarios: Object.fromEntries(content.scenarios.map((s) => [s.id, publicScenario(s)])),
    advisers: content.advisers.map(({ id, name, role, lens }) => ({ id, name, role, lens })),
    endings: Object.fromEntries(content.endings.map(({ id, title, text, furtherReading }) => [id, { id, title, text, furtherReading }])),
    backlashText: content.config.legitimacyBacklash.text,
    sequence: content.sequence,
    infoCost: content.config.politicalCapital.infoCost,
    totalTurns: content.sequence.length + 1,
  };
}
