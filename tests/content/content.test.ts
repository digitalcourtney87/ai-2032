import { describe, expect, test } from "vitest";
import { createGame, reduce, type Choice, type Content, type Effects, type MetricKey, type Track } from "../../src/engine";
import { mulberry32 } from "../../src/engine/rng";
import { findProblems, loadContent, parseContent, rawContent, type RawContent } from "../../src/content/load";
import { scenarioSchema } from "../../src/content/schema";
import { nextAction, playThrough, type Policy } from "../engine/fixture";

const content = loadContent();
const scenarios = content.scenarios.map((s) => [s.id, s] as const);
const isBase = (choice: Choice) => choice.requires.length === 0;
const magnitude = (effects: Effects) => Object.values(effects).reduce((sum, v) => sum + Math.abs(v ?? 0), 0);

describe("schema", () => {
  test.each(rawContent.scenarios.map((raw) => [(raw as { id: string }).id, raw] as const))("%s parses", (_id, raw) => {
    expect(() => scenarioSchema.parse(raw)).not.toThrow();
  });

  test("the whole bundle loads and cross-checks clean", () => {
    expect(findProblems(content)).toEqual([]);
    expect(content.sequence).toHaveLength(7);
    expect(content.scenarios).toHaveLength(10);
  });
});

describe("the loader fails loudly", () => {
  const broken = (mutate: (raw: RawContent & { scenarios: Record<string, unknown>[] }) => void) => {
    const copy = structuredClone(rawContent) as RawContent & { scenarios: Record<string, unknown>[] };
    mutate(copy);
    return () => parseContent(copy);
  };
  const firstChoice = (raw: { scenarios: Record<string, unknown>[] }) => (raw.scenarios[0]!.choices as Record<string, unknown>[])[0]!;

  test("on a misspelt key", () => {
    expect(broken((raw) => { firstChoice(raw).politcalCost = 2; })).toThrow();
  });
  test("on a missing field", () => {
    expect(broken((raw) => { delete raw.scenarios[0]!.briefing; })).toThrow();
  });
  test("on a reference to an event that does not exist", () => {
    expect(broken((raw) => { firstChoice(raw).probabilityModifiers = [{ eventId: "no-such-event", delta: -5 }]; })).toThrow(/unknown event "no-such-event"/);
  });
  test("on an adviser recommending an option that does not exist", () => {
    expect(broken((raw) => { (raw.scenarios[0]!.adviserViews as Record<string, { recommends: string }>).shah!.recommends = "Z"; })).toThrow(/recommends unknown choice/);
  });
  test("on a base option with no stance rank", () => {
    expect(broken((raw) => { delete firstChoice(raw).stance; })).toThrow(/stance/);
  });
  test("on a non-integer effect", () => {
    expect(broken((raw) => { firstChoice(raw).visibleEffects = { innovation: 1.5 }; })).toThrow();
  });
});

// ---------------------------------------------------------------- option design rules (spec Section 8)

describe.each(scenarios)("option design rules: %s", (_id, scenario) => {
  const base = scenario.choices.filter(isBase);

  test("rule 1: no free options", () => {
    for (const choice of scenario.choices) {
      const hasVisibleCost = Object.entries(choice.visibleEffects).some(([key, value]) =>
        key === "systemicRisk" ? (value ?? 0) > 0 : (value ?? 0) < 0);
      expect(hasVisibleCost || choice.politicalCost >= 2, `${choice.id} is free`).toBe(true);
    }
  });

  test("rule 2: no option dominates another on visible effects plus cost (unlocked options exempt)", () => {
    const good = (choice: Choice, key: MetricKey) => (key === "systemicRisk" ? -1 : 1) * (choice.visibleEffects[key] ?? 0);
    const keys = [...new Set(base.flatMap((c) => Object.keys(c.visibleEffects) as MetricKey[]))];
    for (const x of base) {
      for (const y of base) {
        if (x === y) continue;
        const atLeastAsGood = x.politicalCost <= y.politicalCost && keys.every((key) => good(x, key) >= good(y, key));
        expect(atLeastAsGood, `${x.id} dominates ${y.id}`).toBe(false);
      }
    }
  });

  test("rule 3: base options all use different levers", () => {
    const levers = base.map((c) => c.lever);
    expect(new Set(levers).size, levers.join(", ")).toBe(levers.length);
  });

  test("rule 4: one option preserves flexibility or gathers information", () => {
    const waits = base.filter((c) => c.lever === "wait" || c.stance === 1);
    expect(waits.length).toBeGreaterThan(0);
  });

  test("rule 6: visible effects are at most 70% of an option's total magnitude", () => {
    for (const choice of scenario.choices) {
      const share = visibleShare(choice, content);
      expect(share, `${choice.id} is ${(share * 100).toFixed(0)}% visible`).toBeLessThanOrEqual(0.7);
    }
  });
});

