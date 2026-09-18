import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "evaluation"
  | "provenance"
  | "diplomacy"
  | "defensiveCyber"
  | "capital"
  | "lock"
  | "unlock"
  | "crisis"
  | "evidence"
  | "forecast";

const MARKS: Record<IconName, ReactNode> = {
  evaluation: (
    <>
      <rect x="3.5" y="2.75" width="9" height="11" />
      <path d="M6.25 2.75v-1h3.5v1" />
      <path d="M5.5 6.5h5M5.5 9h5M5.5 11.5h3.25" />
    </>
  ),
  provenance: (
    <>
      <rect x="2.5" y="3.25" width="7.25" height="8.75" />
      <rect x="6.25" y="5.5" width="7.25" height="8.75" />
      <circle cx="9.9" cy="10.25" r="1.35" />
    </>
  ),
  diplomacy: (
    <>
      <circle cx="5" cy="8" r="2.35" />
      <circle cx="11" cy="8" r="2.35" />
      <path d="M7.35 8h1.3" />
    </>
  ),
  defensiveCyber: <path d="M8 2.4 13.1 4.6v3.5c0 2.65-2.05 4.55-5.1 5.6-3.05-1.05-5.1-2.95-5.1-5.6V4.6L8 2.4z" />,
  capital: <path d="M3 4.5h10M3 8h10M3 11.5h6.5" />,
  lock: (
    <>
      <rect x="4" y="7" width="8" height="6.5" />
      <path d="M5.6 7V5.15a2.4 2.4 0 0 1 4.8 0V7" />
    </>
  ),
  unlock: (
    <>
      <rect x="4" y="7" width="8" height="6.5" />
      <path d="M5.6 7V5.15a2.4 2.4 0 0 1 4.8 0V3.7" />
    </>
  ),
  crisis: (
    <>
      <path d="M8 2.4 13.6 8 8 13.6 2.4 8 8 2.4z" />
      <path d="M8 5.4v3.1M8 10.5v.9" />
    </>
  ),
  evidence: (
    <>
      <path d="M4.75 2.5h5.4L12.5 5.1v8.4H4.75z" />
      <path d="M10.15 2.5V5.1H12.5" />
      <path d="M6.25 8h5M6.25 10.4h3.4" />
    </>
  ),
  forecast: <path d="M2.4 11.4 5.4 8.1l2.3 1.9L11.4 4.4l2.2 1.7" />,
};

interface Props extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: IconName;
}

/** Inline 16px inspector marks. Stroke follows `currentColor`. */
export function Icon({ name, className = "", ...rest }: Props) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={`inline-block shrink-0 align-text-bottom ${className}`}
      {...rest}
    >
      {MARKS[name]}
    </svg>
  );
}
