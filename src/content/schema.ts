// Zod schemas for every content file. Content is data, never code (handoff rule 3):
// everything the engine knows about scenarios arrives through these shapes.
// Objects are strict, so a misspelt key fails loudly instead of being ignored.

import { z } from "zod";
import type {
  Adviser,
  Choice,
  Condition,
  Ending,
  EventDef,
  GameConfig,
  Scenario,
} from "../engine/types";

const metricKey = z.enum([
  "nationalSecurity", "economy", "publicTrust", "innovation",
  "socialStability", "systemicRisk", "cooperation", "stateCapacity",
]);
const track = z.enum(["evaluation", "provenance", "diplomacy", "defensiveCyber"]);
const profile = z.enum(["benign", "contested", "hard"]);
const domain = z.enum(["cyber", "bio", "labour", "information", "frontier"]);
const seedFact = z.enum([
  "cyberOffenceLed", "bioUpliftReal", "sandbaggingStrategic", "labourShockStructural", "foreignPostureOpen",
]);
const lever = z.enum([
  "evaluationAccess", "marketAccess", "procurement", "domesticLaw",
  "publicInvestment", "convening", "restriction", "wait",
]);
const evidenceStrength = z.enum(["strong", "moderate", "weak", "speculative", "mixed"]);
const severity = z.enum(["moderate", "high", "veryHigh", "catastrophic", "unknown"]);
const capacityLabel = z.enum(["Thin", "Adequate", "Strong"]);
const adviserId = z.enum(["shah", "harcourt", "chen", "okafor"]);

const percent = z.number().min(0).max(100);
const level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const comparison = z.enum([">=", "<="]);
const text = z.string().min(1);
const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, "expected YYYY-MM");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const effectsSchema = z.partialRecord(metricKey, z.number().int());

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.strictObject({
    metric: z.strictObject({ key: metricKey, op: comparison, value: z.number() }).optional(),
    track: z.strictObject({ key: track, minLevel: level }).optional(),
    flag: text.optional(),
    seedFact: seedFact.optional(),
    composite: z.strictObject({ key: z.enum(["control", "prosperity", "legitimacy"]), op: comparison, value: z.number() }).optional(),
    draw: z.strictObject({ key: text, probability: percent }).optional(),
    any: z.array(conditionSchema).min(2).optional(),
    not: z.boolean().optional(),
  }),
);
const conditions = z.array(conditionSchema);

const baseProbability = z.union([
  z.literal("certain"),
  z.strictObject({ benign: percent, contested: percent, hard: percent }),
  z.strictObject({ fact: seedFact, whenTrue: percent, whenFalse: percent }),
  z.strictObject({ cases: z.array(z.strictObject({ when: conditions, probability: percent })).min(1), otherwise: percent }),
]);

const queueSpec = z
  .strictObject({
    eventId: text,
    minDelay: z.number().int().min(0),
    maxDelay: z.number().int().min(0),
    baseProbability: baseProbability.optional(),
  })
  .refine((q) => q.maxDelay >= q.minDelay, "maxDelay must not be below minDelay");

const signalSpec = z.strictObject({ about: conditions.min(1), leansTrue: text, leansFalse: text });

export const eventSchema: z.ZodType<EventDef> = z.strictObject({
  id: text,
  title: text,
  domain,
  severe: z.boolean(),
  publicIncident: z.boolean(),
  base: baseProbability.optional(),
  initial: z.strictObject({ earliestTurn: z.number().int().min(1), latestTurn: z.number().int().min(1) }).optional(),
  effects: effectsSchema,
  conditionalEffects: z.array(z.strictObject({ when: conditions, effects: effectsSchema, headline: text.optional() })),
  mitigations: z.array(z.strictObject({ when: conditions, factor: z.number().min(0).max(1) })),
  trackModifiers: z.array(z.strictObject({ track, minLevel: level, delta: z.number() })),
  flagsAdded: z.array(text),
  reveal: signalSpec
    .extend({ reliability: percent, weakened: z.strictObject({ when: conditions, reliability: percent }).optional() })
    .optional(),
  headline: text.nullable(),
  interruptScenarioId: text.optional(),
});

