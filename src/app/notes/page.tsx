"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trash2, Pencil, Plus, Sparkles, X, ChevronDown } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";
import { useNotes, type Note } from "@/hooks/useNotes";
import { useTheme } from "@/components/providers/ThemeProvider";

const MOOD_OPTIONS = ["Calm", "Grounded", "Grateful", "Focused", "Reflective"] as const;
type SortMode = "recent" | "az";

const formatTime = (value: string): string => {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const day = sameDay
      ? "Today"
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${day}, ${time}`;
  } catch {
    return "—";
  }
};

export default function NotesPage() {
  const router = useRouter();
  useTheme(); // tokens already applied globally

  const { notes, loading, error, createNote, updateNote, deleteNote, refetch } = useNotes();

  // search and sort
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  // composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput.trim()), 250);
    return () => clearTimeout(t);
  }, [queryInput]);

  // success auto hide
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 1800);
    return () => clearTimeout(t);
  }, [successMsg]);

  // filtered list
  const filteredNotes = useMemo(() => {
    let list = notes;
    if (query) {
      const term = query.toLowerCase();
      list = list.filter(
        n =>
          n.title?.toLowerCase().includes(term) ||
          n.content.toLowerCase().includes(term) ||
          n.mood?.toLowerCase().includes(term)
      );
    }
    if (sort === "recent") {
      list = [...list].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else {
      list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return list;
  }, [notes, query, sort]);

  // composer handlers
  const openNew = useCallback(() => {
    setEditingId(null);
    setForm({ title: "", content: "", mood: "" });
    setComposerError(null);
    setComposerOpen(true);
  }, []);

  const openEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setForm({ title: note.title ?? "", content: note.content, mood: note.mood ?? "" });
    setComposerError(null);
    setComposerOpen(true);
  }, []);

  const resetComposer = useCallback(() => {
    setComposerOpen(false);
    setEditingId(null);
    setForm({ title: "", content: "", mood: "" });
    setComposerError(null);
  }, []);

  const saveNote = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        mood: form.mood.trim(),
      };
      if (!payload.content) {
        setComposerError("Reflection cannot be empty.");
        return;
      }
      setIsSaving(true);
      setComposerError(null);
      try {
        if (editingId) {
          await updateNote(editingId, {
            title: payload.title || null,
            content: payload.content,
            mood: payload.mood || null,
          });
          setSuccessMsg("Reflection updated.");
        } else {
          await createNote({
            title: payload.title || undefined,
            content: payload.content,
            mood: payload.mood || undefined,
          });
          setSuccessMsg("Reflection saved.");
        }
        resetComposer();
      } catch (err) {
        console.error(err);
        setComposerError(err instanceof Error ? err.message : "Could not save your note.");
      } finally {
        setIsSaving(false);
      }
    },
    [editingId, form, updateNote, createNote, resetComposer]
  );

  // delete
  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setPageError(null);
    try {
      await deleteNote(deleteId);
      setSuccessMsg("Reflection deleted.");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      setPageError(err instanceof Error ? err.message : "Failed to delete note.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId, deleteNote]);

  // dialog focus trap
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!deleteId || !dialogRef.current) return;
    const el = dialogRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (document.activeElement === last && !e.shiftKey) {
        e.preventDefault();
        first?.focus();
      } else if (document.activeElement === first && e.shiftKey) {
        e.preventDefault();
        last?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    (first || el).focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteId]);

  // ids
  const deleteTitleId = "delete-title";
  const deleteDescId = "delete-desc";

  return (
    <>
      {/* App background just to center the phone frame */}
      <div className="min-h-screen bg-[var(--bg)] flex items-start sm:items-center justify-center py-4">
        {/* Mobile frame */}
        <div className="w-full max-w-[420px] rounded-[28px] border border-[var(--card-border)] bg-[var(--surface,theme(colors.white))] shadow-xl overflow-hidden">
          {/* Status bar notch space */}
          <div className="h-3 bg-[var(--bg)]" />

          {/* Sticky header inside device */}
          <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-4 pt-4 pb-3 border-b border-[var(--card-border)]/70">
            <h1 className="text-xl font-semibold text-[var(--ink)] text-center">My Reflections</h1>
            <p className="mt-1 text-xs text-[var(--ink-muted)] text-center">
              Write, reflect, and reconnect with your thoughts.
            </p>

            {/* Search and sort */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search reflections…"
                  aria-label="Search reflections"
                  className="w-full rounded-full bg-[var(--card)] border border-[var(--card-border)] px-9 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 outline-none"
                />
                {queryInput && (
                  <button
                    type="button"
                    onClick={() => setQueryInput("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex rounded-full border border-[var(--card-border)] bg-[var(--card)] p-1">
                {(["recent", "az"] as const).map(key => {
                  const active = sort === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSort(key)}
                      aria-pressed={active}
                      className={`min-w-[4.5rem] rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {key === "recent" ? "Recent" : "A–Z"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* header feedback */}
            {loading && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading reflections…</span>
              </div>
            )}
            {error && !loading && (
              <div className="mt-2 text-center">
                <p className="text-xs text-rose-500">{error}</p>
                <button
                  type="button"
                  onClick={refetch}
                  className="mt-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
          </header>

          {/* Success toast pinned inside frame */}
          {successMsg && (
            <div aria-live="polite" aria-atomic="true" className="px-4 pt-3">
              <div className="mx-auto w-full rounded-full bg-[var(--card)] border border-[var(--card-border)] px-3 py-2 text-xs text-[var(--ink)] text-center">
                {successMsg}
              </div>
            </div>
          )}

          {/* Content area */}
          <main className="px-4 pb-[104px] pt-3">
            {/* skeletons */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <GlassyCard
                    key={`sk-${i}`}
                    className="h-24 animate-pulse rounded-2xl bg-[var(--card)]/60"
                  />
                ))}
              </div>
            )}

            {/* empty */}
            {!loading && filteredNotes.length === 0 && (
              <div className="pt-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--card)] text-[var(--accent)] shadow">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="text-base font-semibold">No notes {query ? "match" : "yet"}</h2>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {query ? "Try a different search term." : "Start your first mindful reflection."}
                </p>
                {!query && (
                  <button
                    type="button"
                    onClick={openNew}
                    className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-95"
                  >
                    New reflection
                  </button>
                )}
              </div>
            )}

            {/* one-column mobile list */}
            {!loading && filteredNotes.length > 0 && (
              <div className="space-y-3">
                {filteredNotes.map(note => (
                  <GlassyCard
                    key={note.id}
                    className="group border border-[var(--card-border)] bg-[var(--card)]/60 backdrop-blur-xl p-4 rounded-2xl transition hover:bg-[var(--card)]/75"
                  >
                    <div onClick={() => router.push(`/notes/${note.id}`)} className="cursor-pointer">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--ink-muted)] font-medium">
                        {note.mood ? `Mood · ${note.mood}` : "Reflection"}
                      </p>
                      <h3 className="mt-1 text-base font-semibold break-words">
                        {note.title?.trim() || "Untitled reflection"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--ink-muted)] line-clamp-4">
                        {note.content}
                      </p>
                    </div>

                    <div className="my-3 border-t border-[var(--card-border)]/60" />

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        {formatTime(note.updated_at)}
                      </p>
                      <div className="flex gap-2">
                        <IconButton
                          icon={Pencil}
                          aria-label="Edit reflection"
                          onClick={() => openEdit(note)}
                          className="text-[var(--ink-muted)] hover:text-[var(--accent)]"
                        />
                        <IconButton
                          icon={Trash2}
                          aria-label="Delete reflection"
                          onClick={() => setDeleteId(note.id)}
                          className="text-[var(--ink-muted)] hover:text-rose-500"
                        />
                      </div>
                    </div>
                  </GlassyCard>
                ))}
              </div>
            )}
          </main>

          {/* Bottom nav pinned inside frame */}
          <BottomNav />

          {/* FAB positioned above BottomNav safely */}
          {!composerOpen && (
            <button
              type="button"
              onClick={openNew}
              aria-label="Add reflection"
              className="absolute right-4 bottom-[88px] flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition hover:brightness-110 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete dialog with proper semantics and a tiny focus trap */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={deleteTitleId}
          aria-describedby={deleteDescId}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-2xl bg-[var(--card)] p-6 mx-auto shadow-2xl outline-none"
          >
            <h2 id={deleteTitleId} className="text-lg font-semibold">
              Delete reflection
            </h2>
            <p id={deleteDescId} className="mt-2 text-sm text-[var(--ink-muted)]">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]/80 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer stays as a bottom sheet inside the app */}
      <BottomSheet
        open={composerOpen}
        onClose={resetComposer}
        title={editingId ? "Edit reflection" : "New reflection"}
        description="Capture what is on your mind. Title and mood are optional."
      >
        <form onSubmit={saveNote} className="space-y-4">
          <div>
            <label htmlFor="title-input" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title-input"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Today I felt…"
              maxLength={200}
              className="mt-2 w-full rounded-xl bg-[var(--card)] border border-[var(--card-border)] px-3 py-2 text-sm placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[var(--accent)]/30 outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-muted)] text-right">{form.title.length}/200</p>
          </div>

          <div>
            <label htmlFor="mood-select" className="block text-sm font-medium">
              Mood
            </label>
            <div className="relative mt-2">
              <select
                id="mood-select"
                value={form.mood}
                onChange={e => setForm(p => ({ ...p, mood: e.target.value }))}
                className="w-full appearance-none rounded-xl bg-[var(--card)] border border-[var(--card-border)] px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-[var(--accent)]/30 outline-none"
              >
                <option value="">No mood selected</option>
                {MOOD_OPTIONS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
            </div>
          </div>

          <div>
            <label htmlFor="content-input" className="block text-sm font-medium">
              Reflection
            </label>
            <textarea
              id="content-input"
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Let your thoughts flow…"
              rows={6}
              maxLength={5000}
              className="mt-2 w-full resize-none rounded-xl bg-[var(--card)] border border-[var(--card-border)] px-3 py-2 text-sm placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[var(--accent)]/30 outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-muted)] text-right">{form.content.length}/5000</p>
          </div>

          {composerError && (
            <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 p-3">
              <p className="text-sm text-rose-600 dark:text-rose-400">{composerError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={resetComposer}
              disabled={isSaving}
              className="flex-1 rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--card)]/80 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.content.trim()}
              className="flex-1 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
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
