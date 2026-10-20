// Attempt to repair common JSON syntax mistakes:
// 1. Newline-delimited JSON (NDJSON) -> wraps in array
// 2. Trailing commas in objects and arrays
// 3. Unquoted object keys ({ foo: "bar" } -> { "foo": "bar" })
// 4. Single-quoted strings or keys ({ 'foo': 'bar' } -> { "foo": "bar" })
// 5. JavaScript-style single-line and multi-line comments

export function repairJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const str = raw.trim();
  if (!str) return null;

  // Already valid JSON
  try {
    JSON.parse(str);
    return str;
  } catch (_) {}

  // 1. NDJSON check (multiple lines where each line is valid JSON)
  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    let allValid = true;
    for (const line of lines) {
      try {
        JSON.parse(line);
      } catch (_) {
        allValid = false;
        break;
      }
    }
    if (allValid) {
      return `[\n  ${lines.join(",\n  ")}\n]`;
    }
  }

  let cleaned = str;

  // 2. Strip comments (block and inline)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/(^|[^:])\/\/[^\n\r]*/g, "$1");

  // 3. Fix unquoted keys
  cleaned = cleaned.replace(/([{,]\s*)([A-Za-z0-9_$]+)\s*:/g, '$1"$2":');

  // 4. Fix single quotes outside strings
  cleaned = cleaned.replace(/'((?:\\.|[^'])*)'/g, (_, val) => {
    return `"${val.replace(/"/g, '\\"')}"`;
  });

  // 5. Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (_) {}

  return null;
}
