import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type Content, type GameState, type Track } from "../../src/engine";
import { loadContent, publicContent, type PublicContent } from "../../src/content";
import { consequencesOf } from "../../src/ui/consequences";
import { EXACT_METRICS } from "../../src/ui/format";
import { nextAction, type Policy } from "../engine/fixture";
import { advanceUntil, cheapest, FORBIDDEN_KEYS, keysOf, perturbHidden } from "./states";

const content = loadContent();
const pub = publicContent(content);

/** Plays turn 1 with the given choice and track, as the interface would: forecast, decide, invest, advance. */
function firstTurn(c: Content, seed: string, choiceId: string, track: Track, buy = false) {
  let state = reduce(createGame(seed, c), { type: "FORECAST", value: 0.35 }, c);
  if (buy) state = reduce(state, { type: "BUY_INFO" }, c);
  state = reduce(state, { type: "DECIDE", choiceId }, c);
  state = reduce(state, { type: "INVEST", track }, c);
  return resolve(state, c);
}

/** ADVANCE from phase "advance", keeping the two views the interface keeps. */
function resolve(state: GameState, c: Content) {
  const before = displayed(state);
  const after = displayed(reduce(state, { type: "ADVANCE" }, c));
  return { before, after, resolved: { turn: state.turn, scenarioId: state.current!.scenarioId } };
}

const turnOf = (r: ReturnType<typeof resolve>, p: PublicContent = pub) => consequencesOf(r.before, r.after, r.resolved, p);

describe("consequencesOf: your decision", () => {
  test("reads what was chosen from before the turn resolved, not from the next turn", () => {
    const r = firstTurn(content, "NEWS-1", "C", "evaluation", true);
    expect(r.after.current!.scenarioId).toBe("open-weight-release");            // `after` is already the next turn
    expect(turnOf(r).chose).toEqual({
      id: "C", text: pub.scenarios["attribution-gap"]!.choices.find((c) => c.id === "C")!.text, costPaid: 4, boughtAnalysis: true,
    });
    expect(turnOf(r).investment).toBe("evaluation");
  });

  test("every track level that changed is listed, with no cause, and the investment names only where the point went", () => {
    // Option D also raises Defensive cyber, through a hidden track change (spec Section 9, Scenario 1).
    const r = firstTurn(content, "NEWS-2", "D", "evaluation");
    expect(turnOf(r).investment).toBe("evaluation");
    expect(turnOf(r).trackChanges).toEqual([{ track: "evaluation", from: 0, to: 1 }, { track: "defensiveCyber", from: 0, to: 1 }]);
    const same = firstTurn(content, "NEWS-2", "D", "defensiveCyber");
    expect(turnOf(same).investment).toBe("defensiveCyber");
    expect(turnOf(same).trackChanges).toEqual([{ track: "defensiveCyber", from: 0, to: 2 }]);
  });
});

describe("consequencesOf: what the world noticed", () => {
  test("the first headline is the decision as reported; the rest are other news", () => {
    const r = firstTurn(content, "NEWS-1", "A", "provenance");
    const headline = content.scenarios.find((s) => s.id === "attribution-gap")!.choices.find((c) => c.id === "A")!.headline;
    expect(turnOf(r).news).toEqual({ decision: headline, elsewhere: [] });   // nothing can fire on turn 1
  });

  test("findings are this turn's reveals, titled by their event; new policy windows only", () => {
    let seenFinding = false;
    let seenWindow = false;
    for (let i = 0; i < 200 && !(seenFinding && seenWindow); i++) {
      let state = createGame(`NEWS-EVENTS-${i}`, content);
      const policy = { ...cheapest(), buyInfo: false };
      while (state.phase !== "debrief") {
        if (state.phase === "advance") {
          const r = resolve(state, content);
          const c = turnOf(r);
          const reveals = r.after.intel.filter((x) => x.turn === r.resolved.turn && x.source === "reveal");
          expect(c.findings).toEqual(reveals.map((x) => ({ title: pub.eventTitles[x.eventId!] ?? null, text: x.text })));
          const opened = r.after.policyWindows.filter((w, i, all) => w.turnsLeft === pub.rules.windowTurns && all.findIndex((x) => x.domain === w.domain && x.turnsLeft === w.turnsLeft) === i);
          expect(c.windowsOpened).toEqual(r.before.current!.isFinal ? [] : opened);
          seenFinding ||= c.findings.length > 0;
          seenWindow ||= c.windowsOpened.length > 0;
        }
        state = reduce(state, nextAction(state, policy), content);
      }
    }
    expect(seenFinding && seenWindow).toBe(true);
  });
});

