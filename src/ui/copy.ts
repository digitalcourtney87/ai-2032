// Sentence builders for the play screens. Pure and window-free, so Vitest can run
// them in Node (tests/ui/play-copy.test.ts checks them against the copy rules).
// They take public content as parameters and never import ./useGame.
// The debrief's builders live in ./debrief/copy.ts.

import { formatMonth, percent } from "./format";

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
