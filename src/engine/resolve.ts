// Conditions, event odds, effects and event-queue resolution.
//
// Choices never trigger events directly (spec Section 6). Each queued event has a
// base probability, adjusted by decision modifiers and investment tracks, clamped,
// and rolled exactly once with a keyed draw.

import { keyedInt, keyedUniform } from "./rng";
import type {
  BaseProbability,
  CapacityLabel,
  CompositeKey,
  Condition,
  Content,
  Domain,
  Effects,
  EventDef,
  EventOutcome,
  GameConfig,
  GameState,
  IntelReport,
  MetricKey,
  QueueSpec,
  QueuedEvent,
  Scenario,
} from "./types";

export const METRIC_KEYS: MetricKey[] = [
  "nationalSecurity", "economy", "publicTrust", "innovation",
  "socialStability", "systemicRisk", "cooperation", "stateCapacity",
];

// ---------------------------------------------------------------- lookups

export function findScenario(content: Content, id: string): Scenario {
  const scenario = content.scenarios.find((s) => s.id === id);
  if (!scenario) throw new Error(`Unknown scenario "${id}"`);
  return scenario;
}

export function findEvent(content: Content, id: string): EventDef {
  const event = content.events.find((e) => e.id === id);
  if (!event) throw new Error(`Unknown event "${id}"`);
  return event;
}

// ---------------------------------------------------------------- composites and labels

/** The three composites behind the endings (spec Section 10). */
export function composites(metrics: Record<MetricKey, number>): Record<CompositeKey, number> {
  return {
    control: (metrics.nationalSecurity + metrics.stateCapacity + (100 - metrics.systemicRisk)) / 3,
    prosperity: (metrics.economy + metrics.innovation + metrics.socialStability) / 3,
    legitimacy: metrics.publicTrust,
  };
}

export function capacityLabel(
  stateCapacity: number,
  thresholds: { adequateFrom: number; strongFrom: number },
): CapacityLabel {
  if (stateCapacity >= thresholds.strongFrom) return "Strong";
  return stateCapacity >= thresholds.adequateFrom ? "Adequate" : "Thin";
}

// ---------------------------------------------------------------- conditions

const compare = (actual: number, op: ">=" | "<=", value: number) => (op === ">=" ? actual >= value : actual <= value);

/** A keyed yes/no fact: fixed for the seed, identical wherever the key is named. */
export function drawHolds(seed: number, draw: { key: string; probability: number }): boolean {
  return keyedUniform(seed, `draw:${draw.key}`) * 100 < draw.probability;
}

export function holds(condition: Condition, state: GameState): boolean {
  let result = true;
  if (condition.metric) result &&= compare(state.metrics[condition.metric.key], condition.metric.op, condition.metric.value);
  if (condition.composite) {
    result &&= compare(composites(state.metrics)[condition.composite.key], condition.composite.op, condition.composite.value);
  }
  if (condition.track) result &&= state.tracks[condition.track.key] >= condition.track.minLevel;
  if (condition.flag !== undefined) result &&= state.flags.includes(condition.flag);
  if (condition.seedFact) result &&= state.world[condition.seedFact];
  if (condition.draw) result &&= drawHolds(state.world.seed, condition.draw);
  if (condition.any) result &&= condition.any.some((c) => holds(c, state));
  return condition.not ? !result : result;
}

export const allHold = (conditions: Condition[], state: GameState) => conditions.every((c) => holds(c, state));

/**
 * The chance (0..1) that the conditions hold, as seen from inside this world's
 * profile without knowing its hidden facts. Advisers reason from this, so their
 * forecasts cannot leak a fact. Observable parts (metrics, tracks, flags) count as known.
 */
export function chanceOf(conditions: Condition[], state: GameState, config: GameConfig): number {
  const factOdds = config.profiles[state.world.profile].facts;
  return conditions.reduce((product, condition) => {
    const { seedFact, draw, not, ...observable } = condition;
    let chance = holds(observable, state) ? 1 : 0;
    if (seedFact) chance *= factOdds[seedFact] / 100;
    if (draw) chance *= draw.probability / 100;
    return product * (not ? 1 - chance : chance);
  }, 1);
}

