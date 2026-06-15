// Convert between a JSON array and NDJSON / JSON Lines (one JSON value per line).

export function toNdjson(value) {
  if (!Array.isArray(value)) throw new Error("To make NDJSON, the input must be a JSON array.");
  return value.map((v) => JSON.stringify(v)).join("\n");
}

export function fromNdjson(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((l, i) => {
    try { return JSON.parse(l); }
    catch (e) { throw new Error(`Line ${i + 1}: ${e.message}`); }
  });
}

// --- DOM wiring (no-op outside the page) ---
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

function toNd() {
  const errEl = $("err"), outEl = $("out");
  errEl.hidden = true;
  let data;
  try { data = JSON.parse($("in").value); }
  catch (e) { errEl.textContent = "Invalid JSON: " + e.message; errEl.hidden = false; return; }
  try { outEl.value = toNdjson(data); }
  catch (e) { errEl.textContent = e.message; errEl.hidden = false; }
}

function fromNd() {
  const errEl = $("err"), outEl = $("out");
  errEl.hidden = true;
  try { outEl.value = JSON.stringify(fromNdjson($("in").value), null, 2); }
  catch (e) { errEl.textContent = e.message; errEl.hidden = false; }
}

if ($("to-nd")) {
  $("to-nd").addEventListener("click", toNd);
  $("from-nd").addEventListener("click", fromNd);
  $("copy")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) {}
  });
}
