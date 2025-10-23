"use client";

import { useEffect, useState } from "react";

type QuickAction = "breathe" | "reflect" | "stretch";
type Rule = { domains: string[]; cooldownMins: number; enabled: boolean };
type Intention = {
  id: string;
  title: string;
  why: string;
  quickAction?: QuickAction | null;
  rules: Rule;
  createdAt: string;
  updatedAt: string;
  active: boolean;
};

const LS_KEY = "calmscroll_intentions";

const DEFAULT_DOMAINS = ["instagram.com", "tiktok.com", "twitter.com", "youtube.com"];

const sortByRecent = (list: Intention[]) =>
  [...list].sort((a, b) =>
    new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()
  );

function loadIntentions(): Intention[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Intention[];
    return Array.isArray(parsed) ? sortByRecent(parsed) : [];
  } catch {
    return [];
  }
}

function persistIntentions(list: Intention[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(sortByRecent(list)));
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

export default function IntentionsPage() {
  const [items, setItems] = useState<Intention[]>([]);
  const [editing, setEditing] = useState<Intention | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setItems(loadIntentions());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const upsert = (draft: Intention) => {
    const list = loadIntentions();
    const now = new Date().toISOString();
    const existingIndex = list.findIndex((item) => item.id === draft.id);
    let nextList: Intention[];

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      nextList = [...list];
      nextList[existingIndex] = {
        ...draft,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
    } else {
      nextList = [
        {
          ...draft,
          createdAt: draft.createdAt || now,
          updatedAt: now,
        },
        ...list,
      ];
    }

    persistIntentions(nextList);
    setItems(sortByRecent(nextList));
    setEditing(null);
  };

  const remove = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this intention?")) return;
    const next = loadIntentions().filter((item) => item.id !== id);
    persistIntentions(next);
    setItems(next);
  };

  const toggleActive = (id: string, value: boolean) => {
    const next = loadIntentions().map((item) => (item.id === id ? { ...item, active: value } : item));
    persistIntentions(next);
    setItems(next);
  };

  const requestPermission = async () => {
    const globalWindow = typeof window !== "undefined" ? window : undefined;
    if (!globalWindow || !("Notification" in globalWindow)) {
      console.warn("Notifications not supported");
      return;
    }
    try {
      const next = await Notification.requestPermission();
      setPermission(next);
    } catch {
      // ignore
    }
  };

  const beginEdit = (intent: Intention) => {
    setEditing({
      ...intent,
      rules: {
        domains: [...(intent.rules?.domains ?? DEFAULT_DOMAINS)],
        cooldownMins: intent.rules?.cooldownMins ?? 10,
        enabled: intent.rules?.enabled ?? true,
      },
    });
  };

  const startNew = () => {
    const now = new Date().toISOString();
    setEditing({
      id: uid(),
      title: "",
      why: "",
      quickAction: null,
      rules: { domains: [...DEFAULT_DOMAINS], cooldownMins: 10, enabled: true },
      createdAt: now,
      updatedAt: now,
      active: true,
    });
  };

  return (
    <main
      data-version="intentions-v1"
      className="min-h-screen bg-gradient-to-b from-[#0B3B64] via-[#5282FF] to-[#FFB3C7] text-white"
    >
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-semibold">My Intentions</h1>
        <p className="mt-1 text-sm text-white/80">
          Set intentions and nudges so you pause before scrolling.
        </p>
        <div className="mt-4 flex items-center gap-3 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1">Notifications: {permission}</span>
          {permission !== "granted" ? (
            <button
              onClick={requestPermission}
              className="rounded-full bg-white px-3 py-1 font-semibold text-[#0B3B64]"
            >
              Enable Notifications
            </button>
          ) : null}
        </div>
      </header>

      <section className="px-5 space-y-3 pb-24">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white/20 p-5 backdrop-blur-md">
            <p className="text-sm font-medium">No intentions yet.</p>
            <p className="mt-1 text-sm text-white/80">Tap the plus button to add your first reminder.</p>
          </div>
        ) : null}

        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white/20 p-5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{item.title || "Untitled intention"}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/85">{item.why || "No reminder set."}</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {item.active ? "Active" : "Paused"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {item.rules?.enabled
                ? (item.rules.domains ?? []).map((domain) => (
                    <span key={domain} className="rounded-full bg-white/15 px-2 py-1">
                      {domain}
                    </span>
                  ))
                : null}
              <span className="rounded-full bg-white/15 px-2 py-1">
                {item.rules?.cooldownMins ?? 10}m cooldown
              </span>
              {item.quickAction ? (
                <span className="rounded-full bg-white/15 px-2 py-1">action: {item.quickAction}</span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <button
                onClick={() => toggleActive(item.id, !item.active)}
                className="rounded-xl bg-white px-3 py-2 font-semibold text-[#0B3B64]"
              >
                {item.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => beginEdit(item)}
                className="rounded-xl border border-white/40 px-3 py-2 font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => remove(item.id)}
                className="rounded-xl border border-white/40 px-3 py-2"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 text-slate-900 shadow-xl">
            <h2 className="text-lg font-semibold">
              {editing.title ? "Edit Intention" : "New Intention"}
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!editing.title.trim() || !editing.why.trim()) return;
                upsert(editing);
              }}
            >
              <label className="block text-sm font-medium">
                Title
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Why / reminder message
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  rows={3}
                  value={editing.why}
                  onChange={(event) => setEditing({ ...editing, why: event.target.value })}
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Quick Action
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editing.quickAction ?? ""}
                  onChange={(event) =>
                    setEditing({ ...editing, quickAction: (event.target.value || null) as QuickAction | null })
                  }
                >
                  <option value="">None</option>
                  <option value="breathe">Breathe</option>
                  <option value="reflect">Reflect</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>

              <fieldset className="rounded-2xl border border-slate-200 p-4">
                <legend className="text-sm font-semibold">Nudge Rules</legend>

                <label className="mt-2 block text-sm font-medium">
                  Domains (comma-separated)
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={editing.rules.domains.join(", ")}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        rules: {
                          ...editing.rules,
                          domains: event.target.value
                            .split(",")
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="text-sm font-medium">
                    Cooldown (minutes)
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-24 rounded-xl border border-slate-200 px-3 py-2"
                      value={editing.rules.cooldownMins}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          rules: { ...editing.rules, cooldownMins: Number(event.target.value || 10) },
                        })
                      }
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={editing.rules.enabled}
                      onChange={(event) =>
                        setEditing({ ...editing, rules: { ...editing.rules, enabled: event.target.checked } })
                      }
                    />
                    Enabled
                  </label>
                </div>
              </fieldset>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {!editing ? (
        <button
          onClick={startNew}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-white text-3xl font-bold text-[#0B3B64] shadow-lg"
          aria-label="Add Intention"
        >
          +
        </button>
      ) : null}
    </main>
  );
}
