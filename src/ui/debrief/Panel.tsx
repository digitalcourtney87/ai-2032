import { useState, type ReactNode } from "react";
import type { DebriefSectionId } from "./sections";

interface Props {
  /** The section's anchor, from DEBRIEF_SECTIONS. */
  id: DebriefSectionId;
  number: number;
  title: string;
  /** A reference panel the player opens when they want it. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** One line shown under the heading while the panel is closed. */
  teaser?: string;
  children: ReactNode;
}

/**
 * One debrief section. A collapsible panel follows the WAI accordion pattern: the
 * heading holds a button that says whether it is expanded and which region it
 * controls. A closed panel renders nothing inside that region, so a chart never
 * measures a hidden box and an accessibility scan sees only what is on screen.
 */
export function Panel({ id, number, title, collapsible = false, defaultOpen = true, teaser, children }: Props) {
  const [open, setOpen] = useState(!collapsible || defaultOpen);
  const bodyId = `${id}-body`;
  const label = (
    <>
      <span className="font-mono text-muted">{number}.</span> {title}
    </>
  );

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-4 border-t border-rule pt-6">
      <h2 id={`${id}-heading`} className="text-2xl">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((was) => !was)}
            className="flex min-h-11 w-full items-baseline justify-between gap-4 text-left"
          >
            <span>{label}</span>
            <span aria-hidden="true" className="shrink-0 font-mono text-base text-muted">
              {open ? "−" : "+"}
            </span>
          </button>
        ) : (
          label
        )}
      </h2>
      {!open && teaser && <p className="mt-1 text-sm text-muted">{teaser}</p>}
      <div id={bodyId} hidden={!open} className="mt-3">
        {open && children}
      </div>
    </section>
  );
}
