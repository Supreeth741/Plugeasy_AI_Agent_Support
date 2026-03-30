const API_BASE = "/api";

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start, end) {
  if (!start || !end) return "-";
  const ms = new Date(end) - new Date(start);
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

const LANG_LABELS = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  mr: "Marathi",
  te: "Telugu",
  bn: "Bengali",
  ta: "Tamil",
};

function getLangLabel(code) {
  return LANG_LABELS[code] || code || "English";
}
