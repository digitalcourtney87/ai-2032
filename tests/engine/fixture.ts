// A tiny game used only by the engine tests: two scripted scenarios, a final
// decision, one incident interrupt and a false alarm. It is deliberately not the
// real content, so engine tests never depend on balance numbers.

import { reduce } from "../../src/engine";
import type { Action, AdviserView, Choice, Content, GameState, Scenario, Track } from "../../src/engine";

const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

function choice(id: string, politicalCost: number, overrides: Partial<Choice> = {}): Choice {
  return {
    id,
    text: `Option ${id}`,
    lever: "convening",
    politicalCost,
    restrictive: false,
    visibleEffects: {},
    hiddenEffects: {},
    probabilityModifiers: [],
    conditionalEffects: [],
    trackChange: null,
    flagsAdded: [],
    flagsRemoved: [],
    queues: [],
    requires: [],
    headline: `Headline for ${id}`,
    ...overrides,
  };
}

const view = (recommends: string): AdviserView => ({ stance: "A view.", recommends });

function scenario(id: string, overrides: Partial<Scenario> & Pick<Scenario, "choices" | "forecast">): Scenario {
  return {
    id,
    date: "2027-01",
    title: id,
    briefing: `Briefing for ${id}.`,
    isCrisis: false,
    domain: "cyber",
    evidenceStrength: "moderate",
    severity: "high",
    adviserViews: { shah: view("A"), harcourt: view("A"), chen: view("A"), okafor: view("A") },
    evidencePanel: { known: "", unknown: "", whyItMatters: "", sources: [] },
    ...overrides,
  };
}

