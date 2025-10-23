"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Star } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";

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

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const dayLabel = sameDay
    ? "Today"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dayLabel}, ${timeLabel}`;
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const data = load().sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
    setItems(data);
    setIsLoading(false);
    setMounted(true);
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => setPrefersReducedMotion(media.matches);
      update();
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    return undefined;
  }, []);

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
    <div className="page-shell">
      <div className="screen bg-[#F6F8FC]" data-version="notes-wireframe">
        <header
          className={`relative overflow-hidden rounded-b-[42px] bg-[linear-gradient(150deg,#103A8A_0%,#3F6BFF_55%,#FF8CC4_100%)] px-6 pb-16 pt-[calc(env(safe-area-inset-top,0px)+2.25rem)] text-white shadow-[0_30px_80px_-30px_rgba(30,64,160,0.55)] ${
            prefersReducedMotion ? "" : "transition-all duration-500"
          }`}
        >
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Notes</p>
            <h1 className="text-3xl font-semibold tracking-tight">My Reflections</h1>
            <p className="text-sm text-white/75">Revisit the moments you captured across your day.</p>
          </div>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search reflections…"
              className="w-full rounded-full border border-white/30 bg-white/15 px-12 py-3 text-sm font-medium text-white placeholder-white/60 shadow-inner shadow-white/10 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {(["all", "checkin", "prompt", "free"] as const).map((key) => {
              const isActive = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-white/70 ${
                    isActive ? "bg-white text-[#103A8A] shadow-sm" : "border border-white/35 text-white/85 hover:bg-white/15"
                  }`}
                >
                  {key === "all" ? "All" : KIND_LABELS[key]}
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-[-1px]" aria-hidden>
            <svg viewBox="0 0 375 60" xmlns="http://www.w3.org/2000/svg" className="h-12 w-full text-white/65">
              <path
                fill="currentColor"
                d="M0 40c30 12 90 32 150 28s120-36 180-40 96 20 96 20v32H0V40z"
              />
            </svg>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 pb-[140px] pt-12">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <GlassyCard
                  key={index}
                  className="rounded-[26px] border border-white/80 bg-white/70 p-5 shadow-[0_25px_80px_-45px_rgba(30,64,160,0.45)]"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-1/3 rounded-full bg-slate-200/70" />
                    <div className="h-3 w-full rounded-full bg-slate-200/60" />
                    <div className="h-3 w-2/3 rounded-full bg-slate-200/50" />
                  </div>
                </GlassyCard>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <GlassyCard className="rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-[0_25px_80px_-45px_rgba(30,64,160,0.45)]">
              <p className="text-base font-semibold text-slate-800">Create your first reflection</p>
              <p className="mt-2 text-sm text-slate-500">
                Tap the plus button to journal freely, pick a prompt, or check in with yourself.
              </p>
              <button
                className="mt-4 inline-flex rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
                onClick={() => handleComposerToggle(true)}
              >
                Open Composer
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
                    className={`group relative cursor-pointer rounded-[26px] border border-white/80 bg-white p-5 text-left shadow-[0_25px_80px_-45px_rgba(30,64,160,0.45)] ${initialClass} ${animationClass}`}
                    style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 20}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">
                          {item.title?.trim() ||
                            (item.kind === "free"
                              ? "Free Reflection"
                              : item.kind === "prompt"
                              ? "Guided Prompt"
                              : "Check-in")}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.body || "—"}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          {formatTimestamp(item.updatedAt || item.createdAt)}
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
        </main>

        <BottomSheet
          open={composerOpen}
          onClose={() => handleComposerToggle(false)}
          title="New reflection"
          description="Give this reflection a title and jot down what’s on your mind."
        >
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

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => handleComposerToggle(false)}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
            >
              Save
            </button>
          </div>
        </BottomSheet>

        {!composerOpen && (
          <button
            onClick={() => handleComposerToggle(true)}
            className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+116px)] right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7EA7FF] via-[#9C8BFF] to-[#FF8DC5] text-3xl font-bold text-white shadow-[0_25px_45px_-25px_rgba(255,142,200,0.6)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Add reflection"
          >
            +
          </button>
        )}

        <BottomNav />
      </div>
    </div>
  );
}
