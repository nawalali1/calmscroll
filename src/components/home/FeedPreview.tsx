"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heart, Share2, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { FeedPreviewItem } from "@/hooks/useTodayFeed";
import { useToast } from "@/components/ui/Toast";
import { logEvent } from "@/utils/logger";

const kindLabel: Record<string, string> = {
  quote: "Quote",
  breath: "Breath",
  task: "Task",
  reflection: "Reflection",
};

type FeedPreviewProps = {
  items: FeedPreviewItem[] | undefined;
  isLoading: boolean;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onMarkRead: (id: string, kind?: string) => Promise<void>;
  onSeeAll?: () => void;
};

export function FeedPreview({ items, isLoading, onToggleFavorite, onMarkRead, onSeeAll }: FeedPreviewProps) {
  const router = useRouter();
  const toast = useToast();
  const fallbackItems = useMemo(() => new Array(3).fill(null), []);
  const prefersReducedMotion = useReducedMotion();

  const handleShare = async (item: FeedPreviewItem) => {
    const shareData = {
      title: item.title,
      text: `${item.content}\n— CalmScroll`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${item.title}\n${item.content}`);
        toast.notify({ title: "Copied to clipboard" });
      }
      logEvent("card_share", { id: item.id });
    } catch {
      toast.notify({ title: "Share cancelled" });
    }
  };

  const handleMarkRead = async (item: FeedPreviewItem) => {
    try {
      await onMarkRead(item.id, item.kind);
      toast.notify({ title: "Marked as read" });
    } catch {
      toast.notify({ title: "Unable to mark as read", status: "error" });
    }
  };
  const renderCardBody = (item: FeedPreviewItem) => {
    switch (item.kind) {
      case "quote":
        return (
          <blockquote className="space-y-3 text-left">
            <p className="text-sm italic leading-relaxed text-[var(--ink-muted)]">“{item.content}”</p>
            {item.action ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-ink)]">
                {item.action}
              </p>
            ) : null}
          </blockquote>
        );
      case "breath":
        return (
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{item.content}</p>
        );
      case "task":
        return (
          <div className="space-y-1 text-left">
            <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{item.content}</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Gentle nudge — one small action.
            </span>
          </div>
        );
      case "reflection":
      default:
        return (
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            {item.content}
          </p>
        );
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Today’s Feed</h2>
        <button
          type="button"
          onClick={() => (onSeeAll ? onSeeAll() : router.push("/notes"))}
          className="text-sm font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          See all
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-live="polite">
          {fallbackItems.map((_, index) => (
            <Skeleton key={index} className="h-[140px] w-full rounded-3xl border border-slate-100" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {(items ?? []).slice(0, 3).map((item, index) => (
            <motion.article
              key={item.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: [0.21, 0.61, 0.35, 1] }}
            >
              <Card className="space-y-4 rounded-3xl border-slate-100 bg-white shadow-sm" elevated>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                      {kindLabel[item.kind] ?? "Mindful"}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--ink)]">{item.title}</h3>
                    {renderCardBody(item)}
                  </div>
                  <IconButton
                    label={item.isFavorite ? "Remove from favorites" : "Save to favorites"}
                    icon={<Heart className={`h-5 w-5 ${item.isFavorite ? "fill-current" : ""}`} />}
                    active={item.isFavorite}
                    onClick={async () => {
                      try {
                        await onToggleFavorite(item.id, item.isFavorite);
                        toast.notify({
                          title: item.isFavorite ? "Removed from favorites" : "Saved to favorites",
                        });
                      } catch {
                        toast.notify({ title: "Couldn’t update favorite", status: "error" });
                      }
                    }}
                  />
                </div>

                {item.action ? (
                  <div className="rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent-ink)]">
                    {item.action}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                  <IconButton
                    label="Share card"
                    icon={<Share2 className="h-5 w-5" />}
                    onClick={() => handleShare(item)}
                  />
                  <Button
                    type="button"
                    className="gap-2 bg-[var(--accent)] px-4 py-2 text-sm text-white hover:brightness-110"
                    onClick={() => handleMarkRead(item)}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Mark read
                  </Button>
                </div>
              </Card>
            </motion.article>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--ink-muted)]" aria-live="polite">
          No content yet — take a deep breath or add a note to start your calm feed.
        </p>
      )}
    </section>
  );
}

export default FeedPreview;
