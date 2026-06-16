// JSON -> YAML. Pure core (jsonToYaml) exported for tests; DOM wiring guarded.
// Conservative serializer: anything ambiguous is double-quoted, so output is always valid YAML.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

function needsQuote(s) {
  if (s === "") return true;
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(s)) return true;          // type-like
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return true;        // number-like
  if (/^0x[0-9a-fA-F]+$/.test(s) || /^0o[0-7]+$/.test(s)) return true;
  if (/^[\s>|*&!%#@`,\[\]{}"'?:-]/.test(s)) return true;                     // unsafe first char
  if (/[:#]\s/.test(s) || /\s#/.test(s)) return true;                       // ": " or " #"
  if (/[:]$/.test(s) || /\s$/.test(s) || /^\s/.test(s)) return true;        // trailing colon / surrounding space
  if (/[\n\t]/.test(s)) return true;                                        // control chars
  return false;
}

function quoteStr(s) {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t") + '"';
}

function scalar(v) {
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : quoteStr(String(v));
  const s = String(v);
  return needsQuote(s) ? quoteStr(s) : s;
}

const isFilled = (o) => (Array.isArray(o) ? o.length : Object.keys(o).length) > 0;

function dump(data, indent) {
  const pad = "  ".repeat(indent);
  if (Array.isArray(data)) {
    if (!data.length) return pad + "[]";
    return data.map((item) => {
      if (item && typeof item === "object" && isFilled(item)) {
        const child = dump(item, indent + 1).split("\n");
        const first = child[0].slice((indent + 1) * 2);
        const rest = child.slice(1).join("\n");
        return pad + "- " + first + (rest ? "\n" + rest : "");
      }
      const sc = item && typeof item === "object" ? (Array.isArray(item) ? "[]" : "{}") : scalar(item);
      return pad + "- " + sc;
    }).join("\n");
  }
  if (data && typeof data === "object") {
    const keys = Object.keys(data);
    if (!keys.length) return pad + "{}";
    return keys.map((k) => {
      const kk = needsQuote(k) ? quoteStr(k) : k;
      const v = data[k];
      if (v && typeof v === "object" && isFilled(v)) return pad + kk + ":\n" + dump(v, indent + 1);
      const sc = v && typeof v === "object" ? (Array.isArray(v) ? "[]" : "{}") : scalar(v);
      return pad + kk + ": " + sc;
    }).join("\n");
  }
  return pad + scalar(data);
}

export function jsonToYaml(data) { return dump(data, 0); }

if (typeof document !== "undefined") {
  const convert = () => {
    const raw = $("in").value.trim();
    if (!raw) { $("out").value = ""; return; }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { $("out").value = "Invalid JSON: " + e.message; return; }
    try { $("out").value = jsonToYaml(parsed); }
    catch (e) { $("out").value = "Error: " + e.message; }
  };
  $("convert").addEventListener("click", convert);
  $("download").addEventListener("click", () => {
    const y = $("out").value;
    if (!y) return;
    const blob = new Blob([y], { type: "text/yaml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.yaml";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy YAML"), 1200); }
    catch (_e) { /* clipboard blocked */ }
  });
}
