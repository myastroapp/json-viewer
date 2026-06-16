// SHA hash generator using the platform WebCrypto API (correct by construction). Core exported for tests.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export async function sha(text, algo = "SHA-256") {
  const data = new TextEncoder().encode(String(text));
  const buf = await crypto.subtle.digest(algo, data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

if (typeof document !== "undefined") {
  const idFor = (a) => a.replace("-", "").toLowerCase();
  const run = async () => {
    const txt = $("in").value;
    for (const a of ALGOS) {
      const el = $(idFor(a));
      if (!el) continue;
      try { el.textContent = txt ? await sha(txt, a) : ""; }
      catch (e) { el.textContent = "error: " + e.message; }
    }
  };
  $("in").addEventListener("input", run);
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    const v = $(btn.dataset.copy).textContent;
    if (!v) return;
    try { await navigator.clipboard.writeText(v); const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1200); }
    catch (_e) { /* clipboard blocked */ }
  }));
  run();
}
