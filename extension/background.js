// Store schema: { intentions: [{ id, title, why, active, rules: { domains[], cooldownMins, enabled } }], lastShown: { [domain]: timestamp } }
async function getState() {
  return new Promise((resolve) => chrome.storage.sync.get(["intentions", "lastShown"], resolve));
}
function now() {
  return Date.now();
}

function matchesDomain(urlStr, domains) {
  if (!domains || domains.length === 0) return false;
  try {
    const u = new URL(urlStr);
    return domains.some((domain) => u.hostname.includes(domain));
  } catch (error) {
    return false;
  }
}

async function maybeNudge(activeUrl) {
  const { intentions = [], lastShown = {} } = await getState();
  const active = intentions.filter((intention) => intention.active && intention.rules?.enabled);
  for (const intention of active) {
    const cooldownMs = Math.max(1, Number(intention.rules.cooldownMins || 10)) * 60 * 1000;
    const hit = matchesDomain(activeUrl, intention.rules.domains || []);
    if (!hit) continue;

    const matchingDomain = (intention.rules.domains || []).find((domain) => activeUrl.includes(domain)) || "default";
    const last = lastShown[matchingDomain] || 0;
    if (now() - last < cooldownMs) continue;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: intention.title || "Remember your intention",
      message: intention.why || "Take a breath before you scroll.",
      priority: 2,
      buttons: [{ title: "Breathe" }],
    });
    lastShown[matchingDomain] = now();
    chrome.storage.sync.set({ lastShown });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    maybeNudge(tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab?.url) {
      maybeNudge(tab.url);
    }
  } catch (error) {
    // noop
  }
});
