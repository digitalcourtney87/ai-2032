// The reducer: reduce(state, action, content) returns a new state and touches
// nothing else (handoff invariant 1). No dates, no DOM, no module-level mutable
// state, and no scenario-specific logic: everything it does is driven by content.

import { hashString, mulberry32, seedFromCode } from "./rng";
import { drawWorld } from "./seed";
import { buildDebrief } from "./scoring";
import {
  allHold,
  applyEffects,
  capacityLabel,
  chanceOf,
  chanceOfEvent,
  clampMetrics,
  drawSignal,
  enqueue,
  findScenario,
  initialQueueSpecs,
  METRIC_KEYS,
  rollDueEvents,
} from "./resolve";
import type {
  Action,
  AdviserId,
  Choice,
  Content,
  DecisionRecord,
  GameState,
  OddsRecord,
  Scenario,
  Track,
  TrackLevel,
  TurnContext,
  WorldSeed,
} from "./types";

const ADVISER_IDS: AdviserId[] = ["shah", "harcourt", "chen", "okafor"];
const THIN_EVIDENCE: Scenario["evidenceStrength"][] = ["weak", "speculative", "mixed"];

// ---------------------------------------------------------------- costs and availability

/** Political Capital cost after policy-window and boom pricing (spec Section 5). */
export function costOf(choice: Choice, scenario: Scenario, state: GameState, content: Content): number {
  const rules = content.config.politicalCapital;
  if (!choice.restrictive) return choice.politicalCost;
  let cost = choice.politicalCost;
  if (state.metrics.economy >= rules.boomEconomyAt) cost += rules.boomSurcharge;
  if (state.policyWindows.some((w) => w.domain === scenario.domain)) {
    cost = Math.max(rules.windowMinCost, cost - rules.windowDiscount);
  }
  return cost;
}

function choiceStatuses(scenario: Scenario, state: GameState, content: Content): TurnContext["choices"] {
  return scenario.choices.map((choice) => {
    const cost = costOf(choice, scenario, state, content);
    const status = !allHold(choice.requires, state) ? "locked" : cost > state.politicalCapital ? "unaffordable" : "available";
    return { id: choice.id, cost, status };
  });
}

/** Information may be bought only if a decision would still be affordable afterwards. */
function canBuyInfo(scenario: Scenario, state: GameState, content: Content, choices: TurnContext["choices"]): boolean {
  if (scenario.isCrisis || !scenario.briefingSignal) return false;
  const cheapest = Math.min(...choices.filter((c) => c.status !== "locked").map((c) => c.cost));
  return state.politicalCapital - content.config.politicalCapital.infoCost >= cheapest;
}

// ---------------------------------------------------------------- beginning a turn

/** The true chance behind the turn's forecast question, without leaking hidden facts. */
function forecastTruth(scenario: Scenario, state: GameState, content: Content): number {
  const { resolution } = scenario.forecast;
  return Array.isArray(resolution)
    ? chanceOf(resolution, state, content.config)
    : chanceOfEvent(resolution.eventId, state, content);
}

