import { getSupabaseClient } from "./supabase/client";
import { logger } from "@/utils/logger";

export type ExportBundle = {
  notes: unknown[];
  tasks: unknown[];
  favorites: unknown[];
  metrics: unknown[];
};

export async function exportUserData(userId: string): Promise<ExportBundle> {
  const supabase = getSupabaseClient();
  const [notes, tasks, favorites, metrics] = await Promise.all([
    supabase.from("notes").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("favorites").select("*").eq("user_id", userId),
    supabase.from("metrics").select("*").eq("user_id", userId),
  ]);

  const guard = (result: { data: unknown[] | null; error: unknown }) => {
    if (result.error) throw result.error;
    return result.data ?? [];
  };

  return {
    notes: guard(notes),
    tasks: guard(tasks),
    favorites: guard(favorites),
    metrics: guard(metrics),
  };
}

export async function resetUserData(userId: string) {
  const supabase = getSupabaseClient();
  const tables = ["notes", "tasks", "favorites", "metrics"] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      logger.error(`Failed to purge table ${table}`, { error: String(error) });
      throw error;
    }
  }
}
