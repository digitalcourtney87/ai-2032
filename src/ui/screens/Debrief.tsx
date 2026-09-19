import { useEffect, useRef, useState } from "react";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { runSummary, runSummaryText, TEASER } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { Panel } from "../debrief/Panel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { sectionNumber, type DebriefSectionId } from "../debrief/sections";
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

/** A section's anchor and its number in the reading order. */
const section = (id: DebriefSectionId) => ({ id, number: sectionNumber(id) });

/**
 * The debrief separates what the player decided from what the dice delivered
 * (spec Section 11). The six panels come in the order of DECISIONS.md section F: what
 * the player can try first, the reference panels closed until wanted, then sharing.
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
    <div className="space-y-8" data-testid="debrief">
      <header>
        {mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">October 2032 &middot; Your record</p>
        <h1 ref={heading} tabIndex={-1} className="mt-2 text-4xl outline-none">{ending?.title}</h1>
        <p className="mt-6 text-lg">{ending?.text}</p>
        {debrief.backlash && <p className="mt-4">{pub.backlashText}</p>}
        <p className="mt-4 text-sm text-muted">
          What follows separates what you decided from what the dice delivered. Every simulated number is the output of this game&rsquo;s
          assumptions, which you can inspect, and none of it is a finding about the real world.
        </p>
      </header>

      <Panel {...section("panel-what-if")} title="What if you had chosen differently?">
        <WhatIfPanel view={view} whatIf={whatIf} />
      </Panel>
      <Panel {...section("panel-quality")} title="Decision quality versus luck">
        <QualityPanel view={view} rankings={rankings} />
      </Panel>
      <Panel {...section("panel-world")} title="The world you were in" collapsible defaultOpen={false} teaser={TEASER.world}>
        <WorldPanel view={view} />
      </Panel>
      <Panel {...section("panel-calibration")} title="Calibration: how close were your forecasts?" collapsible defaultOpen={false} teaser={TEASER.calibration}>
        <CalibrationPanel view={view} />
      </Panel>
      <Panel {...section("panel-record")} title="Governance record" collapsible defaultOpen={false} teaser={TEASER.record}>
        <RecordPanel view={view} />
      </Panel>
      <Panel {...section("panel-unseen")} title="What you never saw" collapsible defaultOpen={false} teaser={TEASER.unseen}>
        <NeverSawPanel view={view} />
      </Panel>

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
