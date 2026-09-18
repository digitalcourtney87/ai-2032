import { causalSentence, outcomeSentence, soundSentence } from "./copy";
import { describeConditions } from "../format";
import { pub, type Rankings } from "../useGame";
import { luckTag, type DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** Arrives from the worker shortly after the debrief opens. */
  rankings: Rankings | null;
}

/**
 * Panel 3: decision quality separated from luck. For each decision: the odds at
 * the time, the outcome drawn, and a tag. The game never says a decision was
 * right or wrong; it says how the option ranked and how the dice fell.
 */
export function QualityPanel({ view, rankings }: Props) {
  const debrief = view.debrief!;
  const history = view.history ?? [];

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
          const ranking = rankings?.[index];
          const rank = ranking ? ranking.findIndex((e) => e.choiceId === record.choiceId) + 1 : 0;
          const sound = rank > 0 && rank <= 2;
          const chosen = scenario?.choices.find((c) => c.id === record.choiceId);
          return (
            <li key={record.turn} className="border-l-2 border-rule pl-4" data-testid="decision-review">
              <h4 className="font-semibold">
                Turn {record.turn}, {scenario?.title}: option {record.choiceId}
              </h4>
              <p className="text-sm text-muted">{chosen?.text}</p>
              <p className="mt-1 font-serif text-lg" data-testid="luck-tag">
                {ranking && rank > 0 ? luckTag(sound, luck.fortunate).replace(/^./, (c) => c.toUpperCase()) : "Weighing the options you had…"}
              </p>
              {!record.succeeded && <p className="text-sm">The option did not take effect: its conditions were not met, and the cost was still paid.</p>}
              <ul className="mt-1 space-y-1 text-sm">
                {ranking && rank > 0 && <li>{soundSentence(sound, rank, ranking.length)}</li>}
                {record.oddsAtTheTime.filter((o) => Math.round(o.before * 100) !== Math.round(o.probability * 100)).map((o) => (
                  <li key={`cause-${o.eventId}`}>{causalSentence(pub.eventTitles[o.eventId] ?? o.eventId, o.before, o.probability)}</li>
                ))}
                {luck.links.map((link) => (
                  <li key={link.id}>
                    {outcomeSentence(link.kind === "event" ? pub.eventTitles[link.id] ?? link.id : describeConditions(link.when ?? []), link.probability, link.happened)}
                  </li>
                ))}
                {luck.links.length === 0 && <li>No chance event was tied to this decision, so luck played no part in it.</li>}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
