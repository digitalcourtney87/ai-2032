// Sentence builders for the play screens. Pure and window-free, so Vitest can run
// them in Node (tests/ui/play-copy.test.ts checks them against the copy rules).
// They take public content as parameters and never import ./useGame.
// The debrief's builders live in ./debrief/copy.ts.

import { ADVISER_ORDER, DOMAIN_LABEL, formatMonth, METRIC_LABEL, percent, signed, TRACK_LABEL, type ExactMetric } from "./format";
import type { PublicAdviser, PublicChoice, PublicRules, PublicScenario } from "../content";
import type { CapacityLabel, Domain, Track } from "../engine";
import type { Band, MeasuredChange, TurnConsequences } from "./consequences";
import type { MilestoneStatus } from "./preparation";
import type { ChoicePreview, PreviewRow } from "./preview";

// ---------------------------------------------------------------- the forecast

/** Upper bound (inclusive, whole percent) of each band. Symmetric around 50; only 0 and 100 say "certain". */
const CHANCE_WORDS: readonly (readonly [number, string])[] = [
  [0, "certain not to happen"],
  [5, "almost certainly not"],
  [39, "unlikely"],
  [60, "a toss-up"],
  [94, "likely"],
  [99, "almost certain"],
  [100, "certain to happen"],
];

/** 35 becomes "unlikely". Describes the player's own slider value, nothing else. */
export function verbalChance(percentValue: number): string {
  if (!Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) {
    throw new RangeError(`A chance is between 0 and 100, not ${percentValue}`);
  }
  const whole = Math.round(percentValue);
  return CHANCE_WORDS.find(([upTo]) => whole <= upTo)![1];
}

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * "You said 35%. Your advisers range from 47% to 68%." The guess is the slider's
 * whole percent when the player first compared, or null if they compared before
 * moving the slider: the default of 50 is not their guess. The estimates are the
 * engine's 0..1 probabilities. No average: one number would read as the answer
 * and flatten the disagreement.
 */
export function adviserRange(guessPercent: number | null, estimates: readonly number[]): string {
  if (estimates.length === 0) throw new Error("adviserRange needs at least one estimate");
  const shown = estimates.map((p) => Math.round(p * 100));
  const low = Math.min(...shown);
  const high = Math.max(...shown);
  const said = guessPercent === null ? "You compared before moving the slider." : `You said ${Math.round(guessPercent)}%.`;
  return low === high ? `${said} Your advisers all say ${low}%.` : `${said} Your advisers range from ${low}% to ${high}%.`;
}

/**
 * When the forecast question is settled. The final question would resolve after the
 * game ends, so the game's own simulation settles it (DECISIONS B10). It says
 * "simulation", not "model": on that turn "the model" is the AI system in the question.
 */
export function resolvesLine(resolvesBy: string, isFinal: boolean): string {
  return isFinal
    ? `We would only find out by ${formatMonth(resolvesBy)}, after the game ends, so the game's simulation settles it when you finish.`
    : `We will find out by ${formatMonth(resolvesBy)}.`;
}

/** "Dr Maya Shah: 52%", for the list of estimates beside the scale. */
export const estimateLine = (name: string, probability: number) => `${name}: ${percent(probability)}`;

const TITLES = new Set(["Dr", "Prof", "Sir", "Dame", "Mr", "Mrs", "Ms"]);

/** "Dr Maya Shah" becomes "MS": the label on an adviser's mark. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word && !TITLES.has(word));
  const firstWord = words[0] ?? "";
  const lastWord = words[words.length - 1] ?? "";
  return `${firstWord.charAt(0)}${words.length > 1 ? lastWord.charAt(0) : ""}`.toUpperCase();
}

// ---------------------------------------------------------------- the advisers

/** "A, B and C" (no serial comma). */
export function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * "Backs option A: Voluntary incident-reporting pact with developers and insurers.",
 * or "Backs option A." when the card leaves the option's text to the split.
 */
export const backsLine = (choiceId: string, choiceText?: string) =>
  choiceText ? `Backs option ${choiceId}: ${choiceText}` : `Backs option ${choiceId}.`;

/**
 * Under an option opened by investment that no adviser backs. In the content every
 * such option is unbacked, because each adviser's recommendation was written among the
 * base options, so "No adviser backs this option." would read as a verdict on the
 * player's preparation.
 */
export const PREPARED_UNBACKED = "Your advisers' recommendations do not include this option.";