export const choiceSchema: z.ZodType<Choice> = z.strictObject({
  id: text,
  text,
  lever,
  politicalCost: z.number().int().min(0).max(8),
  restrictive: z.boolean(),
  stance: z.number().int().min(1).optional(),
  visibleEffects: effectsSchema,
  hiddenEffects: effectsSchema,
  probabilityModifiers: z.array(z.strictObject({ eventId: text, delta: z.number(), when: conditions.optional() })),
  conditionalEffects: z.array(z.strictObject({ when: conditions.min(1), effects: effectsSchema })),
  trackChange: z.strictObject({ key: track, delta: z.literal(1) }).nullable().optional(),
  flagsAdded: z.array(text),
  flagsRemoved: z.array(text),
  queues: z.array(queueSpec),
  requires: conditions,
  succeedsWhen: conditions.optional(),
  onFailure: z.strictObject({ effects: effectsSchema, flagsAdded: z.array(text), queues: z.array(queueSpec), headline: text }).optional(),
  headline: text,
});

const adviserView = z.strictObject({
  stance: text,
  recommends: text,
  memory: z.array(z.strictObject({ when: conditions.min(1), line: text })).optional(),
});

export const scenarioSchema: z.ZodType<Scenario> = z.strictObject({
  id: text,
  date: isoMonth,
  title: text,
  briefing: text,
  isCrisis: z.boolean(),
  domain,
  evidenceStrength,
  severity,
  forecast: z.strictObject({
    question: text,
    resolvesBy: isoMonth,
    resolution: z.union([conditions.min(1), z.strictObject({ eventId: text })]),
  }),
  briefingSignal: signalSpec.optional(),
  adviserViews: z.record(adviserId, adviserView),
  choices: z.array(choiceSchema).min(2),
  evidencePanel: z.strictObject({
    known: text,
    unknown: text,
    whyItMatters: text,
    sources: z.array(z.strictObject({ label: text, url: z.url(), reviewed: isoDate })).min(1),
  }),
});

export const adviserSchema: z.ZodType<Adviser> = z.strictObject({
  id: adviserId,
  name: text,
  role: text,
  lens: text,
  bias: text,
  forecastBias: z.strictObject({
    default: z.number().min(-0.5).max(0.5),
    byDomain: z.partialRecord(domain, z.number().min(-0.5).max(0.5)).optional(),
    whenEvidenceThin: z.number().min(-0.5).max(0.5).optional(),
  }),
  noise: z.number().min(0).max(0.5),
});

export const endingSchema: z.ZodType<Ending> = z.strictObject({
  id: text,
  title: text,
  text,
  priority: z.number().int(),
  when: conditions,
  furtherReading: z.array(z.strictObject({
    label: text,
    url: z.url(),
    type: text,
    stance: z.enum(["supports", "challenges", "context"]),
    why: text,
    reviewed: isoDate,
  })),
});

const allMetrics = z.record(metricKey, z.number());

export const configSchema: z.ZodType<GameConfig> = z.strictObject({
  startingMetrics: allMetrics,
  drift: allMetrics,
  profiles: z.record(profile, z.strictObject({ weight: percent, facts: z.record(seedFact, percent) })),
  politicalCapital: z.strictObject({
    perTurn: z.number().int(),
    carryCap: z.number().int(),
    trustBonusAt: z.number(),
    trustPenaltyAt: z.number(),
    infoCost: z.number().int(),
    windowTurns: z.number().int(),
    windowDiscount: z.number().int(),
    windowMinCost: z.number().int(),
    boomEconomyAt: z.number(),
    boomSurcharge: z.number().int(),
  }),
  band: z.strictObject({ base: z.number(), perCapacityPoint: z.number() }),
  capacityLabels: z.strictObject({ adequateFrom: z.number(), strongFrom: z.number() }),
  evidenceReliability: z.record(evidenceStrength, percent),
  thinEvidencePenalty: z.number(),
  infoReliability: z.record(capacityLabel, percent),
  oddsClamp: z.strictObject({ min: percent, max: percent }),
  trackBonuses: z.record(track, effectsSchema),
  falseAlarmScenarioId: text,
  legitimacyBacklash: z.strictObject({ below: z.number(), text }),
});

export const gameSchema = z.strictObject({ sequence: z.array(text).min(2), config: configSchema });
