import attributionGap from "./attribution-gap.webp";
import biologyResult from "./biology-result.webp";
import cover from "./cover.webp";
import deepfakeElection from "./deepfake-election.webp";
import endingDependentState from "./ending-dependent-state.webp";
import endingDeregulatedFrontier from "./ending-deregulated-frontier.webp";
import endingFortress from "./ending-fortress.webp";
import endingResponsibleAiPower from "./ending-responsible-ai-power.webp";
import endingUnknownFrontier from "./ending-unknown-frontier.webp";
import falseAlarm from "./false-alarm.webp";
import graduateCollapse from "./graduate-collapse.webp";
import incidentBio from "./incident-bio.webp";
import incidentCyber from "./incident-cyber.webp";
import openWeightRelease from "./open-weight-release.webp";
import sandbaggingFinding from "./sandbagging-finding.webp";
import threshold2032 from "./threshold-2032.webp";

export interface Plate {
  src: string;
  caption: string;
  /** Pixel size of the webp file, so the page reserves the plate's space before it loads. */
  width: number;
  height: number;
}

/** The cover and scenario plates are 960 by 540; the ending marks are 384 by 384. */
const WIDE = { width: 960, height: 540 } as const;
const MARK = { width: 384, height: 384 } as const;

export const COVER: Plate = {
  src: cover,
  caption: "A government building, a map of Britain and Ireland, and a table stacked with files.",
  ...WIDE,
};

export const SCENARIO_PLATES: Record<string, Plate> = {
  "attribution-gap": {
    src: attributionGap,
    caption: "Unattributed links between sites on a public network.",
    ...WIDE,
  },
  "open-weight-release": {
    src: openWeightRelease,
    caption: "Weights leaving a store as open cargo.",
    ...WIDE,
  },
  "biology-result": {
    src: biologyResult,
    caption: "A screening desk and a locked cabinet. Policy, not a protocol.",
    ...WIDE,
  },
  "graduate-collapse": {
    src: graduateCollapse,
    caption: "An empty professional floor after hiring stalled.",
    ...WIDE,
  },
  "deepfake-election": {
    src: deepfakeElection,
    caption: "A polling station and a wall of identical blank screens.",
    ...WIDE,
  },
  "sandbagging-finding": {
    src: sandbaggingFinding,
    caption: "An evaluation room with a second room behind the glass.",
    ...WIDE,
  },
  "incident-cyber": {
    src: incidentCyber,
    caption: "A substation and a control room after a disruption.",
    ...WIDE,
  },
  "incident-bio": {
    src: incidentBio,
    caption: "A customs hall. An allied plot is a policy event, not a specimen.",
    ...WIDE,
  },
  "false-alarm": {
    src: falseAlarm,
    caption: "A situation room waiting on a warning that may be empty.",
    ...WIDE,
  },
  "threshold-2032": {
    src: threshold2032,
    caption: "A gate on a map. The 2032 deployment line.",
    ...WIDE,
  },
};

export const ENDING_PLATES: Record<string, Plate> = {
  "responsible-ai-power": {
    src: endingResponsibleAiPower,
    caption: "A civic plan in balance.",
    ...MARK,
  },
  fortress: {
    src: endingFortress,
    caption: "A thick-walled station, well informed and closed.",
    ...MARK,
  },
  "deregulated-frontier": {
    src: endingDeregulatedFrontier,
    caption: "An open gate and unfenced ground.",
    ...MARK,
  },
  "dependent-state": {
    src: endingDependentState,
    caption: "A small hall beside a much larger terminal.",
    ...MARK,
  },
  "unknown-frontier": {
    src: endingUnknownFrontier,
    caption: "A surveyed horizon with nothing resolved.",
    ...MARK,
  },
};