/** The line under an option in the split. `prepared`: the option was opened by the player's investment. */
export const backersLine = (names: readonly string[], prepared = false) =>
  names.length > 0 ? `Backed by ${listOf(names)}.` : prepared ? PREPARED_UNBACKED : "No adviser backs this option.";

export interface WhoBacksRow {
  id: string;
  text: string;
  /** Opened by the player's investment. */
  prepared: boolean;
  /** Adviser names, in ADVISER_ORDER. Empty when nobody backs the option. */
  backers: string[];
}

/** One row per open option, in the order given, with the advisers who recommend it. Uses only public fields. */
export function whoBacksWhat(scenario: PublicScenario, options: readonly PublicChoice[], advisers: readonly PublicAdviser[]): WhoBacksRow[] {
  const nameOf = (id: string) => {
    const adviser = advisers.find((a) => a.id === id);
    if (!adviser) throw new Error(`Unknown adviser "${id}"`);
    return adviser.name;
  };
  return options.map((choice) => ({
    id: choice.id,
    text: choice.text,
    prepared: choice.unlock !== null,
    backers: ADVISER_ORDER.filter((id) => scenario.advisers[id].recommends === choice.id).map(nameOf),
  }));
}

// ---------------------------------------------------------------- fixed captions

/** Under the analysts' assessment on the briefing. New copy avoids "wrong" (DECISIONS F12). */
export const ASSESSMENT_CAVEAT = "Analysts can misjudge this. How often depends on how strong the evidence is and on your State Capacity.";

/**
 * Opens the advisers' estimates once the player compares. The estimates are figures the
 * game generates, so the group begins with the prefix (DECISIONS F12).
 */
export const ESTIMATES_CAPTION =
  "Under this game's assumptions, these are your advisers' own estimates, not facts, and each adviser is sometimes off. At the end you will see how close each of them came.";

// ---------------------------------------------------------------- Phase 11: decision, investment and consequences
// A group of simulated figures is introduced by a caption that begins "Under this
// game's assumptions" (DECISIONS.md, F12). Political Capital is the player's own
// budget, not a simulated statistic, so capital sentences carry no prefix, except the
// income rules, which name a Public Trust threshold.

/** The caption over the options' stated effects, on the Decision screen. */
export const DECISION_INTRO = "Under this game's assumptions, each option lists the effects officials expect. Every option also has effects you cannot see from here.";
export const OFFICIALS_EXPECT = "Under this game's assumptions, officials expect:";
export const NO_STATED_EFFECT = "Under this game's assumptions, officials expect no immediate effect you can see.";
/** The preview before any option is selected. */
export const PREVIEW_PROMPT = "Choose an option above to see the Political Capital it would leave and what officials expect it to do.";

/** The one-line, live summary beside the Confirm button. */
export function previewSummary(preview: ChoicePreview | null): string {
  if (!preview) return "Choose an option to see what it would cost.";
  if (preview.capitalAfter !== null) return `Option ${preview.id}: Political Capital ${preview.capitalNow} → ${preview.capitalAfter} (costs ${preview.cost}).`;
  if (preview.status === "unaffordable") return `Option ${preview.id}: ${unaffordableLine(preview.cost, preview.capitalNow)} Choose another option.`;
  return `Option ${preview.id} is locked. Choose another option.`;
}

/** "National Security +4 (now 52)". Estimates and the label get the stated change only. */
export function previewRowText(row: PreviewRow): string {
  const change = `${METRIC_LABEL[row.metric]} ${signed(row.delta)}`;
  if (row.now !== null) return `${change} (now ${row.now})`;
  return row.metric === "stateCapacity" ? `${change} (shown only as a label)` : `${change} (an estimate, with no exact figure)`;
}

/**
 * Always shown in the preview, with or without a selection. Never a per-option "may
 * fail", which would expose hidden conditions.
 */
export function previewCaveat(isFinal: boolean): string {
  const movers = isFinal ? "background change and events" : "background change, events and this turn's investment";
  return `Officials' expectations are not promises: plans do not always work out. Other effects are not shown, and ${movers} also move the numbers.`;
}

export const unaffordableLine = (cost: number, have: number) => `Costs ${cost}; you have ${have}.`;
export const levelHaveLine = (level: number) => `You have level ${level}.`;

/**
 * Why some options in this scenario cost less. `turnsLeft` counts this turn, capped at
 * the turns left in the game. The pricing class ("restrictive") is not public, so the
 * note says "some options" and the prices on the cards already include the discount.
 */
