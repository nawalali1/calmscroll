"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock, Wind, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import UnwindProgressRing from "@/components/ui/UnwindProgressRing";

// Background decoration component
function BackgroundDecor({ theme }: { theme: 'light' | 'dark' | string }) {
  const lightBg =
    'linear-gradient(180deg, rgb(245 241 255) 0%, rgb(240 247 255) 40%, rgb(255 246 240) 100%)';
  const darkBg =
    'linear-gradient(180deg, rgb(7 16 28) 0%, rgb(15 23 42) 45%, rgb(2 6 23) 100%)';

  const lightGlow =
    'radial-gradient(700px 360px at 50% -120px, rgba(180,200,255,0.28), transparent 70%)';
  const darkGlow =
    'radial-gradient(700px 360px at 50% -120px, rgba(64,83,216,0.22), transparent 70%)';

  return (
    <>
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: theme === 'dark' ? `${darkGlow}, ${darkBg}` : `${lightGlow}, ${lightBg}` }}
      />
      {/* side vignettes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 -z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 -z-10 bg-gradient-to-l from-background to-transparent" />
    </>
  );
}

// Glass style constants
const glassCard =
  "rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-6";
const glassNav =
  "rounded-3xl bg-card/70 backdrop-blur-md border border-border/40 shadow-[0_8px_24px_rgba(0,0,0,0.12)]";

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
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type UnwindSession = {
  duration: number;
  isActive: boolean;
  progress: number;
};

export default function HomePage() {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
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
  const unwindIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        // Add email from session to profile
        setUserProfile({
          ...profile,
          email: session.user.email,
        });
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

    // Clear existing interval if any
    if (unwindIntervalRef.current) {
      clearInterval(unwindIntervalRef.current);
    }

    // Start timer
    unwindIntervalRef.current = setInterval(() => {
      setUnwindSession(prev => {
        const newProgress = prev.progress + (100 / prev.duration);
        if (newProgress >= 100) {
          if (unwindIntervalRef.current) {
            clearInterval(unwindIntervalRef.current);
            unwindIntervalRef.current = null;
          }
          completeUnwindSession();
          return { ...prev, progress: 100, isActive: false };
        }
        return { ...prev, progress: newProgress };
      });
    }, 1000);
  };

  const cancelUnwindSession = () => {
    if (unwindIntervalRef.current) {
      clearInterval(unwindIntervalRef.current);
      unwindIntervalRef.current = null;
    }
    setUnwindSession(prev => ({ ...prev, isActive: false, progress: 0 }));
    setShowUnwindSheet(false);
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

  // Get display name from profile, preferring first_name, then display_name, then email
  const getDisplayName = () => {
    if (userProfile?.first_name?.trim()) {
      return userProfile.first_name;
    }
    if (userProfile?.display_name?.trim()) {
      return userProfile.display_name;
    }
    if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return "Friend";
  };

  const displayName = getDisplayName();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          background: theme === "dark"
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]"
          />
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      initial={!reducedMotion ? { opacity: 0, y: 8 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={!reducedMotion ? { duration: 0.25 } : { duration: 0 }}
      className="relative min-h-screen w-full flex flex-col items-center justify-start px-4 py-8 gap-6 overflow-x-hidden"
    >
      <BackgroundDecor theme={theme} />
      {/* Page Container - centered column */}
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Greeting Section - ~48px top padding */}
        <motion.div
          initial={!reducedMotion ? { opacity: 0, y: -12 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={!reducedMotion ? { delay: 0.05, duration: 0.3 } : { duration: 0 }}
          className="pt-12 text-center"
        >
          <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-base text-muted-foreground">
            What would you like to focus on?
          </p>
        </motion.div>

        {/* Intention Input Card - default state */}
        {!activeIntention && (
          <motion.div
            initial={!reducedMotion ? { opacity: 0, y: 8 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={!reducedMotion ? { delay: 0.1, duration: 0.3 } : { duration: 0 }}
            whileHover={!reducedMotion ? { y: -3 } : {}}
            className={`${glassCard} space-y-4`}
          >
            <h2 className="text-sm font-medium text-muted-foreground">Set Your Intention</h2>

            <div className="relative">
              <input
                type="text"
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createIntention()}
                className="peer w-full bg-transparent border border-border/50 rounded-xl h-11 px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-ring/60"
                placeholder=" "
                aria-label="Set your intention"
              />
              <label className="absolute left-4 top-2.5 text-sm text-muted-foreground transition-all pointer-events-none peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5">
                What&apos;s your intention?
              </label>
            </div>

            <button
              onClick={createIntention}
              disabled={!intentionText.trim() || isSubmitting}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Setting..." : "Start with intention"}
            </button>
          </motion.div>
        )}

        {/* Active Intention Card - active state */}
        {activeIntention && (
          <motion.div
            initial={!reducedMotion ? { opacity: 0, scale: 0.95 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={!reducedMotion ? { delay: 0.1, duration: 0.3 } : { duration: 0 }}
            whileHover={!reducedMotion ? { y: -3 } : {}}
            className={glassCard}
          >
            <div className="mb-3">
              <h2 className="text-xs font-medium text-muted-foreground mb-1">You planned to…</h2>
              <p className="text-base md:text-lg font-medium text-foreground">{activeIntention.text}</p>
            </div>

            <div className="h-px bg-border/40 my-3" />

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={completeIntention}
                className="h-10 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as done
              </button>

              <button
                onClick={() => snoozeIntention(5)}
                className="h-10 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <Clock className="w-4 h-4" />
                Snooze 5 min
              </button>

              <button
                onClick={startUnwindSession}
                className="h-10 rounded-xl text-sm font-medium text-foreground/90 hover:underline flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <Wind className="w-4 h-4" />
                Unwind 1 min
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Unwind Sheet - Half-height bottom sheet */}
      <AnimatePresence mode="wait" initial={false}>
        {showUnwindSheet && (
          <>
            <motion.div
              key="unwind-overlay"
              initial={!reducedMotion ? { opacity: 0 } : { opacity: 0.3 }}
              animate={{ opacity: 0.3 }}
              exit={!reducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={!reducedMotion ? { duration: 0.2 } : { duration: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={cancelUnwindSession}
            />
            <motion.div
              key="unwind-sheet"
              initial={!reducedMotion ? { y: "100%", opacity: 0 } : { y: "0%", opacity: 1 }}
              animate={!reducedMotion ? { y: "0%", opacity: 1 } : { y: "0%", opacity: 1 }}
              exit={!reducedMotion ? { y: "100%", opacity: 0 } : { y: "0%", opacity: 0 }}
              transition={!reducedMotion
                ? { type: "spring", stiffness: 260, damping: 24 }
                : { duration: 0 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-sm rounded-t-3xl border border-border/40 border-b-0 bg-card/80 backdrop-blur-xl p-6 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary to-accent opacity-70" />
                <h3 className="text-lg font-semibold text-foreground">Unwind</h3>
                <button
                  onClick={cancelUnwindSession}
                  className="p-1.5 rounded-full hover:bg-border/50 transition-colors"
                  aria-label="Close unwind session"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Progress Ring */}
              <div className="flex justify-center mb-6">
                <UnwindProgressRing
                  duration={unwindSession.duration}
                  elapsed={Math.floor((unwindSession.progress / 100) * unwindSession.duration)}
                />
              </div>

              {/* Status Text */}
              <p className="text-center text-muted-foreground text-sm mb-6">
                {unwindSession.isActive
                  ? "Follow your breath. You're doing great."
                  : "Take a minute to reset and refocus."}
              </p>

              {/* Button */}
              {!unwindSession.isActive && (
                <button
                  onClick={startUnwindSession}
                  className="w-full h-11 rounded-xl font-medium text-primary-foreground bg-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
                >
                  Start 1-Minute Unwind
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <motion.nav
        initial={!reducedMotion ? { opacity: 0, y: 8 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={!reducedMotion ? { delay: 0.2, duration: 0.3 } : { duration: 0 }}
        className="fixed bottom-0 left-0 right-0 z-30 max-w-sm mx-auto px-4 mb-4 pb-[env(safe-area-inset-bottom)]"
      >
        <div className={`${glassNav} px-4 py-2`}>
          <BottomNav />
        </div>
      </motion.nav>

      {/* Safe area spacer for bottom nav */}
      <div className="h-24" />
    </motion.main>
  );
}