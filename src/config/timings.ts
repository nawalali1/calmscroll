/**
 * Timing and duration constants
 * All values in milliseconds unless otherwise specified
 */

// Toast/Notification Durations
export const TOAST_DURATIONS = {
  DEFAULT: 4000, // Default toast duration
  SUCCESS: 2000, // Success message duration
  ERROR: 3000, // Error message duration
  GREETING: 2500, // Greeting toast auto-dismiss
} as const;

// UI Interaction Delays
export const UI_DELAYS = {
  AUTH_REDIRECT: 600, // Delay before redirecting after auth
  BREATHE_MODAL_CLOSE: 1200, // Delay before closing breathe modal
} as const;

// Extension Default Values (in minutes)
export const EXTENSION_DEFAULTS = {
  COOLDOWN_MINUTES: 10, // Default cooldown between notifications
} as const;

// Greeting Time Ranges (24-hour format)
export const GREETING_TIME_RANGES = {
  MORNING: { start: 5, end: 12 },
  AFTERNOON: { start: 12, end: 18 },
  EVENING: { start: 18, end: 24 },
} as const;
