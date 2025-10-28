"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, CheckCircle2, Clock } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import PageWrapper from "@/components/PageWrapper";
import GlassyCard from "@/components/GlassyCard";

interface Intention {
  id: string;
  user_id: string;
  text: string;
  status: "active" | "done" | "snoozed";
  created_at: string;
  completed_at: string | null;
  snooze_until: string | null;
}

export default function IntentionsPage() {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newIntention, setNewIntention] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadIntentions();
  }, [userId]);

  const loadIntentions = async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("intentions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setIntentions(data || []);
    setLoading(false);
  };

  const handleAddIntention = useCallback(async () => {
    if (!userId || !newIntention.trim()) return;

    setIsSaving(true);
    const supabase = getSupabaseClient();

    try {
      const { data } = await supabase
        .from("intentions")
        .insert([
          {
            user_id: userId,
            text: newIntention,
            status: "active",
          },
        ])
        .select()
        .single();

      if (data) {
        setIntentions((prev) => [data, ...prev]);
        setNewIntention("");
        setShowNewForm(false);
      }
    } catch (error) {
      console.error("Error adding intention:", error);
    }

    setIsSaving(false);
  }, [userId, newIntention]);

  const handleCompleteIntention = useCallback(
    async (id: string) => {
      const supabase = getSupabaseClient();
      try {
        const { data } = await supabase
          .from("intentions")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (data) {
          setIntentions((prev) =>
            prev.map((i) => (i.id === id ? data : i))
          );
        }
      } catch (error) {
        console.error("Error completing intention:", error);
      }
    },
    []
  );

  const handleDeleteIntention = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    try {
      await supabase.from("intentions").delete().eq("id", id);
      setIntentions((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting intention:", error);
    }
  }, []);

  const handleSnoozeIntention = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 4);

    try {
      const { data } = await supabase
        .from("intentions")
        .update({
          status: "snoozed",
          snooze_until: snoozeUntil.toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (data) {
        setIntentions((prev) =>
          prev.map((i) => (i.id === id ? data : i))
        );
      }
    } catch (error) {
      console.error("Error snoozing intention:", error);
    }
  }, []);

  const filteredIntentions = intentions.filter((i) => {
    if (filter === "all") return true;
    return i.status === filter;
  });

  return (
    <PageWrapper className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Intentions</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Set your mindful goals</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["active", "done", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Intentions List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : filteredIntentions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">
                {filter === "all"
                  ? "No intentions yet. Create one!"
                  : `No ${filter} intentions`}
              </p>
            </div>
          ) : (
            filteredIntentions.map((intention) => (
              <GlassyCard
                key={intention.id}
                className={`p-4 ${
                  intention.status === "done"
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {intention.status === "done" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      )}
                      {intention.status === "snoozed" && (
                        <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                      <h3 className={`font-semibold ${
                        intention.status === "done"
                          ? "line-through text-slate-500 dark:text-slate-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {intention.text}
                      </h3>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {intention.status === "active" && (
                        <>
                          <button
                            onClick={() => handleCompleteIntention(intention.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleSnoozeIntention(intention.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                          >
                            Snooze 4h
                          </button>
                        </>
                      )}
                      {intention.status === "snoozed" && (
                        <button
                          onClick={() => {
                            const updated = {
                              ...intention,
                              status: "active" as const,
                            };
                            setIntentions((prev) =>
                              prev.map((i) =>
                                i.id === intention.id ? updated : i
                              )
                            );
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteIntention(intention.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </GlassyCard>
            ))
          )}
        </div>

        {/* FAB */}
        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="fixed bottom-24 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* New Intention Form */}
        {showNewForm && (
          <div className="fixed bottom-24 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder="New intention..."
              value={newIntention}
              onChange={(e) => setNewIntention(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddIntention();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAddIntention}
              disabled={isSaving || !newIntention.trim()}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewIntention("");
              }}
              className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