function beginTurn(state: GameState, content: Content, scenarioId: string, isInterrupt: boolean): GameState {
  const scenario = findScenario(content, scenarioId);
  const config = content.config;

  // Adviser forecasts: the true value, shifted by bias, plus sequential noise (spec Section 7).
  const truth = forecastTruth(scenario, state, content);
  let rngState = state.rngState;
  const adviserForecasts = {} as Record<AdviserId, number>;
  const adviserMemory = {} as Record<AdviserId, string | null>;
  for (const id of ADVISER_IDS) {
    adviserMemory[id] = scenario.adviserViews[id].memory?.find((m) => allHold(m.when, state))?.line ?? null;
    const adviser = content.advisers.find((a) => a.id === id);
    if (!adviser) throw new Error(`Unknown adviser "${id}"`);
    const draw = mulberry32(rngState);
    rngState = draw.state;
    const bias = adviser.forecastBias;
    const shift = (bias.byDomain?.[scenario.domain] ?? bias.default)
      + (THIN_EVIDENCE.includes(scenario.evidenceStrength) ? bias.whenEvidenceThin ?? 0 : 0);
    const estimate = truth + shift + (draw.value * 2 - 1) * adviser.noise;
    adviserForecasts[id] = Math.round(Math.min(0.98, Math.max(0.02, estimate)) * 100) / 100;
  }

  // The briefing signal points the right way with the rating's reliability,
  // less a silent penalty when State Capacity is Thin (spec Section 7).
  let signalLeansTrue: boolean | null = null;
  let intel = state.intel;
  if (scenario.briefingSignal) {
    const thin = capacityLabel(state.metrics.stateCapacity, config.capacityLabels) === "Thin";
    const reliability = config.evidenceReliability[scenario.evidenceStrength] - (thin ? config.thinEvidencePenalty : 0);
    signalLeansTrue = drawSignal(state.world.seed, `signal:${scenario.id}`, allHold(scenario.briefingSignal.about, state), reliability);
    const text = signalLeansTrue ? scenario.briefingSignal.leansTrue : scenario.briefingSignal.leansFalse;
    intel = [...intel, { turn: state.turn, scenarioId, source: "briefing", leansTrue: signalLeansTrue, text }];
  }

  const choices = choiceStatuses(scenario, state, content);
  const current: TurnContext = {
    scenarioId,
    isInterrupt,
    isFinal: !isInterrupt && scenarioId === content.sequence[content.sequence.length - 1],
    choices,
    adviserForecasts,
    adviserMemory,
    signalLeansTrue,
    canBuyInfo: canBuyInfo(scenario, state, content, choices),
    forecast: null,
    boughtInfo: false,
    choiceId: null,
    investedIn: null,
    oddsAtTheTime: [],
  };
  return { ...state, rngState, intel, current, phase: "forecast" };
}

// ---------------------------------------------------------------- creating a game

/** Builds the opening state inside a given world. Counterfactual reruns enter here. */
export function createGameInWorld(world: WorldSeed, seedCode: string, content: Content): GameState {
  const config = content.config;
  const first = content.sequence[0];
  if (!first) throw new Error("Content has no scripted scenarios");
  const blank: GameState = {
    turn: 1,
    world,
    rngState: hashString("stream", world.seed),
    metrics: { ...config.startingMetrics },
    tracks: { evaluation: 0, provenance: 0, diplomacy: 0, defensiveCyber: 0 },
    politicalCapital: config.politicalCapital.perTurn,
    policyWindows: [],
    flags: [],
    queue: [],
    history: [],
    headlines: [],
    seedCode,
    slot: 1,
    phase: "forecast",
    current: null,
    oddsModifiers: {},
    outcomes: [],
    intel: [],
    pendingInterrupt: null,
    interruptPlayed: false,
    debriefUnlocked: false,
    debrief: null,
    display: {
      bandBase: config.band.base,
      bandPerCapacityPoint: config.band.perCapacityPoint,
      adequateFrom: config.capacityLabels.adequateFrom,
      strongFrom: config.capacityLabels.strongFrom,
    },
  };
  return beginTurn(enqueue(blank, content, initialQueueSpecs(content), null), content, first, false);
}

export function createGame(seedCode: string, content: Content): GameState {
  return createGameInWorld(drawWorld(seedFromCode(seedCode), content.config), seedCode, content);
}

// ---------------------------------------------------------------- the decision

function currentTurn(state: GameState, expected: GameState["phase"], action: Action): TurnContext {
  if (state.phase !== expected || !state.current) {
    throw new Error(`${action.type} is not legal in phase "${state.phase}"`);
  }
  return state.current;
}

function chosen(state: GameState, content: Content): { scenario: Scenario; choice: Choice; ctx: TurnContext } {
  const ctx = state.current;
  if (!ctx || ctx.choiceId === null) throw new Error("No decision has been taken this turn");
  const scenario = findScenario(content, ctx.scenarioId);
  const choice = scenario.choices.find((c) => c.id === ctx.choiceId);
  if (!choice) throw new Error(`Unknown choice "${ctx.choiceId}" in "${scenario.id}"`);
  return { scenario, choice, ctx };
}

function raiseTrack(state: GameState, content: Content, track: Track): GameState {
  const level = state.tracks[track];
  if (level >= 3) return state;
  return {
    ...state,
    tracks: { ...state.tracks, [track]: (level + 1) as TrackLevel },
    metrics: applyEffects(state.metrics, content.config.trackBonuses[track]),
  };
}

/**
 * Steps A to C of the resolution order, plus the choice's own track change:
 * visible effects, hidden effects, then probability modifiers and new events.
 * A choice whose `succeedsWhen` fails applies only its `onFailure` outcome.
 */
