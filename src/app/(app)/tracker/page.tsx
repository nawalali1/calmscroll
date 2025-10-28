"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, Plus, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import PageWrapper from "@/components/PageWrapper";
import GlassyCard from "@/components/GlassyCard";

interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

export default function TrackerPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [showNewHabitForm, setShowNewHabitForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    const loadData = async () => {
      const supabase = getSupabaseClient();
      
      const { data: habitsData } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const { data: completionsData } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId);

      setHabits(habitsData || []);
      setCompletions(completionsData || []);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  const isCompletedToday = (habitId: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return completions.some(
      (c) => c.habit_id === habitId && c.completed_date === today
    );
  };

  const handleToggleHabit = useCallback(
    async (habitId: string) => {
      if (!userId) return;

      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];
      const alreadyCompleted = isCompletedToday(habitId);

      try {
        if (alreadyCompleted) {
          const { error } = await supabase
            .from("habit_completions")
            .delete()
            .eq("habit_id", habitId)
            .eq("completed_date", today);

          if (!error) {
            setCompletions((prev) =>
              prev.filter(
                (c) => !(c.habit_id === habitId && c.completed_date === today)
              )
            );
          }
        } else {
          const { data } = await supabase
            .from("habit_completions")
            .insert([
              {
                habit_id: habitId,
                user_id: userId,
                completed_date: today,
              },
            ])
            .select()
            .single();

          if (data) {
            setCompletions((prev) => [...prev, data]);
          }
        }
      } catch (error) {
        console.error("Error toggling habit:", error);
      }
    },
    [userId, completions, isCompletedToday]
  );

  const handleAddHabit = useCallback(async () => {
    if (!userId || !newHabitName.trim()) return;

    setIsSaving(true);
    const supabase = getSupabaseClient();

    try {
      const { data } = await supabase
        .from("habits")
        .insert([
          {
            user_id: userId,
            name: newHabitName,
            frequency: "daily",
          },
        ])
        .select()
        .single();

      if (data) {
        setHabits((prev) => [data, ...prev]);
        setNewHabitName("");
        setShowNewHabitForm(false);
      }
    } catch (error) {
      console.error("Error adding habit:", error);
    }

    setIsSaving(false);
  }, [userId, newHabitName]);

  const getStreak = (habitId: string): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const completed = completions.some(
        (c) => c.habit_id === habitId && c.completed_date === dateStr
      );

      if (completed) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  return (
    <PageWrapper className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Habits</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Build your daily routines</p>
        </div>

        {/* Habits List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">No habits yet. Create one to get started!</p>
            </div>
          ) : (
            habits.map((habit) => {
              const completed = isCompletedToday(habit.id);
              const streak = getStreak(habit.id);

              return (
                <GlassyCard key={habit.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`flex-shrink-0 mt-1 transition ${
                        completed
                          ? "text-emerald-500"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {habit.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                          🔥 {streak} day streak
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          completed
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          {completed ? "✓ Done today" : "Not done"}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassyCard>
              );
            })
          )}
        </div>

        {/* FAB */}
        {!showNewHabitForm && (
          <button
            onClick={() => setShowNewHabitForm(true)}
            className="fixed bottom-24 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* New Habit Form */}
        {showNewHabitForm && (
          <div className="fixed bottom-24 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder="New habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddHabit();
                }
              }}
            />
            <button
              onClick={handleAddHabit}
              disabled={isSaving || !newHabitName.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewHabitForm(false);
                setNewHabitName("");
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
