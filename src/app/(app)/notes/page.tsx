"use client";

import { useMemo, useState, useCallback } from "react";
import { Search, Trash2, Pencil, Plus, X } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";
import BottomSheet from "@/components/BottomSheet";
import { useNotes, type Note } from "@/hooks/useNotes";
import PageWrapper from "@/components/PageWrapper";

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
  const { notes, loading, error, createNote, updateNote, deleteNote, refetch } = useNotes();

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    let result = notes || [];
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q)
      );
    }
    if (sort === "az") {
      result = [...result].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    }
    return result;
  }, [notes, query, sort]);

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateNote(editingId, {
          title: form.title,
          content: form.content,
          mood: form.mood || null,
        });
        setSuccessMsg("Note updated!");
      } else {
        await createNote({
          title: form.title,
          content: form.content,
          mood: form.mood || null,
        });
        setSuccessMsg("Note created!");
      }
      setForm({ title: "", content: "", mood: "" });
      setEditingId(null);
      setComposerOpen(false);
      await refetch();
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  }, [form, editingId, createNote, updateNote, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteNote(id);
      setDeleteId(null);
      await refetch();
    } catch (err) {
      console.error(err);
    }
    setIsDeleting(false);
  }, [deleteNote, refetch]);

  return (
    <PageWrapper className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reflections</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Your mindful notes</p>
        </div>

        {/* Search & Sort */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={queryInput}
              onChange={(e) => {
                setQueryInput(e.target.value);
                setQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="az">A-Z</option>
          </select>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">Error loading notes</div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500">No notes yet. Create one to get started!</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <GlassyCard
                key={note.id}
                className="p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {note.content}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {note.mood && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          {note.mood}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(note.updated_at || note.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      icon={Pencil}
                      size="sm"
                      onClick={() => {
                        setForm({
                          title: note.title || "",
                          content: note.content || "",
                          mood: note.mood || "",
                        });
                        setEditingId(note.id);
                        setComposerOpen(true);
                      }}
                    />
                    <IconButton
                      icon={Trash2}
                      size="sm"
                      onClick={() => setDeleteId(note.id)}
                      className="text-red-500 hover:text-red-600"
                    />
                  </div>
                </div>
              </GlassyCard>
            ))
          )}
        </div>

        {/* FAB */}
        {!composerOpen && (
          <button
            onClick={() => {
              setForm({ title: "", content: "", mood: "" });
              setEditingId(null);
              setComposerOpen(true);
            }}
            className="fixed bottom-24 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Composer Sheet */}
        <BottomSheet open={composerOpen} onClose={() => setComposerOpen(false)}>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit Note" : "New Note"}
            </h2>
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
            />
            <textarea
              placeholder="Your reflection..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-32 resize-none"
            />
            <select
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
            >
              <option value="">No mood</option>
              {MOOD_OPTIONS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setComposerOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title.trim() || !form.content.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-medium"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Delete Dialog */}
        <BottomSheet open={!!deleteId} onClose={() => setDeleteId(null)}>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Note?</h2>
            <p className="text-slate-600 dark:text-slate-400">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-medium"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Success Toast */}
        {successMsg && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">
            {successMsg}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
