"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { User, Bell, Palette, Download, Trash2, CheckCircle2, Circle } from "lucide-react";

type ThemeChoice = "system" | "light" | "dark";
type Theme = "light" | "dark";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
};

type NotificationPrefs = {
  dailyReminder: boolean;
  streakAlerts: boolean;
  weeklySummary: boolean;
};

const DEFAULT_PROFILE: Profile = {
  firstName: "",
  lastName: "",
  email: "",
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  dailyReminder: true,
  streakAlerts: true,
  weeklySummary: false,
};

export default function SettingsPage() {
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Convert global theme to theme choice for display
  useEffect(() => {
    if (globalTheme) {
      // If global theme matches system preference, show "system"
      // Otherwise show the actual theme
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme: Theme = systemPrefersDark ? "dark" : "light";
      
      if (globalTheme === systemTheme) {
        setThemeChoice("system");
      } else {
        setThemeChoice(globalTheme);
      }
    }
  }, [globalTheme]);

  // Get current background based on theme
  const getCurrentBackground = useCallback(() => {
    if (typeof window === "undefined") return 'linear-gradient(160deg, #0B3B64 0%, #5282FF 52%, #FFB3C7 100%)';
    
    const shouldBeDark = globalTheme === "dark";
    
    return shouldBeDark 
      ? 'linear-gradient(160deg, #0f172a 0%, #1e293b 52%, #334155 100%)'
      : 'linear-gradient(160deg, #0B3B64 0%, #5282FF 52%, #FFB3C7 100%)';
  }, [globalTheme]);

  const [currentBackground, setCurrentBackground] = useState(getCurrentBackground());

  useEffect(() => {
    // Update background when theme changes
    setCurrentBackground(getCurrentBackground());
  }, [globalTheme, getCurrentBackground]);

  useEffect(() => {
    async function loadSettings() {
      const supabase = getSupabaseClient();
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        const localProfile = window.localStorage.getItem("calmscroll_profile");
        const localNotifications = window.localStorage.getItem("calmscroll_notifications");

        let shouldMigrate = false;
        const migratedData: Record<string, unknown> = {};

        if (localProfile) {
          const parsed = JSON.parse(localProfile);
          migratedData.first_name = parsed.firstName;
          migratedData.last_name = parsed.lastName;
          migratedData.email = parsed.email;
          shouldMigrate = true;
        }

        if (localNotifications) {
          const parsed = JSON.parse(localNotifications);
          migratedData.daily_reminder = parsed.dailyReminder;
          migratedData.streak_alerts = parsed.streakAlerts;
          migratedData.weekly_summary = parsed.weeklySummary;
          shouldMigrate = true;
        }

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error);
        }

        if (shouldMigrate && !profileData) {
          await supabase.from("profiles").insert({ id: session.user.id, ...migratedData });
          window.localStorage.removeItem("calmscroll_profile");
          window.localStorage.removeItem("calmscroll_notifications");
        }

        const data = profileData || migratedData;

        const loadedProfile: Profile = {
          firstName: data.first_name || session.user.email?.split("@")[0] || "",
          lastName: data.last_name || "",
          email: data.email || session.user.email || "",
        };

        const loadedNotifications: NotificationPrefs = {
          dailyReminder: data.daily_reminder ?? true,
          streakAlerts: data.streak_alerts ?? true,
          weeklySummary: data.weekly_summary ?? false,
        };

        setProfile(loadedProfile);
        setDraftProfile(loadedProfile);
        setNotificationPrefs(loadedNotifications);

        // Theme is now handled by the global ThemeProvider
        console.log("✅ Settings loaded with global theme:", globalTheme);
      } catch (err) {
        console.error("Error in loadSettings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [globalTheme]);

  const saveProfile = async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();

    try {
      setSaveStatus("Saving...");

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: draftProfile.firstName,
        last_name: draftProfile.lastName,
        email: draftProfile.email,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setProfile(draftProfile);
      setEditingProfile(false);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("Error saving");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const toggleNotification = async (key: keyof NotificationPrefs) => {
    if (!userId) return;
    const supabase = getSupabaseClient();

    const newValue = !notificationPrefs[key];
    const dbKey = key === "dailyReminder" ? "daily_reminder" : key === "streakAlerts" ? "streak_alerts" : "weekly_summary";

    try {
      setNotificationPrefs((prev) => ({ ...prev, [key]: newValue }));

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        [dbKey]: newValue,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      console.log(`✅ ${key} updated to:`, newValue);
    } catch (error) {
      console.error("Error updating notification:", error);
      setNotificationPrefs((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  const updateTheme = async (value: ThemeChoice) => {
    console.log("🎨 Changing theme to:", value);
    setThemeChoice(value);

    // Convert ThemeChoice to Theme for the global theme system
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const themeValue: Theme = value === "system" 
      ? (systemPrefersDark ? "dark" : "light")
      : value;
    
    // This will update the global theme and save to database automatically
    setGlobalTheme(themeValue);
  };

  const exportData = () => {
    const data = {
      profile,
      theme: themeChoice,
      notifications: notificationPrefs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calmscroll-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();

    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");

    if (!confirmed) return;

    try {
      await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", userId);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account. Please try again.");
    }
  };

  if (loading) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center text-white transition-colors duration-300"
        style={{ background: getCurrentBackground() }}
      >
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="px-6 pb-8 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]"
      >
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/70">CalmScroll</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/75">Manage your preferences and account</p>
      </motion.header>

      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-4 w-full max-w-xl px-6"
        >
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-md ${
            saveStatus === "Saved!" 
              ? "border-emerald-200/40 bg-emerald-200/20 text-emerald-50" 
              : saveStatus === "Saving..." 
              ? "border-blue-200/40 bg-blue-200/20 text-blue-50"
              : "border-rose-200/40 bg-rose-200/20 text-rose-50"
          }`}>
            {saveStatus === "Saved!" && <CheckCircle2 className="h-4 w-4" />}
            {saveStatus}
          </div>
        </motion.div>
      )}

      <div className="mx-auto w-full max-w-xl space-y-4 px-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                  if (editingProfile) setDraftProfile(profile);
                  setEditingProfile(!editingProfile);
                }}
                className="text-sm font-medium text-white/80 hover:text-white transition"
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
                  <Input
                    label="Email"
                    type="email"
                    value={draftProfile.email}
                    onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                    className="bg-white/20 text-white placeholder:text-white/50"
                    labelClassName="text-white/90"
                  />
                  <Button onClick={saveProfile} className="w-full rounded-full bg-white/90 text-slate-900 hover:bg-white">
                    Save Changes
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Name</p>
                    <p className="mt-1 text-white">{profile.firstName} {profile.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Email</p>
                    <p className="mt-1 text-white">{profile.email}</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Theme Section - FIXED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
            </div>

            <div className="space-y-3">
              {(["system", "light", "dark"] as ThemeChoice[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateTheme(option)}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all ${
                    themeChoice === option
                      ? "bg-white/25 border-2 border-white/60 shadow-lg"
                      : "bg-white/10 border-2 border-transparent hover:bg-white/15 hover:border-white/30"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center">
                    {themeChoice === option ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <Circle className="h-6 w-6 text-white/40" />
                    )}
                  </div>
                  <span className="flex-1 capitalize font-medium text-white">{option}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications Section - FIXED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => toggleNotification("dailyReminder")}
                className="flex w-full items-start justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">Daily Reminder</p>
                  <p className="text-sm text-white/70 mt-0.5">Get a gentle nudge each day</p>
                </div>
                <div className="flex items-center">
                  {notificationPrefs.dailyReminder ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40" />
                  )}
                </div>
              </button>

              <button
                onClick={() => toggleNotification("streakAlerts")}
                className="flex w-full items-start justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">Streak Alerts</p>
                  <p className="text-sm text-white/70 mt-0.5">Celebrate your mindfulness streak</p>
                </div>
                <div className="flex items-center">
                  {notificationPrefs.streakAlerts ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40" />
                  )}
                </div>
              </button>

              <button
                onClick={() => toggleNotification("weeklySummary")}
                className="flex w-full items-start justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">Weekly Summary</p>
                  <p className="text-sm text-white/70 mt-0.5">Review your week&apos;s progress</p>
                </div>
                <div className="flex items-center">
                  {notificationPrefs.weeklySummary ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40" />
                  )}
                </div>
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Data & Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">Data & Privacy</h2>

            <div className="space-y-3">
              <button
                onClick={exportData}
                className="flex w-full items-center justify-between rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-left text-white transition hover:bg-white/20 hover:border-white/50"
              >
                <span className="font-medium">Export My Data</span>
                <Download className="h-5 w-5 text-white/70" />
              </button>

              <button
                onClick={deleteAccount}
                className="flex w-full items-center justify-between rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-3 text-left text-rose-100 transition hover:bg-rose-500/30 hover:border-rose-300/60"
              >
                <span className="font-medium">Delete Account</span>
                <Trash2 className="h-5 w-5 text-rose-200/70" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <BottomNav />
    </main>
  );
}
