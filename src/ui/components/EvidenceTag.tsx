import { Icon } from "./Icon";
import { EVIDENCE_LABEL, EVIDENCE_MEANING, SEVERITY_LABEL } from "../format";
import type { EvidenceStrength, Severity } from "../../engine";

interface Props {
  evidence: EvidenceStrength;
  severity: Severity;
  /** Crisis turns show the ratings without their explanations: there is no time to weigh them. */
  reduced?: boolean;
}

/**
 * Evidence and severity as text labels in a fixed position, never colour alone
 * (spec Section 14). Rated separately, so a briefing can read "Catastrophic, Weak".
 */
export function EvidenceTag({ evidence, severity, reduced = false }: Props) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 border-y border-rule py-3 text-sm">
      <div>
        <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          <Icon name="evidence" />
          Evidence
        </dt>
        <dd className="font-mono font-medium">{EVIDENCE_LABEL[evidence]}</dd>
        {!reduced && <dd className="text-xs text-muted">{EVIDENCE_MEANING[evidence]}</dd>}
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Severity if it goes wrong</dt>
        <dd className="font-mono font-medium">{SEVERITY_LABEL[severity]}</dd>
      </div>
    </dl>
  );
}
