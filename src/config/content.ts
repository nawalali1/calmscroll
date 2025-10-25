/**
 * Content configuration
 * Default content, mood options, and user-facing text
 */

import { Frown, Activity, Meh, Smile, Sun, Wind, NotebookPen, StretchVertical } from "lucide-react";

// Mood Options
export const MOODS = [
  { label: "Very Low", icon: Frown },
  { label: "Low", icon: Activity },
  { label: "Balanced", icon: Meh },
  { label: "Aligned", icon: Smile },
  { label: "Elevated", icon: Sun },
] as const;

// Quick Actions
export const QUICK_ACTIONS = [
  {
    id: "breathe",
    label: "Breathe",
    description: "Reset your mind with a guided breathing session.",
    prompt: "Inhale slowly for four counts, exhale for six. What shifts for you after three rounds?",
    actionLabel: "Begin Breathing",
    icon: Wind,
  },
  {
    id: "reflect",
    label: "Reflect",
    description: "Take a moment to check in with yourself.",
    prompt: "Name one feeling you want to carry forward and one you can release.",
    actionLabel: "Start Reflection",
    icon: NotebookPen,
  },
  {
    id: "stretch",
    label: "Stretch",
    description: "Release tension with gentle movement prompts.",
    prompt: "Roll your shoulders back and stretch tall. Where do you notice space opening?",
    actionLabel: "Start Stretch",
    icon: StretchVertical,
  },
] as const;

// Focus Cards
export const FOCUS_CARDS = [
  {
    id: "focus-breathe",
    title: "1-Minute Breathe",
    description: "Reset your mind with a guided breathing session.",
    accent: "from-[#86B7FF] to-[#B39CFF]",
    icon: Wind,
  },
  {
    id: "focus-reflection",
    title: "Guided Reflection",
    description: "Take a moment to check in with yourself.",
    accent: "from-[#BF9FFF] to-[#FF9ACB]",
    icon: NotebookPen,
  },
  {
    id: "focus-stretch",
    title: "Stretch Break",
    description: "Release tension with gentle movement prompts.",
    accent: "from-[#8DD2FF] to-[#A78BFA]",
    icon: StretchVertical,
  },
] as const;

// Default Favorites (placeholder - should eventually come from user data)
export const DEFAULT_FAVORITES = [
  "Morning Journal",
  "Gratitude List",
  "Calm Playlist",
  "Reset Breath",
  "Mini Stretch",
] as const;

// Week Template (placeholder for tracker page)
export const WEEK_TEMPLATE = [
  { day: "Mon", logged: true },
  { day: "Tue", logged: true },
  { day: "Wed", logged: false },
  { day: "Thu", logged: true },
  { day: "Fri", logged: false },
  { day: "Sat", logged: true },
  { day: "Sun", logged: true },
] as const;

// Extension Default Intention
export const DEFAULT_EXTENSION_INTENTION = {
  TITLE: "Pause to breathe",
  WHY: "Take three breaths before opening this site.",
  DOMAINS: ["instagram.com", "tiktok.com"],
  ACTIVE: true,
  ENABLED: true,
} as const;

// Notification Settings
export const NOTIFICATION_CONFIG = {
  PRIORITY: 2, // Chrome notification priority
  ICON: "icon128.png",
  DEFAULT_TITLE: "Remember your intention",
  DEFAULT_MESSAGE: "Take a breath before you scroll.",
} as const;
