import type { ReactNode } from "react";

interface Props {
  figureId: string;
  children: ReactNode;
}

/** Grey canvas, centred page with a 1px rule and dimension ticks. */
export function Artboard({ figureId, children }: Props) {
  return (
    <main id="main" className="min-w-0 bg-canvas px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
      <div className="relative mx-auto max-w-3xl bg-paper">
        <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-ink" aria-hidden="true" />
        <div className="border border-rule">
          <p className="border-b border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{figureId}</p>
          <div className="px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
