import { useState } from "react";
import { Button } from "../components/Button";
import { describeConditions, FACT_LABEL, PROFILE_LABEL } from "../format";
import { defaults, overrides as applied } from "../useGame";
import { baseSlots, countOverrides, encodeOverrides, type Overrides } from "../../content";
import type { BaseProbability, Profile, SeedFact } from "../../engine";

const PROFILES: Profile[] = ["benign", "contested", "hard"];
const FACTS = Object.keys(FACT_LABEL) as SeedFact[];

function slotLabel(base: BaseProbability | "certain" | undefined, slot: string): string {
  if (base && base !== "certain" && "fact" in base) {
    const fact = FACT_LABEL[base.fact];
    return `if ${fact.name.toLowerCase()} is ${(slot === "whenTrue" ? fact.whenTrue : fact.whenFalse).toLowerCase()}`;
  }
  if (base && base !== "certain" && "cases" in base && slot.startsWith("case")) return `when ${describeConditions(base.cases[Number(slot.slice(4))]?.when ?? [])}`;
  if (slot === "otherwise") return "otherwise";
  return `in a ${PROFILE_LABEL[slot as Profile]?.toLowerCase() ?? slot}`;
}

function linkFor(seedCode: string, draft: Overrides, facilitator: boolean): string {
  const params = new URLSearchParams();
  if (facilitator) params.set("facilitator", "1");
  if (seedCode.trim()) params.set("seed", seedCode.trim());
  const cfg = encodeOverrides(draft);
  if (cfg) params.set("cfg", cfg);
  const query = params.toString();
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  changed: boolean;
  onChange: (value: number) => void;
}

function NumberField({ id, label, value, changed, onChange }: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="text-sm">{label}{changed && <span className="font-semibold"> (edited)</span>}</label>
      <span className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
          className="w-20 border border-rule bg-paper px-2 py-1 text-right font-mono tabular-nums"
        />
        <span aria-hidden="true">%</span>
      </span>
    </div>
  );
}

/**
 * The facilitator settings panel (spec Sections 6 and 11), behind `?facilitator=1`.
 * It edits the world-profile odds and the base odds of events. Edits are encoded
 * into the link, so every participant who opens it plays the same edited world.
 */
export function Facilitator({ seedCode }: { seedCode: string }) {
  const [draft, setDraft] = useState<Overrides>(applied);
  const [copied, setCopied] = useState(false);

  const weight = (p: Profile) => draft.weights?.[p] ?? defaults.profiles[p].weight;
  const factOdds = (p: Profile, f: SeedFact) => draft.facts?.[p]?.[f] ?? defaults.profiles[p].facts[f];
  const eventOdds = (id: string, slot: string, fallback: number) => draft.events?.[id]?.[slot] ?? fallback;

  // An edit that matches the published number is dropped, so links stay short and honest.
  function setWeight(p: Profile, value: number) {
    const weights = { ...draft.weights };
    if (value === defaults.profiles[p].weight) delete weights[p]; else weights[p] = value;
    setDraft({ ...draft, weights }); setCopied(false);
  }
  function setFact(p: Profile, f: SeedFact, value: number) {
    const facts = { ...draft.facts, [p]: { ...draft.facts?.[p] } };
    if (value === defaults.profiles[p].facts[f]) delete facts[p]![f]; else facts[p]![f] = value;
    setDraft({ ...draft, facts }); setCopied(false);
  }
  function setEvent(id: string, slot: string, value: number, fallback: number) {
    const events = { ...draft.events, [id]: { ...draft.events?.[id] } };
    if (value === fallback) delete events[id]![slot]; else events[id]![slot] = value;
    if (Object.keys(events[id]!).length === 0) delete events[id];
    setDraft({ ...draft, events }); setCopied(false);
  }

  const editable = Object.entries(defaults.events).filter(([, event]) => baseSlots(event.base).length > 0);
  const total = PROFILES.reduce((sum, p) => sum + weight(p), 0);
  const participantLink = linkFor(seedCode, draft, false);

  return (
    <section aria-labelledby="facilitator" className="mt-10 border border-ink p-5">
      <h2 id="facilitator" className="text-2xl">Facilitator settings</h2>
      <p className="mt-2 text-sm">
        Every probability in this game is a design assumption. Edit any of them here, then share the participant link: everyone who opens
        it plays the same seed with the same edited assumptions. A participant who disputes the model can change it, which turns an objection
        into an exercise. {countOverrides(draft)} number{countOverrides(draft) === 1 ? "" : "s"} edited; {countOverrides(applied)} applied to this page.
      </p>

      <details className="mt-4" open>
        <summary className="cursor-pointer font-semibold">How the hidden world is drawn</summary>
        <fieldset className="mt-2">
          <legend className="text-sm text-muted">Chance of each world profile. They need not sum to 100; they are used as weights (now {total}).</legend>
          {PROFILES.map((p) => (
            <NumberField key={p} id={`weight-${p}`} label={PROFILE_LABEL[p]} value={weight(p)} changed={draft.weights?.[p] !== undefined} onChange={(v) => setWeight(p, v)} />
          ))}
        </fieldset>
        {FACTS.map((f) => (
          <fieldset key={f} className="mt-3 border-t border-rule pt-2">
            <legend className="text-sm font-semibold">{FACT_LABEL[f].name}: chance of &ldquo;{FACT_LABEL[f].whenTrue.toLowerCase()}&rdquo;</legend>
            {PROFILES.map((p) => (
              <NumberField key={p} id={`fact-${f}-${p}`} label={`in a ${PROFILE_LABEL[p].toLowerCase()}`} value={factOdds(p, f)} changed={draft.facts?.[p]?.[f] !== undefined} onChange={(v) => setFact(p, f, v)} />
            ))}
          </fieldset>
        ))}
      </details>

      <details className="mt-4">
        <summary className="cursor-pointer font-semibold">Base odds of events</summary>
        <p className="mt-1 text-sm text-muted">Before the player&rsquo;s decisions and investments move them. All odds are clamped between 2% and 95% after modifiers.</p>
        {editable.map(([id, event]) => (
          <fieldset key={id} className="mt-3 border-t border-rule pt-2">
            <legend className="text-sm font-semibold">{event.title}</legend>
            {baseSlots(event.base).map(({ slot, value }) => (
              <NumberField key={slot} id={`event-${id}-${slot}`} label={slotLabel(event.base, slot)} value={eventOdds(id, slot, value)}
                changed={draft.events?.[id]?.[slot] !== undefined} onChange={(v) => setEvent(id, slot, v, value)} />
            ))}
          </fieldset>
        ))}
      </details>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => window.location.assign(linkFor(seedCode, draft, true))}>Apply to this page</Button>
        <Button
          variant="quiet"
          onClick={async () => { try { await navigator.clipboard.writeText(participantLink); setCopied(true); } catch { setCopied(false); } }}
        >
          Copy participant link
        </Button>
        <Button variant="quiet" onClick={() => window.location.assign(linkFor(seedCode, {}, true))}>Reset to the published assumptions</Button>
      </div>
      <p className="mt-2 text-sm" aria-live="polite">{copied ? "Participant link copied." : ""}</p>
      <p className="mt-2 break-all text-xs text-muted" data-testid="participant-link">{participantLink}</p>
      {countOverrides(applied) > 0 && (
        <p className="mt-2 text-sm">The debrief&rsquo;s &ldquo;View assumptions&rdquo; tables show the edited numbers, so participants can see exactly what was changed.</p>
      )}
    </section>
  );
}
