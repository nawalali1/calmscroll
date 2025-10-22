"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import cn from "classnames";

type GradientHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function GradientHeader({ title, subtitle, children }: GradientHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#0B3B64_0%,#5282FF_55%,#FFB3C7_100%)] text-white shadow-[0_35px_80px_-35px_rgba(9,52,115,0.6)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.4),transparent_55%)]" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.3),transparent_60%)]" aria-hidden />
      </div>

      <div className="relative flex flex-col gap-8 px-6 pb-14 pt-[calc(env(safe-area-inset-top,0px)+1.6rem)] sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-white/65">CalmScroll</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="max-w-sm text-sm text-white/75">{subtitle}</p> : null}
          </div>

          <Link
            href="/settings"
            aria-label="Open settings"
            className={cn(
              "relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white transition",
              "hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <Settings2 className="h-5 w-5" aria-hidden />
          </Link>
        </div>

        {children ? <div className="flex items-start gap-6">{children}</div> : null}
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden text-white/30" aria-hidden>
        <svg viewBox="0 0 1440 90" className="h-12 w-full">
          <path
            fill="currentColor"
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,58.7C672,64,768,96,864,101.3C960,107,1056,85,1152,80C1248,75,1344,85,1392,90L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>
    </motion.header>
  );
}

export default GradientHeader;
