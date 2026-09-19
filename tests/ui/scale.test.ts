// Placing adviser marks on the forecast slider's own 0-100 scale.

import { describe, expect, test } from "vitest";
import { MARK_GAP, scaleLeft, stackRows } from "../../src/ui/scale";

describe("scaleLeft: the same position as the slider thumb's centre", () => {
  test("offsets by half a thumb and spans the track less one thumb", () => {
    expect(scaleLeft(0)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 0)");
    expect(scaleLeft(0.35)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 0.35)");
    expect(scaleLeft(1)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 1)");
  });

  test("clamps to the scale", () => {
    expect(scaleLeft(-0.2)).toBe(scaleLeft(0));
    expect(scaleLeft(1.4)).toBe(scaleLeft(1));
  });
});

describe("stackRows: marks too close to share a row go on the next row up", () => {
  test("far-apart marks share row 0", () => {
    expect(stackRows([0.1, 0.4, 0.7, 0.95], MARK_GAP)).toEqual([0, 0, 0, 0]);
  });

  test("a mark within the gap of another moves up, and the first row with room is reused", () => {
    // Sorted: 0.47 (row 0), 0.52 (row 1), 0.54 (row 2), 0.68 (back to row 0).
    expect(stackRows([0.52, 0.68, 0.47, 0.54], MARK_GAP)).toEqual([1, 0, 0, 2]);
  });

  test("identical estimates never overlap", () => {
    expect(stackRows([0.4, 0.4, 0.4, 0.4], MARK_GAP)).toEqual([0, 1, 2, 3]);
  });

  test("exactly one gap apart is far enough, measured in whole points", () => {
    expect(MARK_GAP).toBe(10);
    expect(stackRows([0.47, 0.57], MARK_GAP)).toEqual([0, 0]);
    expect(stackRows([0.47, 0.56], MARK_GAP)).toEqual([0, 1]);
  });

  test("returns rows in the order the values came in", () => {
    expect(stackRows([0.9, 0.1, 0.12], MARK_GAP)).toEqual([0, 0, 1]);
  });
});
