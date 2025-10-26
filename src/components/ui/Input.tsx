"use client";

import { forwardRef, InputHTMLAttributes, useId, type ReactNode } from "react";
import cn from "classnames";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  messageSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, labelClassName, label, helperText, error, id, name, messageSlot, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? name ?? `input-${generatedId}`;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2",
        error ? "data-[input-error=true]" : undefined,
        containerClassName
      )}
      data-input-error={Boolean(error)}
    >
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]",
            labelClassName
          )}
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={cn(
          "min-h-[48px] w-full rounded-2xl border px-4 py-3 text-base transition",
          "border-[var(--card-border)] bg-[var(--card)] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70",
          "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
          error && "border-rose-300 focus:border-rose-300 focus:ring-rose-200",
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText || messageSlot ? `${inputId}-message` : undefined}
        {...props}
      />
      <div id={error || helperText || messageSlot ? `${inputId}-message` : undefined} className="min-h-[1.25rem]">
        {error ? (
          <p className="text-xs font-medium text-rose-500">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--ink-muted)]">{helperText}</p>
        ) : (
          messageSlot || null
        )}
      </div>
    </div>
  );
});

export default Input;
