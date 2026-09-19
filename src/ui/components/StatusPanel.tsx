import { EstimateBand } from "./EstimateBand";
import { Icon, type IconName } from "./Icon";
import { MetricBar } from "./MetricBar";
import { capitalRulesLine } from "../copy";
import { METRIC_LABEL, METRIC_MEANING, METRIC_ORDER, TRACK_LABEL } from "../format";
import { pub } from "../useGame";
import type { DisplayedState, Track } from "../../engine";

const EXACT = ["nationalSecurity", "economy", "publicTrust", "innovation", "socialStability"] as const;
const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];
const TRACK_ICON: Record<Track, IconName> = {
  evaluation: "evaluation",
  provenance: "provenance",
  diplomacy: "diplomacy",
  defensiveCyber: "defensiveCyber",
};

interface Props {
  view: DisplayedState;
  /** The view before the last turn resolved, to show changes on the news screen. */
  before?: DisplayedState | null;
}

/** The state of the nation as the Director can see it: never the true hidden values. */
export function StatusPanel({ view, before }: Props) {
  return (
    <aside aria-label="State of the nation" className="space-y-5 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="capital" />
          Political Capital
        </h2>
        <span className="font-mono text-2xl" aria-label={`${view.politicalCapital} Political Capital`}>
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
          <span className="font-mono font-medium">{view.stateCapacity}</span>
        </div>
        <p className="text-xs text-muted">Higher State Capacity narrows the bands above and makes your evidence more reliable.</p>
      </section>

      <section aria-label="Standing investments" className="border-t border-rule pt-4">
        <h3 className="text-sm font-semibold">Standing investments</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {TRACKS.map((track) => (
            <li key={track} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Icon name={TRACK_ICON[track]} />
                {TRACK_LABEL[track]}
              </span>
              <span className="inline-flex gap-0.5" role="img" aria-label={`level ${view.tracks[track]} of 3`}>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`inline-block size-2 border border-current ${index < view.tracks[track] ? "bg-current" : "bg-transparent"}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* The meanings were only in title= tooltips, which keyboard and touch users never see. */}
      <details className="border-t border-rule pt-4 text-sm">
        <summary className="cursor-pointer py-1 font-semibold">What these measures mean</summary>
        <dl className="mt-2 space-y-2">
          <div>
            <dt className="font-semibold">Political Capital</dt>
            <dd className="text-muted">What you spend on decisions and analysis. {capitalRulesLine(pub.rules)}</dd>
          </div>
          {METRIC_ORDER.map((metric) => (
            <div key={metric}>
              <dt className="font-semibold">{METRIC_LABEL[metric]}</dt>
              <dd className="text-muted">{METRIC_MEANING[metric]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">
          The first five are known exactly. Systemic AI Risk and International Cooperation are estimates shown as a range; State Capacity is
          shown only as a label.
        </p>
      </details>
    </aside>
  );
}
