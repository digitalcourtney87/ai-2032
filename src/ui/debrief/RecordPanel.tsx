import { METRIC_LABEL } from "../format";
import { pub } from "../useGame";
import type { DisplayedState, MetricKey } from "../../engine";

const ORDER: MetricKey[] = ["nationalSecurity", "economy", "publicTrust", "innovation", "socialStability", "systemicRisk", "cooperation", "stateCapacity"];
const STANCE = { supports: "Supports this ending's concern", challenges: "Challenges it", context: "Context" } as const;

/** Panel 4: the final metrics with the true values of the estimated ones, the ending, and further reading. */
export function RecordPanel({ view }: { view: DisplayedState }) {
  const truth = view.truth!.metrics;
  const debrief = view.debrief!;
  const ending = pub.endings[debrief.endingId];

  return (
    <div className="space-y-5">
      <table className="w-full max-w-md text-sm">
        <caption className="pb-1 text-left font-semibold">Where the country ended, true values</caption>
        <tbody>
          {ORDER.map((key) => (
            <tr key={key} className="border-b border-rule">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{METRIC_LABEL[key]}</th>
              <td className="py-1 text-right font-mono font-semibold">{Math.round(truth[key])}</td>
              <td className="py-1 pl-3 text-xs text-muted">
                {key === "systemicRisk" || key === "cooperation"
                  ? `you were shown ${view.estimates[key].low}–${view.estimates[key].high}`
                  : key === "stateCapacity" ? `you were shown “${view.stateCapacity}”` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="grid max-w-md grid-cols-3 gap-4 text-sm">
        {(["control", "prosperity", "legitimacy"] as const).map((key) => (
          <div key={key}>
            <dt className="capitalize text-muted">{key}</dt>
            <dd className="font-mono text-2xl font-semibold">{Math.round(debrief.composites[key])}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        Control averages National Security, State Capacity and 100 minus Systemic Risk. Prosperity averages Economy, Innovation and Social
        Stability. Legitimacy is Public Trust. An ending needs 55 on a composite to count it as secured.
      </p>

      <section aria-label="Further reading">
        <h3 className="font-semibold">Further reading for {ending?.title}</h3>
        <p className="text-sm text-muted">Where the evidence is contested, a source that supports this ending&rsquo;s concern is paired with one that challenges it.</p>
        <ul className="mt-2 space-y-3 text-sm">
          {ending?.furtherReading.map((source) => (
            <li key={source.url}>
              <a className="text-accent underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
              <span className="text-muted"> &middot; {source.type}</span>
              <br />
              <span className="font-semibold">{STANCE[source.stance]}.</span> {source.why}{" "}
              <span className="text-xs text-muted">(reviewed {source.reviewed})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
