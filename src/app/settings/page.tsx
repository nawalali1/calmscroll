"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, Palette, Download, LogOut, CheckCircle2, Circle, AlertCircle } from "lucide-react";

/* ============================================================================
   TYPES
============================================================================ */

type ThemeChoice = "system" | "light" | "dark";
type Theme = "light" | "dark";

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  theme: Theme;
  daily_reminder: boolean;
  streak_alerts: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationPrefs {
  dailyReminder: boolean;
  streakAlerts: boolean;
  weeklySummary: boolean;
}

interface SaveStatus {
  type: "success" | "error" | "saving" | null;
  message: string;
}

interface SupabaseError {
  message?: string;
  error_description?: string;
  hint?: string;
  details?: string;
  code?: string;
  status?: number;
}

/* ============================================================================
   CONSTANTS & DEFAULTS
============================================================================ */

const DEFAULT_PROFILE: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  dailyReminder: true,
  streakAlerts: true,
  weeklySummary: false,
};

const LEGACY_KEYS = {
  profile: "calmscroll_profile",
  notifications: "calmscroll_notifications",
};

/* ============================================================================
   HELPERS
============================================================================ */

function parseSupabaseError(error: unknown): string {
  const err = error as SupabaseError | string;
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  if (err?.error_description) return err.error_description;
  if (err?.hint) return err.hint;
  if (err?.details) return err.details;
  return "An error occurred. Please try again.";
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getBackgroundGradient(theme: Theme): string {
  return theme === "dark"
    ? "linear-gradient(160deg, #0f172a 0%, #1e293b 52%, #334155 100%)"
    : "linear-gradient(160deg, #0B3B64 0%, #5282FF 52%, #FFB3C7 100%)";
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/* ============================================================================
   COMPONENT
============================================================================ */

export default function SettingsPage() {
  const router = useRouter();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();

  // Session & Profile
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<ProfileFormData>(DEFAULT_PROFILE);
  const [draftProfile, setDraftProfile] = useState<ProfileFormData>(DEFAULT_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileChanged, setProfileChanged] = useState(false);
  const [emailError, setEmailError] = useState<string>("");

  // Theme state
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");

  // Notifications
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: null, message: "" });

  // Refs for debouncing and timers (use browser-safe timeout type)
  const themeChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================================
     EFFECTS
  ========================================================================= */

  // Sync global theme to display choice
  useEffect(() => {
    if (globalTheme) {
      const systemTheme = getSystemTheme();
      setThemeChoice(globalTheme === systemTheme ? "system" : globalTheme);
    }
  }, [globalTheme]);

  // Detect profile changes
  useEffect(() => {
    const hasChanged =
      draftProfile.firstName !== profile.firstName ||
      draftProfile.lastName !== profile.lastName ||
      draftProfile.email !== profile.email;
    setProfileChanged(hasChanged);
  }, [draftProfile, profile]);

  // Auto-dismiss save status
  useEffect(() => {
    if (saveStatus.type) {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      const delay = saveStatus.type === "error" ? 3000 : 2000;
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus({ type: null, message: "" });
      }, delay);
    }
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [saveStatus]);

  // Load settings
  useEffect(() => {
    let isMounted = true;

    async function loadSettings(): Promise<void> {
      const supabase = getSupabaseClient();
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) setLoading(false);
          return;
        }

        const currentUserId = session.user.id;
        if (isMounted) setUserId(currentUserId);

        // Legacy localStorage
        let legacyData: Partial<ProfileRow> = {};
        let hasLegacyData = false;

        if (typeof window !== "undefined") {
          const legacyProfile = window.localStorage.getItem(LEGACY_KEYS.profile);
          const legacyNotifications = window.localStorage.getItem(LEGACY_KEYS.notifications);

          if (legacyProfile) {
            try {
              const parsed = JSON.parse(legacyProfile);
              legacyData.first_name = parsed.firstName || null;
              legacyData.last_name = parsed.lastName || null;
              legacyData.email = parsed.email || null;
              hasLegacyData = true;
            } catch (e) {
              console.error("Failed to parse legacy profile:", e);
            }
          }

          if (legacyNotifications) {
            try {
              const parsed = JSON.parse(legacyNotifications);
              legacyData.daily_reminder = parsed.dailyReminder ?? true;
              legacyData.streak_alerts = parsed.streakAlerts ?? true;
              legacyData.weekly_summary = parsed.weeklySummary ?? false;
              hasLegacyData = true;
            } catch (e) {
              console.error("Failed to parse legacy notifications:", e);
            }
          }
        }

        // Fetch existing profile
        const { data: profileData, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUserId)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching profile:", fetchError);
        }

        // Migrate if needed
        if (hasLegacyData && !profileData) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: currentUserId,
            ...legacyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error migrating legacy data:", insertError);
          } else if (typeof window !== "undefined") {
            window.localStorage.removeItem(LEGACY_KEYS.profile);
            window.localStorage.removeItem(LEGACY_KEYS.notifications);
          }
        }

        const effectiveData = profileData || legacyData;

        const loadedProfile: ProfileFormData = {
          firstName:
            (effectiveData.first_name ||
              session.user.user_metadata?.full_name ||
              "").split(" ")[0] || "",
          lastName: (effectiveData.last_name || "").trim() || "",
          email: effectiveData.email || session.user.email || "",
        };

        const loadedNotifications: NotificationPrefs = {
          dailyReminder: effectiveData.daily_reminder ?? true,
          streakAlerts: effectiveData.streak_alerts ?? true,
          weeklySummary: effectiveData.weekly_summary ?? false,
        };

        if (isMounted) {
          setProfile(loadedProfile);
          setDraftProfile(loadedProfile);
          setNotificationPrefs(loadedNotifications);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in loadSettings:", err);
        if (isMounted) setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =========================================================================
     ACTIONS
  ========================================================================= */

  const handleSaveProfile = useCallback(async (): Promise<void> => {
    if (!userId) return;

    if (draftProfile.email && !isValidEmail(draftProfile.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");

    setSaveStatus({ type: "saving", message: "Saving..." });
    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            first_name: draftProfile.firstName || null,
            last_name: draftProfile.lastName || null,
            email: draftProfile.email || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      setProfile(draftProfile);
      setEditingProfile(false);
      setSaveStatus({ type: "success", message: "Profile saved" });
    } catch (err: unknown) {
      const message = parseSupabaseError(err);
      setSaveStatus({ type: "error", message });
    }
  }, [userId, draftProfile]);

  const handleToggleNotification = useCallback(
    async (key: keyof NotificationPrefs): Promise<void> => {
      if (!userId) return;

      const newValue = !notificationPrefs[key];
      const dbKey =
        key === "dailyReminder"
          ? "daily_reminder"
          : key === "streakAlerts"
          ? "streak_alerts"
          : "weekly_summary";

      // optimistic
      setNotificationPrefs((prev) => ({ ...prev, [key]: newValue }));

      const supabase = getSupabaseClient();

      try {
        const { error } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              [dbKey]: newValue,
              updated_at: new Date().toISOString(),
            } as Record<string, unknown>,
            { onConflict: "id" }
          );

        if (error) throw error;
      } catch (err: unknown) {
        // rollback
        setNotificationPrefs((prev) => ({ ...prev, [key]: !newValue }));
        const message = parseSupabaseError(err);
        setSaveStatus({ type: "error", message });
      }
    },
    [userId, notificationPrefs]
  );

  // FIX: remove .catch on the builder; use async/await inside setTimeout
  const handleUpdateTheme = useCallback(
    (value: ThemeChoice): void => {
      setThemeChoice(value);

      if (themeChangeTimeoutRef.current) {
        clearTimeout(themeChangeTimeoutRef.current);
      }

      themeChangeTimeoutRef.current = setTimeout(() => {
        const systemTheme = getSystemTheme();
        const resolvedTheme: Theme = value === "system" ? systemTheme : value;

        // Update global theme immediately
        setGlobalTheme(resolvedTheme);

        // Persist to DB with proper try/catch
        if (userId) {
          const supabase = getSupabaseClient();
          (async () => {
            try {
              const { error } = await supabase
                .from("profiles")
                .upsert(
                  {
                    id: userId,
                    theme: resolvedTheme,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "id" }
                );
              if (error) throw error;
            } catch (err: unknown) {
              console.error("Error saving theme:", err);
              const message = parseSupabaseError(err);
              setSaveStatus({ type: "error", message });
            }
          })();
        }
      }, 500);
    },
    [userId, setGlobalTheme]
  );

  const handleExportData = useCallback((): void => {
    const data = {
      profile,
      theme: themeChoice,
      notifications: notificationPrefs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calmscroll-settings-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [profile, themeChoice, notificationPrefs]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient();
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: unknown) {
      console.error("Error signing out:", err);
      const message = parseSupabaseError(err);
      setSaveStatus({ type: "error", message });
    }
  }, [router]);

  /* =========================================================================
     RENDER
  ========================================================================= */

  const currentBackground = getBackgroundGradient(globalTheme);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-white transition-colors duration-300"
        style={{ background: currentBackground }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-2 border-white/40 border-t-white"
          />
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/80">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="relative min-h-svh pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] text-white transition-colors duration-300"
      style={{ background: currentBackground }}
    >
      {/* Header */}
      <motion.header
        initial={reduceMotion ? {} : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="px-6 pb-8 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]"
      >
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/70">CalmScroll</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/75">Manage your preferences and account</p>
      </motion.header>

      {/* Save Status Message */}
      <AnimatePresence mode="wait">
        {saveStatus.type && (
          <motion.div
            key="save-status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="mx-auto mb-4 w-full max-w-xl px-6"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-md ${
                saveStatus.type === "success"
                  ? "border-emerald-200/40 bg-emerald-200/20 text-emerald-50"
                  : saveStatus.type === "saving"
                  ? "border-blue-200/40 bg-blue-200/20 text-blue-50"
                  : "border-rose-200/40 bg-rose-200/20 text-rose-50"
              }`}
            >
              {saveStatus.type === "success" && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {saveStatus.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{saveStatus.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Sections */}
      <div className="mx-auto w-full max-w-xl space-y-4 px-6">
        {/* Profile */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.1, duration: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">Profile</h2>
              </div>
              <button
                onClick={() => {
                  if (editingProfile) {
                    setDraftProfile(profile);
                    setEmailError("");
                  }
                  setEditingProfile(!editingProfile);
                }}
                className="text-sm font-medium text-white/80 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-2 py-1"
                aria-pressed={editingProfile}
              >
                {editingProfile ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="space-y-4">
              {editingProfile ? (
                <>
                  <Input
                    label="First Name"
                    value={draftProfile.firstName}
                    onChange={(e) => setDraftProfile({ ...draftProfile, firstName: e.target.value })}
                    className="bg-white/20 text-white placeholder:text-white/50"
                    labelClassName="text-white/90"
                  />
                  <Input
                    label="Last Name"
                    value={draftProfile.lastName}
                    onChange={(e) => setDraftProfile({ ...draftProfile, lastName: e.target.value })}
                    className="bg-white/20 text-white placeholder:text-white/50"
                    labelClassName="text-white/90"
                  />
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={draftProfile.email}
                      onChange={(e) => {
                        setDraftProfile({ ...draftProfile, email: e.target.value });
                        if (emailError) setEmailError("");
                      }}
                      className="bg-white/20 text-white placeholder:text-white/50"
                      labelClassName="text-white/90"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                    />
                    {emailError && (
                      <p id="email-error" className="mt-2 text-sm text-rose-200 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!profileChanged || saveStatus.type === "saving" || !!emailError}
                    className="w-full rounded-full bg-white/90 text-slate-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-busy={saveStatus.type === "saving"}
                  >
                    {saveStatus.type === "saving" ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Name</p>
                    <p className="mt-1 text-white">
                      {draftProfile.firstName || draftProfile.lastName
                        ? `${draftProfile.firstName} ${draftProfile.lastName}`.trim()
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Email</p>
                    <p className="mt-1 text-white">{draftProfile.email || "Not set"}</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.15, duration: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
            </div>

            <div className="space-y-3" role="radiogroup" aria-label="Theme">
              {(["system", "light", "dark"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => handleUpdateTheme(option)}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    themeChoice === option
                      ? "bg-white/25 border-2 border-white/60 shadow-lg"
                      : "bg-white/10 border-2 border-transparent hover:bg-white/15 hover:border-white/30"
                  }`}
                  aria-pressed={themeChoice === option}
                  role="radio"
                >
                  <div className="flex h-6 w-6 items-center justify-center flex-shrink-0">
                    {themeChoice === option ? (
                      <CheckCircle2 className="h-6 w-6 text-white" aria-hidden="true" />
                    ) : (
                      <Circle className="h-6 w-6 text-white/40" aria-hidden="true" />
                    )}
                  </div>
                  <span className="flex-1 capitalize font-medium text-white">{option}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              {(["dailyReminder", "streakAlerts", "weeklySummary"] as const).map((key) => {
                const labels = {
                  dailyReminder: { title: "Daily Reminder", desc: "Get a gentle nudge each day" },
                  streakAlerts: { title: "Streak Alerts", desc: "Celebrate your mindfulness streak" },
                  weeklySummary: { title: "Weekly Summary", desc: "Review your week's progress" },
                } as const;

                return (
                  <button
                    key={key}
                    onClick={() => void handleToggleNotification(key)}
                    className="flex w-full items-start justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-pressed={notificationPrefs[key]}
                  >
                    <div className="flex-1 pt-0.5">
                      <p className="font-medium text-white">{labels[key].title}</p>
                      <p className="text-sm text-white/70 mt-0.5">{labels[key].desc}</p>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      {notificationPrefs[key] ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-300" aria-hidden="true" />
                      ) : (
                        <Circle className="h-6 w-6 text-white/40" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.25, duration: 0.3 }}
        >
          <GlassCard className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">Account</h2>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="flex w-full items-center justify-between rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-left text-white transition hover:bg-white/20 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <span className="font-medium">Export My Data</span>
                <Download className="h-5 w-5 text-white/70" aria-hidden="true" />
              </button>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-between rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-3 text-left text-amber-100 transition hover:bg-amber-500/30 hover:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              >
                <span className="font-medium">Sign Out</span>
                <LogOut className="h-5 w-5 text-amber-200/70" aria-hidden="true" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}
