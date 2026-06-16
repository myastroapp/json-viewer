// HTML entity encode / decode. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", euro: "€", pound: "£", cent: "¢", deg: "°" };

export function encodeHtml(s, { all = false } = {}) {
  let out = String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  if (all) out = [...out].map((c) => (c.codePointAt(0) > 127 ? "&#" + c.codePointAt(0) + ";" : c)).join("");
  return out;
}

export function decodeHtml(s) {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => (name in NAMED ? NAMED[name] : m));
}

if (typeof document !== "undefined") {
  const enc = () => { $("err").textContent = ""; $("out").value = encodeHtml($("in").value, { all: $("all").checked }); };
  const dec = () => { $("err").textContent = ""; $("out").value = $("in").value.trim() ? decodeHtml($("in").value) : ""; };
  $("encode").addEventListener("click", enc);
  $("decode").addEventListener("click", dec);
  $("all").addEventListener("change", () => { if ($("out").value) enc(); });
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) { /* */ }
  });
}
