// URL encode / decode. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function urlEncodeComponent(s) { return encodeURIComponent(String(s)); }
export function urlEncodeFull(s) { return encodeURI(String(s)); }
export function urlDecode(s) {
  try { return decodeURIComponent(String(s)); }
  catch (e) { throw new Error("Malformed percent-encoding"); }
}

if (typeof document !== "undefined") {
  const enc = () => {
    $("err").textContent = "";
    const v = $("in").value;
    $("out-comp").value = urlEncodeComponent(v);
    $("out-full").value = urlEncodeFull(v);
  };
  const dec = () => {
    $("err").textContent = "";
    if (!$("in").value.trim()) { $("out-comp").value = ""; $("out-full").value = ""; return; }
    try { const d = urlDecode($("in").value); $("out-comp").value = d; $("out-full").value = d; }
    catch (e) { $("err").textContent = e.message; $("out-comp").value = ""; $("out-full").value = ""; }
  };
  $("encode").addEventListener("click", enc);
  $("decode").addEventListener("click", dec);
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    const v = $(btn.dataset.copy).value;
    if (!v) return;
    try { await navigator.clipboard.writeText(v); const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1200); } catch (_e) { /* */ }
  }));
  enc();
}
