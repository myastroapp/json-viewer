// Unix timestamp <-> date. Pure core exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

// Current 10-digit second timestamps are ~1.7e9; 13-digit ms are ~1.7e12. 1e11 cleanly splits them.
export function detectUnit(n) { return Math.abs(Number(n)) >= 1e11 ? "ms" : "s"; }

export function epochToDate(n) {
  n = Number(n);
  const ms = detectUnit(n) === "ms" ? n : n * 1000;
  return new Date(ms);
}

export function formatEpoch(n) {
  const d = epochToDate(n);
  if (isNaN(d.getTime())) throw new Error("Invalid timestamp");
  return { unix: Math.floor(d.getTime() / 1000), unixMs: d.getTime(), iso: d.toISOString(), utc: d.toUTCString(), local: d.toString() };
}

export function dateToEpoch(str) {
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return { unix: Math.floor(d.getTime() / 1000), unixMs: d.getTime(), iso: d.toISOString() };
}

export function relative(secs, nowSecs) {
  const diff = nowSecs - secs, a = Math.abs(diff);
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [name, s] of units) {
    if (a >= s || name === "second") {
      const v = Math.floor(a / s) || (name === "second" ? a : 1);
      const label = v + " " + name + (v !== 1 ? "s" : "");
      return diff >= 0 ? label + " ago" : "in " + label;
    }
  }
}

if (typeof document !== "undefined") {
  const fromEpoch = () => {
    const raw = $("ts").value.trim();
    $("ts-err").textContent = "";
    if (!raw) { $("ts-out").innerHTML = ""; return; }
    let r;
    try { r = formatEpoch(raw); } catch (e) { $("ts-err").textContent = e.message; $("ts-out").innerHTML = ""; return; }
    const nowS = Math.floor(Date.now() / 1000);
    const rows = [
      ["Detected as", detectUnit(raw) === "ms" ? "milliseconds" : "seconds"],
      ["ISO 8601 (UTC)", r.iso],
      ["UTC", r.utc],
      ["Local", r.local],
      ["Relative", relative(r.unix, nowS)],
      ["Unix (seconds)", String(r.unix)],
      ["Unix (ms)", String(r.unixMs)],
    ];
    $("ts-out").innerHTML = rows.map(([k, v]) => `<div class="cl"><span>${k}</span><span>${String(v).replace(/</g, "&lt;")}</span></div>`).join("");
  };
  const fromDate = () => {
    const raw = $("dt").value.trim();
    $("dt-err").textContent = "";
    if (!raw) { $("dt-out").innerHTML = ""; return; }
    let r;
    try { r = dateToEpoch(raw); } catch (e) { $("dt-err").textContent = e.message; $("dt-out").innerHTML = ""; return; }
    const rows = [["Unix (seconds)", String(r.unix)], ["Unix (ms)", String(r.unixMs)], ["ISO 8601 (UTC)", r.iso]];
    $("dt-out").innerHTML = rows.map(([k, v]) => `<div class="cl"><span>${k}</span><span>${v}</span></div>`).join("");
  };
  $("ts").addEventListener("input", fromEpoch);
  $("dt").addEventListener("input", fromDate);
  $("now").addEventListener("click", () => { $("ts").value = String(Math.floor(Date.now() / 1000)); fromEpoch(); });
  // seed with current time
  $("ts").value = String(Math.floor(Date.now() / 1000));
  fromEpoch();
}
