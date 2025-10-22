"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import cn from "classnames";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
};

const baseClasses =
  "relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,theme(colors.blue.500))] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60";

const spinnerClasses = "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, disabled, isLoading = false, loadingText, type = "submit", ...props },
  ref
) {
  const isDisabled = disabled || isLoading;
  const state = isLoading ? "loading" : "idle";

  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseClasses, className, isLoading && "cursor-wait")}
      disabled={isDisabled}
      data-state={state}
      aria-busy={isLoading}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-0")}>{children}</span>
      {isLoading ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-current">
          <span className={spinnerClasses} aria-hidden />
          {loadingText ? <span className="text-xs font-semibold uppercase tracking-[0.3em]">{loadingText}</span> : null}
        </span>
      ) : null}
    </button>
  );
});

export default Button;