export const fixture: Content = {
  config: {
    startingMetrics: {
      nationalSecurity: 50, economy: 50, publicTrust: 50, innovation: 50,
      socialStability: 50, systemicRisk: 20, cooperation: 45, stateCapacity: 40,
    },
    drift: {
      nationalSecurity: 0, economy: 1, publicTrust: 0, innovation: 0,
      socialStability: -1, systemicRisk: 3, cooperation: -1, stateCapacity: -2,
    },
    profiles: {
      benign: { weight: 30, facts: { cyberOffenceLed: 25, bioUpliftReal: 15, sandbaggingStrategic: 10, labourShockStructural: 30, foreignPostureOpen: 70 } },
      contested: { weight: 40, facts: { cyberOffenceLed: 50, bioUpliftReal: 35, sandbaggingStrategic: 35, labourShockStructural: 50, foreignPostureOpen: 50 } },
      hard: { weight: 30, facts: { cyberOffenceLed: 75, bioUpliftReal: 60, sandbaggingStrategic: 60, labourShockStructural: 70, foreignPostureOpen: 25 } },
    },
    politicalCapital: {
      perTurn: 5, carryCap: 3, trustBonusAt: 60, trustPenaltyAt: 40, infoCost: 1,
      windowTurns: 2, windowDiscount: 2, windowMinCost: 1, boomEconomyAt: 65, boomSurcharge: 1,
    },
    band: { base: 30, perCapacityPoint: 0.25 },
    capacityLabels: { adequateFrom: 35, strongFrom: 65 },
    evidenceReliability: { strong: 90, moderate: 75, weak: 60, speculative: 50, mixed: 60 },
    thinEvidencePenalty: 10,
    infoReliability: { Thin: 65, Adequate: 75, Strong: 85 },
    oddsClamp: { min: 2, max: 95 },
    trackBonuses: {
      evaluation: { stateCapacity: 4 },
      provenance: { publicTrust: 1 },
      diplomacy: { cooperation: 4 },
      defensiveCyber: { nationalSecurity: 2 },
    },
    falseAlarmScenarioId: "false-alarm",
    legitimacyBacklash: { below: 40, text: "Backlash." },
  },

  sequence: ["s1", "s2", "final"],

  events: [
    {
      id: "attack", title: "Infrastructure attack", domain: "cyber", severe: true, publicIncident: true,
      base: { fact: "cyberOffenceLed", whenTrue: 50, whenFalse: 15 },
      initial: { earliestTurn: 1, latestTurn: 2 },
      effects: { nationalSecurity: -10, publicTrust: -4 },
      conditionalEffects: [],
      mitigations: [{ when: [{ track: { key: "defensiveCyber", minLevel: 2 } }], factor: 0.5 }],
      trackModifiers: [{ track: "defensiveCyber", minLevel: 2, delta: -10 }],
      flagsAdded: ["attack-happened"],
      headline: "Attack disrupts infrastructure.",
      interruptScenarioId: "incident",
    },
    {
      id: "delay", title: "Developer delays UK launch", domain: "cyber", severe: false, publicIncident: false,
      base: { benign: 20, contested: 20, hard: 20 },
      effects: { innovation: -4, economy: -2 },
      conditionalEffects: [], mitigations: [], trackModifiers: [], flagsAdded: [],
      headline: "A developer delays its UK launch.",
    },
    {
      id: "study", title: "Uplift study reports", domain: "bio", severe: false, publicIncident: false,
      base: "certain",
      effects: {}, conditionalEffects: [], mitigations: [], trackModifiers: [],
      flagsAdded: ["study-done"],
      reveal: { about: [{ seedFact: "bioUpliftReal" }], reliability: 85, leansTrue: "Uplift looks real.", leansFalse: "Uplift looks marginal." },
      headline: null,
    },
    {
      id: "post-incident", title: "Post-deployment incident", domain: "frontier", severe: true, publicIncident: true,
      base: {
        cases: [
          { when: [{ metric: { key: "systemicRisk", op: "<=", value: 35 } }], probability: 5 },
          { when: [{ metric: { key: "systemicRisk", op: ">=", value: 51 } }], probability: 40 },
        ],
        otherwise: 20,
      },
      effects: { nationalSecurity: -15 },
      conditionalEffects: [], mitigations: [], trackModifiers: [], flagsAdded: [],
      headline: "A severe incident follows deployment.",
    },
  ],

  scenarios: [
    scenario("s1", {
      forecast: { question: "Attack?", resolvesBy: "2029-12", resolution: { eventId: "attack" } },
      briefingSignal: { about: [{ seedFact: "cyberOffenceLed" }], leansTrue: "Offence leads.", leansFalse: "Defence keeps pace." },
      choices: [
        choice("A", 2, { stance: 1, visibleEffects: { innovation: 1 }, hiddenEffects: { stateCapacity: 3 } }),
        choice("B", 3, { stance: 2, visibleEffects: { nationalSecurity: 3, economy: -1 }, probabilityModifiers: [{ eventId: "attack", delta: -6 }] }),
        choice("C", 4, {
          stance: 4, restrictive: true,
          visibleEffects: { nationalSecurity: 4, innovation: -3 }, hiddenEffects: { stateCapacity: 4 },
          probabilityModifiers: [{ eventId: "attack", delta: -10 }],
          queues: [{ eventId: "delay", minDelay: 1, maxDelay: 1 }],
        }),
        choice("D", 3, { stance: 3, visibleEffects: { economy: -2 }, trackChange: { key: "defensiveCyber", delta: 1 } }),
      ],
    }),
    scenario("s2", {
      domain: "bio",
      forecast: { question: "Uplift real?", resolvesBy: "2032-10", resolution: [{ seedFact: "bioUpliftReal" }] },
      briefingSignal: { about: [{ seedFact: "bioUpliftReal" }], leansTrue: "Uplift looks real.", leansFalse: "Uplift looks marginal." },
      choices: [
        choice("A", 2, { stance: 1, visibleEffects: { economy: -1 }, queues: [{ eventId: "study", minDelay: 1, maxDelay: 1 }] }),
        choice("B", 4, {
          stance: 4, restrictive: true, visibleEffects: { nationalSecurity: 4 },
          succeedsWhen: [{ metric: { key: "cooperation", op: ">=", value: 40 } }],
          onFailure: { effects: { publicTrust: -1 }, flagsAdded: ["talks-failed"], queues: [], headline: "Talks collapse." },
        }),
        choice("C", 3, {
          stance: 3, visibleEffects: { economy: -1 },
          conditionalEffects: [
            { when: [{ seedFact: "bioUpliftReal" }], effects: { nationalSecurity: 3 } },
            { when: [{ seedFact: "bioUpliftReal", not: true }], effects: { publicTrust: -3 } },
          ],
        }),
        choice("D", 0, { stance: 2, lever: "wait", visibleEffects: { socialStability: -2 } }),
        // Unlocked by preparation: needs Evaluation science at level 1. No stance rank (decision 2).
        choice("E", 2, { requires: [{ track: { key: "evaluation", minLevel: 1 } }], visibleEffects: { nationalSecurity: 7 } }),
      ],
    }),
    scenario("incident", {
      isCrisis: true,
      forecast: { question: "Another?", resolvesBy: "2032-10", resolution: [{ draw: { key: "second-attack", probability: 30 } }] },
      choices: [
        choice("A", 1, { stance: 1, lever: "wait", visibleEffects: { publicTrust: -3 } }),
        choice("B", 3, { stance: 2, restrictive: true, visibleEffects: { nationalSecurity: 5, innovation: -3 } }),
        choice("C", 5, { stance: 3, restrictive: true, visibleEffects: { nationalSecurity: 4, economy: -3 } }),
      ],
    }),
    scenario("false-alarm", {
      isCrisis: true,
      forecast: { question: "Real?", resolvesBy: "2031-06", resolution: [{ draw: { key: "alarm-real", probability: 40 } }] },
      choices: [
        choice("A", 1, { stance: 1, lever: "wait", visibleEffects: { publicTrust: -1 } }),
        choice("B", 3, { stance: 2, restrictive: true, visibleEffects: { nationalSecurity: 2, economy: -2 } }),
      ],
    }),
    scenario("final", {
      domain: "frontier",
      evidenceStrength: "mixed",
      severity: "unknown",
      forecast: { question: "Incident if deployed?", resolvesBy: "2034-10", resolution: { eventId: "post-incident" } },
      choices: [
        choice("A", 2, { stance: 1, visibleEffects: { innovation: 6 }, queues: [{ eventId: "post-incident", minDelay: 0, maxDelay: 0 }] }),
        choice("E", 3, { stance: 2, restrictive: true, visibleEffects: { innovation: -6 }, flagsAdded: ["prohibited"] }),
      ],
    }),
  ],

  advisers: [
    { id: "shah", name: "Dr Maya Shah", role: "Chief Scientist", lens: "", bias: "", forecastBias: { default: -0.03, whenEvidenceThin: -0.1 }, noise: 0.08 },
    { id: "harcourt", name: "James Harcourt", role: "National Security Adviser", lens: "", bias: "", forecastBias: { default: 0.15 }, noise: 0.08 },
    { id: "chen", name: "Amelia Chen", role: "Economic Adviser", lens: "", bias: "", forecastBias: { default: -0.08 }, noise: 0.08 },
    { id: "okafor", name: "David Okafor", role: "Social Resilience Adviser", lens: "", bias: "", forecastBias: { default: 0.03, byDomain: { labour: 0.15 } }, noise: 0.08 },
  ],

  endings: [
    { id: "responsible", title: "", text: "", priority: 1, furtherReading: [], when: [{ composite: { key: "control", op: ">=", value: 55 } }, { composite: { key: "prosperity", op: ">=", value: 55 } }] },
    { id: "fortress", title: "", text: "", priority: 1, furtherReading: [], when: [{ composite: { key: "control", op: ">=", value: 55 } }, { composite: { key: "prosperity", op: ">=", value: 55 }, not: true }] },
    { id: "deregulated", title: "", text: "", priority: 1, furtherReading: [], when: [{ composite: { key: "control", op: ">=", value: 55 }, not: true }, { composite: { key: "prosperity", op: ">=", value: 55 } }] },
    { id: "dependent", title: "", text: "", priority: 1, furtherReading: [], when: [{ composite: { key: "control", op: ">=", value: 55 }, not: true }, { composite: { key: "prosperity", op: ">=", value: 55 }, not: true }] },
    { id: "unknown-frontier", title: "", text: "", priority: 2, furtherReading: [], when: [{ metric: { key: "stateCapacity", op: ">=", value: 70 } }, { metric: { key: "systemicRisk", op: "<=", value: 35 } }, { flag: "prohibited" }] },
  ],
};

