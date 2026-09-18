import { TRACK_LABEL } from "../format";
import { pub } from "../useGame";
import type { DisplayedState } from "../../engine";

/** Panel 5: options and events that stayed locked, and which investment would have opened them. */
export function NeverSawPanel({ view }: { view: DisplayedState }) {
  const history = view.history ?? [];
  const locked = history.flatMap((record) =>
    record.lockedChoiceIds.map((id) => ({ record, choice: pub.scenarios[record.scenarioId]?.choices.find((c) => c.id === id) })));
  const met = new Set(history.map((r) => r.scenarioId));
  const unmet = Object.values(pub.scenarios).filter((s) => !pub.sequence.includes(s.id) && !met.has(s.id));

  return (
    <div className="space-y-5">
      <section aria-label="Options that stayed locked">
        <h3 className="font-semibold">Options that stayed locked</h3>
        {locked.length === 0 ? (
          <p className="mt-1 text-sm">None. Every prepared option you met was open to you.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {locked.map(({ record, choice }) => (
              <li key={`${record.turn}-${choice?.id}`} className="border-l-2 border-rule pl-3">
                Turn {record.turn}, {pub.scenarios[record.scenarioId]?.title}: <span className="font-semibold">{choice?.text}</span>
                {choice?.unlock && (
                  <> It needed {TRACK_LABEL[choice.unlock.track]} at level {choice.unlock.level}. You had seven points to place and twelve levels to fill.</>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Crises you did not meet">
        <h3 className="font-semibold">Crises you did not meet</h3>
        <p className="mt-1 text-sm text-muted">
          One unscheduled crisis interrupts every run. Which one depends on which severe event fires first; if none does, a warning arrives that may be a false alarm.
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {unmet.map((scenario) => (
            <li key={scenario.id} className="border-l-2 border-rule pl-3">
              <span className="font-semibold">{scenario.title}.</span> {scenario.briefing}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
