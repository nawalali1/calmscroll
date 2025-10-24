"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

type CreateNoteInput = {
  content: string;
  title?: string;
  mood?: string;
  tags?: string[];
};

type UpdateNoteInput = {
  title?: string | null;
  content?: string;
  mood?: string | null;
  tags?: string[] | null;
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setNotes([]);
        return;
      }

      const { data, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (notesError) throw notesError;

      setNotes((data as Note[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch notes";
      setError(message);
      console.error("Error fetching notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(
    async ({ content, title, mood, tags }: CreateNoteInput) => {
      try {
        if (!content.trim()) throw new Error("Content is required");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return null;

        const timestamp = new Date().toISOString();

        const { data, error: insertError } = await supabase
          .from("notes")
          .insert([
            {
              user_id: session.user.id,
              content,
              title: title || `Reflection ${new Date().toLocaleDateString()}`,
              mood: mood ?? null,
              tags: tags ?? [],
              created_at: timestamp,
              updated_at: timestamp,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        const created = data as Note;
        setNotes((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to create note";
        setError(message);
        console.error("Error creating note:", err);
        return null;
      }
    },
    []
  );

  const updateNote = useCallback(async (id: string, updates: UpdateNoteInput) => {
    try {
      if (!id) throw new Error("Missing note id");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return null;

      const { data, error: updateError } = await supabase
        .from("notes")
        .update({
          ...("content" in updates ? { content: updates.content } : {}),
          ...("title" in updates ? { title: updates.title ?? null } : {}),
          ...("mood" in updates ? { mood: updates.mood ?? null } : {}),
          ...("tags" in updates ? { tags: updates.tags ?? [] } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      const next = data as Note;
      setNotes((prev) => {
        const remaining = prev.filter((note) => note.id !== id);
        return [next, ...remaining];
      });
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update note";
      setError(message);
      console.error("Error updating note:", err);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      if (!id) throw new Error("Missing note id");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return false;

      const { error: deleteError } = await supabase.from("notes").delete().eq("id", id);
      if (deleteError) throw deleteError;

      setNotes((prev) => prev.filter((note) => note.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete note";
      setError(message);
      console.error("Error deleting note:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
}

export type NoteRecord = Note;

export default useNotes;
