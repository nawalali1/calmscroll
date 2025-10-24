"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trash2, Pencil, Sparkles } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";
import { useNotes, type Note } from "@/hooks/useNotes";

const MOOD_OPTIONS = ["Calm", "Grounded", "Grateful", "Focused", "Reflective"];

const formatTimestamp = (value: string) => {
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
};

type FormState = {
  title: string;
  content: string;
  mood: string;
};

const initialForm: FormState = {
  title: "",
  content: "",
  mood: "",
};

export default function NotesPage() {
  const router = useRouter();
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refetch,
  } = useNotes();

  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialForm);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayNotes = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter((note) => {
      const titleMatch = (note.title ?? "").toLowerCase().includes(term);
      const contentMatch = note.content.toLowerCase().includes(term);
      const moodMatch = (note.mood ?? "").toLowerCase().includes(term);
      return titleMatch || contentMatch || moodMatch;
    });
  }, [notes, query]);

  const resetComposer = () => {
    setComposerOpen(false);
    setEditingNoteId(null);
    setFormState(initialForm);
    setLocalError(null);
  };

  const openComposerForNew = () => {
    setEditingNoteId(null);
    setFormState(initialForm);
    setComposerOpen(true);
  };

  const openComposerForEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setFormState({
      title: note.title ?? "",
      content: note.content,
      mood: note.mood ?? "",
    });
    setComposerOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.content.trim()) {
      setLocalError("Reflection cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      if (editingNoteId) {
        await updateNote(editingNoteId, {
          title: formState.title.trim() || null,
          content: formState.content.trim(),
          mood: formState.mood.trim() || null,
        });
      } else {
        await createNote({
          title: formState.title.trim() || undefined,
          content: formState.content.trim(),
          mood: formState.mood.trim() || undefined,
        });
      }
      resetComposer();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save note.";
      setLocalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this reflection?");
    if (!confirmed) return;
    await deleteNote(id);
  };

  const handleOpenDetail = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  return (
    <>
        <div className="page-shell">
          <div className="screen">
            <header className="bg-calm-gradient px-6 pt-16 pb-10 text-slate-900 dark:text-white">
              <h1 className="text-3xl font-semibold tracking-tight text-center">My Reflections</h1>
              <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
              Capture mindful notes and revisit what grounded you today.
            </p>
            <div className="relative mx-auto mt-6 max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search reflections..."
                className="w-full rounded-full border border-white/40 bg-white/80 px-11 py-3 text-sm text-slate-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/15 dark:bg-white/10 dark:text-white"
              />
            </div>
            {loading ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Loading reflections…</span>
              </div>
            ) : null}
            {error ? (
              <p className="mt-3 text-center text-sm text-rose-500">
                {error}{" "}
                <button className="underline" type="button" onClick={() => refetch()}>
                  Try again
                </button>
              </p>
            ) : null}
          </header>

          <main className="flex-1 overflow-y-auto px-6 pb-[140px]">
            {loading ? (
              <div className="space-y-3 pt-6" aria-live="polite">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span>Fetching your reflections…</span>
                </div>
                {Array.from({ length: 4 }).map((_, index) => (
                  <GlassyCard
                    key={index}
                    className="h-32 animate-pulse rounded-[26px] bg-white/70 dark:bg-white/10"
                  />
                ))}
              </div>
            ) : displayNotes.length === 0 ? (
              <div className="pt-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-indigo-500 shadow dark:bg-white/10">
                  <Sparkles className="h-8 w-8" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
                  No reflections yet
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Start a new note to capture how you feel right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-6">
                {displayNotes.map((note) => (
                  <GlassyCard
                    key={note.id}
                    className="group flex flex-col gap-4 rounded-[26px] border border-white/80 bg-white p-5 text-left shadow-[0_25px_80px_-45px_rgba(30,64,160,0.45)] dark:border-white/10 dark:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenDetail(note)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenDetail(note);
                          }
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          {note.mood ? `Mood · ${note.mood}` : "Reflection"}
                        </span>
                        <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-white">
                          {note.title?.trim() || "Untitled reflection"}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-300">
                          {note.content}
                        </p>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                          {formatTimestamp(note.updated_at || note.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <IconButton
                          aria-label="Edit reflection"
                          icon={Pencil}
                          onClick={(event) => {
                            event.stopPropagation();
                            openComposerForEdit(note);
                          }}
                        />
                        <IconButton
                          aria-label="Delete reflection"
                          icon={Trash2}
                          className="text-rose-500 hover:text-rose-600"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(note.id);
                          }}
                        />
                      </div>
                    </div>
                  </GlassyCard>
                ))}
              </div>
            )}

          </main>

          {!composerOpen && (
            <button
              onClick={openComposerForNew}
              className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+116px)] right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7EA7FF] via-[#9C8BFF] to-[#FF8DC5] text-3xl font-bold text-white shadow-[0_25px_45px_-25px_rgba(255,142,200,0.6)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Add reflection"
            >
              +
            </button>
          )}

          <BottomNav />
        </div>
      </div>

      <BottomSheet
        open={composerOpen}
        onClose={resetComposer}
        title={editingNoteId ? "Edit reflection" : "New reflection"}
        description="Capture what’s on your mind. Titles and mood selections are optional."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Title
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.currentTarget.value }))}
              placeholder="Today I noticed..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Mood
            <select
              value={formState.mood}
              onChange={(event) => setFormState((prev) => ({ ...prev, mood: event.currentTarget.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
            >
              <option value="">No mood selected</option>
              {MOOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Reflection
            <textarea
              value={formState.content}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  content: event.currentTarget.value,
                }))
              }
              placeholder="Let your thoughts flow..."
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-white/10 dark:text-white"
            />
          </label>

          {localError ? <p className="text-sm text-rose-500">{localError}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetComposer}
              disabled={isSubmitting}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF] disabled:opacity-60 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </BottomSheet>
    </>
  );
}
