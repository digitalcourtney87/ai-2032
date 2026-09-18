import { useState } from "react";
import { AdviserSeal } from "../components/AdviserSeal";
import { Button } from "../components/Button";
import { EffectChips } from "../components/EffectChips";
import { Icon } from "../components/Icon";
import { ADVISER_ORDER, LEVER_LABEL, TRACK_LABEL } from "../format";
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
        <legend className="text-xl font-semibold">Your decision</legend>
        <p className="mt-1 text-sm text-muted">
          You have {view.politicalCapital} Political Capital. Visible effects apply at once. Every option also has effects you cannot see from here.
        </p>
        <div className="mt-4 space-y-3">
          {ordered.map((choice) => {
            const option = ctx.choices.find((o) => o.id === choice.id)!;
            const available = option.status === "available";
            const on = selected === choice.id;
            const inputId = `choice-${choice.id}`;
            const backers = ADVISER_ORDER.filter((id) => scenario.advisers[id].recommends === choice.id).map((id) => pub.advisers.find((a) => a.id === id)!);
            const dim = on ? "opacity-80" : "text-muted";
            return (
              <div key={choice.id} className={`border p-4 transition-colors ${on ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"} ${available ? "" : "opacity-60"}`}>
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
                  <div className="min-w-0 flex-1">
                    <label htmlFor={inputId} className="flex gap-2 font-semibold">
                      <span className="font-mono">{choice.id}.</span>
                      <span>{choice.text}</span>
                    </label>
                    <div id={`${inputId}-detail`} className="mt-2 space-y-2 text-sm">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
                        <span className="border border-rule px-1.5 py-0.5">{LEVER_LABEL[choice.lever]}</span>
                        <span className="inline-flex items-center gap-1 border border-rule px-1.5 py-0.5">
                          <Icon name="capital" />
                          {option.cost} Political Capital
                        </span>
                      </div>
                      <div>
                        <p className={dim}>Visible effects</p>
                        <div className="mt-1">
                          <EffectChips effects={choice.visibleEffects} />
                        </div>
                      </div>
                      {backers.length > 0 && (
                        <div className="flex items-center gap-2" aria-label={`Backed by ${backers.map((a) => a.name).join(", ")}`}>
                          <span className={dim}>Backed by</span>
                          <span className="flex gap-1" aria-hidden="true">
                            {backers.map((a) => (
                              <AdviserSeal key={a.id} id={a.id} name={a.name} size="sm" />
                            ))}
                          </span>
                        </div>
                      )}
                      {choice.unlock && option.status !== "locked" && (
                        <p className="font-semibold">
                          <Icon name="unlock" className="mr-1" />
                          Open to you because of your investment in {TRACK_LABEL[choice.unlock.track]}.
                        </p>
                      )}
                      {option.status === "unaffordable" && <p className="font-semibold">You do not have the Political Capital for this.</p>}
                      {option.status === "locked" && choice.unlock && (
                        <p className="font-semibold">
                          <Icon name="lock" className="mr-1" />
                          Locked: needs {TRACK_LABEL[choice.unlock.track]} at level {choice.unlock.level}.
                        </p>
                      )}
                    </div>
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
