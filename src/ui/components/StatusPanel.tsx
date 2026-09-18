import { EstimateBand } from "./EstimateBand";
import { MetricBar } from "./MetricBar";
import { METRIC_MEANING, TRACK_LABEL } from "../format";
import type { DisplayedState, Track } from "../../engine";

const EXACT = ["nationalSecurity", "economy", "publicTrust", "innovation", "socialStability"] as const;
const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

interface Props {
  view: DisplayedState;
  /** The view before the last turn resolved, to show changes on the news screen. */
  before?: DisplayedState | null;
}

/** The state of the nation as the Director can see it: never the true hidden values. */
export function StatusPanel({ view, before }: Props) {
  return (
    <aside aria-label="State of the nation" className="space-y-5 rounded-sm border border-rule bg-panel p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg">Political Capital</h2>
        <span className="text-2xl font-semibold tabular-nums" aria-label={`${view.politicalCapital} Political Capital`}>
          {view.politicalCapital}
        </span>
      </div>

      <section aria-label="Metrics known exactly" className="space-y-3">
        {EXACT.map((metric) => (
          <MetricBar key={metric} metric={metric} value={view.exact[metric]} delta={before ? view.exact[metric] - before.exact[metric] : undefined} />
        ))}
      </section>

      <section aria-label="Estimated metrics" className="space-y-3 border-t border-rule pt-4">
        <EstimateBand metric="systemicRisk" estimate={view.estimates.systemicRisk} />
        <EstimateBand metric="cooperation" estimate={view.estimates.cooperation} />
        <div className="flex items-baseline justify-between text-sm">
          <span title={METRIC_MEANING.stateCapacity}>State Capacity</span>
          <span className="font-semibold">{view.stateCapacity}</span>
        </div>
        <p className="text-xs text-muted">Higher State Capacity narrows the bands above and makes your evidence more reliable.</p>
      </section>

      <section aria-label="Standing investments" className="border-t border-rule pt-4">
        <h3 className="text-sm font-semibold">Standing investments</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {TRACKS.map((track) => (
            <li key={track} className="flex justify-between">
              <span>{TRACK_LABEL[track]}</span>
              <span className="tabular-nums" aria-label={`level ${view.tracks[track]} of 3`}>
                {"■".repeat(view.tracks[track])}
                {"□".repeat(3 - view.tracks[track])}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
