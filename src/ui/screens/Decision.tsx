import { useEffect, useRef, useState } from "react";
import { BriefingRecap } from "../components/BriefingRecap";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
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
  // Commissioning analysis costs Political Capital and can put the picked option out of reach.
  // The pick counts only while its live status is "available": a stale pick would send an illegal DECIDE.
  const chosen = ctx.choices.find((o) => o.id === selected && o.status === "available")?.id ?? null;
  const purchased = view.intel.find((r) => r.turn === view.turn && r.source === "purchase");
  const bought = purchased !== undefined;
  const analysis = useRef<HTMLParagraphElement>(null);
  // The Commission button unmounts once the analysis arrives, so focus moves to what was bought.
  useEffect(() => {
    if (bought) analysis.current?.focus();
  }, [bought]);
  const statusOf = (id: string) => ctx.choices.find((o) => o.id === id)!.status;
  // Options opened by earlier investment come first: this is where preparation pays (spec Section 4).
  const prepared = (id: string, unlock: unknown) => (unlock && statusOf(id) !== "locked" ? 0 : 1);
  const ordered = [...scenario.choices].sort((a, b) => prepared(a.id, a.unlock) - prepared(b.id, b.unlock));

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
          You have {view.politicalCapital} Political Capital. Visible effects apply at once. Every option also has effects you cannot see from here.
        </p>
        <div className="mt-4 space-y-3">
          {ordered.map((choice) => {
            const option = ctx.choices.find((o) => o.id === choice.id)!;
            const available = option.status === "available";
            const on = chosen === choice.id;
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
                      <span className={on ? "opacity-80" : "text-muted"}>Visible effects:</span> {formatEffects(choice.visibleEffects)}
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
                          <span className="font-semibold">You do not have the Political Capital for this.</span>
                        </>
                      )}
                      {option.status === "locked" && choice.unlock && (
                        <>
                          <br />
                          <Icon name="lock" className="mr-1" />
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

      <Button disabled={chosen === null} onClick={() => chosen && onDecide(chosen)}>
        {chosen ? `Confirm option ${chosen}` : "Choose an option"}
      </Button>

      {/* After Confirm, so the keyboard order above is unchanged. The forecast is locked, so the advisers' estimates can show. */}
      <BriefingRecap view={view} scenario={scenario} showForecasts />
    </div>
  );
}
