import { useState } from "react";
import { Button } from "../components/Button";
import { TrackLadder } from "../components/TrackLadder";
import { LADDER_CAPTION, ladderIntro } from "../copy";
import { TRACK_LABEL, trackBonusText, TRACKS } from "../format";
import { milestonesFor } from "../preparation";
import { pub } from "../useGame";
import type { DisplayedState, Track } from "../../engine";

interface Props {
  view: DisplayedState;
  onInvest: (track: Track) => void;
}

/** Step 5: one point into one track. Tracks unlock later options, which is where preparation pays. */
export function Invest({ view, onInvest }: Props) {
  const [selected, setSelected] = useState<Track | null>(null);
  const points = pub.totalTurns - 1;                // one a turn; the final decision takes none (decision 3)
  const levels = TRACKS.length * 3;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-xl font-semibold">Standing investment</legend>
        <p className="mt-1 text-sm text-muted">{ladderIntro(points, levels, Math.min(view.turn, points))}</p>
        <p className="mt-1 text-sm text-muted">{LADDER_CAPTION}</p>
        <div className="mt-4 space-y-4">
          {TRACKS.map((track) => (
            <TrackLadder
              key={track}
              track={track}
              level={view.tracks[track]}
              bonus={trackBonusText(pub.trackBonuses[track])}
              rungs={milestonesFor(track, view, pub)}
              selected={selected === track}
              onSelect={() => setSelected(track)}
            />
          ))}
        </div>
      </fieldset>
      <Button disabled={selected === null} onClick={() => selected && onInvest(selected)}>
        {selected ? `Invest in ${TRACK_LABEL[selected]} and see what follows` : "Choose a track"}
      </Button>
    </div>
  );
}
