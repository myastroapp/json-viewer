// Base64 encode/decode (UTF-8 safe, standard + URL-safe). Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}
function b64ToBytes(b64) {
  let bin;
  if (typeof atob === "function") bin = atob(b64);
  else bin = Buffer.from(b64, "base64").toString("binary");
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeBase64(str, { urlSafe = false } = {}) {
  const bytes = new TextEncoder().encode(String(str));
  let b64 = bytesToB64(bytes);
  if (urlSafe) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

export function decodeBase64(str, { } = {}) {
  let s = String(str).trim().replace(/\s+/g, "");
  if (/[-_]/.test(s)) s = s.replace(/-/g, "+").replace(/_/g, "/"); // accept URL-safe
  while (s.length % 4) s += "=";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error("Not valid base64");
  const bytes = b64ToBytes(s);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

if (typeof document !== "undefined") {
  const enc = () => {
    $("err").textContent = "";
    try { $("out").value = encodeBase64($("in").value, { urlSafe: $("urlsafe").checked }); }
    catch (e) { $("err").textContent = e.message; }
  };
  const dec = () => {
    $("err").textContent = "";
    if (!$("in").value.trim()) { $("out").value = ""; return; }
    try { $("out").value = decodeBase64($("in").value); }
    catch (e) { $("err").textContent = e.message; $("out").value = ""; }
  };
  $("encode").addEventListener("click", enc);
  $("decode").addEventListener("click", dec);
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy output"), 1200); }
    catch (_e) { /* clipboard blocked */ }
  });
}