export function windowNote(domain: Domain, turnsLeft: number, rules: PublicRules): string {
  const span = turnsLeft === 1 ? "this turn only" : turnsLeft === 2 ? "this turn and next" : `for ${turnsLeft} turns, counting this one`;
  return `Some options here cost ${rules.windowDiscount} less Political Capital than usual (never below ${rules.windowMinCost}) ${span}, because a public incident in ${DOMAIN_LABEL[domain]} has made restrictions easier to pass. The costs shown already include this.`;
}

/** Why some options cost more while the economy booms. Economy is a simulated figure, so the note carries the prefix. */
export function boomNote(rules: PublicRules): string {
  return `Under this game's assumptions, the economy is booming (Economy ${rules.boomEconomyAt} or above), so some of the more restrictive options cost ${rules.boomSurcharge} more Political Capital than usual. The costs shown already include this.`;
}

// The investment ladder.

export function ladderIntro(points: number, levels: number, thisPoint: number): string {
  return `One point each turn, into one track. It costs no Political Capital. You have ${points} points in the whole game and ${levels} levels to fill, so you cannot prepare for everything. This is point ${thisPoint} of ${points}.`;
}
export const LADDER_CAPTION = "Under this game's assumptions, each level adds its bonus once, when you reach it.";
export const thisTurnLine = (from: number) => `This turn: level ${from} → ${from + 1}. Takes effect when the turn ends.`;
export const TRACK_COMPLETE = "Complete: all three levels reached.";
export const MILESTONE_STATUS: Record<MilestoneStatus, string | null> = {
  ahead: "still ahead",
  outOfReach: "too few turns left to reach this level in time",
  passed: "no remaining turn uses this",
  standing: null,
};

// The consequences screen.

export const chosenLine = (id: string, text: string) => `You chose option ${id}: ${text}`;
export function spentLine(chose: NonNullable<TurnConsequences["chose"]>, infoCost: number): string {
  return chose.boughtAnalysis
    ? `It cost ${chose.costPaid} Political Capital, and the analysis ${infoCost} more.`
    : `It cost ${chose.costPaid} Political Capital.`;
}
/** Under "Your decision": where the point went, never the level change (see trackLevelsLine). */
export const investmentPointLine = (track: Track) => `You put this turn's investment point into ${TRACK_LABEL[track]}.`;
/**
 * Every track level that changed, listed with the measured changes and never under "Your
 * decision": a rise beyond the investment point comes from effects the player cannot see.
 */
export const trackLevelsLine = (changes: TurnConsequences["trackChanges"]) =>
  `Standing investment: ${changes.map((c) => `${TRACK_LABEL[c.track]} level ${c.from} → ${c.to}`).join("; ")}.`;
export const HEADLINES_NOTE = "Headlines report what was noticed, which is not always what happened.";
export const DECISION_AS_REPORTED = "Your decision, as reported";
export const ALSO_REPORTED = "Also reported";
export const NOTHING_ELSE = "Nothing else made the news this turn.";
/** Revealed findings are drawn at a reliability below 100 (resolve.ts), like the briefing's assessment. */
export const FINDINGS_CAVEAT = "Findings are not always accurate, like any assessment.";

/** A policy window opened by this turn's events. `turnsLeft` is capped at the turns left in the game. */
export function windowOpenedNote(domain: Domain, turnsLeft: number, rules: PublicRules): string {
  const span = turnsLeft === 1 ? "next turn" : `for the next ${turnsLeft} turns`;
  return `After this public incident in ${DOMAIN_LABEL[domain]}, some options in that area will cost ${rules.windowDiscount} less Political Capital (never below ${rules.windowMinCost}) ${span}. Restrictions are easiest to pass after harm.`;
}

export function measuredCaption(isFinal: boolean): string {
  const causes = isFinal ? "your decision, any events reported above, background trends and effects you cannot see" : "your decision, your investment, any events reported above, background trends and effects you cannot see";
  return `Under this game's assumptions, these are the changes you can measure since you decided. Each one combines ${causes}.`;
}
export const measuredRowText = (row: MeasuredChange) => `${METRIC_LABEL[row.metric]}: ${row.before} → ${row.after} (${signed(row.delta)})`;
export const unchangedLine = (metrics: ExactMetric[]) => `No change: ${metrics.map((m) => METRIC_LABEL[m]).join(", ")}.`;

/** Next turn's Political Capital. How income works is in the glossary (capitalRulesLine). */
export function capitalLine(capital: NonNullable<TurnConsequences["capital"]>): string {
  return `Political Capital: ${capital.leftAfterSpending} left after this turn's spending; ${capital.nextTurn} to start the next turn.`;
}

