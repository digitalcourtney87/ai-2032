import { Button } from "../components/Button";
import { IntelFile } from "../components/IntelFile";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** The turn that has just resolved. */
  resolvedTurn: number;
  onContinue: () => void;
}

/**
 * Step 6: consequences. Headlines report what the world noticed, which is not
 * always what happened. Hidden effects and changed odds are not shown here.
 */
export function News({ view, resolvedTurn, onContinue }: Props) {
  const findings = view.intel.filter((r) => r.turn === resolvedTurn && r.source === "reveal");
  const over = view.phase === "debrief";

  return (
    <div className="space-y-6">
      <section aria-live="polite" aria-label="Headlines">
        <h3 className="text-xl">What the world noticed</h3>
        <ul className="mt-3 space-y-3">
          {view.headlines.map((headline, index) => (
            <li key={index} className="border-l-4 border-ink pl-4 font-serif text-lg">
              {headline}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Headlines report what was noticed, which is not always what happened. The changes you can measure are shown beside this page;
          some consequences of this decision will only surface later, if at all.
        </p>
      </section>

      <IntelFile reports={findings} heading="Findings delivered this turn" />

      {view.policyWindows.length > 0 && !over && (
        <p className="rounded-sm border border-rule p-3 text-sm">
          <span className="font-semibold">A policy window is open.</span> After a public incident, restrictive options in the same area cost
          2 less Political Capital for a short time. Restriction is cheapest after the harm.
        </p>
      )}

      <Button onClick={onContinue}>{over ? "Read your debrief" : "Next briefing"}</Button>
    </div>
  );
}
