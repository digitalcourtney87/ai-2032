import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type DisplayedState } from "../../src/engine";
import { loadContent, publicContent, type PublicScenario } from "../../src/content";
import { choicePreview, pricingNotes } from "../../src/ui/preview";
import { advanceUntil, cheapest, dearest, FORBIDDEN_KEYS, keysOf, perturbHidden } from "./states";

const content = loadContent();
const pub = publicContent(content);
const scenario = (id: string) => pub.scenarios[id]!;
const deciding = (seed: string) => reduce(createGame(seed, content), { type: "FORECAST", value: 0.5 }, content);

describe("choicePreview", () => {
  test("states the cost, the Political Capital left, and the stated effects in a fixed order", () => {
    const view = displayed(deciding("PREVIEW-1"));
    expect(choicePreview(view, scenario("attribution-gap"), "A")).toEqual({
      id: "A",
      text: scenario("attribution-gap").choices.find((c) => c.id === "A")!.text,
      cost: 2,
      status: "available",
      capitalNow: 5,
      capitalAfter: 3,
      rows: [
        { metric: "nationalSecurity", delta: 1, now: 50 },
        { metric: "innovation", delta: 1, now: 50 },
      ],
      unlock: null,
    });
  });

  test("an estimated metric gets its stated change and never a current value", () => {
    const state = advanceUntil(createGame("PREVIEW-2", content), content, cheapest(), (s) => s.phase === "decide" && s.current!.scenarioId === "open-weight-release");
    const view = displayed(state);
    expect(choicePreview(view, scenario("open-weight-release"), "D")!.rows).toEqual([
      { metric: "innovation", delta: -1, now: view.exact.innovation },
      { metric: "cooperation", delta: 5, now: null },
    ]);
  });

  test("an option that cannot be chosen has no Political Capital after, and its status says why", () => {
    const locked = advanceUntil(createGame("PREVIEW-3", content), content, cheapest("evaluation", "diplomacy", "defensiveCyber"), (s) => s.phase === "decide" && s.current!.scenarioId === "deepfake-election");
    const e = choicePreview(displayed(locked), scenario("deepfake-election"), "E")!;
    expect(e).toMatchObject({ status: "locked", capitalAfter: null, unlock: { track: "provenance", level: 2 } });

    // Spending on the dearest option and buying analysis every turn soon leaves an option out of reach.
    const spender = { ...dearest(), buyInfo: true };
    const short = advanceUntil(createGame("PREVIEW-4", content), content, spender, (s) => s.phase === "decide" && s.current!.choices.some((c) => c.status === "unaffordable"));
    const view = displayed(short);
    const option = view.current!.choices.find((c) => c.status === "unaffordable")!;
    const preview = choicePreview(view, scenario(view.current!.scenarioId), option.id)!;
    expect(preview).toMatchObject({ status: "unaffordable", cost: option.cost, capitalNow: view.politicalCapital, capitalAfter: null });
    expect(preview.cost).toBeGreaterThan(preview.capitalNow);
  });

  test("returns null for an option the scenario does not have", () => {
    expect(choicePreview(displayed(deciding("PREVIEW-1")), scenario("attribution-gap"), "Z")).toBeNull();
  });
});

describe("pricingNotes", () => {
  test("report the boom from the published threshold, and no window when none is open", () => {
    const view = displayed(deciding("PREVIEW-1"));
    const at = (economy: number): DisplayedState => ({ ...view, exact: { ...view.exact, economy } });
    expect(pricingNotes(at(pub.rules.boomEconomyAt - 1), scenario("attribution-gap"), pub.rules)).toEqual({ window: null, boom: false });
    expect(pricingNotes(at(pub.rules.boomEconomyAt), scenario("attribution-gap"), pub.rules)).toEqual({ window: null, boom: true });
  });

  test("name the open window in the scenario's area, with the longest time left", () => {
    const view: DisplayedState = { ...displayed(deciding("PREVIEW-1")), policyWindows: [{ domain: "cyber", turnsLeft: 1 }, { domain: "bio", turnsLeft: 2 }, { domain: "cyber", turnsLeft: 2 }] };
    expect(pricingNotes(view, scenario("attribution-gap"), pub.rules).window).toEqual({ domain: "cyber", turnsLeft: 2 });
    expect(pricingNotes(view, scenario("graduate-collapse"), pub.rules).window).toBeNull();
  });
});

describe("hidden information", () => {
  const perturbed = perturbHidden(content);
  const pubB = publicContent(perturbed);
  /** A view in which every option of `s` is on offer, so any option can be previewed. */
  const asIfDeciding = (view: DisplayedState, s: PublicScenario): DisplayedState => ({
    ...view,
    current: { ...view.current!, scenarioId: s.id, choices: s.choices.map((c) => ({ id: c.id, cost: 3, status: "available" as const })) },
  });

  test("changing every hidden effect, odds modifier and base odd changes nothing in any preview", () => {
    const a = displayed(deciding("SAME-WORLD"));
    const b = displayed(reduce(createGame("SAME-WORLD", perturbed), { type: "FORECAST", value: 0.5 }, perturbed));
    for (const choice of scenario("attribution-gap").choices) {
      expect(choicePreview(b, pubB.scenarios["attribution-gap"]!, choice.id)).toEqual(choicePreview(a, scenario("attribution-gap"), choice.id));
    }
    for (const s of Object.values(pub.scenarios)) {
      const view = asIfDeciding(a, s);
      for (const choice of s.choices) {
        expect(choicePreview(view, pubB.scenarios[s.id]!, choice.id)).toEqual(choicePreview(view, s, choice.id));
      }
    }
  });

  test("a preview carries no hidden key", () => {
    const view = displayed(deciding("SAME-WORLD"));
    for (const s of Object.values(pub.scenarios)) {
      for (const choice of s.choices) {
        const keys = keysOf(choicePreview(asIfDeciding(view, s), s, choice.id));
        for (const key of FORBIDDEN_KEYS) expect(keys).not.toContain(key);
      }
    }
  });
});
