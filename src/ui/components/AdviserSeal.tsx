import { ADVISER_VAR, initials } from "../format";
import type { AdviserId } from "../../engine";

interface Props {
  id: AdviserId;
  name: string;
  size?: "sm" | "md" | "lg";
}

const DIMENSIONS: Record<NonNullable<Props["size"]>, string> = {
  sm: "size-6 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
};

/**
 * A monogram seal in the adviser's signature colour. Decorative: it always
 * accompanies the adviser's name in text, so it carries no meaning alone.
 */
export function AdviserSeal({ id, name, size = "md" }: Props) {
  const colour = `var(${ADVISER_VAR[id]})`;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${DIMENSIONS[size]} shrink-0 items-center justify-center border font-mono font-medium tracking-wide`}
      style={{
        borderColor: colour,
        color: colour,
        background: `color-mix(in oklab, ${colour} 14%, var(--paper))`,
      }}
    >
      {initials(name)}
    </span>
  );
}
