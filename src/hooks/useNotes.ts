"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type NoteRow = {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
  deleted_at?: string | null;
};

type NoteContentPayload = {
  title?: string;
  mood?: string;
  body: string;
};

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  updated_at: string;
  deleted_at?: string | null;
}

type CreateNoteInput = {
  content: string;
  title?: string;
  mood?: string;
};

type UpdateNoteInput = {
  title?: string | null;
  content?: string;
  mood?: string | null;
};

const serializeNoteContent = ({ title, mood, body }: NoteContentPayload) =>
  JSON.stringify({
    title,
    mood,
    body,
  });

const parseNoteContent = (raw: string): NoteContentPayload => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "body" in parsed) {
      return {
        title: typeof parsed.title === "string" ? parsed.title : "",
        mood: typeof parsed.mood === "string" ? parsed.mood : "",
        body: typeof parsed.body === "string" ? parsed.body : "",
      };
    }
  } catch {
    // Fall through to default structure
  }
  return {
    title: "",
    mood: "",
    body: raw,
  };
};

const mapRowToNote = (row: NoteRow): Note => {
  const parsed = parseNoteContent(row.content);
  return {
    id: row.id,
    user_id: row.user_id,
    title: parsed.title ?? "",
    content: parsed.body ?? "",
    mood: parsed.mood ?? "",
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
  };
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    const supabase = getSupabaseClient();
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

      const mapped = ((data ?? []) as NoteRow[]).map((row) => mapRowToNote(row));
      setNotes(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch notes";
      setError(message);
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(
    async ({ content, title, mood }: CreateNoteInput) => {
      const supabase = getSupabaseClient();
      try {
        const sanitizedContent = content.trim();
        if (!sanitizedContent) throw new Error("Content is required");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return null;

        const timestamp = new Date().toISOString();
        const payload = {
          user_id: session.user.id,
          content: serializeNoteContent({
            title: title?.trim() || `Reflection ${new Date().toLocaleDateString()}`,
            mood: mood?.trim() || "",
            body: sanitizedContent,
          }),
          updated_at: timestamp,
        };

        const { data, error: insertError } = await supabase
          .from("notes")
          .insert([
            {
              ...payload,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        const created = mapRowToNote(data as NoteRow);
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
    const supabase = getSupabaseClient();
    try {
      if (!id) throw new Error("Missing note id");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return null;

      const existing = notes.find((note) => note.id === id);
      const nextBody =
        "content" in updates
          ? typeof updates.content === "string"
            ? updates.content.trim()
            : existing?.content ?? ""
          : existing?.content ?? "";
      const nextTitle =
        "title" in updates
          ? typeof updates.title === "string"
            ? updates.title.trim()
            : ""
          : existing?.title ?? "";
      const nextMood =
        "mood" in updates
          ? typeof updates.mood === "string"
            ? updates.mood.trim()
            : ""
          : existing?.mood ?? "";
      const nextContent = serializeNoteContent({
        title: nextTitle,
        mood: nextMood,
        body: nextBody,
      });

      const { data, error: updateError } = await supabase
        .from("notes")
        .update({
          content: nextContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      const next = mapRowToNote(data as NoteRow);
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
  }, [notes]);

  const deleteNote = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
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
