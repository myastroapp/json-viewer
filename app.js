import {
  createTree, expandAll, collapseAll, searchData, expandPath, countNodes, valueType,
} from "./render.js";

const $ = (id) => document.getElementById(id);
const els = {
  input: $("input"), inputPanel: $("input-panel"), tree: $("tree"),
  error: $("error"), status: $("status"), search: $("search"),
  file: $("file"), url: $("url"), toast: $("toast"),
};

let current = null;      // parsed value
let treeRoot = null;     // mounted .jv-tree element
let lastMatches = [];    // rows currently highlighted

wire();

function wire() {
  $("btn-new").addEventListener("click", () => {
    current = null;
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
}

function loadText(text) {
  hideError();
  const trimmed = (text || "").trim();
  if (!trimmed) { showInputPanel(); return; }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    showError(formatParseError(e, trimmed));
    return;
  }
  current = parsed;
  renderTree(parsed);
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
  if (!treeRoot || current == null) return;
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
  if (current == null) { toast("Nothing to copy — format some JSON first."); return; }
  try {
    await navigator.clipboard.writeText(JSON.stringify(current, null, indent));
    toast(indent ? "Pretty JSON copied" : "Minified JSON copied");
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

function showError(text) {
  els.error.textContent = text;
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
