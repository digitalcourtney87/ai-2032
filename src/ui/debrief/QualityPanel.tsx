import { causalSentence, outcomeSentence, SOUNDNESS_RETRY, SOUNDNESS_UNAVAILABLE, SOUNDNESS_WEIGHING, soundSentence, standing, tagText, tallySentence } from "./copy";
import { Button } from "../components/Button";
import { describeConditions } from "../format";
import { pub, type SoundnessState } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  soundness: SoundnessState;
  onRetry: () => void;
}

/**
 * Decision quality separated from luck. For each decision: what was chosen, its
 * tag and how the option ranked, with the odds at the time and the outcomes drawn
 * one click away. The game never says a decision was right or wrong; it says how
 * the option ranked and how the dice fell.
 */
export function QualityPanel({ view, soundness, onRetry }: Props) {
  const debrief = view.debrief!;
  const history = view.history ?? [];
  const failed = soundness.status === "error";
  const rankings = soundness.status === "ready" ? soundness.rankings : null;
  const positions = history.map((record, index) => standing(rankings?.[index], record.choiceId));
  const tags = positions.flatMap((position, index) => (position ? [tagText(position, debrief.luck[index]!.fortunate)] : []));
  const status = failed ? SOUNDNESS_UNAVAILABLE : rankings ? "" : SOUNDNESS_WEIGHING;

  return (
    <div className="space-y-4">
      <p>
        A decision is <strong>sound</strong> if it was among the two strongest options on what you could have known at the time, and{" "}
        <strong>risky</strong> otherwise. It was <strong>fortunate</strong> or <strong>unlucky</strong> according to how the chance events tied
        to it fell against their odds. A sound decision can end badly, and a risky one can be rescued by luck.
      </p>
      <ol className="space-y-5">
        {history.map((record, index) => {
          const scenario = pub.scenarios[record.scenarioId];
          const luck = debrief.luck[index]!;
          const position = positions[index];
          const chosen = scenario?.choices.find((c) => c.id === record.choiceId);
          const causes = record.oddsAtTheTime.filter((o) => Math.round(o.before * 100) !== Math.round(o.probability * 100));
          return (
            <li key={record.turn} className="border-l-2 border-rule pl-4" data-testid="decision-review">
              <h3 className="font-semibold">{chosen?.text ?? `Option ${record.choiceId}`}</h3>
              <p className="text-sm text-muted">
                Turn {record.turn}, {scenario?.title}: option {record.choiceId}
              </p>
              {position && (
                <p className="mt-1 font-mono text-lg" data-testid="luck-tag">
                  {tagText(position, luck.fortunate)}
                </p>
              )}
              {!position && !failed && (
                <p className="mt-1 font-mono text-lg" data-testid="luck-tag">{SOUNDNESS_WEIGHING}</p>
              )}
              {!record.succeeded && <p className="text-sm">The option did not take effect: its conditions were not met, and the cost was still paid.</p>}
              {position && <p className="mt-1 text-sm">{soundSentence(position.sound, position.rank, position.of)}</p>}
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer py-1 font-semibold">
                  Why this tag<span className="sr-only">: turn {record.turn}</span>
                </summary>
                <ul className="mt-1 space-y-1">
                  {causes.map((o) => (
                    <li key={`cause-${o.eventId}`}>{causalSentence(pub.eventTitles[o.eventId] ?? o.eventId, o.before, o.probability)}</li>
                  ))}
                  {luck.links.map((link) => (
                    <li key={link.id}>
                      {outcomeSentence(link.kind === "event" ? pub.eventTitles[link.id] ?? link.id : describeConditions(link.when ?? []), link.probability, link.happened)}
                    </li>
                  ))}
                  {luck.links.length === 0 && <li>No chance event was tied to this decision, so luck played no part in it.</li>}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
      {/* After the list and in plain text, so it reads as a summary, not a score to beat. */}
      {history.length > 0 && tags.length === history.length && <p className="text-sm">{tallySentence(tags)}</p>}
      <p className={failed ? "" : "sr-only"} role="status">{status}</p>
      {failed && <Button className="mt-2" onClick={onRetry}>{SOUNDNESS_RETRY}</Button>}
    </div>
  );
}
