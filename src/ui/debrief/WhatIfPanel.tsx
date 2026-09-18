import { useState } from "react";
import { Assumptions } from "./Assumptions";
import { whatIfMethod, whatIfSentences } from "./copy";
import { Button } from "../components/Button";
import { PROFILE_LABEL } from "../format";
import { pub, WHAT_IF_RUNS, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
}

/** Panel 6: counterfactual reruns of any one decision, phrased as the model's output and never as a finding. */
export function WhatIfPanel({ view, whatIf }: Props) {
  const history = view.history ?? [];
  const [changeAt, setChangeAt] = useState(0);
  const [newChoiceId, setNewChoiceId] = useState("");
  const [answer, setAnswer] = useState<(WhatIfAnswer & { changeAt: number }) | null>(null);
  const [running, setRunning] = useState(false);

  const record = history[changeAt]!;
  const scenario = pub.scenarios[record.scenarioId]!;
  const alternatives = scenario.choices.filter((c) => c.id !== record.choiceId && !record.lockedChoiceIds.includes(c.id));
  const chosenAlternative = alternatives.find((c) => c.id === newChoiceId) ?? alternatives[0];

  async function run() {
    if (!chosenAlternative) return;
    setRunning(true);
    try {
      setAnswer({ ...(await whatIf(changeAt, chosenAlternative.id)), changeAt });
    } finally {
      setRunning(false);
    }
  }

  const shown = answer && answer.changeAt === changeAt && answer.result.newChoiceId === chosenAlternative?.id ? answer : null;

  return (
    <div className="space-y-4">
      <p>
        Change one decision and the model replays the game {WHAT_IF_RUNS.toLocaleString("en-GB")} times: fresh dice, the same kind of world,
        and every other decision as you made it.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="what-if-decision" className="block text-sm font-semibold">The decision to change</label>
          <select
            id="what-if-decision"
            className="mt-1 block w-full rounded-sm border border-rule bg-paper p-2"
            value={changeAt}
            onChange={(event) => { setChangeAt(Number(event.target.value)); setNewChoiceId(""); }}
          >
            {history.map((r, index) => (
              <option key={r.turn} value={index}>
                Turn {r.turn}: {pub.scenarios[r.scenarioId]?.title} (you chose {r.choiceId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="what-if-option" className="block text-sm font-semibold">What you might have done instead</label>
          <select
            id="what-if-option"
            className="mt-1 block w-full rounded-sm border border-rule bg-paper p-2"
            value={chosenAlternative?.id ?? ""}
            onChange={(event) => setNewChoiceId(event.target.value)}
          >
            {alternatives.map((c) => (
              <option key={c.id} value={c.id}>{c.id}. {c.text}</option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={run} disabled={running || !chosenAlternative}>
        {running ? "Rerunning…" : `Rerun ${WHAT_IF_RUNS.toLocaleString("en-GB")} games`}
      </Button>

      <div aria-live="polite">
        {shown && (
          <blockquote className="border-l-4 border-ink pl-4" data-testid="what-if-result" data-milliseconds={shown.milliseconds}>
            {whatIfSentences(shown.result, scenario.title, scenario.choices.find((c) => c.id === record.choiceId)?.text ?? record.choiceId, chosenAlternative?.text ?? "")
              .map((sentence) => <p key={sentence} className="mt-1 first:mt-0">{sentence}</p>)}
            <p className="mt-2 text-sm text-muted">
              {whatIfMethod(shown.result, PROFILE_LABEL[shown.result.profile])} Computed in {(shown.milliseconds / 1000).toFixed(2)} seconds.
            </p>
          </blockquote>
        )}
      </div>

      <details className="rounded-sm border border-rule p-4">
        <summary className="cursor-pointer font-semibold">View assumptions</summary>
        <div className="mt-3">
          <Assumptions scenarioId={record.scenarioId} />
        </div>
      </details>
    </div>
  );
}
