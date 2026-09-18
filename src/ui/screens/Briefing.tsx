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
  const crisis = scenario.isCrisis;
  const open = scenario.choices.filter((c) => ctx.choices.find((o) => o.id === c.id)?.status !== "locked");
  const positions = new Set(ADVISER_ORDER.map((id) => scenario.advisers[id].recommends)).size;

  return (
    <div className="space-y-6">
      <p className="text-lg">{scenario.briefing}</p>
      <EvidenceTag evidence={scenario.evidenceStrength} severity={scenario.severity} reduced={crisis} />
      {crisis && (
        <p className="text-sm font-semibold">
          This is a crisis turn. There is no time to commission analysis or to review the evidence file. You decide on what is in front of you.
        </p>
      )}

      {assessment && (
        <section aria-label="Assessment">
          <h2 className="text-sm font-semibold">{crisis ? "Unconfirmed report" : "Assessment"}</h2>
          <p className="mt-1">{assessment.text}</p>
          {!crisis && (
            <p className="mt-1 text-xs text-muted">Assessments are sometimes wrong. How often depends on the evidence rating and on your State Capacity.</p>
          )}
        </section>
      )}

      <section aria-label="The options on the table">
        <h2 className="text-sm font-semibold">The options on the table</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {open.map((choice) => (
            <li key={choice.id}>
              <span className="font-semibold">{choice.id}.</span> {choice.text}{" "}
              {choice.unlock && <span className="font-semibold">Open to you because you prepared. </span>}
              <span className="text-muted">
                ({LEVER_LABEL[choice.lever]}; {formatEffects(choice.visibleEffects)})
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Advisers" className="space-y-4">
        <h2 className="text-sm font-semibold">
          {crisis ? `Your advisers are in open disagreement: ${positions} different recommendations` : "Your advisers"}
        </h2>
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

      {!crisis && (
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
      )}

      {!crisis && <IntelFile reports={earlier} heading="What you have been told so far" />}

      <Button onClick={onContinue}>Continue to your forecast</Button>
    </div>
  );
}
