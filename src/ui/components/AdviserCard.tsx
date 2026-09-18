import { AdviserSeal } from "./AdviserSeal";
import { ADVISER_VAR, percent } from "../format";
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

/** A personnel dossier: who is speaking, the lens they see through, and what they urge. */
export function AdviserCard({ adviser, stance, recommends, memory, forecast }: Props) {
  const colour = `var(${ADVISER_VAR[adviser.id]})`;
  return (
    <article
      className="border border-rule p-4 transition-colors hover:border-ink"
      style={{ borderLeft: `3px solid ${colour}` }}
    >
      <header className="flex items-start gap-3">
        <AdviserSeal id={adviser.id} name={adviser.name} />
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight">{adviser.name}</h3>
          <p className="text-sm text-muted">{adviser.role}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            <span className="inline-block size-1.5" style={{ background: colour }} aria-hidden="true" />
            Lens: {adviser.lens}
          </p>
        </div>
      </header>

      {memory && <p className="mt-3 border-l border-rule pl-3 text-sm italic text-muted">&ldquo;{memory}&rdquo;</p>}
      <blockquote className="mt-3 text-sm">&ldquo;{stance}&rdquo;</blockquote>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
        <span className="border px-1.5 py-0.5" style={{ borderColor: colour, color: colour }}>
          Recommends option {recommends}
        </span>
        {forecast !== undefined && <span className="text-muted">Puts the forecast at {percent(forecast)}</span>}
      </p>
    </article>
  );
}
