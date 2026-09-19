interface Props {
  src: string;
  caption: string;
  /** The plate's own pixel size, so the page reserves its space before the image loads. */
  width: number;
  height: number;
  /** Decorative plates use an empty alt; the caption carries the meaning. */
  alt?: string;
  className?: string;
}

/** A plate: a raster drawing with its caption beneath. */
export function Figure({ src, caption, width, height, alt = "", className = "" }: Props) {
  return (
    <figure className={className}>
      <div className="border border-rule bg-paper">
        <img src={src} alt={alt} width={width} height={height} className="figure-raster block h-auto w-full" />
      </div>
      <figcaption className="mt-2 font-mono text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
