import { INTEL_MATCHED, INTEL_MISSED, profileShareSentence } from "./copy";
import { FACT_LABEL, percent, PROFILE_LABEL } from "../format";
import { pub, published } from "../useGame";
import type { DisplayedState, SeedFact } from "../../engine";

const FACTS: SeedFact[] = ["cyberOffenceLed", "bioUpliftReal", "sandbaggingStrategic", "labourShockStructural", "foreignPostureOpen"];
const SOURCE = { briefing: "Briefing assessment", purchase: "Commissioned analysis", reveal: "Finding delivered" } as const;

/** Panel 1: the profile and the five latent facts, each beside what the player was told and forecast about it. */
export function WorldPanel({ view }: { view: DisplayedState }) {
  const world = view.truth!.world;
  const debrief = view.debrief!;
  const odds = published.profiles[world.profile].facts;
  const { benign, contested, hard } = published.profiles;

  return (
    <div className="space-y-4">
      <p>
        You were governing a <strong>{PROFILE_LABEL[world.profile].toLowerCase()}</strong>.{" "}
        {profileShareSentence({ benign: benign.weight, contested: contested.weight, hard: hard.weight })} These percentages are design
        assumptions, not forecasts.
      </p>
      <ul className="space-y-4">
        {FACTS.map((fact) => {
          const label = FACT_LABEL[fact];
          const value = world[fact];
          const reports = debrief.intel.filter((r) => r.fact === fact);
          const forecasts = debrief.factForecasts.filter((f) => f.fact === fact);
          return (
            <li key={fact} className="border-l-2 border-rule pl-4">
              <h3 className="font-semibold">
                {label.name}: {value ? label.whenTrue : label.whenFalse}
              </h3>
              <p className="text-sm text-muted">
                In a {PROFILE_LABEL[world.profile].toLowerCase()}, &ldquo;{label.whenTrue.toLowerCase()}&rdquo; is drawn {odds[fact]}% of the time.
              </p>
              {forecasts.map((f) => (
                <p key={f.scenarioId} className="mt-1 text-sm">
                  In {pub.scenarios[f.scenarioId]?.title}, you put the chance of &ldquo;{label.whenTrue.toLowerCase()}&rdquo; at {percent(f.forecast)}.
                </p>
              ))}
              {reports.length > 0 && (
                <ul className="mt-1 space-y-1 text-sm">
                  {reports.map((report, index) => (
                    <li key={index}>
                      <span className="font-semibold">{report.correct ? INTEL_MATCHED : INTEL_MISSED}:</span> turn {report.turn},{" "}
                      {SOURCE[report.source].toLowerCase()}. &ldquo;{report.text}&rdquo;
                    </li>
                  ))}
                </ul>
              )}
              {reports.length === 0 && forecasts.length === 0 && <p className="mt-1 text-sm">Nothing you were shown bore on this.</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
