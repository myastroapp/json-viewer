import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATUS_PATH = path.join(ROOT, "cws-status.json");
const README_PATH = path.join(ROOT, "README.md");
const ITEM_ID = "iflllkjiplfnggmmjikcgmjmbgchcgob";
const LOOKUP_URL = process.env.CWS_LOOKUP_URL || `https://chromewebstore.google.com/detail/${ITEM_ID}`;
const EXPECTED_TITLE = process.env.CWS_EXPECTED_TITLE || "JSON Viewer";
const dryRun = process.argv.includes("--dry-run");

const response = await fetch(LOOKUP_URL, {
  redirect: "follow",
  headers: { "user-agent": "json-viewer-publication-monitor/1.0" },
});
const html = await response.text();
const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] || "";
const canonical = response.url;
const isPlaceholder = canonical.includes("/empty-title/") || /<meta\s+name="robots"\s+content="noindex"/i.test(html);
const live = response.ok && !isPlaceholder && ogTitle.includes(EXPECTED_TITLE);

console.log(JSON.stringify({ live, httpStatus: response.status, canonical, ogTitle }));

if (!live) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Chrome Web Store monitor\n\nStill pending publication. Resolved URL: \`${canonical}\`.\n`);
  }
  process.exit(0);
}

const status = JSON.parse(fs.readFileSync(STATUS_PATH, "utf8"));
if (status.status === "live") {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Chrome Web Store monitor\n\nListing is live: ${status.storeUrl}\n`);
  }
  process.exit(0);
}

if (dryRun) {
  console.log("dry-run: publication transition detected; no files changed");
  process.exit(0);
}

status.status = "live";
status.storeUrl = canonical;
status.publishedDetectedAt = new Date().toISOString();
fs.writeFileSync(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`);

const readme = fs.readFileSync(README_PATH, "utf8");
const block = `<!-- CWS_STATUS_START -->\n**Chrome extension:** [Install JSON Viewer & Formatter from the Chrome Web Store](${canonical})\n<!-- CWS_STATUS_END -->`;
const nextReadme = readme.includes("<!-- CWS_STATUS_START -->")
  ? readme.replace(/<!-- CWS_STATUS_START -->[\s\S]*?<!-- CWS_STATUS_END -->/, block)
  : readme.replace(/(\*\*▶ Use it:[^\n]*\n)/, `$1\n${block}\n`);
fs.writeFileSync(README_PATH, nextReadme);

if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, "changed=true\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Chrome Web Store monitor\n\nPublication detected. The owned-site install prompts and README are now live: ${canonical}\n`);
}