// ---------------------------------------------------------------- helpers

/** Picks the next legal action for a turn. `pick` chooses among the options on offer. */
export type Policy = {
  choose: (state: GameState, availableIds: string[]) => string;
  invest?: (state: GameState, openTracks: Track[]) => Track;
  forecast?: number;
  buyInfo?: boolean;
};

export function nextAction(state: GameState, policy: Policy): Action {
  const ctx = state.current;
  if (!ctx) throw new Error("The game is over");
  switch (state.phase) {
    case "forecast":
      return { type: "FORECAST", value: policy.forecast ?? 0.5 };
    case "decide": {
      if (policy.buyInfo && ctx.canBuyInfo) return { type: "BUY_INFO" };
      const available = ctx.choices.filter((c) => c.status === "available").map((c) => c.id);
      return { type: "DECIDE", choiceId: policy.choose(state, available) };
    }
    case "invest": {
      const open = TRACKS.filter((t) => state.tracks[t] < 3);
      return { type: "INVEST", track: policy.invest ? policy.invest(state, open) : open[0]! };
    }
    default:
      return { type: "ADVANCE" };
  }
}

/** Plays a game to the debrief and returns every state along the way. */
export function playThrough(start: GameState, content: Content, policy: Policy): GameState[] {
  const states = [start];
  let state = start;
  while (state.phase !== "debrief") {
    state = reduce(state, nextAction(state, policy), content);
    states.push(state);
  }
  return states;
}

/** Plays one whole turn (forecast to ADVANCE) with a fixed choice and investment. */
export function playTurn(state: GameState, content: Content, choiceId: string, track: Track = "evaluation"): GameState {
  let next = reduce(state, { type: "FORECAST", value: 0.5 }, content);
  next = reduce(next, { type: "DECIDE", choiceId }, content);
  if (next.phase === "invest") next = reduce(next, { type: "INVEST", track }, content);
  return reduce(next, { type: "ADVANCE" }, content);
}

export const first: Policy = { choose: (_state, ids) => ids[0]! };

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
