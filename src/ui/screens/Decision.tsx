import { useState } from "react";
import { Button } from "../components/Button";
import { formatEffects, LEVER_LABEL, TRACK_LABEL } from "../format";
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

  return (
    <div className="space-y-6">
      {!scenario.isCrisis && (
        <section aria-label="Commission analysis" className="rounded-sm border border-rule p-4">
          <h3 className="font-semibold">Commission analysis</h3>
          {purchased ? (
            <>
              <p className="mt-1">{purchased.text}</p>
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
        <legend className="text-xl font-serif">Your decision</legend>
        <p className="mt-1 text-sm text-muted">
          You have {view.politicalCapital} Political Capital. Visible effects apply at once. Every option also has effects you cannot see from here.
        </p>
        <div className="mt-4 space-y-3">
          {scenario.choices.map((choice) => {
            const option = ctx.choices.find((o) => o.id === choice.id)!;
            const available = option.status === "available";
            const inputId = `choice-${choice.id}`;
            return (
              <div
                key={choice.id}
                className={`rounded-sm border p-4 ${selected === choice.id ? "border-accent bg-panel" : "border-rule"} ${available ? "" : "opacity-60"}`}
              >
                <div className="flex gap-3">
                  <input
                    id={inputId}
                    type="radio"
                    name="choice"
                    className="mt-1.5 size-4 accent-(--accent)"
                    checked={selected === choice.id}
                    disabled={!available}
                    onChange={() => setSelected(choice.id)}
                    aria-describedby={`${inputId}-detail`}
                  />
                  <div>
                    <label htmlFor={inputId} className="font-semibold">
                      {choice.id}. {choice.text}
                    </label>
                    <p id={`${inputId}-detail`} className="mt-1 text-sm">
                      <span className="text-muted">Lever:</span> {LEVER_LABEL[choice.lever]} &middot; <span className="text-muted">Cost:</span>{" "}
                      {option.cost} Political Capital
                      <br />
                      <span className="text-muted">Visible effects:</span> {formatEffects(choice.visibleEffects)}
                      {choice.unlock && option.status !== "locked" && (
                        <>
                          <br />
                          <span className="font-semibold">Open to you because of your investment in {TRACK_LABEL[choice.unlock.track]}.</span>
                        </>
                      )}
                      {option.status === "unaffordable" && (
                        <>
                          <br />
                          <span className="font-semibold">You do not have the Political Capital for this.</span>
                        </>
                      )}
                      {option.status === "locked" && choice.unlock && (
                        <>
                          <br />
                          <span className="font-semibold">
                            Locked: needs {TRACK_LABEL[choice.unlock.track]} at level {choice.unlock.level}.
                          </span>
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

      <Button disabled={selected === null} onClick={() => selected && onDecide(selected)}>
        {selected ? `Confirm option ${selected}` : "Choose an option"}
      </Button>
    </div>
  );
}
