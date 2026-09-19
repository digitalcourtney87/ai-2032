import { backsLine } from "../copy";
import { percent } from "../format";
import type { PublicAdviser } from "../../content";

interface Props {
  adviser: PublicAdviser;
  stance: string;
  /** The option this adviser backs, and that option's text. Leave the text out to print only "Backs option X." */
  recommends: string;
  recommendsText?: string;
  /** A line recalling an earlier decision, when one applies. */
  memory: string | null;
  /** The adviser's probability for this turn's forecast question. Pass it only once the player's own forecast is locked. */
  forecast?: number;
}

/** One adviser, in plain terms: who they are, what they care about, what they back and why. All four carry equal weight. */
export function AdviserCard({ adviser, stance, recommends, recommendsText, memory, forecast }: Props) {
  return (
    <article className="border border-rule p-3">
      <h3 className="font-semibold">
        {adviser.name} <span className="font-normal text-muted">&middot; {adviser.role}</span>
      </h3>
      <p className="mt-1 text-sm">
        <span className="text-muted">Cares about:</span> {adviser.lens}
      </p>
      <p className="mt-2 text-sm font-semibold">{backsLine(recommends, recommendsText)}</p>
      <blockquote className="mt-1 text-sm">&ldquo;{stance}&rdquo;</blockquote>
      {memory && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Remembers:</span> <span className="italic">&ldquo;{memory}&rdquo;</span>
        </p>
      )}
      {forecast !== undefined && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Puts the chance at</span> <span className="font-mono">{percent(forecast)}</span>
        </p>
      )}
    </article>
  );
}
