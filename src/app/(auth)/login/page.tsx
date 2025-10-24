"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MessageState =
  | {
      tone: "error" | "success";
      text: string;
    }
  | null;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Sign in to CalmScroll</h1>
          <p className="text-sm text-slate-600">Use your email and password to continue.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading) return;

            setMessage(null);
            setLoading(true);

            try {
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;
              setMessage({ tone: "success", text: "Signed in successfully. Redirecting…" });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Login failed";
              setMessage({ tone: "error", text: message });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            if (loading) return;
            if (!email || !password) {
              setMessage({ tone: "error", text: "Enter email and password to sign up." });
              return;
            }

            setLoading(true);
            try {
              const { error } = await supabase.auth.signUp({ email, password });
              if (error) throw error;
              setMessage({ tone: "success", text: "Check your email to confirm your account." });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Signup failed";
              setMessage({ tone: "error", text: message });
            } finally {
              setLoading(false);
            }
          }}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sign up
        </button>

        {message ? (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.tone === "error"
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
            role={message.tone === "error" ? "alert" : "status"}
          >
            {message.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}
