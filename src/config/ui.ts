/**
 * UI configuration constants
 * Layout dimensions, constraints, and visual settings
 */

// Progress Ring Configuration
export const PROGRESS_RING = {
  RADIUS: 56,
  STROKE_WIDTH: 10,
  SMALL_RADIUS: 50, // For header progress rings
  SMALL_STROKE_WIDTH: 8,
} as const;

// Progress Calculations
export const PROGRESS_CONFIG = {
  MIN_VALUE: 0,
  MAX_VALUE: 100,
  CIRCUMFERENCE_MULTIPLIER: Math.PI * 2,
} as const;

// Toast Configuration
export const TOAST_CONFIG = {
  MAX_VISIBLE: 3, // Maximum number of toasts displayed at once
} as const;

// Layout Constraints
export const LAYOUT = {
  MAX_PAGE_WIDTH: 430, // Maximum width for mobile app shell (in px)
  BOTTOM_NAV_HEIGHT: 140, // Bottom navigation spacing (in px)
  HEADER_SAFE_AREA_TOP: "env(safe-area-inset-top, 0px)",
  BOTTOM_SAFE_AREA: "env(safe-area-inset-bottom, 0px)",
} as const;

// Score & Metrics
export const METRICS = {
  MAX_DAILY_SCORE: 100, // Maximum daily score value
  DEFAULT_DAILY_PROGRESS: 0, // Default progress percentage
} as const;
