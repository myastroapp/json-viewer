// Pro features for the web JSON viewer: JSONPath-lite query + CSV export, gated by a local unlock.
// v1 unlock is a shared code (client-side) — honor-system, fine for proving demand; harden later.

const PRO_CODE = "JV-PRO-9F3K-7Q2X";

export function isPro() {
  try { return localStorage.getItem("jv_pro") === "1"; } catch { return false; }
}
export function setPro() {
  try { localStorage.setItem("jv_pro", "1"); } catch { /* ignore */ }
}
export function tryUnlock(code) {
  if ((code || "").trim().toUpperCase() === PRO_CODE) { setPro(); return true; }
  return false;
}

// --- JSONPath-lite: supports .key, [index], [*] (wildcard over array/object values) ---
function tokenize(expr) {
  const toks = [];
  const re = /([^.[\]]+)|\[(\d+)\]|\[\*\]/g;
  let m;
  while ((m = re.exec(expr))) {
    if (m[1] !== undefined) toks.push({ type: "key", key: m[1] });
    else if (m[2] !== undefined) toks.push({ type: "index", index: +m[2] });
    else toks.push({ type: "wild" });
  }
  return toks;
}

export function query(value, expr) {
  expr = (expr || "").trim().replace(/^\$/, "").replace(/^\./, "");
  if (!expr) return value;
  let cur = [value];
  for (const tok of tokenize(expr)) {
    const next = [];
    for (const v of cur) {
      if (v == null) continue;
      if (tok.type === "key") {
        if (typeof v === "object" && !Array.isArray(v) && tok.key in v) next.push(v[tok.key]);
      } else if (tok.type === "index") {
        if (Array.isArray(v) && tok.index < v.length) next.push(v[tok.index]);
      } else { // wildcard
        if (Array.isArray(v)) next.push(...v);
        else if (typeof v === "object") next.push(...Object.values(v));
      }
    }
    cur = next;
  }
  return cur.length === 1 ? cur[0] : cur;
}

// --- CSV export: array of objects -> columns; otherwise a single "value" column ---
function csvCell(v) {
  if (v == null) return "";
  if (typeof v === "object") v = JSON.stringify(v);
  v = String(v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export function toCSV(value) {
  const rows = Array.isArray(value) ? value : [value];
  const cols = [];
  const seen = new Set();
  let allObjects = rows.length > 0;
  for (const r of rows) {
    if (r && typeof r === "object" && !Array.isArray(r)) {
      for (const k of Object.keys(r)) if (!seen.has(k)) { seen.add(k); cols.push(k); }
    } else { allObjects = false; }
  }
  if (allObjects && cols.length) {
    let csv = cols.map(csvCell).join(",") + "\n";
    for (const r of rows) csv += cols.map((c) => csvCell(r[c])).join(",") + "\n";
    return csv;
  }
  return "value\n" + rows.map((r) => csvCell(r)).join("\n") + "\n";
}
