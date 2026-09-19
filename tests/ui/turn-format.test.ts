import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import {
  describeCondition, DOMAIN_LABEL, effectRows, EXACT_METRICS, formatEffects, isExactMetric, METRIC_LABEL, METRIC_ORDER, TRACK_MILESTONES, trackBonusText, TRACKS,
} from "../../src/ui/format";

const pub = publicContent(loadContent());

describe("metric order and stated effects", () => {
  test("METRIC_ORDER names every metric once, exact ones first", () => {
    expect([...METRIC_ORDER].sort()).toEqual(Object.keys(METRIC_LABEL).sort());
    expect(METRIC_ORDER.slice(0, 5)).toEqual([...EXACT_METRICS]);
    expect(METRIC_ORDER.filter(isExactMetric)).toEqual([...EXACT_METRICS]);
  });

  test("effectRows and formatEffects list stated effects in METRIC_ORDER and drop zeros", () => {
    expect(effectRows({ innovation: -3, cooperation: 5, nationalSecurity: 4, economy: 0 })).toEqual([
      { metric: "nationalSecurity", delta: 4 },
      { metric: "innovation", delta: -3 },
      { metric: "cooperation", delta: 5 },
    ]);
    expect(effectRows({})).toEqual([]);
    // An option's card uses the same order as its preview (attribution-gap A is stored innovation first).
    expect(formatEffects({ innovation: 1, nationalSecurity: 1 })).toBe("National Security +1, Innovation +1");
    expect(formatEffects({})).toBe("No immediate visible effect");
  });

  test("every policy area has a label", () => {
    const domains = new Set(Object.values(pub.scenarios).map((s) => s.domain));
    for (const domain of domains) expect(DOMAIN_LABEL[domain]).toBeTruthy();
  });
});

describe("standing-investment copy (DECISIONS.md, F11)", () => {
  test("the per-level bonus is generated from the published track bonuses", () => {
    expect(TRACKS.map((track) => trackBonusText(pub.trackBonuses[track]))).toEqual([
      "State Capacity +4", "Public Trust +1", "International Cooperation +4", "National Security +2",
    ]);
    expect(trackBonusText({ economy: -2 })).toBe("Economy −2");
    expect(trackBonusText({})).toBe("No bonus");
  });

  test("no promise the content does not keep, and no odds or damage numbers", () => {
    expect(TRACK_MILESTONES.diplomacy.map((m) => m.level)).toEqual([3]);           // "joint evaluations" is gone
    const all = Object.values(TRACK_MILESTONES).flat().map((m) => m.text).join(" ");
    expect(all).toContain("in an unscheduled crisis");
    expect(all).not.toMatch(/crisis turns|joint evaluations|halves|\d/);
  });

  test("every option unlock in content has an 'unlock' milestone at the same track and level, and vice versa", () => {
    const fromContent = new Set(
      Object.values(pub.scenarios).flatMap((s) => s.choices.flatMap((c) => (c.unlock ? [`${c.unlock.track}:${c.unlock.level}`] : []))),
    );
    const authored = new Set(TRACKS.flatMap((t) => TRACK_MILESTONES[t].filter((m) => m.applies === "unlock").map((m) => `${t}:${m.level}`)));
    expect([...authored].sort()).toEqual([...fromContent].sort());
  });
});

describe("conditions in words", () => {
  test("a negated draw reads as a plain negative, not 'it is not the case that'", () => {
    const draw = (key: string) => ({ draw: { key, probability: 0.5 } });
    expect(describeCondition({ ...draw("authentication-correct"), not: true })).toBe("the authentication result was inaccurate");
    expect(describeCondition(draw("authentication-correct"))).toBe("the authentication result was correct");
    expect(describeCondition({ ...draw("alarm-real"), not: true })).toBe("the warning was false");
    for (const key of ["recording-authentic", "forensics-in-time", "authentication-correct", "alarm-real"]) {
      expect(describeCondition({ ...draw(key), not: true })).not.toContain("it is not the case that");
    }
  });
});