/** DECISIONS.md B14: conditional effects, modifier points and queued events count at full magnitude. */
function visibleShare(choice: Choice, all: Content): number {
  const trackValue = (track: Track) =>
    magnitude(all.config.trackBonuses[track])
    + all.events.flatMap((e) => e.trackModifiers).filter((m) => m.track === track).reduce((sum, m) => sum + Math.abs(m.delta) / m.minLevel, 0);
  const eventMagnitude = (eventId: string) => {
    const event = all.events.find((e) => e.id === eventId)!;
    return magnitude(event.effects) + event.conditionalEffects.reduce((sum, c) => sum + magnitude(c.effects), 0);
  };
  const visible = magnitude(choice.visibleEffects);
  const hidden = magnitude(choice.hiddenEffects)
    + choice.conditionalEffects.reduce((sum, c) => sum + magnitude(c.effects), 0)
    + choice.probabilityModifiers.reduce((sum, m) => sum + Math.abs(m.delta), 0)
    + choice.queues.reduce((sum, q) => sum + eventMagnitude(q.eventId), 0)
    + magnitude(choice.onFailure?.effects ?? {})
    + (choice.trackChange ? trackValue(choice.trackChange.key) : 0);
  return visible / (visible + hidden);
}

// ---------------------------------------------------------------- ending copy (spec Section 14)

describe("ending copy", () => {
  test("no ending tells the player a decision was right or wrong", () => {
    const verdict = /\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision|almost everything well|not a failure of your unit)\b/i;
    for (const ending of content.endings) {
      expect(ending.text, ending.id).not.toMatch(verdict);
      expect(ending.title, ending.id).not.toMatch(verdict);
    }
  });
});

// ---------------------------------------------------------------- sources

describe("evidence sources", () => {
  test("every source and reading is dated; any older than six months is reported", () => {
    const dated = [
      ...content.scenarios.flatMap((s) => s.evidencePanel.sources.map((src) => ({ where: s.id, ...src }))),
      ...content.endings.flatMap((e) => e.furtherReading.map((src) => ({ where: e.id, ...src }))),
    ];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const stale = dated.filter((src) => new Date(src.reviewed) < sixMonthsAgo);
    // A warning, not a failure: the six-month review is an editorial duty (spec Section 11).
    if (stale.length > 0) console.warn(`Sources due for review:\n${stale.map((s) => `- ${s.where}: ${s.label} (${s.reviewed})`).join("\n")}`);
    expect(dated.length).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------- the real game plays

describe("the real content plays", () => {
  const randomPolicy = (seed: number): Policy => {
    let rng = seed + 1;
    const pick = <T,>(items: T[]): T => {
      const draw = mulberry32(rng);
      rng = draw.state;
      return items[Math.floor(draw.value * items.length)]!;
    };
    return { choose: (_s, ids) => pick(ids), invest: (_s, tracks) => pick(tracks), forecast: pick([0.1, 0.35, 0.6, 0.9]), buyInfo: pick([true, false]) };
  };

  test("500 random legal games: eight turns, one interrupt, one ending, no dead ends", () => {
    const interrupts = new Set(["incident-cyber", "incident-bio", "false-alarm"]);
    const seen = { endings: new Set<string>(), interrupts: new Set<string>() };
    for (let seed = 0; seed < 500; seed++) {
      const final = playThrough(createGame(`content-${seed}`, content), content, randomPolicy(seed)).at(-1)!;
      expect(final.history, `seed ${seed}`).toHaveLength(8);
      const played = final.history.filter((r) => interrupts.has(r.scenarioId));
      expect(played, `seed ${seed}`).toHaveLength(1);
      expect(final.history.at(-1)!.scenarioId).toBe("threshold-2032");
      expect(final.queue, `seed ${seed}: events left unresolved`).toEqual([]);
      seen.endings.add(final.debrief!.endingId);
      seen.interrupts.add(played[0]!.scenarioId);
    }
    expect([...seen.interrupts].sort()).toEqual(["false-alarm", "incident-bio", "incident-cyber"]);
    expect(seen.endings.size).toBeGreaterThanOrEqual(3);
  });

  test("the same seed and actions reproduce the same run with the real content", () => {
    const play = () => JSON.stringify(playThrough(createGame("WORKSHOP", content), content, randomPolicy(7)).at(-1));
    expect(play()).toBe(play());
  });

  test("every turn offers at least one affordable option, even after buying information", () => {
    for (let seed = 0; seed < 200; seed++) {
      let state = createGame(`afford-${seed}`, content);
      const policy: Policy = { choose: (_s, ids) => ids.at(-1)!, buyInfo: true };   // spend as much as possible
      while (state.phase !== "debrief") {
        if (state.phase === "decide") expect(state.current!.choices.some((c) => c.status === "available"), `seed ${seed} turn ${state.turn}`).toBe(true);
        state = reduce(state, nextAction(state, policy), content);
      }
    }
  });
});