// ---------------------------------------------------------------- effects

export function applyEffects(
  metrics: Record<MetricKey, number>,
  effects: Effects,
  factor = 1,
): Record<MetricKey, number> {
  const next = { ...metrics };
  for (const key of METRIC_KEYS) {
    const delta = effects[key];
    if (delta !== undefined) next[key] += factor === 1 ? delta : Math.round(delta * factor);
  }
  return next;
}

export function clampMetrics(metrics: Record<MetricKey, number>): Record<MetricKey, number> {
  const next = { ...metrics };
  for (const key of METRIC_KEYS) next[key] = Math.min(100, Math.max(0, next[key]));
  return next;
}

// ---------------------------------------------------------------- odds

export function resolveBase(base: BaseProbability | "certain", state: GameState): number | "certain" {
  if (base === "certain") return base;
  if ("cases" in base) {
    const match = base.cases.find((c) => allHold(c.when, state));
    return match ? match.probability : base.otherwise;
  }
  if ("fact" in base) return state.world[base.fact] ? base.whenTrue : base.whenFalse;
  return base[state.world.profile];
}

/** Current chance of a queued event, in percentage points, clamped (spec: 2..95). */
export function oddsOf(queued: QueuedEvent, state: GameState, content: Content): number {
  if (queued.baseProbability === "certain") return 100;
  const trackShift = findEvent(content, queued.eventId).trackModifiers
    .filter((m) => state.tracks[m.track] >= m.minLevel)
    .reduce((sum, m) => sum + m.delta, 0);
  const raw = queued.baseProbability + (state.oddsModifiers[queued.eventId] ?? 0) + trackShift;
  const { min, max } = content.config.oddsClamp;
  return Math.min(max, Math.max(min, raw));
}

/**
 * The chance (0..1) of an event as things stand: its live odds if queued, its
 * outcome if already resolved, otherwise the odds it would face if queued now.
 */
export function chanceOfEvent(eventId: string, state: GameState, content: Content): number {
  const queued = state.queue.find((q) => q.eventId === eventId);
  if (queued) return oddsOf(queued, state, content) / 100;
  const outcome = state.outcomes.find((o) => o.eventId === eventId);
  if (outcome) return outcome.fired ? 1 : 0;
  const hypothetical = toQueued({ eventId, minDelay: 0, maxDelay: 0 }, state, content, null);
  return oddsOf(hypothetical, state, content) / 100;
}

// ---------------------------------------------------------------- queueing

function toQueued(
  spec: QueueSpec,
  state: GameState,
  content: Content,
  source: { choiceId: string; scenarioId: string } | null,
): QueuedEvent {
  const base = spec.baseProbability ?? findEvent(content, spec.eventId).base;
  if (base === undefined) throw new Error(`Event "${spec.eventId}" has no base probability`);
  const last = content.sequence.length;
  const earliestTurn = Math.min(last, state.slot + spec.minDelay);
  const latestTurn = Math.min(last, state.slot + spec.maxDelay);
  return {
    eventId: spec.eventId,
    earliestTurn,
    latestTurn,
    rollTurn: keyedInt(state.world.seed, `when:${spec.eventId}`, earliestTurn, latestTurn),
    baseProbability: resolveBase(base, state),
    sourceChoiceId: source?.choiceId ?? null,
    sourceScenarioId: source?.scenarioId ?? null,
  };
}

/** Adds events to the queue. An event already waiting or already resolved is not queued twice. */
export function enqueue(
  state: GameState,
  content: Content,
  specs: QueueSpec[],
  source: { choiceId: string; scenarioId: string } | null,
): GameState {
  let queue = state.queue;
  for (const spec of specs) {
    const seen = queue.some((q) => q.eventId === spec.eventId) || state.outcomes.some((o) => o.eventId === spec.eventId);
    if (!seen) queue = [...queue, toQueued(spec, { ...state, queue }, content, source)];
  }
  return queue === state.queue ? state : { ...state, queue };
}

