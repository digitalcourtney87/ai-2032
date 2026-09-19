import { Button } from "../components/Button";
import { consequencesOf } from "../consequences";
import {
  ALSO_REPORTED, capacityLine, capitalLine, chosenLine, DECISION_AS_REPORTED, estimatesNowLine, FINDINGS_CAVEAT, HEADLINES_NOTE,
  investmentPointLine, LATER_NOTE, measuredCaption, measuredRowText, NOTHING_ELSE, openQuestionLine, spentLine, trackLevelsLine,
  unchangedLine, windowOpenedNote,
} from "../copy";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** The view captured just before the turn resolved. */
  before: DisplayedState | null;
  /** The scenario whose turn has just resolved. */
  scenario: PublicScenario;
  /** The turn that has just resolved. */
  resolvedTurn: number;
  onContinue: () => void;
}

/**
 * Step 6: consequences, in four parts in the main column: your decision, what the
 * world noticed, what you can measure now, and what is still unknown. Every figure
 * comes from `consequencesOf`, which reads only displayed states and public content.
 * On the final turn `view` already carries the debrief; nothing here reads it.
 */
export function News({ view, before, scenario, resolvedTurn, onContinue }: Props) {
  const over = view.phase === "debrief";
  const turn = before ? consequencesOf(before, view, { turn: resolvedTurn, scenarioId: scenario.id }, pub) : null;
  const headlines = turn ? turn.news : { decision: view.headlines[0] ?? null, elsewhere: view.headlines.slice(1) };
  const changed = turn ? turn.measured.filter((m) => m.delta !== 0) : [];
  const unchanged = turn ? turn.measured.filter((m) => m.delta === 0).map((m) => m.metric) : [];
  // A window can outlast the game: never promise more turns than are left.
  const turnsLeft = pub.totalTurns - resolvedTurn;

  return (
    <div className="space-y-8">
      {turn?.chose && (
        <section aria-labelledby="news-decision">
          <h2 id="news-decision" className="text-xl">Your decision</h2>
          <p className="mt-2">{chosenLine(turn.chose.id, turn.chose.text)}</p>
          <p className="mt-1 text-sm text-muted">{spentLine(turn.chose, pub.infoCost)}</p>
          {turn.investment && <p className="mt-1 text-sm">{investmentPointLine(turn.investment)}</p>}
        </section>
      )}

      <section aria-labelledby="news-noticed">
        <h2 id="news-noticed" className="text-xl">What the world noticed</h2>
        <div aria-live="polite">
          {headlines.decision && (
            <>
              <h3 className="mt-3 text-sm font-semibold">{DECISION_AS_REPORTED}</h3>
              <p className="mt-1 border-l-2 border-ink pl-4 text-lg">{headlines.decision}</p>
            </>
          )}
          <h3 className="mt-4 text-sm font-semibold">{ALSO_REPORTED}</h3>
          {headlines.elsewhere.length > 0 ? (
            <ul className="mt-1 space-y-3">
              {headlines.elsewhere.map((headline, index) => (
                <li key={index} className="border-l-2 border-ink pl-4 text-lg">
                  {headline}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm">{NOTHING_ELSE}</p>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">{HEADLINES_NOTE}</p>
        {turn && turn.findings.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Findings delivered this turn</h3>
            <ul className="mt-1 space-y-2 text-sm">
              {turn.findings.map((finding, index) => (
                <li key={index} className="border border-rule p-3">
                  {finding.title && <span className="block font-semibold">{finding.title}</span>}
                  {finding.text}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{FINDINGS_CAVEAT}</p>
          </>
        )}
        {turn?.windowsOpened.map((w) => (
          <p key={w.domain} className="mt-3 border border-rule p-3 text-sm">
            {windowOpenedNote(w.domain, Math.min(w.turnsLeft, turnsLeft), pub.rules)}
          </p>
        ))}
      </section>

      {turn && (
        <section aria-labelledby="news-measured">
          <h2 id="news-measured" className="text-xl">What you can measure now</h2>
          <p className="mt-2 text-sm text-muted">{measuredCaption(over)}</p>
          {changed.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono text-sm">
              {changed.map((row) => (
                <li key={row.metric}>{measuredRowText(row)}</li>
              ))}
            </ul>
          )}
          {unchanged.length > 0 && <p className="mt-1 text-sm">{unchangedLine(unchanged)}</p>}
          {turn.trackChanges.length > 0 && <p className="mt-2 text-sm">{trackLevelsLine(turn.trackChanges)}</p>}
          {turn.capacity && <p className="mt-2 text-sm">{capacityLine(turn.capacity.before, turn.capacity.after)}</p>}
          {turn.capital && <p className="mt-3 text-sm">{capitalLine(turn.capital)}</p>}
        </section>
      )}

      {turn?.unknown && (
        <section aria-labelledby="news-unknown">
          <h2 id="news-unknown" className="text-xl">Still unknown</h2>
          <p className="mt-2 text-sm">{openQuestionLine(turn.unknown)}</p>
          <p className="mt-2 text-sm">{estimatesNowLine(turn.estimatesNow.systemicRisk, turn.estimatesNow.cooperation)}</p>
          <p className="mt-1 text-sm text-muted">{LATER_NOTE}</p>
        </section>
      )}

      <Button onClick={onContinue}>{over ? "Read your debrief" : "Next briefing"}</Button>
    </div>
  );
}