describe("consequencesOf: what you can measure now", () => {
  test("all five exact metrics, largest change first, unchanged ones last in reading order", () => {
    const r = firstTurn(content, "NEWS-3", "B", "provenance");
    const { measured } = turnOf(r);
    expect(measured.map((m) => m.metric).sort()).toEqual([...EXACT_METRICS].sort());
    for (const m of measured) expect(m).toEqual({ metric: m.metric, before: r.before.exact[m.metric], after: r.after.exact[m.metric], delta: r.after.exact[m.metric] - r.before.exact[m.metric] });
    const sizes = measured.map((m) => Math.abs(m.delta));
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    const unchanged = measured.filter((m) => m.delta === 0).map((m) => m.metric);
    expect(unchanged).toEqual(EXACT_METRICS.filter((m) => unchanged.includes(m)));
    expect(measured.some((m) => m.delta !== 0)).toBe(true);
  });

  test("Political Capital left and for next turn; estimates as they stand, low, mid and high only", () => {
    const r = firstTurn(content, "NEWS-1", "A", "provenance");
    const c = turnOf(r);
    expect(c.capital).toEqual({ leftAfterSpending: 3, nextTurn: r.after.politicalCapital });
    const { low, mid, high } = r.after.estimates.systemicRisk;
    expect(c.estimatesNow.systemicRisk).toEqual({ low, mid, high });
    expect(Object.keys(c.estimatesNow.cooperation).sort()).toEqual(["high", "low", "mid"]);
  });

  test("a State Capacity label change is reported, and only then", () => {
    // Rotating through the options and never investing in Evaluation lets drift pull State Capacity down to Thin.
    const drifting: Policy = { choose: (s, ids) => ids[s.turn % ids.length]!, invest: (_s, open) => open.find((t) => t !== "evaluation") ?? open[0]! };
    const labelChanges = (s: GameState) => s.phase === "advance" && displayed(reduce(s, { type: "ADVANCE" }, content)).stateCapacity !== displayed(s).stateCapacity;
    const state = advanceUntil(createGame("NEWS-0", content), content, drifting, labelChanges);
    const r = resolve(state, content);
    expect(turnOf(r).capacity).toEqual({ before: r.before.stateCapacity, after: r.after.stateCapacity });
    expect(turnOf(firstTurn(content, "NEWS-1", "A", "evaluation")).capacity).toBeNull();
  });
});

describe("consequencesOf: still unknown", () => {
  test("the player's forecast and its question, until the final turn", () => {
    const c = turnOf(firstTurn(content, "NEWS-1", "A", "provenance"));
    const scenario = pub.scenarios["attribution-gap"]!;
    expect(c.unknown).toEqual({ forecast: 0.35, question: scenario.forecastQuestion, resolvesBy: scenario.resolvesBy });
  });

  test("on the final turn: no capital, no windows, no open question, and nothing from the debrief", () => {
    const state = advanceUntil(createGame("NEWS-FINAL", content), content, cheapest(), (s) => s.phase === "advance" && s.current!.isFinal);
    const r = resolve(state, content);
    expect(r.after.truth).toBeDefined();                                   // the debrief has unlocked in `after`
    const c = turnOf(r);
    expect(c.capital).toBeNull();
    expect(c.unknown).toBeNull();
    expect(c.windowsOpened).toEqual([]);
    for (const key of FORBIDDEN_KEYS) expect(keysOf(c)).not.toContain(key);
  });
});

describe("hidden information", () => {
  test("changing the hidden half of the content changes nothing on turn 1's consequences", () => {
    // Turn 1's own hidden effects are spared: they change the measured metrics, which the player can see.
    const perturbed = perturbHidden(content, "attribution-gap");
    for (const choiceId of ["A", "B", "C", "D"]) {
      const a = turnOf(firstTurn(content, "SAME-WORLD", choiceId, "diplomacy"));
      const b = turnOf(firstTurn(perturbed, "SAME-WORLD", choiceId, "diplomacy"), publicContent(perturbed));
      expect(b).toEqual(a);
    }
  });

  test("the same two views give the same consequences whichever content's hidden half is loaded", () => {
    const r = firstTurn(content, "SAME-WORLD", "C", "evaluation");
    expect(turnOf(r, publicContent(perturbHidden(content)))).toEqual(turnOf(r));
  });

  test("no hidden key on any turn of a whole run", () => {
    let state = createGame("NO-LEAK", content);
    while (state.phase !== "debrief") {
      if (state.phase === "advance") for (const key of FORBIDDEN_KEYS) expect(keysOf(turnOf(resolve(state, content)))).not.toContain(key);
      state = reduce(state, nextAction(state, cheapest()), content);
    }
  });
});
