// Regex tester. Pure core (runRegex) exported for tests; DOM wiring + highlighting guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function runRegex(pattern, flags, text) {
  if (pattern === "") return { matches: [], count: 0 };
  let re;
  const gflags = flags.includes("g") ? flags : flags + "g";
  try { re = new RegExp(pattern, gflags); } catch (e) { return { error: e.message }; }
  const matches = [];
  let n = 0;
  for (const m of String(text).matchAll(re)) {
    matches.push({ match: m[0], index: m.index, groups: m.slice(1), named: m.groups || null });
    if (++n >= 10000) break;
  }
  return { matches, count: matches.length };
}

if (typeof document !== "undefined") {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const flagsStr = () => ["g", "i", "m", "s"].filter((fl) => $("f-" + fl).checked).join("");
  const run = () => {
    const pattern = $("pattern").value, text = $("text").value;
    $("err").textContent = "";
    const r = runRegex(pattern, flagsStr(), text);
    if (r.error) { $("err").textContent = "Invalid regex: " + r.error; $("hl").innerHTML = esc(text); $("matches").innerHTML = ""; $("count").textContent = ""; return; }
    // highlight
    let html = "", last = 0;
    for (const m of r.matches) {
      if (m.match === "") continue;
      html += esc(text.slice(last, m.index)) + "<mark>" + esc(m.match) + "</mark>";
      last = m.index + m.match.length;
    }
    html += esc(text.slice(last));
    $("hl").innerHTML = html || "&nbsp;";
    $("count").textContent = r.count + (r.count === 1 ? " match" : " matches");
    $("matches").innerHTML = r.matches.slice(0, 200).map((m, i) => {
      const grp = m.groups.length ? ` <span class="muted">groups:</span> ${m.groups.map((g) => "<code>" + esc(g === undefined ? "∅" : g) + "</code>").join(" ")}` : "";
      return `<div class="mrow"><span class="muted">#${i + 1} @${m.index}</span> <code>${esc(m.match)}</code>${grp}</div>`;
    }).join("");
  };
  ["pattern", "text"].forEach((id) => $(id).addEventListener("input", run));
  ["g", "i", "m", "s"].forEach((fl) => $("f-" + fl).addEventListener("change", run));
  run();
}
