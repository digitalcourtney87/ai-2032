// Every sentence the debrief builds from simulated numbers. Pure functions, so the
// copy rules can be tested: each statistic is prefixed "Under this game's
// assumptions", no decision is called right or wrong, and causal links are shown
// with the probability change they caused (spec Section 14).

import type { CounterfactualResult, DisplayedState, MetricKey } from "../../engine";
import { METRIC_LABEL, percent, TRACK_LABEL } from "../format";

export const PREFIX = "Under this game's assumptions";

const points = (value: number) => `${Math.abs(Math.round(value))} point${Math.abs(Math.round(value)) === 1 ? "" : "s"}`;

/** The verdict half of a luck tag. It describes the option's standing, never the player's judgement. */
export function soundSentence(sound: boolean, rank: number, of: number): string {
  return sound
    ? `${PREFIX}, this option ranked ${rank} of ${of} on expected outcome, judged only on what you could have known then. That counts as sound.`
    : `${PREFIX}, this option ranked ${rank} of ${of} on expected outcome, judged only on what you could have known then. That counts as risky.`;
}

/** A causal link, always with the change in probability it produced. */
export function causalSentence(eventTitle: string, before: number, after: number): string {
  if (Math.round(before * 100) === Math.round(after * 100)) {
    return `${PREFIX}, this decision left the odds of “${eventTitle}” unchanged at ${percent(after)}.`;
  }
  const verb = after > before ? "raised" : "lowered";
  return `${PREFIX}, this decision ${verb} the odds of “${eventTitle}” from ${percent(before)} to ${percent(after)}.`;
}

export function outcomeSentence(label: string, probability: number, happened: boolean): string {
  return `${PREFIX}, the chance of “${label}” was ${percent(probability)} when you decided. It ${happened ? "happened" : "did not happen"}.`;
}

/** The what-if result, in the spec's phrasing: incidents first, then the metrics that moved most. */
export function whatIfSentences(result: CounterfactualResult, scenarioTitle: string, asPlayedText: string, newText: string): string[] {
  const { asPlayed, changed } = result;
  const sentences = [
    `${PREFIX}, choosing “${newText}” instead of “${asPlayedText}” in ${scenarioTitle} moved serious incidents from ${percent(asPlayed.seriousIncidentShare)} of runs to ${percent(changed.seriousIncidentShare)}.`,
  ];
  const moved = (Object.keys(METRIC_LABEL) as MetricKey[])
    .map((key) => ({ key, delta: changed.medianMetrics[key] - asPlayed.medianMetrics[key] }))
    .filter((m) => Math.round(m.delta) !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  if (moved.length > 0) {
    const list = moved.map((m) => `${m.delta > 0 ? "raised" : "lowered"} median ${METRIC_LABEL[m.key]} by ${points(m.delta)}`);
    sentences.push(`${PREFIX}, it ${list.join(", and ")}.`);
  } else {
    sentences.push(`${PREFIX}, it moved no median metric by a whole point.`);
  }
  const scoreDelta = changed.meanScore - asPlayed.meanScore;
  sentences.push(`${PREFIX}, the mean ending score ${Math.abs(scoreDelta) < 0.05 ? "did not change" : `${scoreDelta > 0 ? "rose" : "fell"} by ${Math.abs(scoreDelta).toFixed(1)}`}.`);
  return sentences;
}

export function whatIfMethod(result: CounterfactualResult, profileLabel: string): string {
  return `${result.runs.toLocaleString("en-GB")} reruns across fresh seeds in the same world profile (${profileLabel}), with your other decisions replayed as you made them. This is the model's output, not a finding.`;
}

// ---------------------------------------------------------------- calibration

export interface CalibrationBin {
  label: string;
  /** Mean forecast in the bin, 0..100. */
  forecast: number;
  /** Share of those forecasts that came true, 0..100. */
  observed: number;
  count: number;
}

/** Five equal bins. A forecast of exactly 100% falls in the top bin. */
export function calibrationBins(forecasts: { forecast: number; outcome: 0 | 1 }[]): CalibrationBin[] {
  return [0, 1, 2, 3, 4].flatMap((index) => {
    const inBin = forecasts.filter((f) => Math.min(4, Math.floor(f.forecast * 5)) === index);
    if (inBin.length === 0) return [];
    return [{
      label: `${index * 20}–${index * 20 + 20}%`,
      forecast: (inBin.reduce((sum, f) => sum + f.forecast, 0) / inBin.length) * 100,
      observed: (inBin.filter((f) => f.outcome === 1).length / inBin.length) * 100,
      count: inBin.length,
    }];
  });
}

// ---------------------------------------------------------------- the run summary (DECISIONS.md, decision 11)

export interface RunRecord {
  seedCode: string;
  ending: string;
  endingScore: number;
  brier: number;
  decisions: { turn: number; scenario: string; choice: string; forecast: number; outcome: 0 | 1; boughtInfo: boolean; investedIn: string | null }[];
}

export function runSummary(view: DisplayedState, scenarioTitle: (id: string) => string, endingTitle: string): RunRecord {
  const debrief = view.debrief!;
  return {
    seedCode: view.seedCode,
    ending: endingTitle,
    endingScore: Math.round(debrief.endingScore * 10) / 10,
    brier: Math.round(debrief.brier * 1000) / 1000,
    decisions: (view.history ?? []).map((record, index) => ({
      turn: record.turn,
      scenario: scenarioTitle(record.scenarioId),
      choice: record.choiceId,
      forecast: Math.round(record.forecast * 100),
      outcome: debrief.forecasts[index]?.outcome ?? 0,
      boughtInfo: record.boughtInfo,
      investedIn: record.investedIn,
    })),
  };
}

export function runSummaryText(summary: RunRecord): string {
  const lines = summary.decisions.map((d) =>
    `${d.turn}. ${d.scenario}: option ${d.choice}; forecast ${d.forecast}% (${d.outcome === 1 ? "happened" : "did not happen"})`
    + `${d.boughtInfo ? "; bought analysis" : ""}${d.investedIn ? `; invested in ${TRACK_LABEL[d.investedIn as keyof typeof TRACK_LABEL]}` : ""}`);
  return [`AI 2032 run summary`, `Seed code: ${summary.seedCode}`, `Ending: ${summary.ending}`, `Brier score: ${summary.brier}`, ``, ...lines].join("\n");
}
