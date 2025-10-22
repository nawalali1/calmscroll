"use client";

import cn from "classnames";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-white/40",
        className
      )}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
