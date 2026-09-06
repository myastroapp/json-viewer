import fs from "node:fs";
import process from "node:process";

const targets = [
  ["Web viewer", "https://json-viewer.smolkapps.com/", "JSON viewer that doesn"],
  ["Extension landing page", "https://json-viewer.smolkapps.com/chrome-extension.html", "Large JSON, readable"],
  ["Privacy policy", "https://json-viewer.smolkapps.com/privacy.html", "Privacy Policy"],
  ["Status feed", "https://json-viewer.smolkapps.com/cws-status.json", "iflllkjiplfnggmmjikcgmjmbgchcgob"],
];

const results = await Promise.all(targets.map(async ([name, url, expected]) => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "json-viewer-marketing-health/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    return { name, url, ok: response.ok && body.includes(expected), status: response.status };
  } catch (error) {
    return { name, url, ok: false, status: 0, error: error.message };
  }
}));

const lines = results.map((result) => `- ${result.ok ? "✅" : "❌"} ${result.name}: HTTP ${result.status} — ${result.url}`);
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Marketing funnel health\n\n${lines.join("\n")}\n`);
if (results.some((result) => !result.ok)) process.exit(1);
