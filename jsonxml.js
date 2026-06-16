// JSON -> XML. Pure core (jsonToXml) exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const safeTag = (name) => {
  let t = String(name).replace(/[^A-Za-z0-9_.\-]/g, "_");
  if (!/^[A-Za-z_]/.test(t)) t = "_" + t;
  return t || "_";
};

function build(name, v, indent) {
  const pad = "  ".repeat(indent);
  const tag = safeTag(name);
  if (Array.isArray(v)) {
    if (!v.length) return `${pad}<${tag}/>`;
    return v.map((item) => build(name, item, indent)).join("\n");
  }
  if (v !== null && typeof v === "object") {
    const keys = Object.keys(v);
    if (!keys.length) return `${pad}<${tag}/>`;
    const inner = keys.map((k) => build(k, v[k], indent + 1)).join("\n");
    return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`;
  }
  if (v === null || v === undefined) return `${pad}<${tag}/>`;
  return `${pad}<${tag}>${esc(v)}</${tag}>`;
}

export function jsonToXml(data, root = "root") {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + build(root, data, 0);
}

if (typeof document !== "undefined") {
  const convert = () => {
    $("err").textContent = "";
    const raw = $("in").value.trim();
    if (!raw) { $("out").value = ""; return; }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { $("err").textContent = "Invalid JSON: " + e.message; $("out").value = ""; return; }
    try { $("out").value = jsonToXml(parsed, $("root").value.trim() || "root"); }
    catch (e) { $("err").textContent = "Error: " + e.message; }
  };
  $("convert").addEventListener("click", convert);
  $("root").addEventListener("input", () => { if ($("out").value && !$("err").textContent) convert(); });
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy XML"), 1200); } catch (_e) { /* */ }
  });
}