function applyDecision(state: GameState, content: Content): { state: GameState; succeeded: boolean; headline: string } {
  const { scenario, choice } = chosen(state, content);
  const source = { choiceId: choice.id, scenarioId: scenario.id };
  const succeeded = allHold(choice.succeedsWhen ?? [], state);

  if (!succeeded) {
    const failure = choice.onFailure ?? { effects: {}, flagsAdded: [], queues: [], headline: choice.headline };
    const failed: GameState = {
      ...state,
      metrics: applyEffects(state.metrics, failure.effects),
      flags: [...state.flags, ...failure.flagsAdded.filter((f) => !state.flags.includes(f))],
    };
    return { state: enqueue(failed, content, failure.queues, source), succeeded, headline: failure.headline };
  }

  let metrics = applyEffects(state.metrics, choice.visibleEffects);                       // A
  metrics = applyEffects(metrics, choice.hiddenEffects);                                  // B
  for (const conditional of choice.conditionalEffects) {
    if (allHold(conditional.when, state)) metrics = applyEffects(metrics, conditional.effects);
  }
  const flags = [...state.flags.filter((f) => !choice.flagsRemoved.includes(f))];
  for (const flag of choice.flagsAdded) if (!flags.includes(flag)) flags.push(flag);

  const oddsModifiers = { ...state.oddsModifiers };                                       // C
  for (const modifier of choice.probabilityModifiers) {
    if (allHold(modifier.when ?? [], state)) {
      oddsModifiers[modifier.eventId] = (oddsModifiers[modifier.eventId] ?? 0) + modifier.delta;
    }
  }

  let next = enqueue({ ...state, metrics, flags, oddsModifiers }, content, choice.queues, source);
  if (choice.trackChange) next = raiseTrack(next, content, choice.trackChange.key);
  return { state: next, succeeded, headline: choice.headline };
}

/** Handoff invariant 4: the odds each affected event faced, frozen when the decision is taken. */
function freezeOdds(state: GameState, content: Content): OddsRecord[] {
  const { scenario, choice } = chosen(state, content);
  const after = applyDecision(state, content).state;
  const affected = new Set<string>();
  if (!Array.isArray(scenario.forecast.resolution)) affected.add(scenario.forecast.resolution.eventId);
  for (const modifier of choice.probabilityModifiers) affected.add(modifier.eventId);
  for (const queued of after.queue) if (!state.queue.some((q) => q.eventId === queued.eventId)) affected.add(queued.eventId);

  const isKnown = (s: GameState, id: string) => s.queue.some((q) => q.eventId === id) || s.outcomes.some((o) => o.eventId === id);
  return [...affected].map((eventId) => ({
    eventId,
    before: isKnown(state, eventId) ? chanceOfEvent(eventId, state, content) : 0,
    probability: chanceOfEvent(eventId, after, content),
  }));
}

// ---------------------------------------------------------------- resolving a turn

