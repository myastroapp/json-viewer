// Line-level text diff via LCS. Pure core (lineDiff) exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function lineDiff(a, b) {
  const A = String(a).split("\n"), B = String(b).split("\n");
  const m = A.length, n = B.length;
  if (m * n > 4_000_000) throw new Error("Input too large for line diff — try smaller chunks");
  // LCS length table
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ t: "=", line: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: "-", line: A[i] }); i++; }
    else { out.push({ t: "+", line: B[j] }); j++; }
  }
  while (i < m) out.push({ t: "-", line: A[i++] });
  while (j < n) out.push({ t: "+", line: B[j++] });
  return out;
}

export function diffStats(rows) {
  return {
    added: rows.filter((r) => r.t === "+").length,
    removed: rows.filter((r) => r.t === "-").length,
    unchanged: rows.filter((r) => r.t === "=").length,
  };
}

if (typeof document !== "undefined") {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const run = () => {
    const a = $("a").value, b = $("b").value;
    $("err").textContent = "";
    if (!a && !b) { $("out").innerHTML = ""; $("stats").textContent = ""; return; }
    let rows;
    try { rows = lineDiff(a, b); } catch (e) { $("err").textContent = e.message; return; }
    const s = diffStats(rows);
    $("stats").innerHTML = `<span class="add">+${s.added} added</span> &nbsp; <span class="del">−${s.removed} removed</span> &nbsp; <span class="muted">${s.unchanged} unchanged</span>`;
    $("out").innerHTML = rows.map((r) => {
      const cls = r.t === "+" ? "add" : r.t === "-" ? "del" : "ctx";
      const sign = r.t === "=" ? " " : r.t;
      return `<div class="dl ${cls}"><span class="sg">${sign}</span>${esc(r.line) || "&nbsp;"}</div>`;
    }).join("");
  };
  $("a").addEventListener("input", run);
  $("b").addEventListener("input", run);
  run();
}
