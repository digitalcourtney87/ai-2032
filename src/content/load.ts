// The validated loader. Every content file is parsed with Zod, then cross-checked
// for references that a schema alone cannot see. Bad content fails loudly at load:
// the game never starts on data it does not fully understand.

import type { Choice, Content, QueueSpec, Scenario } from "../engine/types";
import { contentConditionProblems } from "../engine/conditions";
import { adviserSchema, endingSchema, eventSchema, gameSchema, scenarioSchema } from "./schema";
import { z } from "zod";

import game from "./game.json";
import events from "./events.json";
import advisers from "./advisers.json";
import endings from "./endings.json";
import attributionGap from "./scenarios/attribution-gap.json";
import openWeightRelease from "./scenarios/open-weight-release.json";
import biologyResult from "./scenarios/biology-result.json";
import graduateCollapse from "./scenarios/graduate-collapse.json";
import deepfakeElection from "./scenarios/deepfake-election.json";
import sandbaggingFinding from "./scenarios/sandbagging-finding.json";
import incidentCyber from "./scenarios/incident-cyber.json";
import incidentBio from "./scenarios/incident-bio.json";
import falseAlarm from "./scenarios/false-alarm.json";
import threshold2032 from "./scenarios/threshold-2032.json";

/** Content before validation: whatever the JSON files happened to contain. */
export interface RawContent {
  game: unknown;
  events: unknown;
  advisers: unknown;
  endings: unknown;
  scenarios: unknown[];
}

/** The bundled files, unvalidated. Exported so tests can check each file on its own. */
export const rawContent: RawContent = {
  game,
  events,
  advisers,
  endings,
  scenarios: [
    attributionGap, openWeightRelease, biologyResult, graduateCollapse, deepfakeElection,
    sandbaggingFinding, incidentCyber, incidentBio, falseAlarm, threshold2032,
  ],
};

/** The lowest Political Capital a turn can open with (5, less 1 for low Public Trust) leaves 3 after buying information. */
const MAX_CHEAPEST_OPTION = 3;

const queuesOf = (choice: Choice): QueueSpec[] => [...choice.queues, ...(choice.onFailure?.queues ?? [])];
const isBase = (choice: Choice) => choice.requires.length === 0;

function duplicates(ids: string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

/** Everything a schema cannot check. Returns one message per problem; empty means sound. */
export function findProblems(content: Content): string[] {
  const problems: string[] = [];
  const eventIds = new Set(content.events.map((e) => e.id));
  const scenarioIds = new Set(content.scenarios.map((s) => s.id));
  const needEvent = (id: string, where: string) => { if (!eventIds.has(id)) problems.push(`${where}: unknown event "${id}"`); };
  const needScenario = (id: string, where: string) => { if (!scenarioIds.has(id)) problems.push(`${where}: unknown scenario "${id}"`); };

  for (const id of duplicates(content.events.map((e) => e.id))) problems.push(`duplicate event id "${id}"`);
  for (const id of duplicates(content.scenarios.map((s) => s.id))) problems.push(`duplicate scenario id "${id}"`);
  for (const id of duplicates(content.endings.map((e) => e.id))) problems.push(`duplicate ending id "${id}"`);

  content.sequence.forEach((id) => needScenario(id, "sequence"));
  needScenario(content.config.falseAlarmScenarioId, "config.falseAlarmScenarioId");

  const lastTurn = content.sequence.length;
  for (const event of content.events) {
    if (event.interruptScenarioId) needScenario(event.interruptScenarioId, `event ${event.id}`);
    if (event.severe && event.interruptScenarioId && !event.initial) problems.push(`event ${event.id}: a severe interrupting event must be queued at the start`);
    if (event.initial) {
      if (event.base === undefined) problems.push(`event ${event.id}: queued at the start but has no base probability`);
      if (event.initial.latestTurn < event.initial.earliestTurn) problems.push(`event ${event.id}: window ends before it begins`);
      if (event.initial.latestTurn > lastTurn) problems.push(`event ${event.id}: window runs past the final decision`);
      // An interrupt needs a turn to land in, so its trigger cannot roll on the final decision.
      if (event.interruptScenarioId && event.initial.latestTurn > lastTurn - 1) problems.push(`event ${event.id}: could fire too late to interrupt`);
    }
  }

  for (const scenario of content.scenarios) {
    const where = `scenario ${scenario.id}`;
    const choiceIds = scenario.choices.map((c) => c.id);
    for (const id of duplicates(choiceIds)) problems.push(`${where}: duplicate choice id "${id}"`);

    const { resolution } = scenario.forecast;
    if (!Array.isArray(resolution)) needEvent(resolution.eventId, `${where} forecast`);

    for (const [adviser, view] of Object.entries(scenario.adviserViews)) {
      if (!choiceIds.includes(view.recommends)) problems.push(`${where}: ${adviser} recommends unknown choice "${view.recommends}"`);
    }

    for (const choice of scenario.choices) {
      const at = `${where} choice ${choice.id}`;
      for (const modifier of choice.probabilityModifiers) needEvent(modifier.eventId, at);
      for (const queued of queuesOf(choice)) {
        needEvent(queued.eventId, at);
        const registered = content.events.find((e) => e.id === queued.eventId);
        if (registered && queued.baseProbability === undefined && registered.base === undefined) {
          problems.push(`${at}: queues "${queued.eventId}", which has no base probability anywhere`);
        }
      }
      if (choice.onFailure && !choice.succeedsWhen) problems.push(`${at}: has onFailure but can never fail`);
      if (isBase(choice) !== (choice.stance !== undefined)) problems.push(`${at}: base options need a stance rank; unlocked options must not have one`);
    }

    const base = scenario.choices.filter(isBase);
    const ranks = base.map((c) => c.stance ?? 0).sort((a, b) => a - b);
    if (ranks.some((rank, index) => rank !== index + 1)) problems.push(`${where}: stance ranks must run 1..${base.length} without gaps`);
    if (Math.min(...base.map((c) => c.politicalCost)) > MAX_CHEAPEST_OPTION) problems.push(`${where}: no option is affordable on a bad turn`);
  }

  if (content.advisers.length !== 4) problems.push("there must be exactly four advisers");
  problems.push(...contentConditionProblems(content));
  return problems;
}

function parseScenario(raw: unknown): Scenario {
  return scenarioSchema.parse(raw);
}

/** Validates raw content. Throws a single error listing every problem found. */
export function parseContent(raw: RawContent): Content {
  const { sequence, config } = gameSchema.parse(raw.game);
  const content: Content = {
    sequence,
    config,
    events: z.array(eventSchema).parse(raw.events),
    advisers: z.array(adviserSchema).parse(raw.advisers),
    endings: z.array(endingSchema).parse(raw.endings),
    scenarios: raw.scenarios.map(parseScenario),
  };
  const problems = findProblems(content);
  if (problems.length > 0) throw new Error(`Content is invalid:\n- ${problems.join("\n- ")}`);
  return content;
}

export function loadContent(): Content {
  return parseContent(rawContent);
}
