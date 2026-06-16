// JWT decoder. Pure core (decodeJwt/claimsSummary) is exported for tests; DOM wiring is guarded.
// Decodes only — does NOT verify the signature (that needs the secret/key). 100% local.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

function b64urlDecode(str) {
  str = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  let bin;
  if (typeof atob === "function") bin = atob(str);
  else bin = Buffer.from(str, "base64").toString("binary");
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token) {
  const t = String(token).trim().replace(/^Bearer\s+/i, "");
  const parts = t.split(".");
  if (parts.length < 2) throw new Error("Not a JWT — expected header.payload.signature");
  let header, payload;
  try { header = JSON.parse(b64urlDecode(parts[0])); } catch (e) { throw new Error("Header is not valid base64url-encoded JSON"); }
  try { payload = JSON.parse(b64urlDecode(parts[1])); } catch (e) { throw new Error("Payload is not valid base64url-encoded JSON"); }
  return { header, payload, signature: parts[2] || "" };
}

const fmt = (s) => new Date(s * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC");

export function claimsSummary(payload, nowMs) {
  const now = nowMs === undefined ? Date.now() : nowMs;
  const out = [];
  if ("iat" in payload && typeof payload.iat === "number") out.push(["Issued at", fmt(payload.iat)]);
  if ("nbf" in payload && typeof payload.nbf === "number") out.push(["Not valid before", fmt(payload.nbf)]);
  if ("exp" in payload && typeof payload.exp === "number") {
    const expired = payload.exp * 1000 < now;
    out.push(["Expires", fmt(payload.exp) + (expired ? " — EXPIRED" : " — valid")]);
  }
  return out;
}

if (typeof document !== "undefined") {
  const decode = () => {
    const raw = $("in").value.trim();
    $("err").textContent = "";
    if (!raw) { $("header").textContent = ""; $("payload").textContent = ""; $("claims").innerHTML = ""; return; }
    let r;
    try { r = decodeJwt(raw); }
    catch (e) { $("err").textContent = e.message; $("header").textContent = ""; $("payload").textContent = ""; $("claims").innerHTML = ""; return; }
    $("header").textContent = JSON.stringify(r.header, null, 2);
    $("payload").textContent = JSON.stringify(r.payload, null, 2);
    const algRows = r.header.alg ? [["Algorithm", String(r.header.alg)]] : [];
    const rows = algRows.concat(claimsSummary(r.payload));
    $("claims").innerHTML = rows.map(([k, v]) => `<div class="cl"><span>${k}</span><span>${String(v).replace(/</g, "&lt;")}</span></div>`).join("");
  };
  $("in").addEventListener("input", decode);
  $("copy").addEventListener("click", async () => {
    if (!$("payload").textContent) return;
    try { await navigator.clipboard.writeText($("payload").textContent); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy payload"), 1200); }
    catch (_e) { /* clipboard blocked */ }
  });
  decode();
}
