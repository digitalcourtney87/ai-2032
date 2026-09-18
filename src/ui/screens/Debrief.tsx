import { useEffect, useRef, useState, type ReactNode } from "react";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { runSummary, runSummaryText } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { WhatIfPanel } from "../debrief/WhatIfPanel";
import { WorldPanel } from "../debrief/WorldPanel";
import { pub, type Rankings, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  rankings: Rankings | null;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
  onRestart: () => void;
}

function Panel({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`panel-${number}`} className="border-t border-rule pt-6">
      <h2 id={`panel-${number}`} className="text-2xl">
        <span className="font-mono text-muted">{number}.</span> {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * The debrief separates what the player decided from what the dice delivered
 * (spec Section 11). Six panels, then a run summary the player may choose to share.
 */
export function Debrief({ view, rankings, whatIf, onRestart }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<"text" | "json" | null>(null);
  const [showJson, setShowJson] = useState(false);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);

  const debrief = view.debrief;
  if (!debrief || !view.truth) return null;
  const ending = pub.endings[debrief.endingId];
  const summary = runSummary(view, (id) => pub.scenarios[id]?.title ?? id, ending?.title ?? debrief.endingId);
  const summaryText = showJson ? JSON.stringify(summary, null, 2) : runSummaryText(summary);
  const mark = ENDING_PLATES[debrief.endingId];

  async function copy() {
    // No network call: the summary goes to the clipboard and nowhere else (DECISIONS.md, decision 11).
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(showJson ? "json" : "text");
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        {mark && <Figure src={mark.src} figure={mark.figure} caption={mark.caption} state="48mm" className="mb-6 max-w-[12rem]" />}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">October 2032 &middot; Your record</p>
        <h1 ref={heading} tabIndex={-1} className="mt-2 text-4xl outline-none">{ending?.title}</h1>
        <p className="mt-6 text-lg">{ending?.text}</p>
        {debrief.backlash && <p className="mt-4">{pub.backlashText}</p>}
        <p className="mt-4 text-sm text-muted">
          What follows separates what you decided from what the dice delivered. Every simulated number is the output of this game&rsquo;s
          assumptions, which you can inspect, and none of it is a finding about the real world.
        </p>
      </header>

      <Panel number={1} title="The world you were in"><WorldPanel view={view} /></Panel>
      <Panel number={2} title="Calibration"><CalibrationPanel view={view} /></Panel>
      <Panel number={3} title="Decision quality versus luck"><QualityPanel view={view} rankings={rankings} /></Panel>
      <Panel number={4} title="Governance record"><RecordPanel view={view} /></Panel>
      <Panel number={5} title="What you never saw"><NeverSawPanel view={view} /></Panel>
      <Panel number={6} title="What if"><WhatIfPanel view={view} whatIf={whatIf} /></Panel>

      <section aria-labelledby="share" className="border-t border-rule pt-6">
        <h2 id="share" className="text-2xl">Your run summary</h2>
        <p className="mt-2 text-sm text-muted">
          Nothing about your run has been sent anywhere. If a facilitator has asked for your run, copy this and paste it to them. Anyone who
          enters seed code <span className="font-mono font-medium tracking-wider text-ink">{view.seedCode}</span> plays the same world and faces the same dice.
        </p>
        <pre className="mt-3 max-h-64 overflow-auto border border-rule bg-canvas p-3 font-mono text-xs" tabIndex={0} aria-label="Run summary">{summaryText}</pre>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button onClick={copy}>Copy run summary</Button>
          <Button variant="quiet" onClick={() => { setShowJson(!showJson); setCopied(null); }}>{showJson ? "Show as text" : "Show as JSON"}</Button>
          <Button variant="quiet" onClick={onRestart}>Play again</Button>
        </div>
        <p className="mt-2 text-sm" aria-live="polite">{copied ? `Copied as ${copied === "json" ? "JSON" : "text"}.` : ""}</p>
      </section>
    </div>
  );
}
