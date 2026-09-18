interface Props {
  steps: readonly string[];
  activeIndex: number;
  label: string;
}

/** Compact inspector index. The active step is an inverted label. */
export function StepsRail({ steps, activeIndex, label }: Props) {
  return (
    <nav aria-label={label} className="border-b border-rule lg:border-b-0 lg:border-r">
      <ol className="flex flex-wrap gap-1 px-3 py-2 lg:sticky lg:top-0 lg:flex-col lg:gap-0 lg:px-3 lg:py-4">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={`px-2 py-1 font-mono text-xs tracking-wide ${active ? "bg-ink text-paper" : "text-muted"}`}
            >
              <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
