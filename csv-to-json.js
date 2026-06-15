// CSV -> JSON. Pure core (parseCSV/csvToJson) is exported for tests; DOM wiring is guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  text = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  // drop fully-blank rows
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function coerce(v) {
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(v) && String(Number(v)) === v) return Number(v);
  return v;
}

export function csvToJson(text, { coerceTypes = true } = {}) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const head = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    head.forEach((h, idx) => {
      const raw = r[idx] === undefined ? "" : r[idx];
      o[h] = coerceTypes ? coerce(raw) : raw;
    });
    return o;
  });
}

if (typeof document !== "undefined") {
  const convert = () => {
    const raw = $("in").value;
    if (!raw.trim()) { $("out").value = ""; return; }
    try {
      $("out").value = JSON.stringify(csvToJson(raw, { coerceTypes: $("coerce").checked }), null, 2);
    } catch (e) {
      $("out").value = "Error: " + e.message;
    }
  };
  $("convert").addEventListener("click", convert);
  $("coerce").addEventListener("change", () => { if ($("out").value && !$("out").value.startsWith("Error")) convert(); });

  $("download").addEventListener("click", () => {
    const json = $("out").value;
    if (!json) return;
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try {
      await navigator.clipboard.writeText($("out").value);
      $("copy").textContent = "Copied";
      setTimeout(() => ($("copy").textContent = "Copy JSON"), 1200);
    } catch (_e) { /* clipboard blocked */ }
  });
}
