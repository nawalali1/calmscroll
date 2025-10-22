"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Kind = "checkin" | "prompt" | "free";
type Reflection = {
  id: string;
  title?: string;
  body: string;
  kind: Kind;
  tags: string[];
  pinned: boolean;
  starred: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

const LS_KEY = "calmscroll_reflections";
const KIND_LABELS: Record<Kind, string> = {
  checkin: "Check-ins",
  prompt: "Prompts",
  free: "Free",
};

function loadReflections(): Reflection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Reflection[]) : [];
  } catch {
    return [];
  }
}

export default function ReflectionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Reflection[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const data = loadReflections().sort((a, b) =>
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    );
    setItems(data);
  }, []);

  const filtered = useMemo(() => {
    const base = filter === "all" ? items : items.filter((item) => item.kind === filter);
    const term = query.trim().toLowerCase();
    if (!term) return base;
    return base.filter((item) => {
      const haystack = `${item.title ?? ""} ${item.body}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [items, filter, query]);

  const startNew = (kind: Kind) => {
    setSheetOpen(false);
    router.push(`/notes/new?kind=${kind}`);
  };

  return (
    <main
      data-version="notes-list-v2"
      className="min-h-screen bg-gradient-to-b from-[#0B3B64] via-[#5282FF] to-[#FFB3C7] text-white"
    >
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-semibold">My Reflections</h1>
        <p className="mt-1 text-sm text-white/80">Capture daily check-ins, guided prompts, or free-form thoughts.</p>
        <div className="mt-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search reflections…"
            className="w-full rounded-2xl px-4 py-3 text-slate-900 outline-none"
          />
        </div>
        <div className="mt-3 flex gap-2 text-sm">
          {(["all", "checkin", "prompt", "free"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 border transition ${
                filter === key ? "bg-white text-[#0B3B64] border-white" : "border-white/40 text-white"
              }`}
            >
              {key === "all" ? "All" : KIND_LABELS[key]}
            </button>
          ))}
        </div>
      </header>

      <section className="px-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/20 backdrop-blur-md p-4">
            <p className="text-sm font-semibold">No reflections yet.</p>
            <p className="mt-1 text-sm text-white/80">
              Tap the plus button to capture a free reflection, explore a prompt, or log a check-in.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <Link
              key={item.id}
              href={`/notes/${item.id}`}
              className="block rounded-2xl bg-white/20 backdrop-blur-md p-4 transition hover:bg-white/25"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  {item.title?.trim() ||
                    (item.kind === "free"
                      ? "Free Reflection"
                      : item.kind === "prompt"
                      ? "Guided Prompt"
                      : "Check-in")}
                </h3>
                <span className="rounded-full bg-white/15 px-2 py-1 text-xs">
                  {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-white/85">{item.body || "—"}</p>
            </Link>
          ))
        )}

        <div className="h-24" />
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 text-slate-900 shadow-xl">
            <h2 className="text-lg font-semibold">New reflection</h2>
            <p className="mt-1 text-sm text-slate-600">Choose how you want to pause and reflect.</p>
            <div className="mt-4 grid gap-3">
              <button
                onClick={() => startNew("free")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-left font-semibold hover:bg-slate-50"
              >
                Free Reflection
                <span className="block text-xs font-normal text-slate-500">Journal freely with no structure.</span>
              </button>
              <button
                onClick={() => startNew("prompt")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-left font-semibold hover:bg-slate-50"
              >
                Choose a Prompt
                <span className="block text-xs font-normal text-slate-500">Pick from guided prompts to spark insight.</span>
              </button>
              <button
                onClick={() => startNew("checkin")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-left font-semibold hover:bg-slate-50"
              >
                Check-in
                <span className="block text-xs font-normal text-slate-500">Log how you feel right now.</span>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!sheetOpen ? (
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-white text-3xl font-bold text-[#0B3B64] shadow-lg"
          aria-label="Add reflection"
        >
          +
        </button>
      ) : null}
    </main>
  );
}
