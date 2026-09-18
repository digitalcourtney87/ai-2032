import { SEVERITY_LABEL, SEVERITY_RANK, SEVERITY_VAR } from "../format";
import type { Severity } from "../../engine";

interface Props {
  severity: Severity;
}

/**
 * Severity as a four-step gauge and a word. The colour and the count of filled
 * steps both track the level, and the label always spells it out, so meaning
 * never rests on colour alone (spec Section 14).
 */
export function SeverityBadge({ severity }: Props) {
  const colour = `var(${SEVERITY_VAR[severity]})`;
  const filled = SEVERITY_RANK[severity];
  return (
    <span
      className="inline-flex items-center gap-2 border py-1 pl-2 pr-2.5"
      style={{
        borderColor: `color-mix(in oklab, ${colour} 45%, var(--rule))`,
        background: `color-mix(in oklab, ${colour} 10%, var(--paper))`,
      }}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className="w-1"
            style={{
              height: `${6 + step * 2}px`,
              background: step < filled ? colour : "var(--rule)",
            }}
          />
        ))}
      </span>
      <span className="font-mono text-sm font-medium">{SEVERITY_LABEL[severity]}</span>
    </span>
  );
}
