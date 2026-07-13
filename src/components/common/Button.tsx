"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-aqua-500 text-white hover:bg-aqua-600 active:bg-aqua-700",
  secondary: "bg-aqua-50 text-aqua-700 hover:bg-aqua-100 active:bg-aqua-200",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100/40",
  danger: "bg-risk-50 text-risk-600 hover:bg-risk-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3.5",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl2 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-500 ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
