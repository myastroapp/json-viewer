const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

function parsed() {
  const errEl = $("err");
  errEl.hidden = true;
  try { return JSON.parse($("in").value); }
  catch (e) { errEl.textContent = "Invalid JSON: " + e.message; errEl.hidden = false; return undefined; }
}
function beautify() {
  const d = parsed(); if (d === undefined) return;
  const ind = $("indent").value;
  $("out").value = JSON.stringify(d, null, ind === "tab" ? "\t" : Number(ind));
}
function minify() {
  const d = parsed(); if (d === undefined) return;
  $("out").value = JSON.stringify(d);
}

if ($("beautify")) {
  $("beautify").addEventListener("click", beautify);
  $("minify").addEventListener("click", minify);
  $("copy")?.addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) {}
  });
}
