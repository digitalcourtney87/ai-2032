// Facilitator overrides (spec Sections 6 and 11; DECISIONS.md, decision 7).
//
// A facilitator may edit the world-profile odds and the base odds of events, then
// share a link. The edits travel in the URL beside the seed code, so every
// participant plays the same edited world. Only changed numbers are encoded.
// Overrides touch data only: the engine never knows they exist.

import { z } from "zod";
import type { BaseProbability, Content, Profile, SeedFact } from "../engine/types";

const percent = z.number().min(0).max(100);
const profile = z.enum(["benign", "contested", "hard"]);
const seedFact = z.enum(["cyberOffenceLed", "bioUpliftReal", "sandbaggingStrategic", "labourShockStructural", "foreignPostureOpen"]);

/** `events` maps an event id to its edited base odds, keyed by slot: a profile name, "whenTrue", "whenFalse", "case0".., or "otherwise". */
export const overridesSchema = z.strictObject({
  weights: z.partialRecord(profile, percent).optional(),
  facts: z.partialRecord(profile, z.partialRecord(seedFact, percent)).optional(),
  events: z.record(z.string(), z.record(z.string(), percent)).optional(),
});
export type Overrides = z.infer<typeof overridesSchema>;

/** The editable numbers behind one event's base odds, in display order. */
export function baseSlots(base: BaseProbability | "certain" | undefined): { slot: string; value: number }[] {
  if (base === undefined || base === "certain") return [];
  if ("cases" in base) return [...base.cases.map((c, i) => ({ slot: `case${i}`, value: c.probability })), { slot: "otherwise", value: base.otherwise }];
  if ("fact" in base) return [{ slot: "whenTrue", value: base.whenTrue }, { slot: "whenFalse", value: base.whenFalse }];
  return (["benign", "contested", "hard"] as const).map((p) => ({ slot: p, value: base[p] }));
}

function withSlots(base: BaseProbability, edits: Record<string, number>): BaseProbability {
  const pick = (slot: string, fallback: number) => edits[slot] ?? fallback;
  if ("cases" in base) {
    return { cases: base.cases.map((c, i) => ({ ...c, probability: pick(`case${i}`, c.probability) })), otherwise: pick("otherwise", base.otherwise) };
  }
  if ("fact" in base) return { ...base, whenTrue: pick("whenTrue", base.whenTrue), whenFalse: pick("whenFalse", base.whenFalse) };
  return { benign: pick("benign", base.benign), contested: pick("contested", base.contested), hard: pick("hard", base.hard) };
}

export const IMPOSSIBLE_PROFILE_WEIGHTS = "At least one world profile must have a weight above zero";

/** Whether applying these edits would leave every world profile at weight zero. */
export function effectiveWeightsValid(content: Content, overrides: Overrides): boolean {
  return (Object.keys(content.config.profiles) as Profile[]).some(
    (name) => (overrides.weights?.[name] ?? content.config.profiles[name]!.weight) > 0,
  );
}

/** Returns new content with the overrides applied. Unknown event ids and slots are ignored. */
export function applyOverrides(content: Content, overrides: Overrides): Content {
  const profiles = structuredClone(content.config.profiles);
  for (const name of Object.keys(profiles) as Profile[]) {
    profiles[name].weight = overrides.weights?.[name] ?? profiles[name].weight;
    for (const fact of Object.keys(profiles[name].facts) as SeedFact[]) {
      profiles[name].facts[fact] = overrides.facts?.[name]?.[fact] ?? profiles[name].facts[fact];
    }
  }
  if (Object.values(profiles).every((p) => p.weight === 0)) throw new Error(IMPOSSIBLE_PROFILE_WEIGHTS);
  const events = content.events.map((event) => {
    const edits = overrides.events?.[event.id];
    return edits && event.base !== undefined && event.base !== "certain" ? { ...event, base: withSlots(event.base, edits) } : event;
  });
  return { ...content, config: { ...content.config, profiles }, events };
}

/**
 * Shared-link configuration: parse, check the effective weights against the supplied
 * bundle, then apply. An invalid user configuration is discarded as a whole.
 * Direct `applyOverrides` stays strict for trusted callers.
 */
export function resolveEffectiveConfiguration(
  encoded: string | null,
  bundled: Content,
): { content: Content; overrides: Overrides } {
  const overrides = decodeOverrides(encoded);
  if (countOverrides(overrides) === 0 || !effectiveWeightsValid(bundled, overrides)) {
    return { content: bundled, overrides: {} };
  }
  return { content: applyOverrides(bundled, overrides), overrides };
}

export function countOverrides(overrides: Overrides): number {
  return Object.keys(overrides.weights ?? {}).length
    + Object.values(overrides.facts ?? {}).reduce((sum, facts) => sum + Object.keys(facts ?? {}).length, 0)
    + Object.values(overrides.events ?? {}).reduce((sum, slots) => sum + Object.keys(slots).length, 0);
}

// ---------------------------------------------------------------- the URL

const toBase64Url = (text: string) => btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const fromBase64Url = (text: string) => atob(text.replaceAll("-", "+").replaceAll("_", "/"));

/** Overrides as a compact URL parameter. Empty overrides encode to an empty string. */
export function encodeOverrides(overrides: Overrides): string {
  return countOverrides(overrides) === 0 ? "" : toBase64Url(JSON.stringify(overrides));
}

/** Parses a `cfg` parameter. A missing, malformed or out-of-range value yields no overrides rather than a broken game. */
export function decodeOverrides(parameter: string | null): Overrides {
  if (!parameter) return {};
  try {
    return overridesSchema.parse(JSON.parse(fromBase64Url(parameter)));
  } catch {
    return {};
  }
}
