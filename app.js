import {
  createTree, expandAll, collapseAll, searchData, expandPath, countNodes, valueType,
} from "./render.js";
import { isPro, tryUnlock, query as runQuery, toCSV } from "./pro.js";
import { toTypeScript } from "./json-to-ts.js";
import { repairJson } from "./repair.js";

const $ = (id) => document.getElementById(id);
const els = {
  input: $("input"), inputPanel: $("input-panel"), tree: $("tree"),
  error: $("error"), status: $("status"), search: $("search"),
  file: $("file"), url: $("url"), toast: $("toast"),
};

const NO_DOCUMENT = Symbol("no document");
let current = NO_DOCUMENT; // parsed value, including a valid root null
let treeRoot = null;     // mounted .jv-tree element
let lastMatches = [];    // rows currently highlighted

wire();

function wire() {
  $("btn-new").addEventListener("click", () => {
    resetDocument();
    els.input.value = "";
    els.search.value = "";
    hideError();
    showInputPanel();
    els.input.focus();
  });
  $("btn-open").addEventListener("click", () => els.file.click());
  $("btn-format").addEventListener("click", () => loadText(els.input.value));
  $("btn-beautify").addEventListener("click", () => copyJson(2));
  $("btn-minify").addEventListener("click", () => copyJson(0));
  $("btn-ts")?.addEventListener("click", onCopyTs);
  $("btn-expand").addEventListener("click", onExpandAll);
  $("btn-collapse").addEventListener("click", () => treeRoot && collapseAll(treeRoot));
  $("btn-fetch").addEventListener("click", onFetchUrl);

  els.file.addEventListener("change", async () => {
    const f = els.file.files?.[0];
    if (!f) return;
    const text = await f.text();
    els.input.value = text.length > 2_000_000 ? "" : text; // don't choke the textarea on huge files
    loadText(text);
  });

  els.input.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); loadText(els.input.value); }
  });

  let t = null;
  els.search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => runSearch(els.search.value.trim()), 180);
  });

  // Pro: JSONPath query + CSV export, gated behind a one-time unlock
  $("btn-query").addEventListener("click", onQuery);
  $("btn-csv").addEventListener("click", onCsv);
  $("btn-code").addEventListener("click", () => {
    if (tryUnlock($("code").value)) { closeUnlock(); reflectPro(); toast("Pro unlocked — thank you!"); }
    else toast("That code didn't match — check your receipt page.");
  });
  $("unlock-close").addEventListener("click", closeUnlock);
  $("unlock").addEventListener("click", (e) => { if (e.target.id === "unlock") closeUnlock(); });
  reflectPro();
}

function loadText(text) {
  hideError();
  resetDocument();
  const trimmed = (text || "").trim();
  if (!trimmed) { showInputPanel(); return; }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
    assertSupportedNumbers(trimmed);
  } catch (e) {
    if (e instanceof UnsupportedNumberError) showError(e.message);
    else showError(formatParseError(e, trimmed), trimmed);
    return;
  }
  current = parsed;
  renderTree(parsed);
  runSearch(els.search.value.trim());
}

function renderTree(value) {
  els.tree.textContent = "";
  treeRoot = createTree(value);
  els.tree.appendChild(treeRoot);
  els.inputPanel.classList.add("hidden");
  lastMatches = [];
  const n = countNodes(value, 200000);
  const nodes = n > 200000 ? "200k+" : n.toLocaleString();
  els.status.textContent = `${valueType(value)} · ${nodes} nodes`;
}

function resetDocument() {
  current = NO_DOCUMENT;
  treeRoot = null;
  lastMatches = [];
  showInputPanel();
}

function showInputPanel() {
  els.inputPanel.classList.remove("hidden");
  els.tree.textContent = "";
  els.status.textContent = "";
}

function onExpandAll() {
  if (!treeRoot) return;
  const ok = expandAll(treeRoot, 20000);
  if (!ok) toast("Too large to expand all — expand sections as you go.");
}

