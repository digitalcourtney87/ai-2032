import { METRIC_LABEL, METRIC_MEANING, signed } from "../format";
import type { MetricKey } from "../../engine";

interface Props {
  metric: MetricKey;
  value: number;
  /** Change since the last turn, shown on the news screen. */
  delta?: number;
}

/** An exactly-known metric: a number and a bar. */
export function MetricBar({ metric, value, delta }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span title={METRIC_MEANING[metric]}>{METRIC_LABEL[metric]}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{value}</span>
          {delta !== undefined && delta !== 0 && <span className="ml-1 text-muted">({signed(delta)})</span>}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-sm bg-rule" role="img" aria-label={`${METRIC_LABEL[metric]}: ${value} out of 100`}>
        <div className="h-2 rounded-sm bg-ink" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
