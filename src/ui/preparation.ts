// What standing investment prepares for, derived only from public content and the
// displayed state (handoff invariant 3). Only scripted scenarios and the final decision
// get a status. The unscheduled crisis never does: late in a run "still ahead" would pin
// it to the next turn (turn 6 of 8 with the final still ahead means turn 7), and "passed"
// would say that no other crisis is coming (non-negotiable 6; DECISIONS.md, B6).

import type { PublicContent } from "../content";
import type { DisplayedState, Track } from "../engine";
import { TRACK_MILESTONES } from "./format";

/** An option in content that a track level opens. */
export interface UnlockTarget {
  track: Track;
  level: number;
  scenarioId: string;
  choiceId: string;
  /** In the scripted sequence. False for the three interrupt variants. */
  scheduled: boolean;
}

/** Every option that a track level opens, scripted scenarios in play order first. */
export function unlockTargets(pub: PublicContent): UnlockTarget[] {
  const unscheduled = Object.keys(pub.scenarios).filter((id) => !pub.sequence.includes(id)).sort();
  return [...pub.sequence, ...unscheduled].flatMap((scenarioId) =>
    (pub.scenarios[scenarioId]?.choices ?? []).flatMap((choice) =>
      choice.unlock
        ? [{ track: choice.unlock.track, level: choice.unlock.level, scenarioId, choiceId: choice.id, scheduled: pub.sequence.includes(scenarioId) }]
        : [],
    ),
  );
}

export interface RunPosition {
  /** Scripted scenarios still to come after the current turn, in order. */
  remainingScripted: string[];
}

/**
 * Where the run stands, from the displayed turn and scenario only. The engine numbers
 * turns as scripted slot + 1 once the interrupt has run (reduce.ts), so during the
 * interrupt the last scripted scenario played is at index turn − 2.
 */
export function runPosition(view: DisplayedState, pub: PublicContent): RunPosition {
  const current = view.current;
  if (!current) return { remainingScripted: [] };
  if (current.isInterrupt) return { remainingScripted: pub.sequence.slice(Math.max(0, view.turn - 1)) };
  return { remainingScripted: pub.sequence.slice(pub.sequence.indexOf(current.scenarioId) + 1) };
}

/**
 * "ahead": a remaining turn uses it, and the level can still be reached in time.
 * "outOfReach": a remaining turn uses it, but too few investment points are left to reach the level.
 * "passed": no remaining turn uses it.
 * "standing": no status, because it has no single turn or it belongs to the unscheduled crisis.
 */
export type MilestoneStatus = "ahead" | "outOfReach" | "passed" | "standing";

export interface Milestone {
  text: string;
  status: MilestoneStatus;
}

export interface Rung {
  level: 1 | 2 | 3;
  reached: boolean;
  /** The level an investment this turn would reach. */
  next: boolean;
  milestones: Milestone[];
}

/**
 * The three rungs of one track, as the investment screen shows them. A level gained
 * this turn first counts on the next turn, because option statuses are fixed when a
 * turn begins, so "remaining" means after the current turn.
 */
export function milestonesFor(track: Track, view: DisplayedState, pub: PublicContent): Rung[] {
  const have = view.tracks[track];
  const { remainingScripted } = runPosition(view, pub);
  const targets = unlockTargets(pub).filter((t) => t.track === track);
  const final = pub.sequence[pub.sequence.length - 1];
  // At most this many investment points are left before a scripted scenario begins: this
  // turn's, one for each scripted turn in between, and one for an unscheduled turn that
  // may come first. The bound counts that turn whether or not it has come, so it says
  // nothing about when. The final decision is always the last turn, so its count is exact.
  const lastPlayed = pub.sequence.length - 1 - remainingScripted.length;
  const pointsBefore = (scenarioId: string) =>
    scenarioId === final ? pub.totalTurns - view.turn : pub.sequence.indexOf(scenarioId) - lastPlayed + 1;
  const statusFor = (level: number, scenarioIds: string[]): MilestoneStatus => {
    const ahead = scenarioIds.filter((id) => remainingScripted.includes(id));
    if (ahead.length === 0) return "passed";
    return ahead.some((id) => level - have <= pointsBefore(id)) ? "ahead" : "outOfReach";
  };
  // Only scripted targets get a status (see the header). A level that also opens an
  // option in the unscheduled crisis shows none unless a scripted turn can still use it.
  const unlockStatus = (level: number, atLevel: UnlockTarget[]): MilestoneStatus => {
    const scripted = atLevel.filter((t) => t.scheduled).map((t) => t.scenarioId);
    const status = scripted.length > 0 ? statusFor(level, scripted) : "standing";
    return status !== "ahead" && atLevel.some((t) => !t.scheduled) ? "standing" : status;
  };

  return ([1, 2, 3] as const).map((level) => {
    const atLevel = targets.filter((t) => t.level === level);
    const authored = TRACK_MILESTONES[track].filter((m) => m.level === level);
    const milestones: Milestone[] = authored.map((m) => ({
      text: m.text,
      status:
        m.applies === "unlock" ? unlockStatus(level, atLevel)
        : m.applies === "final" && final !== undefined ? statusFor(level, [final])
        : "standing",
    }));
    // An unlock in content with no authored line still shows, in words that name no scenario.
    if (atLevel.length > 0 && !authored.some((m) => m.applies === "unlock")) {
      const unscheduled = atLevel.every((t) => !t.scheduled);
      milestones.push({
        text: unscheduled ? "Opens an option in the unscheduled crisis" : "Opens an option in a later scenario",
        status: unlockStatus(level, atLevel),
      });
    }
    return { level, reached: have >= level, next: have + 1 === level, milestones };
  });
}
