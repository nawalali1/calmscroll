'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Check, Clock, Zap } from 'lucide-react';
import { useIntentions } from '@/hooks/useIntentions';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { useUnwindSession } from '@/hooks/useUnwindSession';
import { useUser } from '@/hooks/useUser';
import UnwindSheet from '@/components/UnwindSheet';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUnwindSheet, setShowUnwindSheet] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { user, loading: userLoading } = useUser();
  const { 
    intention, 
    loading: intentionLoading, 
    error: intentionError, 
    createIntention, 
    markAsDone, 
    snoozeIntention, 
    refetch 
  } = useIntentions();
  const { loading: settingsLoading } = useReminderSettings();
  const { createBreathSession } = useUnwindSession();

  const [intentionInput, setIntentionInput] = useState('');

  // Auto-open unwind sheet if ?unwind=true in URL
  useEffect(() => {
    if (searchParams.get('unwind') === 'true') {
      setShowUnwindSheet(true);
      router.replace('/home');
    }
  }, [searchParams, router]);

  const handleCreateIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentionInput.trim()) return;

    try {
      await createIntention(intentionInput);
      setIntentionInput('');
      showToast('Intention saved! Stay focused.', 'success');
    } catch {
      showToast('Failed to save intention', 'error');
    }
  };

  const handleMarkAsDone = async () => {
    if (!intention) return;
    try {
      await markAsDone(intention.id);
      showToast('Great work! Intention completed.', 'success');
    } catch {
      showToast('Failed to mark as done', 'error');
    }
  };

  const handleSnooze = async () => {
    if (!intention) return;
    try {
      await snoozeIntention(intention.id, 5);
      showToast('Intention snoozed for 5 minutes', 'success');
    } catch {
      showToast('Failed to snooze', 'error');
    }
  };

  const handleUnwindComplete = async (duration: number) => {
    try {
      if (intention) {
        await createBreathSession(duration, true);
      }
      setShowUnwindSheet(false);
      showToast('Nice. Continue your intention.', 'success');
    } catch {
      showToast('Failed to log session', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isLoading = userLoading || intentionLoading || settingsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background text-foreground pb-24"
    >
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* HEADER */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-1"
        >
          <p className="text-xs font-semibold text-foreground/60 tracking-widest">GOOD AFTERNOON</p>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.display_name || 'Friend'}
          </h1>
        </motion.div>

        {/* DAILY PROGRESS RING */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-32 h-32 mx-auto"
        >
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-foreground/10" />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-emerald-500"
              strokeDasharray="314"
              initial={{ strokeDashoffset: 314 }}
              animate={{ strokeDashoffset: 314 * 0.5 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center -mt-28">
            <span className="text-2xl font-bold text-foreground">0%</span>
            <span className="text-xs text-foreground/60">TODAY</span>
          </div>
        </motion.div>

        {/* BREATHE BUTTON */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUnwindSheet(true)}
            className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors"
          >
            <span className="mr-2">🧘</span>
            Breathe
          </motion.button>
        </motion.div>

        {/* ACTIVE INTENTION SECTION */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* ERROR STATE */}
          {intentionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">{intentionError}</p>
                <button onClick={refetch} className="text-xs text-red-500 hover:underline mt-1">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* INTENTION INPUT FORM */}
          <form onSubmit={handleCreateIntention} className="space-y-2">
            <label className="block text-sm font-semibold text-foreground/80">
              What did you open your phone to do?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={intentionInput}
                onChange={(e) => setIntentionInput(e.target.value)}
                placeholder="e.g., Check Sarah's email"
                className="flex-1 bg-foreground/5 border border-foreground/20 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!intentionInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set
              </button>
            </div>
          </form>

          {/* ACTIVE INTENTION CARD */}
          <AnimatePresence mode="wait">
            {intention && intention.status === 'active' ? (
              <motion.div
                key={intention.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 space-y-4"
              >
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Intention</p>
                  <p className="text-lg font-bold text-foreground mt-1">{intention.text}</p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUnwindSheet(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    Unwind
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSnooze}
                    className="bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap className="w-4 h-4" />
                    Snooze
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMarkAsDone}
                    className="bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-lg py-2 font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Done
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-foreground/5 border border-dashed border-foreground/20 rounded-xl p-8 text-center"
              >
                <p className="text-foreground/60">Set an intention to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* UNWIND SHEET MODAL */}
      <AnimatePresence>
        {showUnwindSheet && (
          <UnwindSheet
            intentionText={intention?.text || 'Reset your focus'}
            onClose={() => setShowUnwindSheet(false)}
            onComplete={handleUnwindComplete}
          />
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATIONS */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-24 left-4 right-4 rounded-lg px-4 py-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}