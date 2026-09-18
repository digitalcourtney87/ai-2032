import type { ReactNode } from "react";
import { Artboard } from "./Artboard";
import { ChromeBar } from "./ChromeBar";
import { StepsRail } from "./StepsRail";

export interface ShellChrome {
  turn?: number;
  totalTurns?: number;
  dateLabel?: string | null;
  seedCode?: string | null;
}

interface Props {
  chrome?: ShellChrome;
  steps: readonly string[];
  stepIndex: number;
  stepsLabel: string;
  figureId: string;
  status?: ReactNode;
  skip?: { href: string; label: string } | null;
  children: ReactNode;
}

/**
 * Chrome, a compact step index, the inspected page, and an optional status rail.
 * Desktop (`lg+`): 12rem | minmax(0,1fr) | 18rem. Below that, stacked.
 */
export function AppShell({ chrome = {}, steps, stepIndex, stepsLabel, figureId, status, skip, children }: Props) {
  const columns = status
    ? "lg:grid-cols-[12rem_minmax(0,1fr)_18rem]"
    : "lg:grid-cols-[12rem_minmax(0,1fr)]";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {skip && (
        <a href={skip.href} className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-paper focus:p-2">
          {skip.label}
        </a>
      )}
      <ChromeBar {...chrome} />
      <div className={`flex min-h-0 flex-1 flex-col lg:grid ${columns}`}>
        <StepsRail steps={steps} activeIndex={stepIndex} label={stepsLabel} />
        <Artboard figureId={figureId}>{children}</Artboard>
        {status && (
          <div className="min-w-0 border-t border-rule lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto lg:border-l lg:border-t-0">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
