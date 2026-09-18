import { useState } from "react";
import { Button } from "../components/Button";
import { ADVISER_ORDER, formatMonth, percent } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onForecast: (probability: number) => void;
}

/** Step 2: one probability, one slider. Adviser estimates sit beside it as anchors (spec risk register). */
export function Forecast({ view, scenario, onForecast }: Props) {
  const [value, setValue] = useState(50);
  const ctx = view.current!;

  return (
    <div className="space-y-6">
      <section aria-labelledby="forecast-question">
        <h2 id="forecast-question" className="text-xl">
          {scenario.forecastQuestion}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Resolves by {formatMonth(scenario.resolvesBy)}. Your forecasts are scored for calibration at the end, alongside your advisers&rsquo;.
        </p>

        <label htmlFor="forecast" className="mt-5 block font-semibold">
          Your probability: <output htmlFor="forecast" className="tabular-nums">{value}%</output>
        </label>
        <input
          id="forecast"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="mt-2 w-full accent-(--accent)"
        />
        <div className="flex justify-between text-xs text-muted" aria-hidden="true">
          <span>0% will not happen</span>
          <span>50%</span>
          <span>100% certain</span>
        </div>
      </section>

      <section aria-label="Adviser estimates">
        <h2 className="text-sm font-semibold">Your advisers&rsquo; estimates</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {ADVISER_ORDER.map((id) => (
            <li key={id} className="flex justify-between border-b border-rule py-1">
              <span>{pub.advisers.find((a) => a.id === id)!.name}</span>
              <span className="font-semibold tabular-nums">{percent(ctx.adviserForecasts[id])}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Each adviser has a track record, and each is sometimes wrong. You will see their scores at the end.</p>
      </section>

      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>
    </div>
  );
}
