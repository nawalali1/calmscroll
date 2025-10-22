"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

type GreetingCardProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

const tagline = "A calm space to reset and move with intention.";

function initialsFromName(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    if (parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "CS";
}

export function GreetingCard({ name, email, avatarUrl }: GreetingCardProps) {
  const displayName = name || email || "Calm friend";
  const initials = initialsFromName(name, email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.61, 0.35, 1] }}
    >
      <Card className="border-[var(--card-border)] bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 rounded-full border border-[var(--card-border)] bg-white shadow-sm">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName ?? "Avatar"}
                width={56}
                height={56}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-end)] text-base font-semibold text-[var(--accent-ink)]">
                {initials}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{displayName}</h1>
            <p className="text-sm leading-5 text-[var(--ink-muted)]">{tagline}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default GreetingCard;
