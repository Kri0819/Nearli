"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-aqua-500 text-white shadow-tap hover:bg-aqua-600 active:bg-aqua-700",
  secondary: "bg-aqua-50 text-aqua-700 hover:bg-aqua-100 active:bg-aqua-200",
  ghost: "border border-ink-200 bg-transparent text-ink-600 hover:bg-ink-100/60",
  danger: "bg-risk-50 text-risk-600 hover:bg-risk-100",
};

// 兩種尺寸都保證至少約 44px 的觸控高度
const SIZE_CLASSES: Record<Size, string> = {
  md: "text-sm px-4 py-2.5 min-h-[44px]",
  lg: "text-base px-5 py-3.5 min-h-[48px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl2 font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-500 ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
