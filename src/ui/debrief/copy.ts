// Every sentence the debrief builds from simulated numbers. Pure functions, so the
// copy rules can be tested: each statistic is prefixed "Under this game's
// assumptions", no decision is called right or wrong, and causal links are shown
// with the probability change they caused (spec Section 14).

import {
  luckTag,
  type CompositeKey,
  type CounterfactualResult,
  type DisplayedState,
  type LuckLink,
  type MetricKey,
  type OptionEstimate,
  type Profile,
} from "../../engine";
import { METRIC_LABEL, percent, TRACK_LABEL } from "../format";

export const PREFIX = "Under this game's assumptions";

export const SOUNDNESS_WEIGHING = "Weighing the options you had…";
export const SOUNDNESS_UNAVAILABLE = "We couldn’t compare your decisions. Try again.";
export const SOUNDNESS_RETRY = "Retry decision comparison";
export const WHAT_IF_UNAVAILABLE = "We couldn’t complete the rerun. Try again.";
export const WHAT_IF_RETRY = "Retry rerun";
export const WHAT_IF_PREVIOUS = "Previous result for this comparison.";

/** A briefing or purchase, judged against the fact it was about — never as a right or wrong call. */
export const INTEL_MATCHED = "Matched the fact";
export const INTEL_MISSED = "Did not match the fact";

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
export function whatIfSentences(result: CounterfactualResult, scenarioTitle: string, asPlayedText: string, newText: string, unaffordable = false): string[] {
  const { asPlayed, changed } = result;
  const incidents = `moved serious incidents from ${percent(asPlayed.seriousIncidentShare)} of runs to ${percent(changed.seriousIncidentShare)}`;
  const sentences = [
    unaffordable
      ? `${PREFIX}, “${newText}” cost more Political Capital than you had at the time. A replay takes it only when that world's capital can pay for it; otherwise it uses the nearest affordable option. Across those replays it ${incidents}.`
      : `${PREFIX}, choosing “${newText}” instead of “${asPlayedText}” in ${scenarioTitle} ${incidents}.`,
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

// ---------------------------------------------------------------- the debrief for everyone (DECISIONS.md, section F)

/**
 * The decision to argue about: the one the dice went against most, or, if luck
 * never went against the player, the one it favoured most. Read only from the
 * debrief summary, never from the worker's rankings, so it is fixed the moment
 * the debrief opens and identical on every replay of the same run.
 */
export function pivotalDecision(debrief: { luck: readonly { delta: number }[] }): number {
  const deltas = debrief.luck.map((entry) => entry.delta);
  if (deltas.length === 0) return 0;
  const lowest = Math.min(...deltas);
  if (lowest < 0) return deltas.indexOf(lowest);
  const largest = Math.max(...deltas.map(Math.abs));
  return Math.max(0, deltas.findIndex((delta) => Math.abs(delta) === largest));
}

/** Why that decision was picked: which way its dice fell, never whether it was a good choice. */
export function pivotSentence(delta: number): string {
  if (delta < 0) return `${PREFIX}, no other decision had its chance events go against you more than this one.`;
  if (delta > 0) return `${PREFIX}, none of your decisions was unlucky, and no other decision had its chance events go your way more than this one.`;
  return `${PREFIX}, the chance events tied to your decisions landed as their odds implied, so no decision was clearly lucky or unlucky.`;
}

export const DEFEND_PROMPT = "Would you defend this choice, knowing how it turned out?";

export interface NotableOutcome {
  /** The decision the chance event was tied to. */
  index: number;
  link: LuckLink;
}

/**
 * The least likely thing that happened: of every chance event tied to a decision,
 * the one that happened against the longest odds; hidden facts only when no event
 * was at stake. If nothing in that pool happened, the likeliest thing that did not.
 * Certainties are skipped.
 */
export function leastLikelyOutcome(debrief: { luck: readonly { links: readonly LuckLink[] }[] }): NotableOutcome | null {
  const chances = debrief.luck.flatMap((entry, index) =>
    entry.links.filter((link) => link.probability > 0 && link.probability < 1).map((link) => ({ index, link })));
  // An event reads as something that happened. A hidden fact is a state of the world, named in condition
  // language ("the authentication result did not match"), so it is used only when no event was at stake.
  const events = chances.filter((chance) => chance.link.kind === "event");
  const pool = events.length > 0 ? events : chances;
  const happened = pool.filter((chance) => chance.link.happened);
  if (happened.length > 0) return happened.reduce((least, chance) => (chance.link.probability < least.link.probability ? chance : least));
  if (pool.length > 0) return pool.reduce((likeliest, chance) => (chance.link.probability > likeliest.link.probability ? chance : likeliest));
  return null;
}

/** Which decision a chance event was linked to, always with the change in odds that decision made, never as fate. */
export function linkSentence(turn: number, scenarioTitle: string, before: number, after: number): string {
  if (Math.round(before * 100) === Math.round(after * 100)) {
    return `${PREFIX}, your decision in turn ${turn}, ${scenarioTitle}, left its odds unchanged at ${percent(after)}.`;
  }
  return `${PREFIX}, your decision in turn ${turn}, ${scenarioTitle}, ${after > before ? "raised" : "lowered"} its odds from ${percent(before)} to ${percent(after)}.`;
}

/** The three composites in plain words, with the one rule that gives a newcomer a reference point (content/endings.json: 55). */
export function compositeSentence(composites: Record<CompositeKey, number>): string {
  const [control, prosperity, legitimacy] = [composites.control, composites.prosperity, composites.legitimacy].map(Math.round);
  return `${PREFIX}, the country finished on ${control} out of 100 for control (security, the state's capacity and low systemic AI risk), `
    + `${prosperity} for prosperity (economy, innovation and social stability) and ${legitimacy} for legitimacy (public trust). `
    + "Most endings depend on whether control and prosperity each reached 55.";
}

/** How often the game draws each kind of world, read from the weights in force, so a facilitator's edits show truthfully. */
export function profileShareSentence(weights: Record<Profile, number>): string {
  const total = weights.benign + weights.contested + weights.hard;
  const share = (weight: number) => `${Math.round((weight / total) * 100)}%`;
  return `The game draws a benign world ${share(weights.benign)} of the time, a contested one ${share(weights.contested)} and a hard one `
    + `${share(weights.hard)}, then draws each fact below from that world’s odds.`;
}

export interface EndingRow {
  endingId: string;
  /** Share of the replays, 0..1. */
  asPlayed: number;
  changed: number;
}

/** Every ending either arm of a what-if reached, most common first. */
export function whatIfEndingRows(result: CounterfactualResult): EndingRow[] {
  const ids = [...new Set([...Object.keys(result.asPlayed.endings), ...Object.keys(result.changed.endings)])];
  return ids
    .map((endingId) => ({ endingId, asPlayed: result.asPlayed.endings[endingId] ?? 0, changed: result.changed.endings[endingId] ?? 0 }))
    .sort((a, b) => Math.max(b.asPlayed, b.changed) - Math.max(a.asPlayed, a.changed) || a.endingId.localeCompare(b.endingId));
}

export function whatIfEndingCaption(runs: number): string {
  return `${PREFIX}, how the ${runs.toLocaleString("en-GB")} replays ended, with your choices and with the change`;
}

/** A decision's rank among the options open at the time. Null until the worker's rankings arrive. */
export interface Standing {
  rank: number;
  of: number;
  /** Among the two strongest options on what could have been known then (spec Section 11). */
  sound: boolean;
}

export function standing(ranking: readonly OptionEstimate[] | undefined, choiceId: string): Standing | null {
  if (!ranking) return null;
  const rank = ranking.findIndex((estimate) => estimate.choiceId === choiceId) + 1;
  return rank > 0 ? { rank, of: ranking.length, sound: rank <= 2 } : null;
}

/** "Sound and unlucky": one of the spec's four luck tags, capitalised for display. */
export function tagText(position: Standing, fortunate: boolean): string {
  return luckTag(position.sound, fortunate).replace(/^./, (first) => first.toUpperCase());
}

const TAG_ORDER = ["Sound and fortunate", "Sound and unlucky", "Risky and fortunate", "Risky and unlucky"];

/** How the tags added up across the run, in the spec's order, leaving out tags no decision earned. */
export function tallySentence(tags: readonly string[]): string {
  const counts = TAG_ORDER.map((tag) => ({ tag, count: tags.filter((t) => t === tag).length })).filter((c) => c.count > 0);
  const parts = counts.map((c, index) => `${c.count} ${index === 0 ? (c.count === 1 ? "was " : "were ") : ""}${c.tag.toLowerCase()}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "");
  return `${PREFIX}, of your ${tags.length} decision${tags.length === 1 ? "" : "s"}, ${list}.`;
}

export const BRIER_GLOSS =
  "It is a forecast score. For each question it measures how far the chance you gave was from what happened, counting a big miss far more "
  + "than a small one, then averages the eight. Lower means closer. Answering 50% every time scores 0.250; being certain every time and "
  + "matching every outcome would score 0. With eight forecasts it is a rough measure.";

/** One line under each reference panel's heading while it is closed. Each promises only what its panel shows. */
export const TEASER = {
  world: "Which kind of world you drew, its five hidden facts, and how the reports you read lined up with them.",
  calibration: "How close your forecasts came to what happened, and how your advisers scored on the same questions.",
  record: "Where the country ended on every measure, including the true values of those you saw only as a range or a label, and further reading.",
  unseen: "Options that stayed locked to you, and the crises you did not meet.",
} as const;

export const TALK_INTRO = "Questions to think about on your own, or to talk over with someone who has played. Each has more than one reasonable answer.";

/** Open questions for the end of a run. Never numbered in the text, so none can be mistaken for a decision line in a copied summary. */
export const DISCUSSION_PROMPTS: readonly string[] = [
  "Which of your decisions would you defend even if it had ended badly, and why?",
  "What surprised you most about the world you were in?",
  "Did an adviser ever change your mind? Whose advice did you set aside, and why?",
  "Which mattered most to you: keeping the country safe, keeping the economy growing, or keeping the public's trust? Did your choices show it?",
  "Has playing changed what you think about AI's risks or its benefits?",
];
