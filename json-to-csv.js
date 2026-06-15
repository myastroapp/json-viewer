import { toCSV } from "./pro.js";

const $ = (id) => document.getElementById(id);

$("convert").addEventListener("click", () => {
  const raw = $("in").value.trim();
  if (!raw) return;
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) { $("out").value = "Invalid JSON: " + e.message; return; }
  $("out").value = toCSV(parsed);
});

$("download").addEventListener("click", () => {
  const csv = $("out").value;
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("copy").addEventListener("click", async () => {
  if (!$("out").value) return;
  try {
    await navigator.clipboard.writeText($("out").value);
    $("copy").textContent = "Copied";
    setTimeout(() => ($("copy").textContent = "Copy CSV"), 1200);
  } catch (_e) { /* clipboard blocked */ }
});
