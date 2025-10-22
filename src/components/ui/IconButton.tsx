"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import cn from "classnames";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  active?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, active = false, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      type="button"
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--card-border)] bg-white px-3 text-[var(--ink-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        active ? "border-[var(--accent)] text-[var(--accent)]" : "",
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
});

export default IconButton;
