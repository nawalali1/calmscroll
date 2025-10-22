"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/components/ui/Toast";

const FAVORITES_LIMIT = 6;

type FavoriteItem = {
  id: string;
  feed_items: {
    id: string;
    title: string;
    kind: string;
    content: string;
  } | null;
};

async function fetchFavorites(userId: string): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id, feed_items:feed_items(id, title, kind, content)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(FAVORITES_LIMIT);

  if (error) throw error;
  return data ?? [];
}

export function FavoritesStrip() {
  const { session } = useSession();
  const toast = useToast();
  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => {
      if (!userId) throw new Error("User not available");
      return fetchFavorites(userId);
    },
    enabled: Boolean(userId),
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Favorites</h2>
        <Heart className="h-4 w-4 text-[var(--accent)]" aria-hidden />
      </div>
      {isLoading ? (
        <Skeleton className="h-[64px] w-full rounded-full" />
      ) : data && data.length > 0 ? (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1">
          {data
            .filter((item) => item.feed_items)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toast.notify({ title: "Saved to Favorites" })}
                className="min-h-[64px] min-w-[150px] snap-start rounded-full bg-white/90 px-5 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  {item.feed_items?.kind ?? "Favorite"}
                </span>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium text-[var(--ink)]">
                  {item.feed_items?.title}
                </p>
              </button>
            ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">No favorites yet. Mark a card with the heart to pin it here.</p>
      )}
    </section>
  );
}

export default FavoritesStrip;
