import { METRIC_LABEL, METRIC_MEANING } from "../format";
import type { Estimate } from "../../engine";

interface Props {
  metric: "systemicRisk" | "cooperation";
  estimate: Estimate;
}

/**
 * An estimated metric: a range bar with a midpoint, never a single number
 * (spec Section 14). The band narrows as State Capacity grows.
 */
export function EstimateBand({ metric, estimate }: Props) {
  const { low, mid, high } = estimate;
  const label = `${METRIC_LABEL[metric]}: estimated between ${low} and ${high}, most likely near ${mid}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span title={METRIC_MEANING[metric]}>{METRIC_LABEL[metric]}</span>
        <span className="font-mono text-muted">
          {low}&ndash;{high}
        </span>
      </div>
      <div className="relative mt-1 h-1.5 bg-rule" role="img" aria-label={label}>
        <div className="absolute h-1.5 bg-muted" style={{ left: `${low}%`, width: `${Math.max(1, high - low)}%` }} />
        <div className="absolute -top-1 h-3.5 w-px bg-ink" style={{ left: `${mid}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">Estimate. Midpoint {mid}; the true value lies somewhere in the band.</p>
    </div>
  );
}
