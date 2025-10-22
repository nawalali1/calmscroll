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
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-600 transition hover:bg-white/80 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
});

export default IconButton;
