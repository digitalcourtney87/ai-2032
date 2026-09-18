import { Icon } from "./Icon";

/**
 * The crisis clock is cosmetic (spec Sections 4 and 13: a simulated six-minute
 * clock, no real-time timers). It steps forward as the player moves through the
 * turn and never runs on wall time, so nobody is rushed and there is no timing
 * barrier (DECISIONS.md, B13). It is static text, so reduced-motion needs no case.
 */
const REMAINING = ["6:00", "4:30", "3:00", "1:00", "0:00"] as const;

interface Props {
  /** Index of the current step: briefing, forecast, decision, investment, consequences. */
  step: number;
}

export function CrisisClock({ step }: Props) {
  const remaining = REMAINING[Math.min(step, REMAINING.length - 1)];
  return (
    <p
      className="inline-flex items-baseline gap-2 border border-ink px-3 py-1"
      role="img"
      aria-label={`Crisis turn. Simulated clock: ${remaining} remaining. The clock moves only as you move; take the time you need.`}
    >
      <Icon name="crisis" className="self-center" />
      <span className="font-mono text-[10px] font-medium uppercase tracking-widest">Crisis</span>
      <span className="font-mono text-xl">{remaining}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">simulated</span>
    </p>
  );
}
