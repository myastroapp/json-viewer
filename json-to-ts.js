// Infer TypeScript interfaces from a JSON value. No deps; handles nested objects,
// arrays (merged element interface with optional fields), and unions.

const pascal = (s) => {
  const w = String(s).replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ");
  return w.map((x) => (x ? x[0].toUpperCase() + x.slice(1) : "")).join("") || "Obj";
};
const safeKey = (k) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k));
const singular = (s) => { s = String(s || "Item"); return s.endsWith("s") ? s.slice(0, -1) : s; };

export function toTypeScript(root, rootName = "Root") {
  const out = [];
  const used = new Set();
  const name = (hint) => {
    const base = pascal(hint);
    let n = base, i = 1;
    while (used.has(n)) n = base + ++i;
    used.add(n);
    return n;
  };

  function tsType(value, hint) {
    if (value === null) return "null";
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") return t;
    if (Array.isArray(value)) return arrType(value, hint);
    return objType(value, hint);
  }

  function objType(obj, hint) {
    const iface = name(hint);
    const lines = Object.entries(obj).map(([k, v]) => `  ${safeKey(k)}: ${tsType(v, k)};`);
    out.push(`export interface ${iface} {\n${lines.join("\n") || "  [key: string]: unknown;"}\n}`);
    return iface;
  }

  function arrType(arr, hint) {
    if (arr.length === 0) return "unknown[]";
    if (arr.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
      const iface = name(singular(hint));
      const counts = new Map();
      for (const o of arr) for (const k of Object.keys(o)) counts.set(k, (counts.get(k) || 0) + 1);
      const lines = [...counts].map(([k, c]) => {
        const first = arr.find((o) => k in o);
        const opt = c < arr.length ? "?" : "";
        return `  ${safeKey(k)}${opt}: ${tsType(first[k], k)};`;
      });
      out.push(`export interface ${iface} {\n${lines.join("\n")}\n}`);
      return iface + "[]";
    }
    const types = [...new Set(arr.map((v) => tsType(v, singular(hint))))];
    const inner = types.length > 1 ? `(${types.join(" | ")})` : types[0];
    return inner + "[]";
  }

  if (root !== null && typeof root === "object") { tsType(root, rootName); return out.join("\n\n"); }
  return `export type ${pascal(rootName)} = ${tsType(root, rootName)};`;
}

// --- DOM wiring (no-op outside the page) ---
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
function run() {
  const errEl = $("err"), outEl = $("out");
  errEl.hidden = true;
  let data;
  try { data = JSON.parse($("in").value); }
  catch (e) { errEl.textContent = "Invalid JSON: " + e.message; errEl.hidden = false; outEl.textContent = ""; return; }
  outEl.textContent = toTypeScript(data, $("rootname").value.trim() || "Root");
}
if ($("run")) {
  $("run").addEventListener("click", run);
  $("copy")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("out").textContent); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) {}
  });
}
