/**
 * Animation and motion constants
 * Durations, easing functions, and motion presets
 */

import { Variants } from "framer-motion";

// Animation Durations (in seconds)
export const ANIMATION_DURATIONS = {
  FADE_IN: 0.4,
  SCALE_IN: 0.25,
  QUICK: 0.2,
  MEDIUM: 0.35,
  SLOW: 0.7,
} as const;

// Cubic Bezier Easing Functions
export const EASING = {
  EASE_OUT_EXPO: [0.21, 0.61, 0.35, 1] as const,
  EASE_OUT_CUBIC: [0.26, 0.76, 0.34, 1] as const,
  EASE_IN_OUT: [0.25, 0.8, 0.25, 1] as const,
} as const;

// Framer Motion Variants
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.FADE_IN,
      ease: EASING.EASE_OUT_EXPO,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATIONS.SCALE_IN,
      ease: EASING.EASE_OUT_CUBIC,
    },
  },
};

export const withReducedMotion: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};
