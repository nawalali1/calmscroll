"use client";

import { useEffect, useState } from "react";
import GlassyCard from "@/components/GlassyCard";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/ui/BottomNav";

const PROFILE_KEY = "calmscroll_profile";
const THEME_KEY = "calmscroll_theme";
const NOTIFICATIONS_KEY = "calmscroll_notifications";
const REFLECTIONS_KEY = "calmscroll_reflections";

type ThemeChoice = "system" | "light" | "dark";

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
  firstName: "Calm",
  lastName: "Seeker",
  email: "you@example.com",
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  dailyReminder: true,
  streakAlerts: true,
  weeklySummary: false,
};

function applyTheme(preference: ThemeChoice) {
  if (typeof window === "undefined") return;
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedProfile = window.localStorage.getItem(PROFILE_KEY);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as Profile;
        setProfile(parsed);
        setDraftProfile(parsed);
      }
    } catch {
      // ignore
    }

    try {
      const storedNotifications = window.localStorage.getItem(NOTIFICATIONS_KEY);
      if (storedNotifications) {
        setNotificationPrefs(JSON.parse(storedNotifications) as NotificationPrefs);
      }
    } catch {
      // ignore
    }

    const storedTheme = window.localStorage.getItem(THEME_KEY) as ThemeChoice | null;
    const initialTheme: ThemeChoice = storedTheme ?? "system";
    setThemeChoice(initialTheme);
    applyTheme(initialTheme);

    return () => undefined;
  }, []);

  const toggleNotification = (key: keyof NotificationPrefs) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const updateTheme = (value: ThemeChoice) => {
    setThemeChoice(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, value);
    }
    applyTheme(value);
  };

  const handleProfileSave = () => {
    setProfile(draftProfile);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(draftProfile));
    }
    setEditingProfile(false);
  };

  const clearLocalCache = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Clear local CalmScroll cache?")) return;
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(NOTIFICATIONS_KEY);
    window.localStorage.removeItem(REFLECTIONS_KEY);
    setProfile(DEFAULT_PROFILE);
    setDraftProfile(DEFAULT_PROFILE);
    setNotificationPrefs(DEFAULT_NOTIFICATIONS);
  };

  const deleteAccount = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Delete your CalmScroll data? This cannot be undone.")) {
      window.alert("Account deletion is not available in this preview build.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-calm-gradient py-12">
      <div className="page-shell">
        <div className="screen">
          <header className="bg-calm-gradient px-6 pt-16 pb-10 text-slate-900 dark:text-white">
            <h1 className="text-3xl font-semibold tracking-tight text-center">Settings</h1>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
              Tune your CalmScroll experience.
            </p>
          </header>

          <main className="flex-1 overflow-y-auto px-6 pb-28">
            <div className="space-y-6 pt-6">
              <GlassyCard role="group" aria-labelledby="settings-profile" className="flex items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#A5C7FF] via-[#D0B8FF] to-[#FFB3D1] text-slate-800 shadow">
                    <span className="text-sm font-semibold">
                      {profile.firstName?.[0]}
                      {profile.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h2
                      id="settings-profile"
                      className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
                    >
                      Profile
                    </h2>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{profile.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraftProfile(profile);
                    setEditingProfile(true);
                  }}
                  className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                >
                  Edit Profile
                </button>
              </GlassyCard>

              <GlassyCard role="group" aria-labelledby="settings-notifications" className="p-6">
                <h2 id="settings-notifications" className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Notifications
                </h2>
                <div className="mt-4 space-y-3">
                  {([
                    ["dailyReminder", "Daily reminder", "Gentle nudge to check-in each morning."],
                    ["streakAlerts", "Streak alerts", "Celebrate milestones when you stay consistent."],
                    ["weeklySummary", "Weekly summary", "Friday roundup of highlights and insights."],
                  ] as const).map(([key, label, helper]) => (
                    <button
                      key={key}
                      type="button"
                      role="switch"
                      aria-checked={notificationPrefs[key]}
                      onClick={() => toggleNotification(key)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5] ${
                        notificationPrefs[key]
                          ? "border-transparent bg-gradient-to-br from-[#A5C7FF]/40 via-[#D0B8FF]/40 to-[#FFB3D1]/40"
                          : "border-white/40 bg-[rgba(255,255,255,0.55)] dark:border-white/10 dark:bg-[rgba(20,20,20,0.5)]"
                      }`}
                    >
                      <span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-300">{helper}</span>
                      </span>
                      <span
                        className={`flex h-6 w-11 items-center rounded-full px-1 transition ${
                          notificationPrefs[key] ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white shadow transition ${
                            notificationPrefs[key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </GlassyCard>

              <GlassyCard role="group" aria-labelledby="settings-theme" className="p-6">
                <h2 id="settings-theme" className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Theme
                </h2>
                <div className="mt-4 space-y-3">
                  {(["system", "light", "dark"] as ThemeChoice[]).map((option) => (
                    <label
                      key={option}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-400 ${
                        themeChoice === option
                          ? "border-indigo-300 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500 dark:text-indigo-300"
                          : "border-white/40 bg-white/40 text-slate-600 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                      }`}
                    >
                      <span className="capitalize">{option}</span>
                      <input
                        type="radio"
                        name="theme"
                        value={option}
                        checked={themeChoice === option}
                        onChange={() => updateTheme(option)}
                        className="h-5 w-5"
                      />
                    </label>
                  ))}
                </div>
              </GlassyCard>

              <GlassyCard role="group" aria-labelledby="settings-privacy" className="p-6">
                <h2 id="settings-privacy" className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Data &amp; Privacy
                </h2>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => window.alert("Export coming soon")}
                    className="w-full rounded-full border border-white/40 bg-[rgba(255,255,255,0.6)] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5] dark:border-white/15 dark:bg-[rgba(20,20,20,0.5)] dark:text-white dark:hover:bg-white/10"
                  >
                    Export Data
                  </button>
                  <button
                    type="button"
                    onClick={clearLocalCache}
                    className="w-full rounded-full border border-rose-400 bg-[rgba(255,255,255,0.6)] px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 dark:border-rose-500/60 dark:bg-[rgba(20,20,20,0.5)] dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Clear Local Cache
                  </button>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    className="text-sm font-semibold text-rose-500 underline hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Delete Account
                  </button>
                </div>
              </GlassyCard>

              <footer className="pb-12 text-xs text-slate-500 dark:text-slate-400">
                <p className="text-center">CalmScroll v0.1</p>
                <div className="mt-2 flex justify-center gap-4">
                  <a href="/privacy" className="underline">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="underline">
                    Terms
                  </a>
                </div>
              </footer>
            </div>
          </main>

          <BottomNav />
        </div>
      </div>

      <BottomSheet
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        title="Edit Profile"
      >
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          First Name
          <input
            value={draftProfile.firstName}
            onChange={(event) => setDraftProfile((prev) => ({ ...prev, firstName: event.currentTarget.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Last Name
          <input
            value={draftProfile.lastName}
            onChange={(event) => setDraftProfile((prev) => ({ ...prev, lastName: event.currentTarget.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
          <input
            type="email"
            value={draftProfile.email}
            onChange={(event) => setDraftProfile((prev) => ({ ...prev, email: event.currentTarget.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
          />
        </label>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditingProfile(false)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProfileSave}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 dark:bg-indigo-500"
          >
            Save
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
