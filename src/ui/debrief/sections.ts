// The debrief's sections in reading order (DECISIONS.md, section F: the debrief order).
// Each id is the anchor the debrief rail links to, and each section's number is its
// place in this list, so a heading and its rail entry cannot drift apart.

export const DEBRIEF_SECTIONS = [
  { id: "panel-at-a-glance", rail: "At a glance" },
  { id: "panel-what-if", rail: "What if" },
  { id: "panel-quality", rail: "Quality" },
  { id: "panel-world", rail: "World" },
  { id: "panel-calibration", rail: "Calibration" },
  { id: "panel-record", rail: "Governance" },
  { id: "panel-unseen", rail: "Unseen" },
  { id: "panel-talk", rail: "Talk it over" },
  { id: "panel-share", rail: "Share" },
] as const;

export type DebriefSectionId = (typeof DEBRIEF_SECTIONS)[number]["id"];

/** A section's number in the reading order, as its heading and the rail both show it. */
export function sectionNumber(id: DebriefSectionId): number {
  return DEBRIEF_SECTIONS.findIndex((section) => section.id === id) + 1;
}
