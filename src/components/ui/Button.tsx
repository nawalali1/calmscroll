"use client";

import * as React from "react";
import cn from "classnames";

type ButtonVariant = "primary" | "subtle" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:brightness-110",
  subtle: "bg-white/80 text-[var(--ink)] hover:bg-white",
  ghost: "bg-transparent text-[var(--ink-muted)] hover:bg-white/70",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3 text-base",
};

export type UIButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function UIButtonImpl(
  {
    isLoading = false,
    loadingText = "Loading...",
    type,
    disabled,
    className,
    children,
    variant = "primary",
    size = "md",
    ...rest
  }: UIButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const finalType = type ?? "submit";
  return (
    <button
      ref={ref}
      type={finalType}
      disabled={disabled || isLoading}
      data-state={isLoading ? "loading" : "idle"}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

const Button = React.forwardRef<HTMLButtonElement, UIButtonProps>(UIButtonImpl);
Button.displayName = "Button";

export { Button };
export default Button;
