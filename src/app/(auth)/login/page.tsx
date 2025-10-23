"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-calm-gradient px-6 py-12 text-center text-slate-900 dark:text-white">
      <div className="max-w-sm space-y-6 rounded-[32px] bg-white/80 p-8 shadow-xl backdrop-blur-md dark:bg-white/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-sky-400 to-pink-400 text-white shadow-lg">
          <span className="text-2xl font-semibold">~</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">CalmScroll Login</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This preview build routes authentication through <strong>/auth</strong>. Use the button below to continue to
          the full experience.
        </p>
        <Link
          href="/auth"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-indigo-500"
        >
          Go to Login
        </Link>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Need help? Contact support@calmscroll.app.
        </p>
      </div>
    </main>
  );
}
