import { capitalise, verbalChance } from "../copy";
import { MARK_GAP, scaleLeft, stackRows } from "../scale";

export interface ScaleMark {
  id: string;
  /** Shown on the mark. The full name is in the list that follows the compare button. */
  initials: string;
  /** 0..1, as the engine gives it. */
  probability: number;
}

interface Props {
  /** Whole percent, 0 to 100. */
  value: number;
  onChange: (value: number) => void;
  /** Adviser estimates to draw on the scale, or null while they are hidden. */
  marks: ScaleMark[] | null;
  /** Id of the element holding the forecast question, read out with the slider. */
  describedBy: string;
}

/** Verbal anchors under the track. 25 and 75 appear only where there is room for them. */
const ANCHORS = [0, 25, 50, 75, 100] as const;
/** Height of one row of stacked marks, in rem. */
const ROW = 1.5;

/**
 * The forecast slider: one native range input (the only role=slider on the step),
 * with the player's value in words, and, once revealed, each adviser's estimate as
 * a mark on the same 0-100 scale. Marks and anchors are decorative (aria-hidden);
 * the slider's aria-valuetext and the list after the compare button carry the same
 * information in text. See `.forecast-scale` in theme.css for the thumb width.
 */
export function ForecastScale({ value, onChange, marks, describedBy }: Props) {
  const words = verbalChance(value);
  const rows = marks ? stackRows(marks.map((m) => m.probability), MARK_GAP) : [];
  const depth = rows.length > 0 ? Math.max(...rows) + 1 : 0;

  return (
    <div className="forecast-scale @container mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <label htmlFor="forecast" className="font-semibold">
          Your guess
        </label>
        <p aria-hidden="true">
          <span className="font-mono text-2xl">{value}%</span> <span className="text-muted">{words}</span>
        </p>
      </div>

      {marks && (
        <div aria-hidden="true" data-testid="adviser-marks" className="relative mt-3" style={{ height: `${depth * ROW}rem` }}>
          {marks.map((mark, index) => {
            const row = rows[index] ?? 0;
            return (
              <span
                key={mark.id}
                data-testid="adviser-mark"
                className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                // Lower rows paint on top, so a higher mark's stem passes behind the labels below it.
                style={{ left: scaleLeft(mark.probability), zIndex: depth - row }}
              >
                <span className="border border-ink bg-paper px-1 font-mono text-xs leading-4">{mark.initials}</span>
                {/* A border, not a background: forced colours keep borders and blank out backgrounds. */}
                <span className="w-0 border-l border-ink" style={{ height: `${row * ROW + 0.25}rem` }} />
              </span>
            );
          })}
        </div>
      )}

      <input
        id="forecast"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-valuetext={`${value}%, ${words}`}
        aria-describedby={describedBy}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      <div aria-hidden="true" className="relative mt-1 h-10 text-xs text-muted">
        {ANCHORS.map((point) => {
          const place =
            point === 0 ? "left-0 text-left" : point === 100 ? "right-0 text-right" : "-translate-x-1/2 text-center";
          const room = point === 25 || point === 75 ? "hidden @2xl:block" : "block";
          return (
            <span
              key={point}
              className={`absolute top-0 w-max max-w-[7rem] ${place} ${room}`}
              style={point === 0 || point === 100 ? undefined : { left: scaleLeft(point / 100) }}
            >
              {capitalise(verbalChance(point))}
            </span>
          );
        })}
      </div>
    </div>
  );
}
