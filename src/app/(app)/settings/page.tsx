"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Bell, Palette, Download, LogOut, Save } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useMobileTheme } from "@/components/providers/MobileThemeProvider";
import PageWrapper from "@/components/PageWrapper";
import GlassyCard from "@/components/GlassyCard";

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  theme: "light" | "dark";
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useMobileTheme();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [notifications, setNotifications] = useState({
    daily_reminder: true,
    streak_alerts: true,
    weekly_summary: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        router.push("/");
      }
    };
    loadUser();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setNotifications({
        daily_reminder: data.daily_reminder ?? true,
        streak_alerts: data.streak_alerts ?? true,
        weekly_summary: data.weekly_summary ?? true,
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return;
    setSaving(true);

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        daily_reminder: notifications.daily_reminder,
        streak_alerts: notifications.streak_alerts,
        weekly_summary: notifications.weekly_summary,
      })
      .eq("id", userId);

    if (error) {
      setMessage({ type: "error", text: "Failed to save profile" });
    } else {
      setMessage({ type: "success", text: "Profile saved!" });
      setTimeout(() => setMessage(null), 2000);
    }

    setSaving(false);
  }, [userId, displayName, notifications]);

  const handleThemeChange = useCallback(
    async (newTheme: "light" | "dark") => {
      if (!userId) return;

      setGlobalTheme(newTheme);

      const supabase = getSupabaseClient();
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("id", userId);
    },
    [userId, setGlobalTheme]
  );

  const handleLogout = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  const handleExportData = useCallback(async () => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    const { data: habits } = await supabase.from("habits").select("*").eq("user_id", userId);
    const { data: notes } = await supabase.from("notes").select("*").eq("user_id", userId);
    const { data: intentions } = await supabase.from("intentions").select("*").eq("user_id", userId);

    const exportData = {
      profile,
      habits,
      notes,
      intentions,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calmscroll-export-${Date.now()}.json`;
    link.click();
  }, [userId, profile]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">Loading...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <div className="w-full h-full flex flex-col p-6 space-y-4 overflow-y-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Customize your experience</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <GlassyCard className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          {profile?.email && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
              <p className="mt-2 text-sm text-slate-900 dark:text-white">{profile.email}</p>
            </div>
          )}
        </GlassyCard>

        {/* Theme Section */}
        <GlassyCard className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  globalTheme === t
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </GlassyCard>

        {/* Notifications Section */}
        <GlassyCard className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {(["daily_reminder", "streak_alerts", "weekly_summary"] as const).map((key) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-900 dark:text-white capitalize">
                  {key.replace(/_/g, " ")}
                </span>
              </label>
            ))}
          </div>
        </GlassyCard>

        {/* Data Section */}
        <GlassyCard className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Data</h2>
          </div>
          <button
            onClick={handleExportData}
            className="w-full px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export Data
          </button>
        </GlassyCard>

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-medium transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