function runSearch(query) {
  if (!treeRoot || current === NO_DOCUMENT) return;
  for (const row of lastMatches) row.classList.remove("jv-match");
  lastMatches = [];
  if (!query) { els.status.textContent = statusForCurrent(); return; }

  const paths = searchData(current, query, 500);
  let first = null;
  for (const path of paths) {
    const node = expandPath(treeRoot, path);
    if (!node) continue;
    const row = node.querySelector(":scope > .jv-row");
    if (row) { row.classList.add("jv-match"); lastMatches.push(row); first ||= row; }
  }
  if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
  els.status.textContent = paths.length >= 500
    ? "500+ matches (showing first 500)"
    : `${paths.length} match${paths.length === 1 ? "" : "es"}`;
}

function statusForCurrent() {
  const n = countNodes(current, 200000);
  return `${valueType(current)} · ${n > 200000 ? "200k+" : n.toLocaleString()} nodes`;
}

async function copyJson(indent) {
  if (current === NO_DOCUMENT) { toast("Nothing to copy — format some JSON first."); return; }
  try {
    await navigator.clipboard.writeText(JSON.stringify(current, null, indent));
    toast(indent ? "Pretty JSON copied" : "Minified JSON copied");
  } catch (_e) {
    toast("Copy failed — clipboard blocked.");
  }
}

async function onCopyTs() {
  if (current === NO_DOCUMENT) { toast("Nothing to convert — format some JSON first."); return; }
  try {
    const ts = toTypeScript(current, "Root");
    await navigator.clipboard.writeText(ts);
    toast("TypeScript interfaces copied");
  } catch (_e) {
    toast("Copy failed — clipboard blocked.");
  }
}

async function onFetchUrl() {
  const url = els.url.value.trim();
  if (!url) return;
  hideError();
  try {
    const res = await fetch(url);
    const text = await res.text();
    els.input.value = text.length > 2_000_000 ? "" : text;
    loadText(text);
  } catch (e) {
    showError("Couldn't fetch that URL (the site may block cross-origin requests).\n" + e.message);
  }
}

// JSON.parse uses JavaScript Numbers. Reject inputs whose decimal value would
// change when copied, rather than silently rounding them or serializing Infinity
// as null. This is a bounded formatter, not an arbitrary-precision JSON parser.
class UnsupportedNumberError extends Error {}

function normalizedDecimal(token) {
  const match = token.match(/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  const fraction = match[3] || "";
  let digits = (match[2] + fraction).replace(/^0+/, "");
  if (!digits) return { negative: match[1] === "-", digits: "0", exponent: 0n };
  let end = digits.length;
  while (digits[end - 1] === "0") end--;
  const trailing = digits.length - end;
  if (trailing) digits = digits.slice(0, end);
  // Strip leading exponent zeros before BigInt conversion, including long ones.
  const rawExponent = match[4] || "0";
  const exponentSign = rawExponent.startsWith("-") ? "-" : "";
  const exponentDigits = rawExponent.replace(/^[+-]/, "").replace(/^0+/, "") || "0";
  return {
    negative: match[1] === "-", digits,
    exponent: BigInt(exponentSign + exponentDigits) - BigInt(fraction.length) + BigInt(trailing),
  };
}

function assertSupportedNumbers(text) {
  // JSON syntax has already been validated. Skip entire quoted strings, including
  // escaped quotes, so keys and string values are never interpreted as numbers.
  const tokens = /"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (const match of text.matchAll(tokens)) {
    const token = match[0];
    if (token[0] === '"') continue;
    const number = Number(token);
    let supported = Number.isFinite(number);
    if (supported) {
      const source = normalizedDecimal(token);
      const output = normalizedDecimal(JSON.stringify(number));
      supported = source.negative === output.negative && source.digits === output.digits && source.exponent === output.exponent;
    }
    if (!supported) {
      const before = text.slice(0, match.index);
      const line = before.split("\n").length;
      const column = match.index - before.lastIndexOf("\n");
      const preview = token.length > 60 ? token.slice(0, 57) + "…" : token;
      throw new UnsupportedNumberError(
        `Unsupported numeric value: ${preview}\n→ line ${line}, column ${column}\n` +
        "Formatting would change this number's precision, range, or negative-zero sign. " +
        "Nothing was formatted. Use a lossless JSON tool for this document, or quote the number only if a string is intended."
      );
    }
  }
}

function formatParseError(e, text) {
  const msg = e.message || String(e);
  const m = msg.match(/position (\d+)/);
  if (m) {
    const pos = Number(m[1]);
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const col = pos - before.lastIndexOf("\n");
    return `Invalid JSON: ${msg}\n→ line ${line}, column ${col}`;
  }
  return `Invalid JSON: ${msg}`;
}

