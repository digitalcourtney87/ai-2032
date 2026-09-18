import { AdviserCard } from "../components/AdviserCard";
import { Button } from "../components/Button";
import { EvidenceTag } from "../components/EvidenceTag";
import { IntelFile } from "../components/IntelFile";
import { ADVISER_ORDER, formatEffects, LEVER_LABEL } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onContinue: () => void;
}

/** Step 1 of the turn: the situation, the evidence, what is unclear, and four adviser positions. */
export function Briefing({ view, scenario, onContinue }: Props) {
  const ctx = view.current!;
  const assessment = view.intel.find((r) => r.turn === view.turn && r.source === "briefing" && r.scenarioId === scenario.id);
  const earlier = view.intel.filter((r) => r !== assessment);

  return (
    <div className="space-y-6">
      <p className="text-lg">{scenario.briefing}</p>
      <EvidenceTag evidence={scenario.evidenceStrength} severity={scenario.severity} />

      {assessment && (
        <section aria-label="Assessment">
          <h3 className="text-sm font-semibold">Assessment</h3>
          <p className="mt-1">{assessment.text}</p>
          <p className="mt-1 text-xs text-muted">Assessments are sometimes wrong. How often depends on the evidence rating and on your State Capacity.</p>
        </section>
      )}

      <section aria-label="The options on the table">
        <h3 className="text-sm font-semibold">The options on the table</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {scenario.choices.filter((c) => ctx.choices.find((o) => o.id === c.id)?.status !== "locked").map((choice) => (
            <li key={choice.id}>
              <span className="font-semibold">{choice.id}.</span> {choice.text}{" "}
              <span className="text-muted">
                ({LEVER_LABEL[choice.lever]}; {formatEffects(choice.visibleEffects)})
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Advisers" className="space-y-4">
        <h3 className="text-sm font-semibold">Your advisers</h3>
        {ADVISER_ORDER.map((id) => (
          <AdviserCard
            key={id}
            adviser={pub.advisers.find((a) => a.id === id)!}
            stance={scenario.advisers[id].stance}
            recommends={scenario.advisers[id].recommends}
            memory={ctx.adviserMemory[id]}
          />
        ))}
      </section>

      <details className="rounded-sm border border-rule p-4">
        <summary className="cursor-pointer font-semibold">Real-world evidence behind this fictional scenario</summary>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-semibold">What we know</dt>
            <dd>{scenario.evidencePanel.known}</dd>
          </div>
          <div>
            <dt className="font-semibold">What we do not know</dt>
            <dd>{scenario.evidencePanel.unknown}</dd>
          </div>
          <div>
            <dt className="font-semibold">Why it matters</dt>
            <dd>{scenario.evidencePanel.whyItMatters}</dd>
          </div>
        </dl>
        <ul className="mt-3 space-y-1 text-sm">
          {scenario.evidencePanel.sources.map((source) => (
            <li key={source.url}>
              <a className="text-accent underline" href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>{" "}
              <span className="text-xs text-muted">(reviewed {source.reviewed})</span>
            </li>
          ))}
        </ul>
      </details>

      <IntelFile reports={earlier} heading="What you have been told so far" />

      <Button onClick={onContinue}>Continue to your forecast</Button>
    </div>
  );
}
