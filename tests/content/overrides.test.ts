import { describe, expect, test } from "vitest";
import { createGame } from "../../src/engine";
import { findProblems, loadContent } from "../../src/content/load";
import { applyOverrides, baseSlots, countOverrides, decodeOverrides, encodeOverrides, resolveEffectiveConfiguration, type Overrides } from "../../src/content/overrides";
import { deepFreeze, first, playThrough } from "../engine/fixture";

const content = loadContent();
const edits: Overrides = {
  weights: { hard: 60 },
  facts: { benign: { cyberOffenceLed: 5 } },
  events: { "infra-attack": { whenTrue: 95, whenFalse: 95 }, "post-deployment-incident": { case1: 55, otherwise: 12 } },
};

describe("facilitator overrides (DECISIONS.md, decision 7)", () => {
  test("round-trip through the URL parameter", () => {
    const parameter = encodeOverrides(edits);
    expect(parameter).toMatch(/^[A-Za-z0-9_-]+$/);                         // safe in a URL with no escaping
    expect(decodeOverrides(parameter)).toEqual(edits);
    expect(countOverrides(edits)).toBe(6);
  });

  test("no edits encode to nothing, so an unedited link stays clean", () => {
    expect(encodeOverrides({})).toBe("");
    expect(decodeOverrides(null)).toEqual({});
  });

  test("a malformed or out-of-range parameter yields no overrides rather than a broken game", () => {
    expect(decodeOverrides("not base64 json")).toEqual({});
    expect(decodeOverrides(encodeOverrides({ weights: { hard: 60 } }).slice(0, -3))).toEqual({});
    expect(decodeOverrides(btoa(JSON.stringify({ weights: { hard: 140 } })))).toEqual({});
    expect(decodeOverrides(btoa(JSON.stringify({ engine: "rm -rf" })))).toEqual({});
  });

  test("change exactly the numbers named, and nothing else", () => {
    const edited = applyOverrides(deepFreeze(structuredClone(content)), edits);
    expect(edited.config.profiles.hard.weight).toBe(60);
    expect(edited.config.profiles.benign.weight).toBe(30);
    expect(edited.config.profiles.benign.facts.cyberOffenceLed).toBe(5);
    expect(edited.config.profiles.hard.facts.cyberOffenceLed).toBe(75);
    expect(edited.events.find((e) => e.id === "infra-attack")!.base).toEqual({ fact: "cyberOffenceLed", whenTrue: 95, whenFalse: 95 });
    const incident = edited.events.find((e) => e.id === "post-deployment-incident")!.base;
    expect(baseSlots(incident).map((s) => s.value)).toEqual([8, 55, 12]);
    expect(edited.scenarios).toEqual(content.scenarios);
    expect(findProblems(edited)).toEqual([]);
    expect(applyOverrides(content, {})).toEqual(content);
  });

  test("unknown events and slots are ignored; scheduled events cannot be edited", () => {
    const edited = applyOverrides(content, { events: { "no-such-event": { benign: 50 }, "retraining-outcome": { benign: 50 }, "infra-attack": { nonsense: 50 } } });
    expect(edited.events).toEqual(content.events);
  });

  test("a world with no possible profile is refused", () => {
    expect(() => applyOverrides(content, { weights: { benign: 0, contested: 0, hard: 0 } })).toThrow();
  });

  test("shared URL configuration with all-zero weights falls back to the published bundle", () => {
    const invalid = { weights: { benign: 0, contested: 0, hard: 0 } };
    const frozen = deepFreeze(structuredClone(content));
    const resolved = resolveEffectiveConfiguration(encodeOverrides(invalid), frozen);
    expect(resolved.content).toEqual(content);
    expect(resolved.overrides).toEqual({});
    expect(countOverrides(resolved.overrides)).toBe(0);
    expect(frozen).toEqual(content);
    expect(() => applyOverrides(content, invalid)).toThrow(/weight above zero/);
  });

  test("a partial override whose effective weights are all zero is also discarded", () => {
    const alreadyNarrow = applyOverrides(content, { weights: { benign: 0, contested: 0 } });
    const resolved = resolveEffectiveConfiguration(encodeOverrides({ weights: { hard: 0 } }), alreadyNarrow);
    expect(resolved.content).toEqual(alreadyNarrow);
    expect(resolved.overrides).toEqual({});
    expect(() => applyOverrides(alreadyNarrow, { weights: { hard: 0 } })).toThrow(/weight above zero/);
  });

  test("valid partial weights, facts and events apply as a whole", () => {
    const resolved = resolveEffectiveConfiguration(encodeOverrides(edits), content);
    expect(resolved.overrides).toEqual(edits);
    expect(resolved.content.config.profiles.hard.weight).toBe(60);
    expect(resolved.content.config.profiles.benign.weight).toBe(30);
    expect(resolved.content.config.profiles.benign.facts.cyberOffenceLed).toBe(5);
    expect(resolved.content.events.find((e) => e.id === "infra-attack")!.base).toEqual({
      fact: "cyberOffenceLed", whenTrue: 95, whenFalse: 95,
    });
    expect(content.config.profiles.hard.weight).toBe(30);
  });

  test("malformed encoding yields the published bundle with no accepted edits", () => {
    const resolved = resolveEffectiveConfiguration("not base64 json", content);
    expect(resolved.content).toEqual(content);
    expect(resolved.overrides).toEqual({});
  });

  test("an empty or missing parameter leaves the bundled content untouched", () => {
    expect(resolveEffectiveConfiguration(null, content)).toEqual({ content, overrides: {} });
    expect(resolveEffectiveConfiguration("", content)).toEqual({ content, overrides: {} });
    expect(resolveEffectiveConfiguration(encodeOverrides({}), content)).toEqual({ content, overrides: {} });
  });

  test("edited odds change what happens: an attack made near-certain nearly always fires", () => {
    const edited = applyOverrides(content, edits);
    const fired = (c: typeof content) => Array.from({ length: 200 }, (_, i) => playThrough(createGame(`edit-${i}`, c), c, first).at(-1)!)
      .filter((final) => final.outcomes.some((o) => o.eventId === "infra-attack" && o.fired)).length;
    expect(fired(edited)).toBeGreaterThan(fired(content) + 60);
  });

  test("the same seed with the same edits is still exactly reproducible", () => {
    const edited = applyOverrides(content, edits);
    const play = () => JSON.stringify(playThrough(createGame("WORKSHOP-9", edited), edited, first).at(-1));
    expect(play()).toBe(play());
  });
});
