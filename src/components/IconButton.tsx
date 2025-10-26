"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import cn from "classnames";
import { LucideIcon } from "lucide-react";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95",
        "border-[var(--card-border)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--card)]/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
});

export default IconButton;
