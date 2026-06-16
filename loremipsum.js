// Lorem Ipsum generator. Pure core (generateLorem) exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

const WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");
const CLASSIC = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const word = () => WORDS[Math.floor(Math.random() * WORDS.length)];
const sentence = () => { const w = Array.from({ length: ri(6, 14) }, word); w[0] = cap(w[0]); return w.join(" ") + "."; };
const paragraph = () => Array.from({ length: ri(3, 6) }, sentence).join(" ");

export function generateLorem(count, unit = "paragraphs", startClassic = true) {
  count = Math.max(1, count | 0);
  if (unit === "words") {
    const w = Array.from({ length: count }, word);
    if (startClassic) { w[0] = "lorem"; if (count > 1) w[1] = "ipsum"; }
    w[0] = cap(w[0]);
    return w.join(" ") + ".";
  }
  if (unit === "sentences") {
    const arr = Array.from({ length: count }, sentence);
    if (startClassic) arr[0] = CLASSIC;
    return arr.join(" ");
  }
  const arr = Array.from({ length: count }, paragraph);
  if (startClassic) arr[0] = CLASSIC + " " + arr[0];
  return arr.join("\n\n");
}

if (typeof document !== "undefined") {
  const run = () => {
    const n = Math.min(100, Math.max(1, parseInt($("count").value, 10) || 1));
    $("out").value = generateLorem(n, $("unit").value, $("classic").checked);
  };
  $("gen").addEventListener("click", run);
  ["count", "unit", "classic"].forEach((id) => $(id).addEventListener("input", run));
  $("unit").addEventListener("change", run);
  $("classic").addEventListener("change", run);
  $("copy").addEventListener("click", async () => {
    if (!$("out").value) return;
    try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied"; setTimeout(() => ($("copy").textContent = "Copy"), 1200); } catch (_e) { /* */ }
  });
  run();
}
