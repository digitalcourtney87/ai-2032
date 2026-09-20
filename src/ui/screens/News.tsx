import { Button } from "../components/Button";
import type { TurnConsequences } from "../consequences";
import {
  ALSO_REPORTED, capacityLine, capitalLine, chosenLine, DECISION_AS_REPORTED, estimatesNowLine, FINDINGS_CAVEAT, HEADLINES_NOTE,
  investmentPointLine, LATER_NOTE, measuredCaption, measuredRowText, NOTHING_ELSE, openQuestionLine, spentLine, trackLevelsLine,
  unchangedLine, windowOpenedNote,
} from "../copy";
import { pub } from "../useGame";

interface Props {
  consequences: TurnConsequences;
  /** True after the final ADVANCE, when the debrief is waiting. */
  over: boolean;
  /** The turn that has just resolved. */
  resolvedTurn: number;
  onContinue: () => void;
}

/**
 * Step 6: consequences, in four parts in the main column: your decision, what the
 * world noticed, what you can measure now, and what is still unknown. Every figure
 * comes from the completed-turn record via `consequencesOf`. Nothing here reads
 * debrief fields even when the after-view already carries them.
 */
export function News({ consequences, over, resolvedTurn, onContinue }: Props) {
  const headlines = consequences.news;
  const changed = consequences.measured.filter((m) => m.delta !== 0);
  const unchanged = consequences.measured.filter((m) => m.delta === 0).map((m) => m.metric);
  // A window can outlast the game: never promise more turns than are left.
  const turnsLeft = pub.totalTurns - resolvedTurn;

  return (
    <div className="space-y-8">
      {consequences.chose && (
        <section aria-labelledby="news-decision">
          <h2 id="news-decision" className="text-xl">Your decision</h2>
          <p className="mt-2">{chosenLine(consequences.chose.id, consequences.chose.text)}</p>
          <p className="mt-1 text-sm text-muted">{spentLine(consequences.chose, pub.infoCost)}</p>
          {consequences.investment && <p className="mt-1 text-sm">{investmentPointLine(consequences.investment)}</p>}
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
        {consequences.findings.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Findings delivered this turn</h3>
            <ul className="mt-1 space-y-2 text-sm">
              {consequences.findings.map((finding, index) => (
                <li key={index} className="border border-rule p-3">
                  {finding.title && <span className="block font-semibold">{finding.title}</span>}
                  {finding.text}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{FINDINGS_CAVEAT}</p>
          </>
        )}
        {consequences.windowsOpened.map((w) => (
          <p key={w.domain} className="mt-3 border border-rule p-3 text-sm">
            {windowOpenedNote(w.domain, Math.min(w.turnsLeft, turnsLeft), pub.rules)}
          </p>
        ))}
      </section>

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
        {consequences.trackChanges.length > 0 && <p className="mt-2 text-sm">{trackLevelsLine(consequences.trackChanges)}</p>}
        {consequences.capacity && <p className="mt-2 text-sm">{capacityLine(consequences.capacity.before, consequences.capacity.after)}</p>}
        {consequences.capital && <p className="mt-3 text-sm">{capitalLine(consequences.capital)}</p>}
      </section>

      {consequences.unknown && (
        <section aria-labelledby="news-unknown">
          <h2 id="news-unknown" className="text-xl">Still unknown</h2>
          <p className="mt-2 text-sm">{openQuestionLine(consequences.unknown)}</p>
          <p className="mt-2 text-sm">{estimatesNowLine(consequences.estimatesNow.systemicRisk, consequences.estimatesNow.cooperation)}</p>
          <p className="mt-1 text-sm text-muted">{LATER_NOTE}</p>
        </section>
      )}

      <Button onClick={onContinue}>{over ? "Read your debrief" : "Next briefing"}</Button>
    </div>
  );
}
