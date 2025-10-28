"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types aligned to your schema (public.notes)
────────────────────────────────────────────── */
type Note = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/* ─────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
const ANIM = 0.24;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Generates a gentle cyan–purple glass gradient without hardcoded exact hues.
// We vary the angle/opacity using a stable hash of the note id.
function softGlassGradient(id: string, theme: "light" | "dark") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const ang = 15 + (h % 40); // 15–55deg
  const a1 = theme === "dark" ? 0.20 : 0.60;
  const a2 = theme === "dark" ? 0.12 : 0.40;
  return `linear-gradient(${ang}deg, rgba(56,189,248,${a1}) 0%, rgba(168,85,247,${a2}) 100%)`;
}

function normalizeNoteFields(n: Partial<Note>) {
  // title: first non-empty line of content if title absent
  const raw = (n.content ?? n.body ?? "").toString();
  const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const title = (n.title ?? "").trim() || firstLine.slice(0, 80);
  const body = (n.body ?? "").trim() || raw;
  return { title, body, content: raw };
}

/* ─────────────────────────────────────────────
   Minimal Toasts (centered, calm style)
────────────────────────────────────────────── */
type Toast = { id: number; msg: string; kind?: "error" | "success" | "info" };
function Toasts({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live={t.kind === "error" ? "assertive" : "polite"}
            className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm shadow-md border backdrop-blur-md
              ${t.kind === "error"
                ? "bg-red-500/90 text-white border-white/20"
                : t.kind === "success"
                ? "bg-emerald-500/90 text-white border-white/20"
                : "bg-slate-600/90 text-white border-white/20"}`}
          >
            <div className="flex items-center gap-3">
              <span className="whitespace-pre-line">{t.msg}</span>
              <button
                onClick={() => onClose(t.id)}
                className="ml-1 rounded p-1 hover:bg-white/15"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Editor Sheet
────────────────────────────────────────────── */
function EditorSheet({
  open,
  note,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (partial: { title: string; content: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const reduced = useReducedMotion();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? note?.body ?? "");

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? note?.body ?? "");
  }, [note]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={!reduced ? { opacity: 0 } : { opacity: 0.4 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          {/* sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md md:max-w-lg rounded-t-3xl border border-white/20 border-b-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl p-6 shadow-2xl"
            initial={!reduced ? { y: "100%" } : { y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={!reduced ? { type: "spring", stiffness: 300, damping: 28 } : { duration: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {note ? "Edit note" : "New note"}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Capture your thoughts mindfully…"
                rows={8}
                className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {onDelete && note && (
                <button
                  onClick={onDelete}
                  className="h-11 rounded-xl border border-red-300/50 dark:border-red-700/40 bg-red-50/70 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-100/70 dark:hover:bg-red-900/30 transition"
                >
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </span>
                </button>
              )}
              <button
                onClick={() => onSave({ title, content })}
                className="h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium transition shadow-md"
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <Save className="h-4 w-4" />
                  Save
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Page
────────────────────────────────────────────── */
export default function NotesPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const toast = useCallback((msg: string, kind?: Toast["kind"]) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, msg, kind }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);
  const dismissToast = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  /* Auth */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setLoading(false);
      if (!uid) return;
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  /* Load notes */
  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id,user_id,title,body,content,created_at,updated_at,deleted_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes((data ?? []) as Note[]);
    } catch (e) {
      console.error(e);
      toast("Failed to load notes", "error");
    }
  }, [supabase, userId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /* Realtime sync for this user */
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` },
        () => fetchNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, userId, fetchNotes]);

  /* Actions */
  const openNew = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  const openEdit = (n: Note) => {
    setSelected(n);
    setSheetOpen(true);
  };

  const saveNote = async (partial: { title: string; content: string }) => {
    if (!userId) return;
    const { title, content } = partial;
    const normalized = normalizeNoteFields({ title, content });

    try {
      if (selected) {
        // update
        const { error } = await supabase
          .from("notes")
          .update({
            title: normalized.title,
            body: normalized.body,
            content: normalized.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selected.id)
          .eq("user_id", userId);
        if (error) throw error;
        toast("Saved", "success");
      } else {
        // insert
        const { error } = await supabase
          .from("notes")
          .insert({
            user_id: userId,
            title: normalized.title,
            body: normalized.body,
            content: normalized.content,
          });
        if (error) throw error;
        toast("Note created", "success");
      }
      setSheetOpen(false);
      setSelected(null);
      // fetchNotes() will be triggered by realtime as well; we call it to feel snappy
      fetchNotes();
    } catch (e) {
      console.error(e);
      toast("Could not save note", "error");
    }
  };

  const deleteNote = async () => {
    if (!userId || !selected) return;
    try {
      // soft delete for safety
      const { error } = await supabase
        .from("notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", selected.id)
        .eq("user_id", userId);
      if (error) throw error;
      toast("Deleted", "success");
      setSheetOpen(false);
      setSelected(null);
      fetchNotes();
    } catch (e) {
      console.error(e);
      toast("Could not delete", "error");
    }
  };

  /* UI */
  const count = notes.length;

  const bg =
    theme === "dark"
      ? "from-neutral-950 via-slate-900/80 to-neutral-950"
      : "from-slate-50/80 via-white to-slate-50/80";

  if (loading) {
    return (
      <motion.main
        initial={!reduced ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`min-h-screen bg-gradient-to-b ${bg} pb-28`}
      >
        <div className="flex h-[70vh] items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-cyan-500 dark:border-neutral-700 dark:border-t-cyan-400"
          />
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={!reduced ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM }}
      className={`relative min-h-screen w-full bg-gradient-to-b ${bg} transition-colors pb-28`}
    >
      <Toasts toasts={toasts} onClose={dismissToast} />

      <div className="mx-auto w-full max-w-md md:max-w-lg px-4 pt-6">
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Mindful Notes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{count} {count === 1 ? "note" : "notes"}</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>

        {/* Content */}
        {count === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div
              className="rounded-full p-10"
              style={{
                background: softGlassGradient("empty", theme === "dark" ? "dark" : "light"),
              }}
            >
              <BookOpen className="h-10 w-10 text-slate-700 dark:text-slate-200 opacity-80" />
            </div>
            <h2 className="mt-6 text-base font-medium text-slate-800 dark:text-slate-100">No notes yet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Start capturing your thoughts mindfully
            </p>
          </div>
        ) : (
          <motion.ul
            initial={!reduced ? { opacity: 0, y: 10 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIM }}
            className="grid grid-cols-1 gap-3"
          >
            {notes.map((n) => {
              const gradient = softGlassGradient(n.id, theme === "dark" ? "dark" : "light");
              const preview =
                (n.content ?? n.body ?? "")
                  .toString()
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .slice(0, 4)
                  .join("\n") || "—";

              return (
                <li key={n.id}>
                  <button
                    onClick={() => openEdit(n)}
                    className="w-full text-left rounded-2xl border border-white/40 dark:border-neutral-800/40 backdrop-blur-xl shadow-sm transition hover:shadow-md"
                    style={{ background: gradient }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {n.title || "Untitled"}
                          </h3>
                          <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-slate-700/90 dark:text-slate-200/90">
                            {preview}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-600/80 dark:text-slate-400/80">
                          {timeAgo(n.updated_at)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/40 dark:border-neutral-800/40 bg-white/40 dark:bg-neutral-900/40 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </div>

      {/* Editor */}
      <EditorSheet
        open={sheetOpen}
        note={selected}
        onClose={() => {
          setSheetOpen(false);
          setSelected(null);
        }}
        onSave={saveNote}
        onDelete={selected ? deleteNote : undefined}
      />

      {/* Bottom nav (matches Home) */}
      <motion.nav
        initial={!reduced ? { opacity: 0, y: 10 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIM }}
        className="fixed bottom-0 left-0 right-0 z-30 mx-auto mb-4 max-w-md md:max-w-lg px-4 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="rounded-3xl border border-white/30 dark:border-neutral-800/40 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-2xl shadow-lg px-4 py-3">
          <BottomNav />
        </div>
      </motion.nav>
    </motion.main>
  );
}
