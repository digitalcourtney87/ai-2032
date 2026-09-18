import { percent } from "../format";
import type { PublicAdviser } from "../../content";

interface Props {
  adviser: PublicAdviser;
  stance: string;
  recommends: string;
  /** A line recalling an earlier decision, when one applies. */
  memory: string | null;
  /** The adviser's probability for this turn's forecast question. */
  forecast?: number;
}

export function AdviserCard({ adviser, stance, recommends, memory, forecast }: Props) {
  return (
    <article className="border-l-2 border-rule pl-4">
      <h3 className="font-semibold">
        {adviser.name} <span className="font-normal text-muted">&middot; {adviser.role}</span>
      </h3>
      {memory && <p className="mt-1 text-sm italic">&ldquo;{memory}&rdquo;</p>}
      <p className="mt-1 text-sm">&ldquo;{stance}&rdquo;</p>
      <p className="mt-1 text-xs text-muted">
        Recommends option {recommends}
        {forecast !== undefined && <> &middot; puts the forecast at {percent(forecast)}</>}
      </p>
    </article>
  );
}
