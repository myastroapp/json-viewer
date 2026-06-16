// Case converter. Pure core (words + case fns) exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

// Split any input (camelCase, snake_case, kebab-case, "Title Case", acronyms) into lowercase word tokens.
export function words(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")        // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")      // ACRONYM + Word (HTMLFile -> HTML File)
    .replace(/[_\-.\/\\]+/g, " ")                   // separators
    .replace(/\s+/g, " ").trim().toLowerCase()
    .split(" ").filter(Boolean);
}

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);

export const cases = {
  camel: (w) => w.map((x, i) => (i ? cap(x) : x)).join(""),
  pascal: (w) => w.map(cap).join(""),
  snake: (w) => w.join("_"),
  kebab: (w) => w.join("-"),
  constant: (w) => w.join("_").toUpperCase(),
  dot: (w) => w.join("."),
  title: (w) => w.map(cap).join(" "),
  sentence: (w) => (w.length ? cap(w[0]) + (w.length > 1 ? " " + w.slice(1).join(" ") : "") : ""),
  lower: (w) => w.join(" "),
  upper: (w) => w.join(" ").toUpperCase(),
};

export function convertAll(input) {
  const w = words(input);
  const out = {};
  for (const k of Object.keys(cases)) out[k] = cases[k](w);
  return out;
}

if (typeof document !== "undefined") {
  const LABELS = [["camel", "camelCase"], ["pascal", "PascalCase"], ["snake", "snake_case"], ["kebab", "kebab-case"],
    ["constant", "CONSTANT_CASE"], ["dot", "dot.case"], ["title", "Title Case"], ["sentence", "Sentence case"],
    ["lower", "lower case"], ["upper", "UPPER CASE"]];
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const run = () => {
    const all = convertAll($("in").value);
    $("out").innerHTML = LABELS.map(([k, label]) =>
      `<div class="row"><span class="lbl">${label}</span><code id="c-${k}">${esc(all[k]) || "&nbsp;"}</code><button data-copy="c-${k}">Copy</button></div>`
    ).join("");
    document.querySelectorAll("#out [data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
      const v = $(btn.dataset.copy).textContent;
      if (!v.trim()) return;
      try { await navigator.clipboard.writeText(v); const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1200); } catch (_e) { /* */ }
    }));
  };
  $("in").addEventListener("input", run);
  run();
}
