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
    <section aria-label={heading} className="border border-rule p-3">
      <h2 className="text-sm font-semibold">{heading}</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {reports.map((report, index) => (
          <li key={index} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
              Turn {report.turn} &middot; {SOURCE_LABEL[report.source]}
            </span>
            {report.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
