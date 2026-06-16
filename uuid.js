// UUID v4 generator. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = (i * 2654435761) & 0xff; // non-crypto last resort
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}

export function generate(n, { uppercase = false, dashes = true } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let u = uuidv4();
    if (!dashes) u = u.replace(/-/g, "");
    if (uppercase) u = u.toUpperCase();
    out.push(u);
  }
  return out;
}

if (typeof document !== "undefined") {
  const gen = () => {
    const n = Math.min(500, Math.max(1, parseInt($("count").value, 10) || 1));
    $("out").value = generate(n, { uppercase: $("upper").checked, dashes: !$("nodash").checked }).join("\n");
  };
  $("gen").addEventListener("click", gen);
  $("count").addEventListener("input", gen);
  $("upper").addEventListener("change", gen);
  $("nodash").addEventListener("change", gen);
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy all"), 1200); } catch (_e) { /* */ }
  });
  gen();
}
