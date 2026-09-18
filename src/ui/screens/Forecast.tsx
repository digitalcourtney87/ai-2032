import { useState } from "react";
import { AdviserSeal } from "../components/AdviserSeal";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { ADVISER_ORDER, ADVISER_VAR, formatMonth, percent } from "../format";
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
          <span className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
            <Icon name="forecast" />
            Forecast
          </span>
          {scenario.forecastQuestion}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Resolves by {formatMonth(scenario.resolvesBy)}. Your forecasts are scored for calibration at the end, alongside your advisers&rsquo;.
        </p>

        <label htmlFor="forecast" className="mt-5 block font-semibold">
          Your probability:{" "}
          <output htmlFor="forecast" className="font-mono tabular-nums">
            {value}%
          </output>
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
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted" aria-hidden="true">
          <span>0% will not happen</span>
          <span>50%</span>
          <span>100% certain</span>
        </div>
      </section>

      <section aria-label="Adviser estimates">
        <h2 className="text-sm font-semibold">Your advisers&rsquo; estimates</h2>
        <p className="mt-1 text-xs text-muted">Your forecast sits on the same scale, so you can see where you stand against the room.</p>

        <div aria-hidden="true" className="relative mt-6 h-20 overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
          {[0, 25, 50, 75, 100].map((tick) => (
            <span key={tick} className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-rule" style={{ left: `${tick}%` }} />
          ))}
          {ADVISER_ORDER.map((id) => {
            const p = Math.round(ctx.adviserForecasts[id] * 100);
            const adviser = pub.advisers.find((a) => a.id === id)!;
            return (
              <span key={id} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${p}%` }}>
                <AdviserSeal id={id} name={adviser.name} size="sm" />
                <span className="mt-0.5 font-mono text-[10px] font-medium" style={{ color: `var(${ADVISER_VAR[id]})` }}>
                  {p}%
                </span>
                <span className="h-2 w-px" style={{ background: `var(${ADVISER_VAR[id]})` }} />
              </span>
            );
          })}
          <span className="absolute inset-y-0 w-px -translate-x-1/2 bg-ink" style={{ left: `${value}%` }} />
          <span className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${value}%` }}>
            <span className="size-3 rotate-45 border-2 border-ink bg-paper" />
            <span className="mt-1 font-mono text-[10px] font-semibold">You {value}%</span>
          </span>
        </div>

        <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
          {ADVISER_ORDER.map((id) => {
            const adviser = pub.advisers.find((a) => a.id === id)!;
            return (
              <li key={id} className="flex items-center justify-between gap-2 border-b border-rule py-1.5">
                <span className="flex items-center gap-2">
                  <AdviserSeal id={id} name={adviser.name} size="sm" />
                  {adviser.name}
                </span>
                <span className="font-mono font-medium">{percent(ctx.adviserForecasts[id])}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">Each adviser has a track record, and each is sometimes wrong. You will see their scores at the end.</p>
      </section>

      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>
    </div>
  );
}
