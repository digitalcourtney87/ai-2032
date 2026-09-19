import { useState } from "react";
import { Assumptions } from "./Assumptions";
import { whatIfEndingCaption, whatIfEndingRows, whatIfMethod, whatIfSentences } from "./copy";
import { Button } from "../components/Button";
import { percent, PROFILE_LABEL } from "../format";
import { pub, WHAT_IF_RUNS, type UnaffordableAt, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
  /** For each decision, the options that cost more Political Capital than the player then had. */
  unaffordable: readonly UnaffordableAt[];
  /** The decision to change, by its place in the history. The debrief holds it, so At a glance can choose it. */
  changeAt: number;
  onChangeAt: (index: number) => void;
}

/** Counterfactual reruns of any one decision, phrased as the model's output and never as a finding. */
export function WhatIfPanel({ view, whatIf, unaffordable, changeAt, onChangeAt }: Props) {
  const history = view.history ?? [];
  // The alternative picked, and for which decision: choosing another decision starts again from its first alternative.
  const [picked, setPicked] = useState<{ at: number; choiceId: string } | null>(null);
  const [answer, setAnswer] = useState<(WhatIfAnswer & { changeAt: number }) | null>(null);
  const [running, setRunning] = useState(false);

  const record = history[changeAt]!;
  const scenario = pub.scenarios[record.scenarioId]!;
  const alternatives = scenario.choices.filter((c) => c.id !== record.choiceId && !record.lockedChoiceIds.includes(c.id));
  const chosenAlternative = alternatives.find((c) => picked?.at === changeAt && c.id === picked.choiceId) ?? alternatives[0];
  // Unaffordable options stay on offer, labelled: hiding them would hide the capital lesson, and a silent
  // substitution would claim the replay took an option it did not. The result names the substitution instead.
  const unaffordableAt = unaffordable[changeAt];
  const over = (id: string) => unaffordableAt?.options.find((option) => option.id === id);
  const substitution = chosenAlternative ? over(chosenAlternative.id) : undefined;

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
  const sentences = shown
    ? whatIfSentences(shown.result, scenario.title, scenario.choices.find((c) => c.id === record.choiceId)?.text ?? record.choiceId, chosenAlternative?.text ?? "", substitution !== undefined)
    : [];

  return (
    <div className="space-y-4">
      <p>
        Pick one decision and something else you could have done. The game replays your whole run {WHAT_IF_RUNS.toLocaleString("en-GB")} times
        with fresh dice in the same kind of world, keeping every other decision as you made it, and compares the replays with and without the
        change. One game is a single roll of the dice; many replays show what a change tends to do.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="what-if-decision" className="block text-sm font-semibold">The decision to change</label>
          <select
            id="what-if-decision"
            className="mt-1 block w-full border border-rule bg-paper p-2"
            value={changeAt}
            onChange={(event) => onChangeAt(Number(event.target.value))}
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
            className="mt-1 block w-full border border-rule bg-paper p-2"
            value={chosenAlternative?.id ?? ""}
            onChange={(event) => setPicked({ at: changeAt, choiceId: event.target.value })}
          >
            {alternatives.map((c) => {
              const beyond = over(c.id);
              return <option key={c.id} value={c.id}>{c.id}. {c.text}{beyond ? ` (costs ${beyond.cost}; you had ${unaffordableAt!.capital})` : ""}</option>;
            })}
          </select>
        </div>
      </div>
      <Button onClick={run} disabled={running || !chosenAlternative}>
        {running ? "Rerunning…" : `Rerun ${WHAT_IF_RUNS.toLocaleString("en-GB")} games`}
      </Button>

      {/* Announce the run and its headline only; the full result, table included, is there to read, not to be read out. */}
      <p className="sr-only" role="status">
        {running ? `Rerunning ${WHAT_IF_RUNS.toLocaleString("en-GB")} games.` : (sentences[0] ?? "")}
      </p>
      <div>
        {shown && (
          <blockquote className="border-l-4 border-ink pl-4" data-testid="what-if-result" data-milliseconds={shown.milliseconds}>
            {sentences.map((sentence) => <p key={sentence} className="mt-1 first:mt-0">{sentence}</p>)}
            {/* A table, not paragraphs: every paragraph in the result is a prefixed sentence or the closing caveat. */}
            <table className="mt-3 w-full max-w-md text-sm">
              <caption className="pb-1 text-left font-semibold">{whatIfEndingCaption(shown.result.runs)}</caption>
              <thead>
                <tr className="border-b border-rule text-left text-muted">
                  <th scope="col" className="py-1 pr-2 font-normal">Ending</th>
                  <th scope="col" className="py-1 pr-2 text-right font-normal">Your choices, replayed</th>
                  <th scope="col" className="py-1 text-right font-normal">With the change</th>
                </tr>
              </thead>
              <tbody>
                {whatIfEndingRows(shown.result).map((row) => (
                  <tr key={row.endingId} className="border-b border-rule">
                    <th scope="row" className="py-1 pr-2 text-left font-normal">{pub.endings[row.endingId]?.title ?? row.endingId}</th>
                    <td className="py-1 pr-2 text-right font-mono">{percent(row.asPlayed)}</td>
                    <td className="py-1 text-right font-mono">{percent(row.changed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">
              {whatIfMethod(shown.result, PROFILE_LABEL[shown.result.profile])} Computed in {(shown.milliseconds / 1000).toFixed(2)} seconds.
            </p>
          </blockquote>
        )}
      </div>

      <details className="border border-rule p-4">
        <summary className="cursor-pointer font-semibold">View assumptions</summary>
        <div className="mt-3">
          <Assumptions scenarioId={record.scenarioId} />
        </div>
      </details>
    </div>
  );
}
