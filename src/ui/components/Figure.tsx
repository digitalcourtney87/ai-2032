interface Props {
  src: string;
  caption: string;
  figure: string;
  /** Width or state label, set in mono beside the caption. */
  state?: string;
  /** Decorative plates use an empty alt; the caption carries the meaning. */
  alt?: string;
  className?: string;
}

/** An appendix figure: raster plate, mono caption, optional width/state label. */
export function Figure({ src, caption, figure, state, alt = "", className = "" }: Props) {
  return (
    <figure className={className}>
      <div className="border border-rule bg-paper">
        <img src={src} alt={alt} className="figure-raster block h-auto w-full" />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-muted">
        <span>
          <span className="uppercase tracking-wider text-ink">{figure}</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>{caption}</span>
        </span>
        {state && <span className="uppercase tracking-wider">{state}</span>}
      </figcaption>
    </figure>
  );
}
