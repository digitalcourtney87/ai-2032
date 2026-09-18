import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import { calibrationBins } from "./copy";
import { ADVISER_ORDER, percent } from "../format";
import { pub } from "../useGame";
import type { DisplayedState } from "../../engine";

/** Panel 2: the Brier score across all forecasts, a calibration chart, and each adviser's score beside the player's. */
export function CalibrationPanel({ view }: { view: DisplayedState }) {
  const debrief = view.debrief!;
  const bins = calibrationBins(debrief.forecasts);
  const scores = [
    { name: "You", score: debrief.brier },
    ...ADVISER_ORDER.map((id) => ({ name: pub.advisers.find((a) => a.id === id)!.name, score: debrief.adviserBrier[id] ?? 0 })),
  ].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-5">
      <p>
        Your Brier score is{" "}
        <strong data-testid="brier" className="tabular-nums">
          {debrief.brier.toFixed(3)}
        </strong>
        . It is the average squared gap between each forecast and what happened: 0 is perfect, and always answering 50% scores 0.250.
        With eight forecasts it is a rough measure.
      </p>

      <figure>
        <div
          className="h-72 w-full"
          role="img"
          aria-label={`Calibration chart. ${bins.map((b) => `Forecasts of ${b.label}: ${b.count}, of which ${Math.round(b.observed)}% happened`).join(". ")}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 24 }}>
              <CartesianGrid stroke="var(--rule)" strokeDasharray="0" vertical={false} />
              <XAxis type="number" dataKey="forecast" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} unit="%" stroke="var(--ink)"
                axisLine={{ stroke: "var(--ink)", strokeWidth: 1 }} tickLine={{ stroke: "var(--rule)" }}
                tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
                label={{ value: "What you forecast", position: "insideBottom", offset: -18, fill: "var(--muted)" }} />
              <YAxis type="number" dataKey="observed" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} unit="%" stroke="var(--ink)"
                axisLine={{ stroke: "var(--ink)", strokeWidth: 1 }} tickLine={{ stroke: "var(--rule)" }}
                tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
                width={52} label={{ value: "How often it happened", angle: -90, position: "insideLeft", offset: -14, fill: "var(--muted)", style: { textAnchor: "middle" } }} />
              <ZAxis type="number" dataKey="count" range={[36, 160]} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="var(--muted)" strokeDasharray="2 4" />
              <Scatter data={bins} fill="var(--ink)" stroke="var(--ink)" isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="text-xs text-muted">
          Each dot groups your forecasts in a 20-point range; a larger dot holds more forecasts. A perfectly calibrated forecaster sits on the dashed line.
        </figcaption>
      </figure>

      <table className="w-full text-sm">
        <caption className="pb-1 text-left font-semibold">Every forecast</caption>
        <thead>
          <tr className="border-b border-rule text-left text-muted">
            <th scope="col" className="py-1 pr-2 font-normal">Question</th>
            <th scope="col" className="whitespace-nowrap py-1 pr-2 text-right font-normal">You said</th>
            <th scope="col" className="py-1 font-normal">What happened</th>
          </tr>
        </thead>
        <tbody>
          {debrief.forecasts.map((f) => (
            <tr key={f.turn} className="border-b border-rule align-top" data-testid="forecast-row" data-forecast={f.forecast} data-outcome={f.outcome}>
              <td className="py-1 pr-2">{pub.scenarios[f.scenarioId]?.forecastQuestion}</td>
              <td className="py-1 pr-2 text-right font-mono">{percent(f.forecast)}</td>
              <td className="whitespace-nowrap py-1">{f.outcome === 1 ? "It happened" : "It did not happen"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full max-w-sm text-sm">
        <caption className="pb-1 text-left font-semibold">Brier scores, best first</caption>
        <tbody>
          {scores.map((row) => (
            <tr key={row.name} className={`border-b border-rule ${row.name === "You" ? "font-semibold" : ""}`}>
              <th scope="row" className="py-1 pr-2 text-left font-[inherit]">{row.name}</th>
              <td className="py-1 text-right font-mono">{row.score.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted">Each adviser leans a known way, and each was sometimes wrong. None of them saw the hidden facts either.</p>
    </div>
  );
}
