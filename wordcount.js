// Word / character counter. Pure core (countText) exported for tests; DOM wiring guarded.
const $ = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);

export function countText(text) {
  const s = String(text);
  const t = s.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const sentences = t ? s.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean).length : 0;
  const paragraphs = t ? t.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).length : 0;
  return {
    chars: s.length,
    charsNoSpaces: s.replace(/\s/g, "").length,
    words,
    sentences,
    paragraphs,
    readingMinutes: words / 200,
  };
}

if (typeof document !== "undefined") {
  const fmtMin = (m) => {
    if (m < 1) return m === 0 ? "0 sec" : Math.max(1, Math.round(m * 60)) + " sec";
    const mm = Math.floor(m), ss = Math.round((m - mm) * 60);
    return mm + " min" + (ss ? " " + ss + " sec" : "");
  };
  const run = () => {
    const r = countText($("in").value);
    $("c-words").textContent = r.words.toLocaleString();
    $("c-chars").textContent = r.chars.toLocaleString();
    $("c-nospace").textContent = r.charsNoSpaces.toLocaleString();
    $("c-sentences").textContent = r.sentences.toLocaleString();
    $("c-paragraphs").textContent = r.paragraphs.toLocaleString();
    $("c-reading").textContent = fmtMin(r.readingMinutes);
  };
  $("in").addEventListener("input", run);
  run();
}
