// Geometry for the forecast scale: where a mark sits on the slider's 0-100 track,
// and which marks must stack so their labels do not overlap. Pure, window-free.

/**
 * CSS `left` for a point on the scale. A range thumb's centre travels from half a
 * thumb in from the left edge (at 0) to half a thumb in from the right (at 100),
 * so marks use the same formula. `--thumb` is fixed in theme.css (.forecast-scale).
 */
export function scaleLeft(probability: number): string {
  const p = Math.min(1, Math.max(0, probability));
  return `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${p})`;
}

/**
 * Marks closer than this many percentage points stack. At a 360px phone width the
 * track is about 282px, so 10 points is about 28px, just wider than one mark's
 * initials box (about 25px).
 */
export const MARK_GAP = 10;

/**
 * Row for each value (0 = nearest the track), in input order. Values are placed
 * lowest first; each takes the lowest row whose last mark is at least `gap`
 * points to its left, so identical or near values climb and distant ones share.
 */
export function stackRows(probabilities: readonly number[], gap: number): number[] {
  const points = probabilities.map((p) => Math.round(p * 100));
  const order = points.map((point, index) => ({ point, index })).sort((a, b) => a.point - b.point || a.index - b.index);
  const lastInRow: number[] = [];
  const rows = new Array<number>(points.length).fill(0);
  for (const { point, index } of order) {
    let row = lastInRow.findIndex((last) => point - last >= gap);
    if (row === -1) row = lastInRow.length;
    lastInRow[row] = point;
    rows[index] = row;
  }
  return rows;
}
