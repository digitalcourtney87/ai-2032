// The balance harness (handoff Section 6, spec Section 8).
//
//   npm run balance            Rule 7: 10,000 games per world profile for the three
//                              fixed strategies. Fails if any tops 40% in any profile,
//                              and names the scenarios where that strategy runs away.
//   npm run balance -- --rules Also reports Rules 4 and 5: for each scenario, the worlds in which
//                              the waiting option and the most restrictive option are the best
//                              choice, judged by whole profile and by single latent fact.
//   npm run balance -- --runs 2000   Fewer games, for a quick look while tuning.
//
// Tune the JSON in src/content, never the engine, then rerun. Log every change in
// DECISIONS.md section E.

import { loadContent } from "../src/content/load";
import { balanceForProfile, optionValues, PROFILES, runawayScenarios, STRATEGIES, type WorldCell } from "../src/engine/simulate";
import { SEED_FACTS } from "../src/engine/seed";

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
const content = loadContent();
const percent = (share: number) => `${(share * 100).toFixed(1)}%`.padStart(6);
let failed = false;

// ---------------------------------------------------------------- Rule 7

console.log(`Rule 7: share of ${runs.toLocaleString("en-GB")} runs per profile in which each fixed strategy gave the best ending score (limit ${percent(LIMIT).trim()})\n`);
console.log(`${"profile".padEnd(11)}${STRATEGIES.map((s) => s.padStart(13)).join("")}   mean scores`);

for (const profile of PROFILES) {
  const row = balanceForProfile(profile, runs, content);
  const shares = STRATEGIES.map((s) => `${percent(row.winShare[s])}${row.winShare[s] > LIMIT ? " FAIL" : "     "}`.padStart(13)).join("");
  const means = STRATEGIES.map((s) => row.meanScore[s].toFixed(1)).join(" / ");
  console.log(`${profile.padEnd(11)}${shares}   ${means}`);

  for (const strategy of STRATEGIES.filter((s) => row.winShare[s] > LIMIT)) {
    failed = true;
    const runaway = runawayScenarios(strategy, profile, Math.min(runs, 1500), content).slice(0, 4);
    console.log(`  always-${strategy} runs away in the ${profile} world. Ending-score advantage of its pick over its rivals' picks, by scenario:`);
    for (const { scenarioId, advantage } of runaway) console.log(`    ${scenarioId.padEnd(22)} ${advantage >= 0 ? "+" : ""}${advantage.toFixed(2)}`);
  }
}

// ---------------------------------------------------------------- Rules 4 and 5

if (flag("--rules")) {
  const valueRuns = option("--value-runs", 3000);
  console.log(`\nRules 4 and 5: mean ending score when one option is forced and every other decision is neutral (${valueRuns.toLocaleString("en-GB")} paired runs per profile)\n`);
  const values = optionValues(valueRuns, content);
  const factCells = SEED_FACTS.flatMap((fact) => [`${fact}:true`, `${fact}:false`] as WorldCell[]);

  for (const scenarioId of content.scenarios.map((s) => s.id)) {
    const options = values.filter((v) => v.scenarioId === scenarioId).sort((a, b) => a.stance - b.stance);
    const bestIn = (cell: WorldCell) => options.reduce((best, o) => (o.meanScore[cell] > best.meanScore[cell] ? o : best));
    const waiting = options.find((o) => o.lever === "wait") ?? options[0]!;
    const strictest = options.at(-1)!;

    console.log(`${scenarioId}`);
    for (const o of options) {
      const cells = PROFILES.map((p) => `${o.meanScore[p].toFixed(2)}${bestIn(p) === o ? "*" : " "}`.padStart(9)).join("");
      console.log(`  ${o.choiceId} (stance ${o.stance}, ${o.lever})`.padEnd(38) + cells);
    }
    for (const [rule, o] of [["Rule 4 (waiting)", waiting], ["Rule 5 (most restrictive)", strictest]] as const) {
      const profiles = PROFILES.filter((p) => bestIn(p) === o);
      const facts = factCells.filter((cell) => bestIn(cell) === o);
      const verdict = profiles.length > 0 ? `best in the ${profiles.join(", ")} profile` : facts.length > 0 ? "never best in a whole profile" : "never best";
      console.log(`  ${rule}: option ${o.choiceId} is ${verdict}${facts.length > 0 ? `; best when ${facts.join(", ")}` : ""}`);
    }
    console.log("");
  }
  console.log("Columns: benign, contested, hard. * marks the best option in that profile.");
  // Reported, not enforced: judged by whole profile, Rules 4 and 5 pull against Rule 7 (DECISIONS.md, section E).
}

console.log(failed ? "\nBalance check FAILED." : "\nBalance check passed.");
if (failed) process.exitCode = 1;
