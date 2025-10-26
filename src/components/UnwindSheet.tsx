'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Pause, Play } from 'lucide-react';

interface UnwindSheetProps {
  intentionText: string;
  onClose: () => void;
  onComplete: (duration: number) => void;
}

export default function UnwindSheet({ intentionText, onClose, onComplete }: UnwindSheetProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete(60);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, onComplete]);

  const progress = (60 - timeLeft) / 60;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - progress);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleClose = () => {
    setIsRunning(false);
    setTimeLeft(60);
    setIsPaused(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-t-3xl border border-foreground/20 bg-background p-6 text-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">One-Minute Unwind</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-foreground/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-foreground/70 mb-6">
          {intentionText}
        </p>

        {/* Circular Progress Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground/20"
              />
              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-emerald-500"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transition={{ duration: 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
              <span className="text-xs text-foreground/60">Breathing</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold transition"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 text-foreground px-6 py-3 rounded-full font-semibold transition"
              >
                <Pause className="w-4 h-4" />
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-full font-semibold transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}