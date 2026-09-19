import type { IntelReport } from "../../engine";

const SOURCE_LABEL: Record<IntelReport["source"], string> = {
  briefing: "Briefing assessment",
  purchase: "Commissioned analysis",
  reveal: "Finding delivered",
};

interface Props {
  reports: IntelReport[];
  heading?: string;
  /** Fold the file behind a summary that counts the reports. The briefing's file grows every turn; the news screen's stays open. */
  collapsible?: boolean;
}

/** What the Director has been told about the hidden world. Any of it may be wrong. */
export function IntelFile({ reports, heading = "Intelligence file", collapsible = false }: Props) {
  if (reports.length === 0) return null;
  const list = (
    <ul className="mt-2 space-y-2 text-sm">
      {reports.map((report, index) => (
        <li key={index} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">
          <span className="block font-mono text-xs uppercase tracking-wider text-muted">
            Turn {report.turn} &middot; {SOURCE_LABEL[report.source]}
          </span>
          {report.text}
        </li>
      ))}
    </ul>
  );

  if (collapsible) {
    const count = `${reports.length} ${reports.length === 1 ? "report" : "reports"}`;
    return (
      <details className="border border-rule p-3">
        <summary className="cursor-pointer py-1 text-sm font-semibold">
          {heading} ({count})
        </summary>
        {list}
      </details>
    );
  }
  return (
    <section aria-label={heading} className="border border-rule p-3">
      <h2 className="text-sm font-semibold">{heading}</h2>
      {list}
    </section>
  );
}
