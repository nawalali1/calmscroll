/**
 * Application-wide constants
 * Database names, storage keys, and other core configuration values
 */

// IndexedDB Configuration
export const INDEXEDDB_CONFIG = {
  NAME: "calmscroll-offline",
  VERSION: 1,
  QUEUE_STORE_NAME: "queue",
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  PROFILE: "calmscroll_profile",
  THEME: "calmscroll_theme",
  NOTIFICATIONS: "calmscroll_notifications",
} as const;

// Database Tables
export const DB_TABLES = {
  NOTES: "notes",
  TASKS: "tasks",
  FAVORITES: "favorites",
  METRICS: "metrics",
  PROFILES: "profiles",
} as const;

// Exportable tables for data export functionality
export const EXPORTABLE_TABLES = [
  DB_TABLES.NOTES,
  DB_TABLES.TASKS,
  DB_TABLES.FAVORITES,
  DB_TABLES.METRICS,
] as const;

// Metrics Fields
export const METRICS_FIELDS =
  "id, user_id, day_key, minutes_read, cards_read, tasks_done, streak, open_count, mood, created_at, updated_at";

// Default Values
export const DEFAULT_METRICS = {
  MINUTES_READ: 0,
  CARDS_READ: 0,
  TASKS_DONE: 0,
  STREAK: 0,
  OPEN_COUNT: 1,
  MOOD: null,
} as const;

export const DEFAULT_PROFILE = {
  FIRST_NAME: "",
  LAST_NAME: "",
  EMAIL: "",
} as const;

export const DEFAULT_NOTIFICATIONS = {
  DAILY_REMINDER: true,
  STREAK_ALERTS: true,
  WEEKLY_SUMMARY: false,
} as const;
