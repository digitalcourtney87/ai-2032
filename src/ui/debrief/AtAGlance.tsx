import { compositeSentence, DEFEND_PROMPT, leastLikelyOutcome, linkSentence, outcomeSentence, pivotalDecision, pivotSentence, standing, tagText } from "./copy";
import { Button } from "../components/Button";
import { describeConditions, PROFILE_LABEL } from "../format";
import { pub, type Rankings } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** Arrives from the worker shortly after the debrief opens. */
  rankings: Rankings | null;
  /** Opens the What if panel on this decision. */
  onTryAnother: (changeAt: number) => void;
}

/**
 * Three things a newcomer can take in before any reference panel: the world they
 * drew, the least likely thing that happened, and one decision to argue about. The
 * decision comes from the luck deltas alone, so it is there at once and does not
 * move when the soundness rankings arrive; only its tag appears later.
 */
export function AtAGlance({ view, rankings, onTryAnother }: Props) {
  const debrief = view.debrief!;
  const history = view.history ?? [];
  const pivotal = pivotalDecision(debrief);
  const record = history[pivotal];
  const luck = debrief.luck[pivotal];
  const scenario = record ? pub.scenarios[record.scenarioId] : undefined;
  const chosen = scenario?.choices.find((c) => c.id === record?.choiceId);
  const position = record ? standing(rankings?.[pivotal], record.choiceId) : null;
  const notable = leastLikelyOutcome(debrief);
  const notableRecord = notable ? history[notable.index] : undefined;
  // The odds that decision faced before and after it was made, so the link is shown with its change, never as fate.
  const notableOdds = notable?.link.kind === "event" ? notableRecord?.oddsAtTheTime.find((o) => o.eventId === notable.link.id) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Your world</h3>
        <p className="mt-1">
          You were governing a <strong>{PROFILE_LABEL[view.truth!.world.profile].toLowerCase()}</strong>.
        </p>
        <p className="mt-1 text-sm text-muted">What that meant, fact by fact, is under &ldquo;The world you were in&rdquo; below.</p>
        <p className="mt-1 text-sm">{compositeSentence(debrief.composites)}</p>
      </div>

      {notable && (
        <div>
          <h3 className="font-semibold">{notable.link.happened ? "The least likely thing that happened" : "The likeliest thing that did not happen"}</h3>
          <p className="mt-1">
            {outcomeSentence(
              notable.link.kind === "event" ? pub.eventTitles[notable.link.id] ?? notable.link.id : describeConditions(notable.link.when ?? []),
              notable.link.probability,
              notable.link.happened,
            )}
          </p>
          {notableRecord && notableOdds && (
            <p className="mt-1 text-sm text-muted">
              {linkSentence(notableRecord.turn, pub.scenarios[notableRecord.scenarioId]?.title ?? notableRecord.scenarioId, notableOdds.before, notableOdds.probability)}
            </p>
          )}
        </div>
      )}

      {record && luck && (
        <div data-testid="pivotal-decision" data-index={pivotal}>
          <h3 className="font-semibold">A decision to argue about</h3>
          <p className="mt-1">
            Turn {record.turn}, {scenario?.title}: you chose &ldquo;{chosen?.text ?? record.choiceId}&rdquo;.
          </p>
          {position && <p className="mt-1 font-mono text-lg">{tagText(position, luck.fortunate)}</p>}
          <p className="mt-1 text-sm">{pivotSentence(luck.delta)}</p>
          <p className="mt-3 font-semibold">{DEFEND_PROMPT}</p>
          <Button variant="quiet" className="mt-3" onClick={() => onTryAnother(pivotal)}>
            Try a different choice here
          </Button>
        </div>
      )}
    </div>
  );
}
