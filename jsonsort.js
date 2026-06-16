// Sort JSON object keys (recursively, alphabetical). Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function sortKeys(v, { desc = false } = {}) {
  if (Array.isArray(v)) return v.map((x) => sortKeys(x, { desc }));
  if (v !== null && typeof v === "object") {
    const out = {};
    let keys = Object.keys(v).sort();
    if (desc) keys.reverse();
    for (const k of keys) out[k] = sortKeys(v[k], { desc });
    return out;
  }
  return v;
}

export function sortJson(text, opts) {
  return JSON.stringify(sortKeys(JSON.parse(text), opts), null, 2);
}

if (typeof document !== "undefined") {
  const run = () => {
    $("err").textContent = "";
    const raw = $("in").value.trim();
    if (!raw) { $("out").value = ""; return; }
    try { $("out").value = sortJson(raw, { desc: $("desc").checked }); }
    catch (e) { $("err").textContent = "Invalid JSON: " + e.message; $("out").value = ""; }
  };
  $("convert").addEventListener("click", run);
  $("desc").addEventListener("change", () => { if ($("out").value && !$("err").textContent) run(); });
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) { /* */ }
  });
}
