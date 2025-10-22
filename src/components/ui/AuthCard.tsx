"use client";

import { forwardRef, type HTMLAttributes } from "react";
import cn from "classnames";

export type AuthCardProps = HTMLAttributes<HTMLDivElement>;

export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(function AuthCard(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "w-full max-w-[360px] rounded-3xl border border-white/30 bg-white/20 p-8 text-slate-900 shadow-lg backdrop-blur-md",
        className
      )}
      {...props}
    />
  );
});

export default AuthCard;
