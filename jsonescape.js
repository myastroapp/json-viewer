// JSON string escape / unescape. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function jsonEscape(s, withQuotes = false) {
  const full = JSON.stringify(String(s)); // outer quotes + all escapes
  return withQuotes ? full : full.slice(1, -1);
}

export function jsonUnescape(s) {
  let str = String(s).trim();
  if (!(str.startsWith('"') && str.endsWith('"'))) str = '"' + str + '"';
  try { return JSON.parse(str); }
  catch (e) { throw new Error("Not a valid escaped JSON string (check quotes / control characters)"); }
}

if (typeof document !== "undefined") {
  const esc = () => {
    $("err").textContent = "";
    $("out").value = jsonEscape($("in").value, $("quotes").checked);
  };
  const unesc = () => {
    $("err").textContent = "";
    if (!$("in").value.trim()) { $("out").value = ""; return; }
    try { $("out").value = jsonUnescape($("in").value); }
    catch (e) { $("err").textContent = e.message; $("out").value = ""; }
  };
  $("escape").addEventListener("click", esc);
  $("unescape").addEventListener("click", unesc);
  $("quotes").addEventListener("change", () => { if ($("out").value && !$("err").textContent) esc(); });
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) { /* */ }
  });
}