function showError(text, rawText) {
  els.error.textContent = text;
  const repaired = rawText ? repairJson(rawText) : null;
  if (repaired) {
    const btn = document.createElement("button");
    btn.className = "repair-btn";
    btn.textContent = "🪄 Auto-fix syntax & format";
    btn.title = "Automatically repair trailing commas, quotes, or unquoted keys";
    btn.addEventListener("click", () => {
      els.input.value = repaired;
      loadText(repaired);
      toast("Syntax automatically repaired!");
    });
    els.error.appendChild(document.createElement("br"));
    els.error.appendChild(btn);
  }
  els.error.hidden = false;
  els.inputPanel.classList.remove("hidden");
}
function hideError() { els.error.hidden = true; els.error.textContent = ""; }

let toastTimer = null;
function toast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1800);
}

// --- Pro features ---
function onQuery(e) {
  if (!isPro()) { openUnlock(e?.currentTarget); return; }
  if (current === NO_DOCUMENT) { toast("Format some JSON first."); return; }
  const expr = $("query").value.trim();
  if (!expr) { toast("Type a path, e.g. data.items[*].name"); return; }
  let result;
  try { result = runQuery(current, expr); }
  catch (e) { toast("Query error: " + e.message); return; }
  current = result; // search / CSV / copy now apply to the result; Format restores the original
  renderTree(result);
  els.search.value = "";
  toast("Showing query result · click Format to reset");
}

function onCsv(e) {
  if (!isPro()) { openUnlock(e?.currentTarget); return; }
  if (current === NO_DOCUMENT) { toast("Format some JSON first."); return; }
  download("data.csv", toCSV(current), "text/csv;charset=utf-8");
  toast("CSV exported");
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let unlockTrigger = null;
let inertBackground = [];
const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

function unlockFocusables() {
  return Array.from($("unlock").querySelectorAll(focusableSelector))
    .filter((el) => !el.disabled && el.tabIndex >= 0 && !el.closest("[hidden], [inert]") && el.getClientRects().length);
}

function focusUnlock() {
  const controls = unlockFocusables();
  const code = $("code");
  (controls.includes(code) ? code : controls[0] || $("unlock")).focus();
}

function openUnlock(trigger = document.activeElement) {
  const modal = $("unlock");
  if (!modal.hidden) return;
  unlockTrigger = trigger;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.tabIndex = -1;
  const title = modal.querySelector("h1, h2, h3");
  if (title) {
    if (!title.id) title.id = "unlock-title";
    modal.setAttribute("aria-labelledby", title.id);
  } else modal.setAttribute("aria-label", "Unlock Pro");
  modal.hidden = false;
  // Inert siblings along the ancestor chain, preserving existing inert states.
  // This works whether the dialog is a direct child of body or nested in a panel.
  inertBackground = [];
  for (let branch = modal; branch && branch !== document.body; branch = branch.parentElement) {
    for (const sibling of branch.parentElement?.children || []) {
      if (sibling === branch) continue;
      inertBackground.push([sibling, sibling.inert]);
      sibling.inert = true;
    }
  }
  focusUnlock();
}

function closeUnlock() {
  const modal = $("unlock");
  if (modal.hidden) return;
  modal.hidden = true;
  for (const [el, wasInert] of inertBackground) el.inert = wasInert;
  inertBackground = [];
  const trigger = unlockTrigger;
  unlockTrigger = null;
  if (trigger?.isConnected && typeof trigger.focus === "function") trigger.focus();
}

document.addEventListener("keydown", (e) => {
  const modal = $("unlock");
  if (modal.hidden) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeUnlock();
  } else if (e.key === "Tab") {
    const controls = unlockFocusables();
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { e.preventDefault(); modal.focus(); return; }
    if (e.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
      e.preventDefault(); first.focus();
    }
  }
});

document.addEventListener("focusin", (e) => {
  const modal = $("unlock");
  if (!modal.hidden && !modal.contains(e.target)) focusUnlock();
});

function reflectPro() {
  if (!isPro()) return;
  $("btn-query").textContent = "Query";
  $("btn-csv").textContent = "CSV";
  $("btn-query").title = "Run a JSONPath-style query";
  $("btn-csv").title = "Export an array to CSV / Excel";
}
