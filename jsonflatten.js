// Flatten nested JSON to dot/bracket-notation keys. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function flatten(obj, prefix = "", out = {}) {
  if (Array.isArray(obj)) {
    if (obj.length === 0) { out[prefix || ""] = []; return out; }
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}[${i}]` : `[${i}]`, out));
  } else if (obj !== null && typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) { out[prefix || ""] = {}; return out; }
    for (const k of keys) flatten(obj[k], prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = obj;
  }
  return out;
}

export function flattenJson(text) {
  return JSON.stringify(flatten(JSON.parse(text)), null, 2);
}

if (typeof document !== "undefined") {
  const run = () => {
    $("err").textContent = "";
    const raw = $("in").value.trim();
    if (!raw) { $("out").value = ""; return; }
    try { $("out").value = flattenJson(raw); }
    catch (e) { $("err").textContent = "Invalid JSON: " + e.message; $("out").value = ""; }
  };
  $("convert").addEventListener("click", run);
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) { /* */ }
  });
}
