import { Button } from "../components/Button";
import { pub } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  onRestart: () => void;
}

/**
 * The end of the run. Phase 4 shows the ending and the seed code; the six debrief
 * panels of spec Section 11 (world reveal, calibration, quality versus luck,
 * governance record, what you never saw, what if) arrive in Phase 6.
 */
export function Debrief({ view, onRestart }: Props) {
  const debrief = view.debrief;
  if (!debrief) return null;
  const ending = pub.endings[debrief.endingId];

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm uppercase tracking-widest text-muted">October 2032 &middot; Your record</p>
      <h1 className="mt-2 text-4xl">{ending?.title}</h1>
      <p className="mt-6 text-lg">{ending?.text}</p>
      {debrief.backlash && <p className="mt-4">{pub.backlashText}</p>}

      <p className="mt-8 rounded-sm border border-rule p-4 text-sm">
        The full debrief (the world you were in, your calibration, decision quality separated from luck, and what-if reruns) is under
        construction.
      </p>

      <p className="mt-6 text-sm text-muted">
        Seed code <span className="font-semibold tracking-wider text-ink">{view.seedCode}</span>. Anyone who enters it plays the same world.
      </p>
      <Button className="mt-6" onClick={onRestart}>
        Play again
      </Button>
    </main>
  );
}
