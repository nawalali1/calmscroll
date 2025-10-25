import { getSupabaseClient } from "./supabase/client";
import { todayKey } from "@/utils/dates";
import { logger } from "@/utils/logger";
import { METRICS_FIELDS, DEFAULT_METRICS } from "@/config/constants";

export type MetricsRow = {
  id?: string;
  user_id: string;
  day_key: string;
  minutes_read: number;
  cards_read: number;
  tasks_done: number;
  streak: number;
  open_count: number;
  mood?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function fetchMetricsRow(userId: string, dayKey: string): Promise<MetricsRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("metrics")
    .select(METRICS_FIELDS)
    .eq("user_id", userId)
    .eq("day_key", dayKey)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch metrics row", { error: String(error) });
    throw error;
  }

  return data ?? null;
}

export async function createMetricsRow(userId: string, dayKey: string): Promise<MetricsRow> {
  const supabase = getSupabaseClient();
  const defaults: MetricsRow = {
    user_id: userId,
    day_key: dayKey,
    minutes_read: DEFAULT_METRICS.MINUTES_READ,
    cards_read: DEFAULT_METRICS.CARDS_READ,
    tasks_done: DEFAULT_METRICS.TASKS_DONE,
    streak: DEFAULT_METRICS.STREAK,
    open_count: DEFAULT_METRICS.OPEN_COUNT,
    mood: DEFAULT_METRICS.MOOD,
  };

  const { data, error } = await supabase
    .from("metrics")
    .insert(defaults)
    .select(METRICS_FIELDS)
    .maybeSingle();

  if (error) {
    logger.error("Failed to create metrics row", { error: String(error) });
    throw error;
  }

  return data as MetricsRow;
}

export async function ensureTodayMetrics(userId: string, dayKey: string = todayKey()) {
  const supabase = getSupabaseClient();
  const existing = await fetchMetricsRow(userId, dayKey);
  if (existing) {
    // Increment open_count on fresh visit.
    const { data, error } = await supabase
      .from("metrics")
      .update({ open_count: (existing.open_count ?? 0) + 1 })
      .eq("user_id", userId)
      .eq("day_key", dayKey)
      .select(METRICS_FIELDS)
      .single();

    if (error) {
      logger.warn("Failed to bump open_count; returning existing row", { error: String(error) });
      return existing;
    }

    return data as MetricsRow;
  }

  return createMetricsRow(userId, dayKey);
}

export async function updateMetrics(
  userId: string,
  dayKey: string,
  patch: Partial<Pick<MetricsRow, "minutes_read" | "cards_read" | "tasks_done" | "streak" | "open_count" | "mood">>
): Promise<MetricsRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("metrics")
    .update(patch)
    .eq("user_id", userId)
    .eq("day_key", dayKey)
    .select(METRICS_FIELDS)
    .single();

  if (error) {
    logger.error("Failed to update metrics row", { error: String(error) });
    throw error;
  }

  return data as MetricsRow;
}

export async function incrementCardsRead(userId: string, dayKey: string, amount = 1): Promise<MetricsRow> {
  const current = await fetchMetricsRow(userId, dayKey);
  if (!current) {
    const created = await createMetricsRow(userId, dayKey);
    return updateMetrics(userId, dayKey, { cards_read: created.cards_read + amount });
  }

  return updateMetrics(userId, dayKey, { cards_read: (current.cards_read ?? 0) + amount });
}

export async function setMood(userId: string, dayKey: string, mood: string): Promise<MetricsRow> {
  return updateMetrics(userId, dayKey, { mood });
}