/** How Political Capital comes in, for the glossary. It names a Public Trust threshold, so it carries the prefix. */
export function capitalRulesLine(rules: PublicRules): string {
  return `Under this game's assumptions, each turn adds ${rules.perTurn} Political Capital; at most ${rules.carryCap} unspent points carry over; Public Trust at ${rules.trustBonusAt} or above adds 1, and at ${rules.trustPenaltyAt} or below takes 1 away.`;
}

export const capacityLine = (before: CapacityLabel, after: CapacityLabel) => `Under this game's assumptions, State Capacity is now ${after} (it was ${before}).`;

/** The estimates as they stand. Never a change: the bands are redrawn every turn. */
export function estimatesNowLine(systemicRisk: Band, cooperation: Band): string {
  return `Under this game's assumptions, Systemic AI Risk is now estimated at ${systemicRisk.low}–${systemicRisk.high} and International Cooperation at ${cooperation.low}–${cooperation.high}. Estimates are redrawn every turn, so a shift in a band is not a measured change.`;
}

export function openQuestionLine(unknown: NonNullable<TurnConsequences["unknown"]>): string {
  const yours = unknown.forecast === null ? "" : `You forecast ${percent(unknown.forecast)}. `;
  return `${yours}${unknown.question} It resolves by ${formatMonth(unknown.resolvesBy)}; you will see how it turned out in the debrief.`;
}
export const LATER_NOTE = "Some effects of decisions may surface later, if at all.";

// ---------------------------------------------------------------- the first-decision pause (Phase 12)
// The five-minute taster (DECISIONS.md F6): turn 1 of the real game, then a one-time
// pause. None of these sentences states a simulated statistic, so none carries the
// prefix, and none takes hidden state. Who backed what comes from whoBacksWhat and
// backersLine (Phase 10, above).

/** Spec Section 4: "Each turn ... takes about three minutes". A design estimate; only the human playtest can confirm it. */
const MINUTES_PER_DECISION = 3;

export const PAUSE_HEADING = "That was your first decision";

/** "Keep going: 7 more decisions, about 20 minutes, then your debrief." Derived from the run length, never hard-coded. */
export function remainingLine(totalTurns: number, turnsPlayed: number): string {
  const left = Math.max(0, totalTurns - turnsPlayed);
  const minutes = Math.max(5, Math.round((left * MINUTES_PER_DECISION) / 5) * 5);
  return `Keep going: ${left} more decision${left === 1 ? "" : "s"}, about ${minutes} minutes, then your debrief.`;
}

/** Names no interrupt and no timing (turn 1 never rolls a world event, so nothing here says chance has played out). */
export const WHAT_NEXT_NOTE =
  "Later turns may bring the unexpected. At the end, a debrief shows the hidden world you were in and separates what you decided from what the dice delivered.";

/** The player's own number, in the forecast screen's words. Not a simulated statistic, so no prefix. */
export function forecastRecap(forecast: number): string {
  return `You said ${percent(forecast)}.`;
}

export const STILL_OPEN_NOTE = "Nobody knows the answer yet. If you keep going, the debrief at the end shows how it turned out.";

/** Open questions. Nothing answers or scores them (engagement handoff: "discover what might change your mind"). */
export const THINK_IT_OVER = [
  "What would you need to see to move your forecast up or down?",
  "Which adviser's concern weighed most with you, and what would change your mind about it?",
] as const;

/**
 * A seed link reproduces a world; it is not a saved-progress link (engagement handoff).
 * Offered for a friend, as the debrief's share control is (Phase 13, DECISIONS.md F8):
 * a player who reopens it knows how it began, and it is no rewind to one decision.
 */
export function stopHereNote(seedCode: string): string {
  return `Anyone who opens this link starts world ${seedCode} from the first decision, with the same hidden facts and the same dice. Send it to a friend and compare what you each chose. If you open it yourself, you start again from the first decision, already knowing how it began. It is not saved progress: your choices so far are not in it, and they are not sent anywhere.`;
}

/**
 * A link that reproduces this world from the start: `seed` set, a facilitator's `cfg`
 * kept, everything else (including `facilitator`) dropped. The debrief's share
 * control (Phase 13) imports this too.
 */
export function worldLink(base: string, search: string, seedCode: string): string {
  const params = new URLSearchParams();
  params.set("seed", seedCode);
  const cfg = new URLSearchParams(search).get("cfg");
  if (cfg) params.set("cfg", cfg);
  return `${base}?${params.toString()}`;
}
