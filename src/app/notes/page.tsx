"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Star } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";

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
const KIND_LABELS: Record<Kind, string> = { checkin: "Check-ins", prompt: "Prompts", free: "Free" };

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function load(): Reflection[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "[]") as Reflection[];
  } catch {
    return [];
  }
}

function persist(list: Reflection[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export default function ReflectionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Reflection[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const data = load().sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
    setItems(data);
    setIsLoading(false);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = composerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [composerOpen]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? items : items.filter((item) => item.kind === filter);
    const term = query.trim().toLowerCase();
    if (!term) return base;
    return base.filter((item) => `${item.title ?? ""} ${item.body}`.toLowerCase().includes(term));
  }, [items, filter, query]);

  const updateItems = (next: Reflection[]) => {
    const sorted = [...next].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
    persist(sorted);
    setItems(sorted);
  };

  const togglePinned = (id: string) => {
    const next = items.map((item) => (item.id === id ? { ...item, pinned: !item.pinned, updatedAt: item.updatedAt } : item));
    updateItems(next);
  };

  const handleCardActivate = (id: string) => {
    router.push(`/notes/${id}`);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const now = new Date().toISOString();
    const next: Reflection = {
      id: uid(),
      title: title.trim(),
      body: body.trim(),
      kind: "free",
      tags: [],
      pinned: false,
      starred: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
    };
    updateItems([next, ...items]);
    setTitle("");
    setBody("");
    setError("");
    setComposerOpen(false);
  };

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    setBody(el.value);
  };

  const handleComposerToggle = (value: boolean) => {
    setComposerOpen(value);
    if (!value) {
      setTitle("");
      setBody("");
      setError("");
    }
  };

  return (
    <main
      data-version="notes-list-v2"
      className="min-h-screen bg-calm-gradient text-slate-900 transition-colors dark:text-white"
    >
      <header
        className={`bg-calm-gradient px-5 pt-12 pb-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] ${
          prefersReducedMotion ? "" : "transition-all duration-500"
        }`}
      >
        <h1 className="text-2xl font-semibold tracking-tight">My Reflections</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Capture daily check-ins, guided prompts, or free-form thoughts.
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search reflections."
            className="w-full rounded-full border border-white/60 bg-white/90 px-11 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/20 dark:bg-white/10 dark:text-white"
          />
        </div>

        <div className="mt-4 flex gap-2 text-sm">
          {(["all", "checkin", "prompt", "free"] as const).map((key) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? "bg-white text-[#0B3B64] shadow"
                    : "border border-white/50 text-white/90 hover:bg-white/20 dark:border-white/20"
                }`}
              >
                {key === "all" ? "All" : KIND_LABELS[key]}
              </button>
            );
          })}
        </div>
      </header>

      <section className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <GlassyCard key={index} className="animate-pulse bg-white/40 dark:bg-white/10">
                <div className="space-y-3 p-4">
                  <div className="h-4 w-1/3 rounded-full bg-white/60 dark:bg-white/20" />
                  <div className="h-3 w-full rounded-full bg-white/50 dark:bg-white/15" />
                  <div className="h-3 w-2/3 rounded-full bg-white/40 dark:bg-white/10" />
                </div>
              </GlassyCard>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <GlassyCard className="p-6 text-center">
            <p className="text-base font-semibold text-slate-700 dark:text-white">Create your first reflection</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Tap the plus button to journal freely, pick a prompt, or check in with yourself.
            </p>
            <button
              className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-indigo-500"
              onClick={() => handleComposerToggle(true)}
            >
              Open composer
            </button>
          </GlassyCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, index) => {
              const animationClass =
                prefersReducedMotion || !mounted
                  ? ""
                  : `transition-all duration-300 ease-out ${mounted ? "opacity-100 translate-y-0" : ""}`;
              const initialClass = prefersReducedMotion || mounted ? "" : "opacity-0 translate-y-1";
              return (
                <GlassyCard
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => handleCardActivate(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCardActivate(item.id);
                    }
                  }}
                  className={`group relative cursor-pointer bg-white/75 p-4 text-left dark:bg-white/10 ${initialClass} ${animationClass}`}
                  style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 20}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                        {item.title?.trim() ||
                          (item.kind === "free"
                            ? "Free Reflection"
                            : item.kind === "prompt"
                            ? "Guided Prompt"
                            : "Check-in")}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {item.body || "—"}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <IconButton
                        aria-label={item.pinned ? "Unpin reflection" : "Pin reflection"}
                        icon={Star}
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePinned(item.id);
                        }}
                        className={item.pinned ? "bg-amber-400/90 text-white hover:bg-amber-400" : ""}
                      />
                      <IconButton
                        aria-label="More options"
                        icon={MoreVertical}
                        onClick={(event) => {
                          event.stopPropagation();
                          // Placeholder micro-interaction; future menu could be added here.
                          console.log("More options for reflection", item.id);
                        }}
                      />
                    </div>
                  </div>
                </GlassyCard>
              );
            })}
          </div>
        )}
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 text-slate-900 shadow-2xl dark:bg-neutral-900 dark:text-white">
            <h2 className="text-lg font-semibold">New reflection</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Give this reflection a title and jot down what&apos;s on your mind.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Title
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.currentTarget.value);
                    if (error) setError("");
                  }}
                  placeholder="Today I noticed..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
                />
                {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Body
                <textarea
                  value={body}
                  onChange={handleTextareaInput}
                  placeholder="Let your thoughts flow..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => handleComposerToggle(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 dark:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {!composerOpen && (
        <button
          onClick={() => handleComposerToggle(true)}
          className="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-indigo-500"
          aria-label="Add reflection"
        >
          +
        </button>
      )}
    </main>
  );
}
