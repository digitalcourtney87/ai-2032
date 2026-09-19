import { useState } from "react";
import { Button } from "../components/Button";
import { consequencesOf } from "../consequences";
import {
  backersLine, forecastRecap, remainingLine, STILL_OPEN_NOTE, stopHereNote, THINK_IT_OVER, WHAT_NEXT_NOTE, whoBacksWhat, worldLink,
} from "../copy";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  /** The live view. At the pause it already shows turn 2, so it is read only through consequencesOf and for the seed code. */
  view: DisplayedState;
  /** The snapshot taken just before turn 1 resolved. Every fact about turn 1 comes from here. */
  before: DisplayedState;
  /** The scenario played on turn 1. */
  scenario: PublicScenario;
  /** The turn and scenario just reported, as App keeps them for the news screen. */
  resolved: { turn: number; scenarioId: string };
  onContinue: () => void;
  onRestart: () => void;
}

/** Brings the Stop here panel into view as it opens, without scrolling the focused toggle off screen (400% zoom). Instant, so reduced motion holds. */
const revealPanel = (panel: HTMLElement | null) => {
  if (!panel) return;
  panel.scrollIntoView({ block: "nearest" });
  document.querySelector<HTMLElement>('[aria-controls="stop-here"]')?.scrollIntoView({ block: "nearest" });
};

/**
 * The five-minute taster (DECISIONS.md F6): a one-time pause after turn 1's consequences.
 * It is not a turn step. The choice comes first: Keep going plays on in the same game; Stop here
 * offers a link to play this world with a friend, from the start, which is not saved progress.
 * Below it: every option with its backers, then the question still open and two questions to
 * think over. The measured changes are not repeated: the consequences screen has just shown them.
 * Reads only displayed() snapshots and public content.
 */
export function FirstDecision({ view, before, scenario, resolved, onContinue, onRestart }: Props) {
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const turn = consequencesOf(before, view, resolved, pub);
  const rows = whoBacksWhat(scenario, scenario.choices, pub.advisers);
  const link = worldLink(`${window.location.origin}${window.location.pathname}`, window.location.search, view.seedCode);

  async function copyLink() {
    // No network call: the link goes to the clipboard and nowhere else (DECISIONS.md, decision 11).
    try {
      await navigator.clipboard.writeText(link);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="pause-next">
        <h2 id="pause-next" className="text-xl">What happens next</h2>
        <p className="mt-3 font-semibold">{remainingLine(pub.totalTurns, resolved.turn)}</p>
        <p className="mt-2 text-sm">{WHAT_NEXT_NOTE}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onContinue}>Keep going</Button>
          <Button
            variant="quiet"
            aria-expanded={stopping}
            aria-controls={stopping ? "stop-here" : undefined}
            onClick={() => {
              setStopping(!stopping);
              setCopied(null);
            }}
          >
            Stop here
          </Button>
        </div>
      </section>

      {stopping && (
        <section id="stop-here" ref={revealPanel} aria-labelledby="stop-here-heading" className="border border-ink p-5">
          <h2 id="stop-here-heading" className="text-xl">Play the same world as a friend</h2>
          <p className="mt-2 text-sm">{stopHereNote(view.seedCode)}</p>
          <p className="mt-3 break-all font-mono text-xs" data-testid="world-link">{link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={copyLink}>Copy link to this world</Button>
            <Button variant="quiet" onClick={onRestart}>Back to the start</Button>
          </div>
          <p className="mt-2 text-sm">Back to the start opens the title page with a new world.</p>
          <p className="mt-2 text-sm" aria-live="polite">
            {copied === "done" ? "Link copied." : copied === "failed" ? "Copying is blocked in this browser. Select the link above and copy it." : ""}
          </p>
        </section>
      )}

      <section aria-labelledby="pause-chose">
        <h2 id="pause-chose" className="text-xl">Your choice, and who backed each option</h2>
        <ul className="mt-3 space-y-3">
          {rows.map((row) => {
            const mine = row.id === turn.chose?.id;
            return (
              <li key={row.id} className={`border-l-2 pl-4 ${mine ? "border-ink" : "border-transparent"}`}>
                <span className="font-semibold">
                  Option {row.id}
                  {mine ? " (your choice)" : ""}.
                </span>{" "}
                {row.text}
                <span className="mt-0.5 block text-sm text-muted">{backersLine(row.backers)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {turn.unknown && (
        <section aria-labelledby="pause-think">
          <h2 id="pause-think" className="text-xl">Think it over</h2>
          <p className="mt-3">{turn.unknown.question}</p>
          {turn.unknown.forecast !== null && <p className="mt-1 font-semibold">{forecastRecap(turn.unknown.forecast)}</p>}
          <p className="mt-2 text-sm">{STILL_OPEN_NOTE}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {THINK_IT_OVER.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
