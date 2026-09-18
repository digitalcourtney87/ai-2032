import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "quiet";
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const look = variant === "primary"
    ? "bg-accent text-on-accent border-accent"
    : "bg-transparent text-ink border-rule";
  return (
    <button
      type="button"
      className={`min-h-11 rounded-sm border px-5 py-2 font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...rest}
    />
  );
}
