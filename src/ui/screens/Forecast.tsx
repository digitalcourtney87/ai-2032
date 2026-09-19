import { useState } from "react";
import { Button } from "../components/Button";
import { ForecastScale } from "../components/ForecastScale";
import { adviserRange, estimateLine, ESTIMATES_CAPTION, initials, resolvesLine } from "../copy";
import { ADVISER_ORDER } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onForecast: (probability: number) => void;
}

/**
 * Step 2: one probability, one slider. Gut feel first: the advisers' estimates stay
 * hidden until the player asks to compare, then appear on the slider's own scale.
 * Comparing is optional and Lock in never waits for it (DECISIONS F, D4; this
 * amends the spec's "adviser estimates shown beside it as anchors").
 */
export function Forecast({ view, scenario, onForecast }: Props) {
  const [value, setValue] = useState(50);
  /** Whether the player has moved the slider at all. The default of 50 is not their guess. */
  const [moved, setMoved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  /**
   * What the player had said when they first compared: a whole percent, or null if they
   * had not moved the slider. Undefined until then. Only for the sentence below; never stored (D4).
   */
  const [firstGuess, setFirstGuess] = useState<number | null | undefined>(undefined);
  const ctx = view.current!;
  const advisers = ADVISER_ORDER.map((id) => {
    const { name } = pub.advisers.find((a) => a.id === id)!;
    return { id, name, initials: initials(name), probability: ctx.adviserForecasts[id] };
  });

  function change(next: number) {
    setValue(next);
    setMoved(true);
  }

  function compare() {
    if (firstGuess === undefined) setFirstGuess(moved ? value : null);
    setRevealed(!revealed);
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="forecast-heading">
        <h2 id="forecast-heading" className="text-xl">
          How likely do you think this is?
        </h2>
        <p id="forecast-question" className="mt-2 text-lg">
          {scenario.forecastQuestion}
        </p>
        <p className="mt-1 text-sm text-muted">
          {resolvesLine(scenario.resolvesBy, ctx.isFinal)} You will see the answer, and how your guess and your advisers&rsquo; compared with it,
          at the end of the game.
        </p>

        <ForecastScale value={value} onChange={change} marks={revealed ? advisers : null} describedBy="forecast-question" />

        <Button variant="quiet" className="mt-4" aria-expanded={revealed} aria-controls="adviser-estimates" onClick={compare}>
          Compare with your advisers
        </Button>
        <div id="adviser-estimates" className="mt-3">
          {/* The caption comes first so the group of figures opens with the prefix (DECISIONS F12). */}
          {revealed && <p className="mb-1 text-xs text-muted">{ESTIMATES_CAPTION}</p>}
          <p aria-live="polite" className="text-sm font-semibold">
            {revealed && firstGuess !== undefined ? adviserRange(firstGuess, advisers.map((a) => a.probability)) : ""}
          </p>
          {revealed && (
            <ul aria-label="Your advisers’ estimates" className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {advisers.map((adviser) => (
                <li key={adviser.id} className="flex gap-2 border-b border-rule py-1">
                  <span aria-hidden="true" className="w-7 shrink-0 font-mono text-xs leading-5">
                    {adviser.initials}
                  </span>
                  <span>{estimateLine(adviser.name, adviser.probability)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>
    </div>
  );
}
