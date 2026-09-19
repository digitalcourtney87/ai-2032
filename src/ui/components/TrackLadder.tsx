import { Icon, type IconName } from "./Icon";
import { MILESTONE_STATUS, thisTurnLine, TRACK_COMPLETE } from "../copy";
import { TRACK_LABEL } from "../format";
import type { Rung } from "../preparation";
import type { Track, TrackLevel } from "../../engine";

const TRACK_ICON: Record<Track, IconName> = {
  evaluation: "evaluation",
  provenance: "provenance",
  diplomacy: "diplomacy",
  defensiveCyber: "defensiveCyber",
};

interface Props {
  track: Track;
  level: TrackLevel;
  /** What each level adds once, when reached: "State Capacity +4". */
  bonus: string;
  rungs: Rung[];
  selected: boolean;
  onSelect: () => void;
}

/**
 * One standing-investment track as a ladder of three rungs. Deliberately unlike the
 * policy cards: no inverted card, the per-level bonus stated once, a rail of rungs that
 * fill as levels are reached, and the rung this turn would reach outlined and spelt out
 * when the track is selected.
 * The radio's accessible name starts with the track label (e2e/play.ts relies on it).
 */
export function TrackLadder({ track, level, bonus, rungs, selected, onSelect }: Props) {
  const full = level >= 3;
  const inputId = `track-${track}`;
  return (
    <div className={`border-l-4 py-1 pl-3 ${selected ? "border-ink" : "border-rule"}`}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="radio"
          name="track"
          className="mt-1.5 size-4 accent-current"
          checked={selected}
          disabled={full}
          onChange={onSelect}
          aria-describedby={`${inputId}-bonus ${inputId}-ladder`}
        />
        <label htmlFor={inputId} className="font-semibold">
          <Icon name={TRACK_ICON[track]} className="mr-1" />
          {TRACK_LABEL[track]} <span className="whitespace-nowrap font-mono font-normal text-muted">&middot; level {level} of 3</span>
        </label>
      </div>
      <p id={`${inputId}-bonus`} className="ml-7 mt-1 text-sm">
        Bonus per level: {bonus}
      </p>
      {/* No aria-label here: the radio's description is this list's text, and an aria-label would replace all of it. */}
      <ol id={`${inputId}-ladder`} className="ml-7 mt-2 space-y-1 text-sm">
        {rungs.map((rung) => {
          const target = selected && rung.next;
          return (
            <li key={rung.level} className={`flex gap-2 border px-2 py-1 ${target ? "border-dashed border-ink" : "border-transparent"}`}>
              <span aria-hidden="true" className={`mt-1 inline-block size-3 shrink-0 border border-current ${rung.reached ? "bg-current" : ""}`} />
              <div className="min-w-0">
                <span className="font-mono">Level {rung.level}</span>
                {rung.reached && <span className="text-muted"> (reached)</span>}
                {rung.milestones.map((milestone) => (
                  <span key={milestone.text} className="block">
                    <Icon name={rung.reached ? "unlock" : "lock"} className="mr-1" />
                    {milestone.text}
                    {MILESTONE_STATUS[milestone.status] && <span className="text-muted"> ({MILESTONE_STATUS[milestone.status]})</span>}
                  </span>
                ))}
                {target && <span className="block font-semibold">{thisTurnLine(level)}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {full && <p className="ml-7 mt-1 text-sm">{TRACK_COMPLETE}</p>}
    </div>
  );
}
