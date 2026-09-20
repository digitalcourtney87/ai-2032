import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { worldLink } from "../copy";
import { AtAGlance } from "../debrief/AtAGlance";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { pivotalDecision, runSummary, runSummaryText, TEASER } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { Panel } from "../debrief/Panel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { sectionNumber, type DebriefSectionId } from "../debrief/sections";
import { TalkItOver } from "../debrief/TalkItOver";
import { WhatIfPanel } from "../debrief/WhatIfPanel";
import { WorldPanel } from "../debrief/WorldPanel";
import { overrideCount, pub, type SoundnessState, type UnaffordableAt, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  soundness: SoundnessState;
  onRetrySoundness: () => void;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
  unaffordable: UnaffordableAt[];
  onRestart: () => void;
}

/** A section's anchor and its number in the reading order. */
const section = (id: DebriefSectionId) => ({ id, number: sectionNumber(id) });

/**
 * The debrief separates what the player decided from what the dice delivered
 * (spec Section 11). The six panels come in the order of DECISIONS.md section F: what
 * the player can try first, the reference panels closed until wanted, then sharing.
 */
export function Debrief({ view, soundness, onRetrySoundness, whatIf, unaffordable, onRestart }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<"text" | "json" | "link" | "link-failed" | null>(null);
  const [showJson, setShowJson] = useState(false);
  // The decision the What if panel changes. It opens on the decision to argue about, the same one on every replay of this run.
  const [whatIfAt, setWhatIfAt] = useState(() => (view.debrief ? pivotalDecision(view.debrief) : 0));
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);

  const debrief = view.debrief;
  if (!debrief || !view.truth) return null;
  const ending = pub.endings[debrief.endingId];
  const summary = runSummary(view, (id) => pub.scenarios[id]?.title ?? id, ending?.title ?? debrief.endingId);
  const summaryText = showJson ? JSON.stringify(summary, null, 2) : runSummaryText(summary);
  const mark = ENDING_PLATES[debrief.endingId];
  // The seed and any facilitator edits, and nothing about how this run went.
  const link = worldLink(window.location.origin + window.location.pathname, window.location.search, view.seedCode);

  async function copy() {
    // No network call: the summary goes to the clipboard and nowhere else (DECISIONS.md, decision 11).
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(showJson ? "json" : "text");
    } catch {
      setCopied(null);
    }
  }

  async function copyLink() {
    // Also clipboard only. The link is shown on the page too, so a blocked clipboard still leaves a way to take it.
    try {
      await navigator.clipboard.writeText(link);
      setCopied("link");
    } catch {
      setCopied("link-failed");
    }
  }

  /** "Try a different choice here": open the what-if on that decision and go straight to the alternative. */
  function tryAnother(index: number) {
    // Render the new decision's alternatives before focus lands, so a screen reader announces the right option.
    flushSync(() => setWhatIfAt(index));
    const select = document.getElementById("what-if-option");
    if (!select) return;
    select.focus({ preventScroll: true });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    select.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
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

      <Panel {...section("panel-at-a-glance")} title="At a glance">
        <AtAGlance view={view} soundness={soundness} onTryAnother={tryAnother} />
      </Panel>
      <Panel {...section("panel-what-if")} title="What if you had chosen differently?">
        <WhatIfPanel view={view} whatIf={whatIf} unaffordable={unaffordable} changeAt={whatIfAt} onChangeAt={setWhatIfAt} />
      </Panel>
      <Panel {...section("panel-quality")} title="Decision quality versus luck">
        <QualityPanel view={view} soundness={soundness} onRetry={onRetrySoundness} />
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

      <Panel {...section("panel-talk")} title="Talk it over">
        <TalkItOver />
      </Panel>

      <Panel {...section("panel-share")} title="Share your run">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold">Play the same world as a friend</h3>
            <p className="mt-1 text-sm">
              {/* With a facilitator's edits the world is drawn from the edited odds, which only the link carries, so the code alone is not enough. */}
              Anyone who opens this link
              {overrideCount === 0 && (
                <>
                  , or enters seed code <span className="font-mono font-medium tracking-wider text-ink">{view.seedCode}</span>,
                </>
              )}{" "}
              plays the same world and faces the same dice. The link says nothing about how your run went, so they start fresh. If you play it
              again yourself, you will know what is coming.
            </p>
            <p className="mt-2 break-all font-mono text-xs" data-testid="world-link">{link}</p>
            <Button className="mt-3" onClick={copyLink}>Copy link to this world</Button>
          </div>
          <div>
            <h3 className="font-semibold">Your run summary</h3>
            <p className="mt-1 text-sm text-muted">
              Nothing about your run has been sent anywhere. The summary lists every decision and how this world turned out, so it gives the
              world away: share it with someone who has already played it, or keep it to compare notes.
            </p>
            <pre className="mt-3 max-h-64 overflow-auto border border-rule bg-canvas p-3 font-mono text-xs" tabIndex={0} aria-label="Run summary">{summaryText}</pre>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button onClick={copy}>Copy run summary</Button>
              <Button variant="quiet" onClick={() => { setShowJson(!showJson); setCopied(null); }}>{showJson ? "Show as text" : "Show as JSON"}</Button>
            </div>
          </div>
          <p className="text-sm" aria-live="polite">
            {copied === "link"
              ? "Link to this world copied."
              : copied === "link-failed"
                ? "Copying is blocked in this browser. Select the link above and copy it."
                : copied ? `Copied as ${copied === "json" ? "JSON" : "text"}.` : ""}
          </p>
          <Button variant="quiet" onClick={onRestart}>Play a new world</Button>
        </div>
      </Panel>
    </div>
  );
}
