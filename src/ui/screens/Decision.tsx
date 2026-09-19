import { useEffect, useRef, useState } from "react";
import { BriefingRecap } from "../components/BriefingRecap";
import { Button } from "../components/Button";
import { ChoicePreview } from "../components/ChoicePreview";
import { Icon } from "../components/Icon";
import { boomNote, DECISION_INTRO, levelHaveLine, unaffordableLine, windowNote } from "../copy";
import { formatEffects, LEVER_LABEL, TRACK_LABEL } from "../format";
import { choicePreview, pricingNotes } from "../preview";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onBuyInfo: () => void;
  onDecide: (choiceId: string) => void;
}

/** Steps 3 and 4: an optional information purchase, then one decision. */
export function Decision({ view, scenario, onBuyInfo, onDecide }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const ctx = view.current!;
  const purchased = view.intel.find((r) => r.turn === view.turn && r.source === "purchase");
  const bought = purchased !== undefined;
  const analysis = useRef<HTMLParagraphElement>(null);
  // Phase 8: the Commission button unmounts once the analysis arrives, so focus moves to what was bought.
  useEffect(() => {
    if (bought) analysis.current?.focus();
  }, [bought]);
  const statusOf = (id: string) => ctx.choices.find((o) => o.id === id)!.status;
  // Options opened by earlier investment come first: this is where preparation pays (spec Section 4).
  const prepared = (id: string, unlock: unknown) => (unlock && statusOf(id) !== "locked" ? 0 : 1);
  const ordered = [...scenario.choices].sort((a, b) => prepared(a.id, a.unlock) - prepared(b.id, b.unlock));
  // Buying analysis recomputes every status, so a selection can stop being affordable.
  // Whether it can be confirmed is derived from the live status, never from `selected` alone.
  const preview = selected ? choicePreview(view, scenario, selected) : null;
  const notes = pricingNotes(view, scenario, pub.rules);
  // A window can outlast the game: never promise more turns than are left, counting this one.
  const windowTurns = notes.window ? Math.min(notes.window.turnsLeft, pub.totalTurns - view.turn + 1) : 0;

  return (
    <div className="space-y-6">
      {scenario.isCrisis && <p className="text-sm font-semibold">No analysis can be commissioned in a crisis.</p>}
      {!scenario.isCrisis && (
        <section aria-label="Commission analysis" className="border border-rule p-4">
          <h2 className="font-semibold">Commission analysis</h2>
          {purchased ? (
            <>
              <p ref={analysis} tabIndex={-1} className="mt-1 outline-none">
                {purchased.text}
              </p>
              <p className="mt-1 text-xs text-muted">A second, independent reading. It is more reliable when State Capacity is higher, and it can still be wrong.</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm">
                For {pub.infoCost} Political Capital, your analysts return a second, independent reading of what lies behind this briefing.
              </p>
              <Button variant="quiet" className="mt-3" disabled={!ctx.canBuyInfo} onClick={onBuyInfo}>
                Commission analysis ({pub.infoCost} Political Capital)
              </Button>
              {!ctx.canBuyInfo && <p className="mt-2 text-xs text-muted">You cannot afford analysis and a decision this turn.</p>}
            </>
          )}
        </section>
      )}

      <fieldset>
        <legend className="text-xl font-semibold">Your decision</legend>
        <p className="mt-1 text-sm text-muted">
          You have {view.politicalCapital} Political Capital. {DECISION_INTRO}
        </p>
        {notes.window && <p className="mt-2 border-l-2 border-ink pl-3 text-sm">{windowNote(notes.window.domain, windowTurns, pub.rules)}</p>}
        {notes.boom && <p className="mt-2 border-l-2 border-ink pl-3 text-sm">{boomNote(pub.rules)}</p>}
        <div className="mt-4 space-y-3">
          {ordered.map((choice) => {
            const option = ctx.choices.find((o) => o.id === choice.id)!;
            const available = option.status === "available";
            const on = selected === choice.id && available;
            const inputId = `choice-${choice.id}`;
            return (
              <div key={choice.id} className={`border p-4 ${on ? "border-ink bg-ink text-paper" : "border-rule"} ${available ? "" : "opacity-60"}`}>
                <div className="flex gap-3">
                  <input
                    id={inputId}
                    type="radio"
                    name="choice"
                    className="mt-1.5 size-4 accent-current"
                    checked={on}
                    disabled={!available}
                    onChange={() => setSelected(choice.id)}
                    aria-describedby={`${inputId}-detail`}
                  />
                  <div>
                    <label htmlFor={inputId} className="font-semibold">
                      {choice.id}. {choice.text}
                    </label>
                    <p id={`${inputId}-detail`} className="mt-1 text-sm">
                      <span className={on ? "opacity-80" : "text-muted"}>Lever:</span> {LEVER_LABEL[choice.lever]} &middot;{" "}
                      <span className={on ? "opacity-80" : "text-muted"}>Cost:</span>{" "}
                      <Icon name="capital" className="mx-0.5" />
                      {option.cost} Political Capital
                      <br />
                      <span className={on ? "opacity-80" : "text-muted"}>Officials expect:</span> {formatEffects(choice.visibleEffects)}
                      {choice.unlock && option.status !== "locked" && (
                        <>
                          <br />
                          <Icon name="unlock" className="mr-1" />
                          <span className="font-semibold">Open to you because of your investment in {TRACK_LABEL[choice.unlock.track]}.</span>
                        </>
                      )}
                      {option.status === "unaffordable" && (
                        <>
                          <br />
                          <span className="font-semibold">{unaffordableLine(option.cost, view.politicalCapital)}</span>
                        </>
                      )}
                      {option.status === "locked" && choice.unlock && (
                        <>
                          <br />
                          <Icon name="lock" className="mr-1" />
                          <span className="font-semibold">
                            Locked: needs {TRACK_LABEL[choice.unlock.track]} at level {choice.unlock.level}.
                          </span>{" "}
                          <span>{levelHaveLine(view.tracks[choice.unlock.track])}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <ChoicePreview
        preview={preview}
        isFinal={ctx.isFinal}
        onConfirm={() => {
          if (selected && preview?.status === "available") onDecide(selected);
        }}
      />

      {/* Phase 10: after the confirm bar, so the keyboard order above is unchanged. The forecast is locked, so the advisers' estimates can show. */}
      <BriefingRecap view={view} scenario={scenario} showForecasts />
    </div>
  );
}
