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
  figure: string;
  caption: string;
}

export const COVER: Plate = {
  src: cover,
  figure: "Fig. 00",
  caption: "Cover sheet. Frontier Technology Risk Unit, 2026–2032.",
};

export const SCENARIO_PLATES: Record<string, Plate> = {
  "attribution-gap": {
    src: attributionGap,
    figure: "Fig. 01",
    caption: "Unattributed links between sites on a public network.",
  },
  "open-weight-release": {
    src: openWeightRelease,
    figure: "Fig. 02",
    caption: "Weights leaving a store as open cargo.",
  },
  "biology-result": {
    src: biologyResult,
    figure: "Fig. 03",
    caption: "A screening desk and a locked cabinet. Policy, not a protocol.",
  },
  "graduate-collapse": {
    src: graduateCollapse,
    figure: "Fig. 04",
    caption: "An empty professional floor after hiring stalled.",
  },
  "deepfake-election": {
    src: deepfakeElection,
    figure: "Fig. 05",
    caption: "A polling station and a wall of identical blank screens.",
  },
  "sandbagging-finding": {
    src: sandbaggingFinding,
    figure: "Fig. 06",
    caption: "An evaluation room with a second room behind the glass.",
  },
  "incident-cyber": {
    src: incidentCyber,
    figure: "Fig. 07",
    caption: "A substation and a control room after a disruption.",
  },
  "incident-bio": {
    src: incidentBio,
    figure: "Fig. 08",
    caption: "A customs hall. An allied plot is a policy event, not a specimen.",
  },
  "false-alarm": {
    src: falseAlarm,
    figure: "Fig. 09",
    caption: "A situation room waiting on a warning that may be empty.",
  },
  "threshold-2032": {
    src: threshold2032,
    figure: "Fig. 10",
    caption: "A gate on a map. The 2032 deployment line.",
  },
};

export const ENDING_PLATES: Record<string, Plate> = {
  "responsible-ai-power": {
    src: endingResponsibleAiPower,
    figure: "Fig. E1",
    caption: "A civic plan in balance.",
  },
  fortress: {
    src: endingFortress,
    figure: "Fig. E2",
    caption: "A thick-walled station, well informed and closed.",
  },
  "deregulated-frontier": {
    src: endingDeregulatedFrontier,
    figure: "Fig. E3",
    caption: "An open gate and unfenced ground.",
  },
  "dependent-state": {
    src: endingDependentState,
    figure: "Fig. E4",
    caption: "A small hall beside a much larger terminal.",
  },
  "unknown-frontier": {
    src: endingUnknownFrontier,
    figure: "Fig. E5",
    caption: "A surveyed horizon with nothing resolved.",
  },
};
