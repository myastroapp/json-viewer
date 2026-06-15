import { valueType, isContainer } from "./render.js";

const keysOf = (v) => (valueType(v) === "array" ? v.map((_, i) => i) : Object.keys(v));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Recursive structural diff. Returns [{type:'added'|'removed'|'changed', path, old?, new?}]
export function diff(a, b, path = "$", out = []) {
  const ta = valueType(a), tb = valueType(b);
  if (isContainer(a) && isContainer(b) && ta === tb) {
    const ka = keysOf(a).map(String), kb = keysOf(b).map(String);
    const sa = new Set(ka), sb = new Set(kb);
    for (const k of new Set([...ka, ...kb])) {
      const seg = ta === "array" ? `[${k}]` : `.${k}`;
      const p = path + seg;
      const av = ta === "array" ? a[+k] : a[k];
      const bv = tb === "array" ? b[+k] : b[k];
      if (sa.has(k) && !sb.has(k)) out.push({ type: "removed", path: p, old: av });
      else if (!sa.has(k) && sb.has(k)) out.push({ type: "added", path: p, new: bv });
      else diff(av, bv, p, out);
    }
  } else if (!eq(a, b)) {
    out.push({ type: "changed", path, old: a, new: b });
  }
  return out;
}

// --- DOM wiring (no-op outside the page) ---
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
const show = (v) => (v === undefined ? "" : typeof v === "string" ? JSON.stringify(v) : typeof v === "object" ? JSON.stringify(v) : String(v));

function run() {
  const errEl = $("err"), outEl = $("out");
  errEl.hidden = true; outEl.innerHTML = "";
  let a, b;
  try { a = JSON.parse($("a").value); } catch (e) { errEl.textContent = "Left JSON invalid: " + e.message; errEl.hidden = false; return; }
  try { b = JSON.parse($("b").value); } catch (e) { errEl.textContent = "Right JSON invalid: " + e.message; errEl.hidden = false; return; }
  const changes = diff(a, b);
  const counts = { added: 0, removed: 0, changed: 0 };
  for (const c of changes) counts[c.type]++;
  $("summary").textContent = changes.length === 0
    ? "Identical — no differences."
    : `${counts.added} added · ${counts.removed} removed · ${counts.changed} changed`;
  const frag = document.createDocumentFragment();
  for (const c of changes) {
    const row = document.createElement("div");
    row.className = "chg chg-" + c.type;
    const sign = c.type === "added" ? "+" : c.type === "removed" ? "−" : "~";
    let detail = "";
    if (c.type === "added") detail = show(c.new);
    else if (c.type === "removed") detail = show(c.old);
    else detail = show(c.old) + "  →  " + show(c.new);
    row.innerHTML = `<span class="sign">${sign}</span><span class="path"></span> <span class="val"></span>`;
    row.querySelector(".path").textContent = c.path;
    row.querySelector(".val").textContent = detail;
    frag.appendChild(row);
  }
  outEl.appendChild(frag);
}

if ($("run")) {
  $("run").addEventListener("click", run);
}
