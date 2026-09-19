// The interface reads content only through publicContent() (DECISIONS.md B33).
// These tests fail if a hidden field ever reaches that view, for example when a
// redesign renders more of it.

import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import type { SeedFact } from "../../src/engine";

const pub = publicContent(loadContent());
const json = JSON.stringify(pub);

/**
 * Keys that exist only in the hidden half of content (src/content/schema.ts, src/engine/types.ts):
 * every container key, and the nested keys that carry timing, odds and conditions.
 */
const HIDDEN_KEYS = [
  // Choice
  "hiddenEffects", "probabilityModifiers", "conditionalEffects", "trackChange", "flagsAdded", "flagsRemoved",
  "queues", "baseProbability", "requires", "succeedsWhen", "onFailure", "headline",
  // Scenario: how the forecast resolves, what the briefing signal is about, adviser memory conditions
  "resolution", "briefingSignal", "about", "adviserViews", "memory",
  // Condition
  "seedFact", "flag", "composite", "draw", "minLevel", "any",
  // BaseProbability
  "fact", "whenTrue", "whenFalse", "cases", "otherwise",
  // EventDef
  "base", "initial", "earliestTurn", "latestTurn", "effects", "mitigations", "trackModifiers",
  "reveal", "reliability", "weakened", "severe", "publicIncident", "interruptScenarioId",
  // Adviser
  "bias", "forecastBias", "byDomain", "whenEvidenceThin", "noise",
  // Ending
  "priority", "when",
  // GameConfig, apart from the Political Capital rules and track bonuses
  "startingMetrics", "drift", "profiles", "facts", "weight", "band", "perCapacityPoint", "capacityLabels",
  "adequateFrom", "strongFrom", "evidenceReliability", "thinEvidencePenalty", "infoReliability", "oddsClamp",
  "falseAlarmScenarioId", "legitimacyBacklash", "below",
  // Nested inside the hidden structures above: the event registry, queued-consequence timing,
  // odds modifiers, condition operands, adviser memory lines and per-profile odds
  "events", "eventId", "minDelay", "maxDelay", "factor", "delta", "metric", "op", "not", "probability",
  "forecast", "question", "line", "benign", "contested", "hard",
] as const;

/**
 * The latent facts of a world (WorldSeed). Their names appear only inside hidden conditions.
 * A Record, so a fact added to WorldSeed and missing here fails the type check.
 */
const SEED_FACT_SET: Record<SeedFact, true> = {
  cyberOffenceLed: true, bioUpliftReal: true, sandbaggingStrategic: true, labourShockStructural: true, foreignPostureOpen: true,
};
const SEED_FACTS = Object.keys(SEED_FACT_SET) as SeedFact[];

const keysOf = (value: object) => Object.keys(value).sort();

describe("publicContent() carries nothing hidden (DECISIONS.md B33)", () => {
  test.each(HIDDEN_KEYS)("no %s key", (key) => {
    expect(json).not.toContain(`"${key}":`);
  });

  test.each(SEED_FACTS)("no mention of the latent fact %s", (fact) => {
    expect(json).not.toContain(fact);
  });

  test("advisers expose exactly id, name, role and lens", () => {
    expect(pub.advisers).toHaveLength(4);
    for (const adviser of pub.advisers) expect(keysOf(adviser)).toEqual(["id", "lens", "name", "role"]);
  });

  test("each scenario's adviser views expose exactly stance and recommends", () => {
    for (const scenario of Object.values(pub.scenarios)) {
      for (const view of Object.values(scenario.advisers)) expect(keysOf(view)).toEqual(["recommends", "stance"]);
    }
  });

  test("each scenario exposes exactly its public fields", () => {
    // A new public field on a scenario is a deliberate decision: add it here and log it in DECISIONS.md.
    for (const scenario of Object.values(pub.scenarios)) {
      expect(keysOf(scenario)).toEqual([
        "advisers", "briefing", "choices", "date", "domain", "evidencePanel", "evidenceStrength",
        "forecastQuestion", "id", "isCrisis", "resolvesBy", "severity", "signal", "title",
      ]);
    }
  });

  test("each option exposes exactly id, text, lever, visible effects and its unlock", () => {
    // A new public field on an option is a deliberate decision: add it here and log it in DECISIONS.md.
    for (const scenario of Object.values(pub.scenarios)) {
      for (const choice of scenario.choices) {
        expect(keysOf(choice)).toEqual(["id", "lever", "text", "unlock", "visibleEffects"]);
        if (choice.unlock) expect(keysOf(choice.unlock)).toEqual(["level", "track"]);
      }
    }
  });

  test("each ending exposes exactly id, title, text and further reading", () => {
    for (const ending of Object.values(pub.endings)) expect(keysOf(ending)).toEqual(["furtherReading", "id", "text", "title"]);
  });
});
