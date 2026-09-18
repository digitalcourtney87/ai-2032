import { METRIC_LABEL, METRIC_MEANING, signed } from "../format";
import type { Effects, MetricKey } from "../../engine";

interface Props {
  effects: Effects;
}

/**
 * Visible metric changes as scannable chips with a direction mark. The mark is
 * neutral: a rise in Systemic Risk is not "good", so we colour nothing here and
 * leave the reading to the player.
 */
export function EffectChips({ effects }: Props) {
  const keys = (Object.keys(effects) as MetricKey[]).filter((key) => (effects[key] ?? 0) !== 0);
  if (keys.length === 0) {
    return <span className="text-sm text-muted">No immediate visible effect</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {keys.map((key) => {
        const value = effects[key] ?? 0;
        const up = value > 0;
        return (
          <span
            key={key}
            title={METRIC_MEANING[key]}
            className="inline-flex items-center gap-1 border border-rule px-1.5 py-0.5 font-mono text-xs"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
              {up ? <path d="M4 1 7 6H1z" fill="currentColor" /> : <path d="M4 7 1 2h6z" fill="currentColor" />}
            </svg>
            {METRIC_LABEL[key]} {signed(value)}
          </span>
        );
      })}
    </span>
  );
}
