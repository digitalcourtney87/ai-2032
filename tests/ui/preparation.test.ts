import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type GameState, type Track } from "../../src/engine";
import { loadContent, publicContent } from "../../src/content";
import { TRACKS } from "../../src/ui/format";
import { milestonesFor, runPosition, unlockTargets } from "../../src/ui/preparation";
import { advanceUntil, cheapest, FORBIDDEN_KEYS, keysOf } from "./states";
import { nextAction } from "../engine/fixture";

const content = loadContent();
const pub = publicContent(content);
const investing = (state: GameState) => state.phase === "invest";

describe("unlockTargets", () => {
  test("lists every option a track level opens, scripted first", () => {
    expect(unlockTargets(pub)).toEqual([
      { track: "provenance", level: 2, scenarioId: "deepfake-election", choiceId: "E", scheduled: true },
      { track: "evaluation", level: 3, scenarioId: "false-alarm", choiceId: "D", scheduled: false },
      { track: "evaluation", level: 3, scenarioId: "incident-bio", choiceId: "D", scheduled: false },
      { track: "evaluation", level: 3, scenarioId: "incident-cyber", choiceId: "D", scheduled: false },
    ]);
  });
});

describe("runPosition", () => {
  test("matches the engine's own bookkeeping on every turn of many runs", () => {
    for (let i = 0; i < 60; i++) {
      let state = createGame(`POSITION-${i}`, content);
      const policy = cheapest("provenance", "evaluation");
      while (state.phase !== "debrief") {
        if (state.phase === "decide" || state.phase === "invest") {
          // The test may read the hidden bookkeeping; the helper may not.
          expect(runPosition(displayed(state), pub)).toEqual({ remainingScripted: content.sequence.slice(state.slot) });
        }
        state = reduce(state, nextAction(state, policy), content);
      }
    }
  });
});

describe("milestonesFor", () => {
  test("on turn 1 every scripted rung is ahead, and level 1 is the next rung", () => {
    const view = displayed(advanceUntil(createGame("LADDER-1", content), content, cheapest(), investing));
    expect(milestonesFor("evaluation", view, pub)).toEqual([
      { level: 1, reached: false, next: true, milestones: [] },
      { level: 2, reached: false, next: false, milestones: [{ text: "Stronger unannounced evaluations", status: "standing" }] },
      { level: 3, reached: false, next: false, milestones: [{ text: "A government incident-response model in the unscheduled crisis", status: "standing" }] },
    ]);
    expect(milestonesFor("provenance", view, pub)[1]!.milestones).toEqual([{ text: "Rapid authentication in a crisis about disputed media", status: "ahead" }]);
    expect(milestonesFor("diplomacy", view, pub)[2]!.milestones).toEqual([{ text: "A credible coordinated pause in the final decision", status: "ahead" }]);
  });

  test("filled rungs follow the track level", () => {
    const state = advanceUntil(createGame("LADDER-2", content), content, cheapest("evaluation"), (s) => investing(s) && s.tracks.evaluation === 1);
    const rungs = milestonesFor("evaluation", displayed(state), pub);
    expect(rungs.map((r) => [r.reached, r.next])).toEqual([[true, false], [false, true], [false, false]]);
  });

  test("a scripted unlock whose turn has passed says so; the unscheduled crisis never gets a status", () => {
    const onElection = advanceUntil(createGame("LADDER-3", content), content, cheapest(), (s) => investing(s) && s.current!.scenarioId === "deepfake-election");
    expect(milestonesFor("provenance", displayed(onElection), pub)[1]!.milestones[0]!.status).toBe("passed");
    const duringCrisis = advanceUntil(createGame("LADDER-3", content), content, cheapest(), (s) => investing(s) && s.current!.isInterrupt);
    expect(milestonesFor("evaluation", displayed(duringCrisis), pub)[2]!.milestones[0]!.status).toBe("standing");
  });

  test("a level too far to reach before the turn that uses it says so", () => {
    // Evaluation first, then Provenance: Diplomacy stays at 0, and from turn 6 two points are left before the final.
    const at = (turn: number) => displayed(advanceUntil(createGame("LADDER-4", content), content, cheapest("evaluation", "provenance"), (s) => investing(s) && s.turn === turn));
    expect(at(5).tracks.diplomacy).toBe(0);
    expect(milestonesFor("diplomacy", at(5), pub)[2]!.milestones[0]!.status).toBe("ahead");
    expect(milestonesFor("diplomacy", at(6), pub)[2]!.milestones[0]!.status).toBe("outOfReach");
  });

  test("never names the unscheduled crisis's variant or says whether it is still to come, and gives no odds", () => {
    for (let i = 0; i < 20; i++) {
      let state = createGame(`LADDER-NAMES-${i}`, content);
      while (state.phase !== "debrief") {
        if (investing(state)) {
          const view = displayed(state);
          const json = JSON.stringify(TRACKS.map((t: Track) => milestonesFor(t, view, pub)));
          expect(json).not.toMatch(/The Incident|The Warning|incident-cyber|incident-bio|false-alarm|%/);
          for (const key of FORBIDDEN_KEYS) expect(keysOf(JSON.parse(json))).not.toContain(key);
          // Whether the unscheduled crisis is ahead or behind is never shown (non-negotiable 6).
          const crisisLines = TRACKS.flatMap((t) => milestonesFor(t, view, pub).flatMap((r) => r.milestones)).filter((m) => m.text.includes("unscheduled crisis"));
          for (const m of crisisLines) expect(m.status).toBe("standing");
        }
        state = reduce(state, nextAction(state, cheapest()), content);
      }
    }
  });
});
