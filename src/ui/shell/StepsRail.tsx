import type { MouseEvent } from "react";

interface Props {
  steps: readonly string[];
  activeIndex: number;
  label: string;
  /** Anchors by step index. A step with one becomes a link, unless it is the current step. */
  hrefs?: readonly string[];
}

/**
 * A rail link to a folded <details> unfolds it, scrolls to it and moves focus to its summary.
 * A link to a closed debrief panel (debrief/Panel.tsx) opens it through its own toggle, and the
 * browser then follows the link. This also works when the URL already carries that hash.
 */
function unfold(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (target instanceof HTMLDetailsElement) {
    event.preventDefault();
    target.open = true;
    target.scrollIntoView({ block: "start" });
    target.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
    return;
  }
  target?.querySelector<HTMLButtonElement>(':scope > h2 > button[aria-expanded="false"]')?.click();
}

/** Compact inspector index. The active step is an inverted label; a step with an anchor is a link to it. */
export function StepsRail({ steps, activeIndex, label, hrefs }: Props) {
  return (
    <nav aria-label={label} className="border-b border-rule lg:border-b-0 lg:border-r">
      <ol className="flex flex-wrap gap-1 px-3 py-2 lg:sticky lg:top-0 lg:flex-col lg:gap-0 lg:px-3 lg:py-4">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const href = active ? undefined : hrefs?.[index];
          const text = (
            <>
              <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {step}
            </>
          );
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={`font-mono text-xs tracking-wide ${active ? "bg-ink px-2 py-1 text-paper" : href ? "" : "px-2 py-1 text-muted"}`}
            >
              {href ? (
                // min-h-6: at least 24px tall, the WCAG 2.2 target size.
                <a href={href} onClick={unfold} className="inline-flex min-h-6 items-center px-2 text-accent underline">
                  {text}
                </a>
              ) : (
                text
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
