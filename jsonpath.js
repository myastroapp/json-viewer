import { query } from "./pro.js";
import { createTree } from "./render.js";

const $ = (id) => document.getElementById(id);

function run() {
  const raw = $("in").value.trim();
  const path = $("path").value.trim();
  $("out").textContent = "";
  $("err").hidden = true;
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { $("err").textContent = "Invalid JSON: " + e.message; $("err").hidden = false; return; }
  let res;
  try { res = query(data, path); }
  catch (e) { $("err").textContent = "Query error: " + e.message; $("err").hidden = false; return; }
  $("out").appendChild(createTree(res));
}

$("run").addEventListener("click", run);
$("path").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
