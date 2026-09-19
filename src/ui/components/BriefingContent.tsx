import { AdviserCard } from "./AdviserCard";
import { AdviserSplit } from "./AdviserSplit";
import { EvidenceTag } from "./EvidenceTag";
import { IntelFile } from "./IntelFile";
import { ASSESSMENT_CAVEAT } from "../copy";
import { ADVISER_ORDER } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  /** Show each adviser's forecast on their card. Only after the player's own forecast is locked. */
  showForecasts?: boolean;
}

/**
 * The body of a briefing: the situation, the evidence, what the analysts think, the
 * four advisers, then who backs which option (after the cards, so the reader
 * has met each backer). No plate and no way on, so the same body can be shown again,
 * folded, on the forecast and decision steps.
 */
export function BriefingContent({ view, scenario, showForecasts = false }: Props) {
  const ctx = view.current!;
  const assessment = view.intel.find((r) => r.turn === view.turn && r.source === "briefing" && r.scenarioId === scenario.id);
  // Earlier turns only: on the decision step this turn's commissioned analysis is shown above the options.
  const earlier = view.intel.filter((r) => r.turn < view.turn);
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
        <section aria-label="Assessment" className="border-l-2 border-ink pl-4">
          <h2 className="text-sm font-semibold">{crisis ? "Unconfirmed report" : "What your analysts think"}</h2>
          <p className="mt-1">{assessment.text}</p>
          {!crisis && (
            <p className="mt-1 text-xs text-muted">{ASSESSMENT_CAVEAT}</p>
          )}
        </section>
      )}

      <section aria-label="Advisers" className="space-y-4">
        <h2 className="text-sm font-semibold">
          {crisis ? `Your advisers are in open disagreement: ${positions} different recommendations` : "Your advisers"}
        </h2>
        {showForecasts && (
          <p className="text-sm text-muted">
            Under this game&rsquo;s assumptions, these are their forecasts for this turn&rsquo;s question: {scenario.forecastQuestion}
          </p>
        )}
        {ADVISER_ORDER.map((id) => {
          const { stance, recommends } = scenario.advisers[id];
          return (
            <AdviserCard
              key={id}
              adviser={pub.advisers.find((a) => a.id === id)!}
              stance={stance}
              recommends={recommends}
              recommendsText={scenario.choices.find((c) => c.id === recommends)?.text ?? ""}
              memory={ctx.adviserMemory[id]}
              forecast={showForecasts ? ctx.adviserForecasts[id] : undefined}
            />
          );
        })}
      </section>

      <AdviserSplit scenario={scenario} options={open} advisers={pub.advisers} />

      {!crisis && (
        <details className="border border-rule p-4">
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
    </div>
  );
}
