import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "quiet";
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const look =
    variant === "primary"
      ? "bg-ink text-paper border-ink"
      : "bg-transparent text-ink border-rule";
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-none border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...rest}
    />
  );
}
