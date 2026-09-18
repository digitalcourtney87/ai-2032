import { describeConditions, FACT_LABEL, formatEffects, PROFILE_LABEL, signed } from "../format";
import { pub, published } from "../useGame";
import type { BaseProbability, Profile, SeedFact } from "../../engine";

const PROFILES: Profile[] = ["benign", "contested", "hard"];
const FACTS = Object.keys(FACT_LABEL) as SeedFact[];

function formatBase(base: BaseProbability | "certain" | undefined): string {
  if (base === undefined) return "no base odds";
  if (base === "certain") return "scheduled: it happens without a roll";
  if ("cases" in base) {
    return [...base.cases.map((c) => `${c.probability}% when ${describeConditions(c.when)}`), `${base.otherwise}% otherwise`].join("; ");
  }
  if ("fact" in base) {
    const fact = FACT_LABEL[base.fact];
    return `${base.whenTrue}% if ${fact.name.toLowerCase()} is ${fact.whenTrue.toLowerCase()}, ${base.whenFalse}% if ${fact.whenFalse.toLowerCase()}`;
  }
  return base.benign === base.contested && base.contested === base.hard
    ? `${base.benign}% in every world`
    : PROFILES.map((p) => `${base[p]}% in a ${PROFILE_LABEL[p].toLowerCase()}`).join(", ");
}

/** "View assumptions": the probability table behind a scenario (spec Section 11). Design assumptions, not forecasts. */
export function Assumptions({ scenarioId }: { scenarioId: string }) {
  const options = published.options[scenarioId] ?? [];
  return (
    <div className="space-y-5 text-sm">
      <p className="text-muted">
        These numbers are design assumptions, not forecasts. All event odds are clamped between 2% and 95% after modifiers. A facilitator can
        edit them and rerun.
      </p>

      <section aria-label="Hidden effects of each option">
        <h3 className="font-semibold">What each option in {pub.scenarios[scenarioId]?.title} did out of sight</h3>
        <ul className="mt-2 space-y-3">
          {options.map((option) => (
            <li key={option.id} className="border-l-2 border-rule pl-3">
              <span className="font-semibold">{option.id}. {option.text}</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {Object.keys(option.hiddenEffects).length > 0 && <li>Hidden effects: {formatEffects(option.hiddenEffects)}</li>}
                {option.conditionalEffects.map((c, i) => <li key={`c${i}`}>If {describeConditions(c.when)}: {formatEffects(c.effects)}</li>)}
                {option.probabilityModifiers.map((m, i) => (
                  <li key={`m${i}`}>
                    Odds of &ldquo;{published.events[m.eventId]?.title}&rdquo; {signed(m.delta)} points{m.when ? `, if ${describeConditions(m.when)}` : ""}
                  </li>
                ))}
                {option.queues.map((q, i) => (
                  <li key={`q${i}`}>
                    Sets up &ldquo;{published.events[q.eventId]?.title}&rdquo; ({formatBase(q.base)}): {formatEffects(published.events[q.eventId]?.effects ?? {})}
                    {published.events[q.eventId]?.conditionalEffects.map((c, j) => <span key={j}>; if {describeConditions(c.when)}: {formatEffects(c.effects)}</span>)}
                  </li>
                ))}
                {option.succeedsWhen && <li>Takes effect only if {describeConditions(option.succeedsWhen)}. Otherwise: {formatEffects(option.onFailure?.effects ?? {})}</li>}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="World profile odds">
        <h3 className="font-semibold">How the hidden world is drawn</h3>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-rule text-muted">
                <th scope="col" className="py-1 pr-2 font-normal">Latent fact</th>
                {PROFILES.map((p) => (
                  <th key={p} scope="col" className="py-1 pr-2 text-right font-normal">{PROFILE_LABEL[p]} ({published.profiles[p].weight}%)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTS.map((fact) => (
                <tr key={fact} className="border-b border-rule">
                  <th scope="row" className="py-1 pr-2 font-normal">{FACT_LABEL[fact].name}: {FACT_LABEL[fact].whenTrue.toLowerCase()}</th>
                  {PROFILES.map((p) => <td key={p} className="py-1 pr-2 text-right tabular-nums">{published.profiles[p].facts[fact]}%</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