/** Steps A to H of the resolution order (handoff Section 3), then the next turn. */
function advance(state: GameState, content: Content): GameState {
  const { scenario, choice, ctx } = chosen(state, content);
  const config = content.config;
  const rules = config.politicalCapital;

  const decided = applyDecision(state, content);                                           // A, B, C
  let next = ctx.investedIn ? raiseTrack(decided.state, content, ctx.investedIn) : decided.state; // D
  const rolled = rollDueEvents(next, content, !ctx.isFinal);                               // E
  next = rolled.state;

  const metrics = { ...next.metrics };                                                     // F
  for (const key of METRIC_KEYS) metrics[key] += config.drift[key];

  const trust = metrics.publicTrust;                                                       // G
  const income = rules.perTurn + (trust >= rules.trustBonusAt ? 1 : 0) - (trust <= rules.trustPenaltyAt ? 1 : 0);
  const politicalCapital = Math.min(next.politicalCapital, rules.carryCap) + income;
  const policyWindows = [
    ...next.policyWindows.map((w) => ({ ...w, turnsLeft: w.turnsLeft - 1 })).filter((w) => w.turnsLeft > 0),
    ...rolled.incidents.map((domain) => ({ domain, turnsLeft: rules.windowTurns })),
  ];

  const record: DecisionRecord = {
    scenarioId: scenario.id,
    choiceId: choice.id,
    forecast: ctx.forecast ?? 0.5,
    adviserForecasts: ctx.adviserForecasts,
    boughtInfo: ctx.boughtInfo,
    investedIn: ctx.investedIn,
    oddsAtTheTime: ctx.oddsAtTheTime,
    turn: state.turn,
    succeeded: decided.succeeded,
    costPaid: ctx.choices.find((c) => c.id === choice.id)?.cost ?? choice.politicalCost,
    lockedChoiceIds: ctx.choices.filter((c) => c.status === "locked").map((c) => c.id),
  };

  next = {
    ...next,
    metrics: clampMetrics(metrics),                                                        // H
    politicalCapital,
    policyWindows,
    history: [...next.history, record],
    headlines: [decided.headline, ...rolled.headlines],
  };

  if (ctx.isFinal) {
    return { ...next, current: null, phase: "debrief", debriefUnlocked: true, debrief: buildDebrief(next, content) };
  }

  next = { ...next, turn: next.turn + 1 };
  if (next.pendingInterrupt) {
    const interruptId = next.pendingInterrupt;
    return beginTurn({ ...next, pendingInterrupt: null, interruptPlayed: true }, content, interruptId, true);
  }
  const upcoming = content.sequence[next.slot];
  if (!upcoming) throw new Error("The scripted sequence ended without a final decision");
  const finalIsNext = next.slot === content.sequence.length - 1;
  if (finalIsNext && !next.interruptPlayed) {
    // Nothing severe has fired: the false alarm runs instead (spec Section 9).
    return beginTurn({ ...next, interruptPlayed: true }, content, config.falseAlarmScenarioId, true);
  }
  return beginTurn({ ...next, slot: next.slot + 1 }, content, upcoming, false);
}

// ---------------------------------------------------------------- reduce

export function reduce(state: GameState, action: Action, content: Content): GameState {
  switch (action.type) {
    case "FORECAST": {
      const ctx = currentTurn(state, "forecast", action);
      if (!(action.value >= 0 && action.value <= 1)) throw new Error("A forecast is a probability between 0 and 1");
      return { ...state, phase: "decide", current: { ...ctx, forecast: action.value } };
    }

    case "BUY_INFO": {
      const ctx = currentTurn(state, "decide", action);
      const scenario = findScenario(content, ctx.scenarioId);
      if (!ctx.canBuyInfo || !scenario.briefingSignal) throw new Error("Information cannot be bought this turn");
      const config = content.config;
      const label = capacityLabel(state.metrics.stateCapacity, config.capacityLabels);
      const leansTrue = drawSignal(
        state.world.seed,
        `intel:${scenario.id}`,
        allHold(scenario.briefingSignal.about, state),
        config.infoReliability[label],
      );
      const paid: GameState = {
        ...state,
        politicalCapital: state.politicalCapital - config.politicalCapital.infoCost,
        intel: [...state.intel, {
          turn: state.turn,
          scenarioId: scenario.id,
          source: "purchase",
          leansTrue,
          text: leansTrue ? scenario.briefingSignal.leansTrue : scenario.briefingSignal.leansFalse,
        }],
      };
      const choices = choiceStatuses(scenario, paid, content);
      return { ...paid, current: { ...ctx, choices, boughtInfo: true, canBuyInfo: false } };
    }

    case "DECIDE": {
      const ctx = currentTurn(state, "decide", action);
      const option = ctx.choices.find((c) => c.id === action.choiceId);
      if (!option || option.status !== "available") throw new Error(`Choice "${action.choiceId}" is not available`);
      const decided: GameState = { ...state, current: { ...ctx, choiceId: option.id, canBuyInfo: false } };
      return {
        ...decided,
        politicalCapital: state.politicalCapital - option.cost,
        phase: ctx.isFinal ? "advance" : "invest",
        current: { ...decided.current!, oddsAtTheTime: freezeOdds(decided, content) },
      };
    }

    case "INVEST": {
      const ctx = currentTurn(state, "invest", action);
      if (state.tracks[action.track] >= 3) throw new Error(`Track "${action.track}" is already at level 3`);
      return { ...state, phase: "advance", current: { ...ctx, investedIn: action.track } };
    }

    case "ADVANCE": {
      currentTurn(state, "advance", action);
      return advance(state, content);
    }
  }
}
