interface Props {
  turn?: number;
  totalTurns?: number;
  dateLabel?: string | null;
  seedCode?: string | null;
}

/** Tool header: product name, turn, date or “Unscheduled”, seed in mono. */
export function ChromeBar({ turn, totalTurns, dateLabel, seedCode }: Props) {
  const parts: string[] = [];
  if (turn != null && totalTurns != null) parts.push(`Turn ${turn} of ${totalTurns}`);
  if (dateLabel) parts.push(dateLabel);

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-3 py-2 lg:px-4">
      <p className="text-sm font-semibold tracking-wide">AI 2032</p>
      <p className="font-mono text-xs text-muted">
        {parts.join(" · ")}
        {seedCode && (
          <>
            {parts.length > 0 ? " · " : ""}
            Seed <span className="tracking-wider text-ink">{seedCode}</span>
          </>
        )}
      </p>
    </header>
  );
}
