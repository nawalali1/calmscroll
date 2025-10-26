"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock, Wind, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BottomNav from "@/components/BottomNav";

// Types
type Intention = {
  id: string;
  text: string;
  status: 'active' | 'done' | 'snoozed';
  created_at: string;
  completed_at: string | null;
  snooze_until: string | null;
};

type UserProfile = {
  display_name: string | null;
};

type UnwindSession = {
  duration: number;
  isActive: boolean;
  progress: number;
};

export default function HomePage() {
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeIntention, setActiveIntention] = useState<Intention | null>(null);
  const [intentionText, setIntentionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnwindSheet, setShowUnwindSheet] = useState(false);
  const [unwindSession, setUnwindSession] = useState<UnwindSession>({
    duration: 60,
    isActive: false,
    progress: 0
  });
  const [loading, setLoading] = useState(true);

  // Dynamic color variables for theme-aware SVG - updates when theme changes
  const progressRingColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const progressBgColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  // Load user data and active intention on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Ensure theme changes are reflected immediately
  useEffect(() => {
    // This effect runs when theme changes, ensuring SVG colors update
  }, [theme]);

  const loadUserData = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // Load user profile with full data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else if (profile) {
        setUserProfile(profile);
      }

      // Load active intention
      const { data: intention, error: intentionError } = await supabase
        .from('intentions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (intentionError) {
        console.error('Error loading intention:', intentionError);
      } else if (intention) {
        setActiveIntention(intention);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIntention = async () => {
    if (!intentionText.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      // Ensure only one active intention
      await supabase
        .from('intentions')
        .update({ status: 'done' })
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      // Create new intention
      const { data: newIntention, error } = await supabase
        .from('intentions')
        .insert({
          user_id: session.user.id,
          text: intentionText.trim(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveIntention(newIntention);
      setIntentionText("");
      
      // Schedule reminder notification
      scheduleReminder(newIntention.id);
    } catch (error) {
      console.error('Error creating intention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeIntention = async () => {
    if (!activeIntention) return;

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('intentions')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', activeIntention.id);

      if (error) throw error;

      setActiveIntention(null);
    } catch (error) {
      console.error('Error completing intention:', error);
    }
  };

  const snoozeIntention = async (minutes: number = 5) => {
    if (!activeIntention) return;

    try {
      const supabase = getSupabaseClient();
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('intentions')
        .update({ 
          status: 'snoozed',
          snooze_until: snoozeUntil
        })
        .eq('id', activeIntention.id);

      if (error) throw error;

      setActiveIntention(null);
    } catch (error) {
      console.error('Error snoozing intention:', error);
    }
  };

  const startUnwindSession = () => {
    setShowUnwindSheet(true);
    setUnwindSession(prev => ({ ...prev, isActive: true, progress: 0 }));
    
    // Start timer
    const interval = setInterval(() => {
      setUnwindSession(prev => {
        const newProgress = prev.progress + (100 / prev.duration);
        if (newProgress >= 100) {
          clearInterval(interval);
          completeUnwindSession();
          return { ...prev, progress: 100, isActive: false };
        }
        return { ...prev, progress: newProgress };
      });
    }, 1000);
  };

  const completeUnwindSession = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase
          .from('breath_sessions')
          .insert({
            user_id: session.user.id,
            duration_seconds: 60,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error logging breath session:', error);
    }
  };

  const scheduleReminder = async (intentionId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Get user's reminder settings
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (settings?.nudges_enabled) {
        // In a real app, you'd use Push API or set a timer
        console.log(`Would send reminder for intention ${intentionId} after ${settings.nudge_after_seconds} seconds`);
        
        // Log the notification
        await supabase
          .from('notifications')
          .insert({
            user_id: session.user.id,
            intention_id: intentionId
          });
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  };

  // Get display name from profile, with fallback to email
  const displayName = userProfile?.display_name?.trim()
    ? userProfile.display_name
    : "Friend";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--ink)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--ink-muted)] border-t-[var(--accent)]" />
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--ink-muted)]">
            Loading your calm space…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--ink)] transition-colors duration-300 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-4"
        style={{ paddingTop: `calc(2rem + env(safe-area-inset-top))` }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {displayName}</h1>
          <p className="text-[var(--ink-muted)] text-sm">
            What would you like to focus on?
          </p>
        </div>
      </motion.header>

      <div className="flex-1 px-6 space-y-6 pb-6">
        {/* Set Intention Section */}
        {!activeIntention && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-4">Set Your Intention</h2>
              <p className="text-sm mb-4 text-[var(--ink-muted)]">
                What did you open your phone to do?
              </p>
              <div className="space-y-3">
                <Input
                  value={intentionText}
                  onChange={(e) => setIntentionText(e.target.value)}
                  placeholder="e.g., Check messages, Read an article, Make a call..."
                  onKeyDown={(e) => e.key === 'Enter' && createIntention()}
                />
                <Button
                  onClick={createIntention}
                  disabled={!intentionText.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Setting intention..." : "Start with intention"}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Active Intention Card */}
        {activeIntention && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Your Intention</h3>
                  <p className="text-[var(--ink)] text-base leading-relaxed">
                    {activeIntention.text}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-[var(--success)] animate-pulse mt-1 flex-shrink-0" />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={completeIntention}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--success)] hover:brightness-110 text-white py-3"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Mark as Done
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => snoozeIntention(5)}
                    className="flex items-center justify-center gap-2 border border-[var(--card-border)] hover:bg-[var(--card)]/50 text-[var(--ink)] py-3"
                  >
                    <Clock className="h-5 w-5" />
                    Snooze 5 min
                  </Button>

                  <Button
                    onClick={startUnwindSession}
                    className="flex items-center justify-center gap-2 border border-[var(--card-border)] hover:bg-[var(--card)]/50 text-[var(--ink)] py-3"
                  >
                    <Wind className="h-5 w-5" />
                    Unwind 1 min
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </div>

      {/* Unwind Sheet */}
      <AnimatePresence>
        {showUnwindSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={() => setShowUnwindSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md rounded-t-3xl p-6 bg-[var(--card)] text-[var(--ink)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Unwind Session</h3>
                <button
                  onClick={() => setShowUnwindSheet(false)}
                  className="p-2 hover:bg-[var(--card-border)]/50 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center space-y-6">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={progressBgColor}
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={progressRingColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * unwindSession.progress) / 100}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {Math.ceil((unwindSession.duration * (100 - unwindSession.progress)) / 100)}s
                    </span>
                  </div>
                </div>

                <p className="text-[var(--ink-muted)]">
                  {unwindSession.isActive
                    ? "Follow your breath..."
                    : "Take a minute to reset and refocus"}
                </p>

                {!unwindSession.isActive && (
                  <Button onClick={startUnwindSession} className="w-full">
                    Start 1-Minute Unwind
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingBottom: `env(safe-area-inset-bottom)` }}>
        <BottomNav />
      </div>
    </div>
  );
}