/** Events the registry places in the world before the first turn. */
export function initialQueueSpecs(content: Content): QueueSpec[] {
  return content.events.flatMap((event) =>
    event.initial
      ? [{ eventId: event.id, minDelay: event.initial.earliestTurn - 1, maxDelay: event.initial.latestTurn - 1 }]
      : [],
  );
}

// ---------------------------------------------------------------- rolling

/** A directional statement about a hidden truth, right with the given reliability (%). */
export function drawSignal(seed: number, key: string, truth: boolean, reliability: number): boolean {
  const pointsTheRightWay = keyedUniform(seed, key) * 100 < reliability;
  return pointsTheRightWay ? truth : !truth;
}

export interface RollResult {
  state: GameState;
  headlines: string[];
  /** Domains in which a public incident fired this turn; each opens a policy window. */
  incidents: Domain[];
}

/** Step E of the resolution order: roll every event that is due, in queue order. */
export function rollDueEvents(state: GameState, content: Content, mayInterrupt: boolean): RollResult {
  const due = state.queue.filter((q) => q.rollTurn <= state.slot);
  if (due.length === 0) return { state, headlines: [], incidents: [] };

  let next: GameState = { ...state, queue: state.queue.filter((q) => q.rollTurn > state.slot) };
  const headlines: string[] = [];
  const incidents: Domain[] = [];

  for (const queued of due) {
    const def = findEvent(content, queued.eventId);
    const odds = oddsOf(queued, next, content);
    const fired = queued.baseProbability === "certain"
      || keyedUniform(next.world.seed, `event:${queued.eventId}`) * 100 < odds;
    const outcome: EventOutcome = {
      eventId: queued.eventId,
      turn: next.turn,
      probability: odds / 100,
      fired,
      sourceChoiceId: queued.sourceChoiceId,
      sourceScenarioId: queued.sourceScenarioId,
    };
    next = { ...next, outcomes: [...next.outcomes, outcome] };
    if (!fired) continue;

    const factor = def.mitigations.filter((m) => allHold(m.when, next)).reduce((f, m) => f * m.factor, 1);
    let metrics = applyEffects(next.metrics, def.effects, factor);
    if (def.headline) headlines.push(def.headline);
    for (const conditional of def.conditionalEffects) {
      if (!allHold(conditional.when, next)) continue;
      metrics = applyEffects(metrics, conditional.effects, factor);
      if (conditional.headline) headlines.push(conditional.headline);
    }

    let intel = next.intel;
    if (def.reveal) {
      const weakened = def.reveal.weakened && allHold(def.reveal.weakened.when, next);
      const reliability = weakened ? def.reveal.weakened!.reliability : def.reveal.reliability;
      const leansTrue = drawSignal(next.world.seed, `reveal:${def.id}`, allHold(def.reveal.about, next), reliability);
      const report: IntelReport = {
        turn: next.turn,
        scenarioId: queued.sourceScenarioId ?? next.current?.scenarioId ?? "",
        source: "reveal",
        eventId: def.id,
        leansTrue,
        text: leansTrue ? def.reveal.leansTrue : def.reveal.leansFalse,
      };
      intel = [...intel, report];
    }

    const newFlags = def.flagsAdded.filter((flag) => !next.flags.includes(flag));
    const interrupts = def.severe && mayInterrupt && !next.interruptPlayed
      && next.pendingInterrupt === null && def.interruptScenarioId !== undefined;
    next = {
      ...next,
      metrics,
      intel,
      flags: [...next.flags, ...newFlags],
      pendingInterrupt: interrupts ? def.interruptScenarioId! : next.pendingInterrupt,
    };
    if (def.publicIncident) incidents.push(def.domain);
  }
  return { state: next, headlines, incidents };
}
