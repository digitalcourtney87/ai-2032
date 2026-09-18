import type { IntelReport } from "../../engine";

const SOURCE_LABEL: Record<IntelReport["source"], string> = {
  briefing: "Briefing assessment",
  purchase: "Commissioned analysis",
  reveal: "Finding delivered",
};

interface Props {
  reports: IntelReport[];
  heading?: string;
}

/** What the Director has been told about the hidden world. Any of it may be wrong. */
export function IntelFile({ reports, heading = "Intelligence file" }: Props) {
  if (reports.length === 0) return null;
  return (
    <section aria-label={heading}>
      <h3 className="text-sm font-semibold">{heading}</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {reports.map((report, index) => (
          <li key={index} className="border-l-2 border-rule pl-3">
            <span className="block text-xs uppercase tracking-wide text-muted">
              Turn {report.turn} &middot; {SOURCE_LABEL[report.source]}
            </span>
            {report.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
