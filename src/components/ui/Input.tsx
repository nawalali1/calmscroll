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
            "text-xs font-semibold uppercase tracking-[0.22em] text-slate-700",
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
          "min-h-[48px] w-full rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition placeholder:text-slate-600/60 focus:border-white/70 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70",
          error && "border-rose-300/80 focus:border-rose-300 focus:ring-rose-200/60",
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
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : (
          messageSlot || null
        )}
      </div>
    </div>
  );
});

export default Input;
