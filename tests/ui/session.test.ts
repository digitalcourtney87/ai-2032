import { describe, expect, test } from "vitest";
import { displayed, type Track } from "../../src/engine";
import { loadContent, publicContent } from "../../src/content";
import { consequencesOf } from "../../src/ui/consequences";
import { createSession, type GameSession, type Session } from "../../src/ui/session";
import { first, playThrough } from "../engine/fixture";
import { createGame } from "../../src/engine";

const content = loadContent();
const pub = publicContent(content);
const api = createSession(content);

function availableChoice(session: Session, prefer = "A"): string {
  const choices = session.game!.current!.choices;
  return choices.some((choice) => choice.id === prefer && choice.status === "available")
    ? prefer
    : choices.find((choice) => choice.status === "available")!.id;
}

function openTrack(session: Session, prefer: Track = "evaluation"): Track {
  const tracks: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];
  const levels = session.game!.tracks;
  if (levels[prefer] < 3) return prefer;
  return tracks.find((track) => levels[track] < 3) ?? prefer;
}

function playTurn(session: Session, prefer = "A", track: Track = "evaluation"): Session {
  const next = api.forecast(session, 0.5);
  const choiceId = availableChoice(next, prefer);
  if (next.game!.current!.isFinal) return api.completeFinal(next, choiceId);
  return api.completeNonFinal(api.decide(next, choiceId), openTrack(next, track));
}

function playUntil(session: Session, scenarioId: string): Session {
  let current = session;
  for (let turn = 0; turn < 8; turn++) {
    if (current.game?.current?.scenarioId === scenarioId) return current;
    current = playTurn(current);
  }
  throw new Error(`Never reached ${scenarioId}`);
}

function seedWhoseHistoryIncludes(scenarioId: string): string {
  for (let i = 0; i < 400; i++) {
    const seed = `SESSION-${scenarioId}-${i}`;
    const final = playThrough(createGame(seed, content), content, first).at(-1)!;
    if (final.history.some((record) => record.scenarioId === scenarioId)) return seed;
  }
  throw new Error(`No seed reached ${scenarioId}`);
}

function expectCompleted(session: Session) {
  const completed = session.completed;
  expect(completed).not.toBeNull();
  expect(completed!.turn).toBe(completed!.before.turn);
  expect(completed!.scenarioId).toBe(completed!.before.current!.scenarioId);
  expect(completed!.after).toEqual(displayed(session.game!));
  return completed!;
}

describe("createSession", () => {
  test("an ordinary successor records identity from the outgoing view and the exact after snapshot", () => {
    let session = api.start("WORKSHOP");
    expect(session.completed).toBeNull();
    expect(session.decisionStates).toEqual([]);
    session = playTurn(session);
    const completed = expectCompleted(session);
    expect(completed.scenarioId).toBe("attribution-gap");
    expect(completed.turn).toBe(1);
    expect(session.game!.current!.scenarioId).toBe("open-weight-release");
    expect(session.decisionStates).toHaveLength(1);
    expect(consequencesOf(completed.before, completed.after, completed, pub).chose?.id).toBeTruthy();
  });

  test("a real interrupt and a false alarm keep their own identity, not the next scheduled scenario", () => {
    const cyber = playTurn(playUntil(api.start("WORKSHOP"), "incident-cyber"));
    expect(expectCompleted(cyber).scenarioId).toBe("incident-cyber");

    const falseAlarmSeed = seedWhoseHistoryIncludes("false-alarm");
    const alarm = playTurn(playUntil(api.start(falseAlarmSeed), "false-alarm"));
    expect(expectCompleted(alarm).scenarioId).toBe("false-alarm");
    expect(pub.sequence.includes("false-alarm")).toBe(false);
  });

  test("the final turn's after-view may include the debrief; the news projection stays safe", () => {
    let session = api.start("WORKSHOP");
    while (session.game?.phase !== "debrief") session = playTurn(session);
    const completed = expectCompleted(session);
    expect(completed.scenarioId).toBe("threshold-2032");
    expect(completed.after.phase).toBe("debrief");
    expect(completed.after.debrief).toBeTruthy();
    const news = consequencesOf(completed.before, completed.after, completed, pub);
    expect(news.capital).toBeNull();
    expect(news.unknown).toBeNull();
    expect(session.decisionStates).toHaveLength(8);
  });

  test("the first completed turn is still there after the next briefing starts, and start/reset clear it", () => {
    const afterFirst = playTurn(api.start("WORKSHOP"));
    const briefing = api.forecast(afterFirst, 0.4);
    expect(briefing.completed!.turn).toBe(1);
    expect(briefing.completed!.scenarioId).toBe("attribution-gap");
    expect(api.start("WORKSHOP-9").completed).toBeNull();
    expect(api.empty().completed).toBeNull();
    expect(api.empty().game).toBeNull();
  });

  test("an illegal completion or a failed action batch leaves the session untouched", () => {
    const atForecast = api.start("WORKSHOP");
    const forecastSnap = structuredClone(atForecast);
    expect(() => api.apply(atForecast, [{ type: "INVEST", track: "evaluation" }, { type: "ADVANCE" }])).toThrow(/not legal/);
    expect(atForecast).toEqual(forecastSnap);
    expect(atForecast.completed).toBeNull();

    const decided = api.decide(api.forecast(api.start("WORKSHOP"), 0.5), "A");
    const decidedSnap = structuredClone(decided);
    expect(() => api.completeFinal(decided, "A")).toThrow(/not legal/);
    expect(decided).toEqual(decidedSnap);
    expect(decided.completed).toBeNull();
    expect(decided.decisionStates).toHaveLength(1);
  });
});

describe("GameSession typing is for the hook and tests", () => {
  test("the factory is a GameSession", () => {
    const session: GameSession = api;
    expect(session.empty().game).toBeNull();
  });
});
