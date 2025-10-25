// Configuration constants
const CONFIG = {
  DEFAULT_COOLDOWN_MINS: 10,
  DEFAULT_TITLE: "Pause to breathe",
  DEFAULT_WHY: "Take three breaths before opening this site.",
  DEFAULT_DOMAINS: ["instagram.com", "tiktok.com"],
};

function uid() {
  return (crypto?.randomUUID?.() ?? Date.now().toString()) + Math.random().toString(16).slice(2);
}
function loadIntentions(callback) {
  chrome.storage.sync.get(["intentions"], (data) => {
    callback(Array.isArray(data.intentions) ? data.intentions : []);
  });
}
function saveIntentions(list, callback) {
  chrome.storage.sync.set({ intentions: list }, () => callback && callback());
}

function render(list) {
  const root = document.getElementById("list");
  root.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.textContent = "No intentions yet. Use the button below to add one.";
    root.appendChild(empty);
    return;
  }

  list.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row" style="align-items:center; justify-content:space-between;">
        <input data-field="title" value="${item.title || ""}" placeholder="Title" />
        <label style="font-size:12px; font-weight:600;">Active <input type="checkbox" data-field="active" ${
          item.active ? "checked" : ""
        } /></label>
      </div>
      <label>Why / Reminder
        <textarea data-field="why" rows="3">${item.why || ""}</textarea>
      </label>
      <label>Domains (comma separated)
        <input data-field="domains" value="${(item.rules?.domains || []).join(", ")}" />
      </label>
      <label>Cooldown (minutes)
        <input data-field="cooldown" type="number" min="1" value="${item.rules?.cooldownMins ?? CONFIG.DEFAULT_COOLDOWN_MINS}" />
      </label>
      <label style="display:flex; align-items:center; gap:6px; font-weight:500;">
        <input data-field="enabled" type="checkbox" ${item.rules?.enabled !== false ? "checked" : ""} /> Enable rules
      </label>
      <div class="row" style="margin-top:8px;">
        <button class="primary" data-action="save">Save</button>
        <button class="ghost" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-field="title"]').addEventListener("input", (event) => {
      list[index].title = event.target.value;
    });
    card.querySelector('[data-field="why"]').addEventListener("input", (event) => {
      list[index].why = event.target.value;
    });
    card.querySelector('[data-field="domains"]').addEventListener("input", (event) => {
      const domains = event.target.value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      list[index].rules = {
        ...(list[index].rules || {}),
        domains,
        enabled: list[index].rules?.enabled !== false,
        cooldownMins: list[index].rules?.cooldownMins ?? CONFIG.DEFAULT_COOLDOWN_MINS,
      };
    });
    card.querySelector('[data-field="cooldown"]').addEventListener("input", (event) => {
      list[index].rules = {
        ...(list[index].rules || {}),
        domains: list[index].rules?.domains || [],
        cooldownMins: Number(event.target.value || CONFIG.DEFAULT_COOLDOWN_MINS),
        enabled: list[index].rules?.enabled !== false,
      };
    });
    card.querySelector('[data-field="enabled"]').addEventListener("change", (event) => {
      list[index].rules = {
        ...(list[index].rules || {}),
        domains: list[index].rules?.domains || [],
        cooldownMins: list[index].rules?.cooldownMins ?? CONFIG.DEFAULT_COOLDOWN_MINS,
        enabled: event.target.checked,
      };
    });
    card.querySelector('[data-field="active"]').addEventListener("change", (event) => {
      list[index].active = event.target.checked;
    });

    card.querySelector('[data-action="save"]').addEventListener("click", () => {
      saveIntentions(list, () => {
        render(list);
      });
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm("Delete this intention?")) return;
      const next = [...list.slice(0, index), ...list.slice(index + 1)];
      saveIntentions(next, () => render(next));
    });

    root.appendChild(card);
  });
}

document.getElementById("add").addEventListener("click", () => {
  loadIntentions((list) => {
    const next = [
      {
        id: uid(),
        title: CONFIG.DEFAULT_TITLE,
        why: CONFIG.DEFAULT_WHY,
        active: true,
        rules: { domains: CONFIG.DEFAULT_DOMAINS, cooldownMins: CONFIG.DEFAULT_COOLDOWN_MINS, enabled: true },
      },
      ...list,
    ];
    saveIntentions(next, () => render(next));
  });
});

loadIntentions(render);
