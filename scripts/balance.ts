// The balance harness (handoff Section 6, spec Section 8).
//
//   npm run balance            Rule 7, then Rules 4 and 5. Fails if any rule is broken.
//   npm run balance -- --runs 2000 --value-runs 1000    A quicker reading while tuning.
//   npm run balance -- --table   Also print every option's value in every profile.
//
// Rule 7: no fixed strategy (always most permissive, always middle, always most
//   restrictive) may give the best ending score in more than 40% of runs. It plays
//   10,000 paired-seed games per world profile and judges the shares POOLED across
//   the profiles at their published weights (30 / 40 / 30). Per-profile shares are
//   printed for information. See DECISIONS.md section E for why the rule is pooled:
//   judged per profile it cannot hold alongside Rules 4 and 5.
// Rules 4 and 5: in every scripted scenario, the waiting option and the most
//   restrictive option must each be the best choice in at least one world profile.
//   An option's value is its mean ending score when it is forced and every other
//   decision is left to the neutral policy. The interrupts are reported, not enforced:
//   each is reached in only some games.
//
// Tune the JSON in src/content, never the engine, then rerun. Log every change in
// DECISIONS.md section E.

import { loadContent } from "../src/content/load";
import { balanceForProfile, optionValues, PROFILES, runawayScenarios, STRATEGIES } from "../src/engine/simulate";

// A minimal declaration, so the script needs no Node type package (DECISIONS.md, B31).
declare const process: { argv: string[]; exitCode?: number };

const LIMIT = 0.4;
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string, fallback: number) => {
  const index = args.indexOf(name);
  return index >= 0 ? Number(args[index + 1]) : fallback;
};

const runs = option("--runs", 10_000);
const valueRuns = option("--value-runs", 4000);
const content = loadContent();
const percent = (share: number) => `${(share * 100).toFixed(1)}%`.padStart(6);
let failed = false;

// ---------------------------------------------------------------- Rule 7

console.log(`Rule 7: share of runs in which each fixed strategy gave the best ending score (${runs.toLocaleString("en-GB")} paired runs per profile; limit ${percent(LIMIT).trim()} pooled)\n`);
console.log(`${"worlds".padEnd(18)}${STRATEGIES.map((s) => s.padStart(13)).join("")}   mean scores`);

const rows = PROFILES.map((profile) => balanceForProfile(profile, runs, content));
for (const row of rows) {
  const label = `${row.profile} (${content.config.profiles[row.profile].weight}%)`;
  console.log(`${label.padEnd(18)}${STRATEGIES.map((s) => percent(row.winShare[s]).padStart(13)).join("")}   ${STRATEGIES.map((s) => row.meanScore[s].toFixed(1)).join(" / ")}`);
}

const totalWeight = PROFILES.reduce((sum, p) => sum + content.config.profiles[p].weight, 0);
const pooled = Object.fromEntries(STRATEGIES.map((s) =>
  [s, rows.reduce((sum, row) => sum + row.winShare[s] * content.config.profiles[row.profile].weight, 0) / totalWeight])) as Record<(typeof STRATEGIES)[number], number>;
console.log(`${"ALL WORLDS".padEnd(18)}${STRATEGIES.map((s) => `${percent(pooled[s])}${pooled[s] > LIMIT ? " FAIL" : ""}`.padStart(13)).join("")}`);

for (const strategy of STRATEGIES.filter((s) => pooled[s] > LIMIT)) {
  failed = true;
  const worst = rows.reduce((a, b) => (b.winShare[strategy] > a.winShare[strategy] ? b : a));
  const runaway = runawayScenarios(strategy, worst.profile, Math.min(runs, 1500), content).slice(0, 4);
  console.log(`  always-${strategy} wins too often, most of all in the ${worst.profile} world. Ending-score advantage of its pick over its rivals' picks, by scenario:`);
  for (const { scenarioId, advantage } of runaway) console.log(`    ${scenarioId.padEnd(22)} ${advantage >= 0 ? "+" : ""}${advantage.toFixed(2)}`);
}

// ---------------------------------------------------------------- Rules 4 and 5

console.log(`\nRules 4 and 5: is the waiting option, and the most restrictive option, the best choice in at least one world profile? (${valueRuns.toLocaleString("en-GB")} paired runs per profile)\n`);
const values = optionValues(valueRuns, content);

for (const scenarioId of content.scenarios.map((s) => s.id)) {
  const options = values.filter((v) => v.scenarioId === scenarioId).sort((a, b) => a.stance - b.stance);
  const bestIn = (profile: (typeof PROFILES)[number]) => options.reduce((best, o) => (o.meanScore[profile] > best.meanScore[profile] ? o : best));
  const runnerUpGap = (profile: (typeof PROFILES)[number]) => {
    const sorted = options.map((o) => o.meanScore[profile]).sort((a, b) => b - a);
    return sorted[0]! - sorted[1]!;
  };
  const waiting = options.find((o) => o.lever === "wait") ?? options[0]!;
  const strictest = options.at(-1)!;
  const enforced = content.sequence.includes(scenarioId);

  if (flag("--table")) {
    console.log(scenarioId);
    for (const o of options) {
      console.log(`  ${o.choiceId} (stance ${o.stance}, ${o.lever})`.padEnd(38) + PROFILES.map((p) => `${o.meanScore[p].toFixed(2)}${bestIn(p) === o ? "*" : " "}`.padStart(9)).join(""));
    }
  }
  const verdicts = ([["4", waiting], ["5", strictest]] as const).map(([rule, o]) => {
    const where = PROFILES.filter((p) => bestIn(p) === o);
    if (where.length === 0 && enforced) failed = true;
    const margin = where.length > 0 ? Math.max(...where.map(runnerUpGap)).toFixed(2) : "";
    return `Rule ${rule}: ${o.choiceId} ${where.length > 0 ? `best in ${where.join(", ")} (by ${margin})` : enforced ? "never best  FAIL" : "never best"}`;
  });
  console.log(`${`${scenarioId}${enforced ? "" : " (reported only)"}`.padEnd(38)}${verdicts.join("   ")}`);
}
if (flag("--table")) console.log("\nColumns: benign, contested, hard. * marks the best option in that profile.");

console.log(failed ? "\nBalance check FAILED." : "\nBalance check passed.");
if (failed) process.exitCode = 1;
