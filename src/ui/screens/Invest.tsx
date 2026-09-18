import { useState } from "react";
import { Button } from "../components/Button";
import { TRACK_DETAIL, TRACK_LABEL } from "../format";
import type { DisplayedState, Track } from "../../engine";

const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

interface Props {
  view: DisplayedState;
  onInvest: (track: Track) => void;
}

/** Step 5: one point into one track. Tracks unlock later options, which is where preparation pays. */
export function Invest({ view, onInvest }: Props) {
  const [selected, setSelected] = useState<Track | null>(null);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-xl font-serif">Standing investment</legend>
        <p className="mt-1 text-sm text-muted">
          One point, every turn, into one track. It costs no Political Capital. You have seven points in the whole game and twelve levels to
          fill, so you cannot prepare for everything.
        </p>
        <div className="mt-4 space-y-3">
          {TRACKS.map((track) => {
            const level = view.tracks[track];
            const full = level >= 3;
            const inputId = `track-${track}`;
            return (
              <div key={track} className={`rounded-sm border p-4 ${selected === track ? "border-accent bg-panel" : "border-rule"} ${full ? "opacity-60" : ""}`}>
                <div className="flex gap-3">
                  <input
                    id={inputId}
                    type="radio"
                    name="track"
                    className="mt-1.5 size-4 accent-(--accent)"
                    checked={selected === track}
                    disabled={full}
                    onChange={() => setSelected(track)}
                    aria-describedby={`${inputId}-detail`}
                  />
                  <div>
                    <label htmlFor={inputId} className="font-semibold">
                      {TRACK_LABEL[track]} <span className="font-normal text-muted">&middot; level {level} of 3</span>
                    </label>
                    <div id={`${inputId}-detail`} className="mt-1 text-sm">
                      <p>{TRACK_DETAIL[track].perLevel}</p>
                      <ul className="text-muted">
                        {TRACK_DETAIL[track].unlocks.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
      <Button disabled={selected === null} onClick={() => selected && onInvest(selected)}>
        {selected ? `Invest in ${TRACK_LABEL[selected]} and see what follows` : "Choose a track"}
      </Button>
    </div>
  );
}
