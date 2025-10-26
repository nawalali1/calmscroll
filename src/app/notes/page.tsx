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
            <header className="bg-calm-gradient px-6 pt-16 pb-10 text-[var(--ink)]">
              <h1 className="text-3xl font-semibold tracking-tight text-center">My Reflections</h1>
              <p className="mt-2 text-center text-sm text-[var(--ink-muted)]">
              Capture mindful notes and revisit what grounded you today.
            </p>
            <div className="relative mx-auto mt-6 max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search reflections..."
                className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card)] px-11 py-3 text-sm text-[var(--ink)] shadow-inner shadow-black/5 transition placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>
            {loading ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--ink-muted)]" aria-live="polite">
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
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--ink-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span>Fetching your reflections…</span>
                </div>
                {Array.from({ length: 4 }).map((_, index) => (
                  <GlassyCard
                    key={index}
                    className="h-32 animate-pulse rounded-[26px] bg-[var(--card)]/70"
                  />
                ))}
              </div>
            ) : displayNotes.length === 0 ? (
              <div className="pt-12 text-center text-[var(--ink)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)] text-[var(--accent)] shadow">
                  <Sparkles className="h-8 w-8" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-semibold">
                  No reflections yet
                </h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Start a new note to capture how you feel right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-6">
                {displayNotes.map((note) => (
                  <GlassyCard
                    key={note.id}
                    className="group flex flex-col gap-4 rounded-[26px] border border-[var(--card-border)] bg-[var(--card)] p-5 text-left shadow-[0_25px_80px_-45px_rgba(30,64,160,0.25)]"
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
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                          {note.mood ? `Mood · ${note.mood}` : "Reflection"}
                        </span>
                        <h3 className="mt-2 text-base font-semibold text-[var(--ink)]">
                          {note.title?.trim() || "Untitled reflection"}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-[var(--ink-muted)]">
                          {note.content}
                        </p>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                          {formatTimestamp(note.updated_at)}
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
        <label className="block text-sm font-semibold text-[var(--ink)]">
            Title
            <input
              value={formState.title}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setFormState((prev) => ({ ...prev, title: value }));
              }}
              placeholder="Today I noticed..."
              className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </label>

        <label className="block text-sm font-semibold text-[var(--ink)]">
            Mood
            <select
              value={formState.mood}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setFormState((prev) => ({ ...prev, mood: value }));
              }}
              className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            >
              <option value="">No mood selected</option>
              {MOOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

        <label className="block text-sm font-semibold text-[var(--ink)]">
            Reflection
            <textarea
              value={formState.content}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setFormState((prev) => ({
                  ...prev,
                  content: value,
                }));
              }}
              placeholder="Let your thoughts flow..."
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-base text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </label>

          {localError ? <p className="text-sm text-rose-500">{localError}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetComposer}
              disabled={isSubmitting}
              className="rounded-full border border-[var(--card-border)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
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
