import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../chrome-extension.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storeUrl = "https://chromewebstore.google.com/detail/iflllkjiplfnggmmjikcgmjmbgchcgob";
const expected = "https://json-viewer.smolkapps.com/app.html?utm_source=shared_link&utm_medium=referral&utm_campaign=viewer_sharing";

async function setup({ status = "live", nativeShare, copyError, fetchError } = {}) {
  const elements = new Map();
  function element(id) {
    return {
      hidden: id === "share" || id === "share-status", textContent: "", children: [], events: {},
      removeAttribute() {},
      addEventListener(name, handler) { this.events[name] = handler; },
      appendChild(child) { this.children.push(child); },
    };
  }
  for (const id of ["install", "availability", "share", "share-status"]) elements.set(id, element(id));
  const copies = [], shares = [];
  const navigator = {
    clipboard: { async writeText(text) { if (copyError) throw copyError; copies.push(text); } },
  };
  if (nativeShare) navigator.share = async data => { shares.push(data); await nativeShare(data); };
  vm.runInNewContext(script, {
    URL, navigator,
    // The existing feed must not forward arbitrary parameters or fragments to the share target.
    fetch: async () => {
      if (fetchError) throw fetchError;
      return { json: async () => ({status, storeUrl: storeUrl + "?private=do_not_share#local_data"}) };
    },
    document: { getElementById: id => elements.get(id), createElement: () => element("") },
  });
  await new Promise(setImmediate);
  return { elements, copies, shares, click: () => elements.get("share").events.click() };
}

let checks = 0;
let app = await setup();
await app.click();
assert.deepEqual(app.copies, [expected], "Sharing must lead to the corrected web viewer, without JSON or arbitrary URL content");
assert.equal(app.elements.get("share-status").textContent, "Web viewer link copied.");
checks++;

app = await setup({nativeShare: async () => {}});
await app.click();
assert.equal(app.shares.length, 1);
assert.equal(app.shares[0].url, expected);
assert.deepEqual(Object.keys(app.shares[0]).sort(), ["text", "title", "url"]);
assert.equal(app.copies.length, 0, "A native share must not overwrite the clipboard");
assert.equal(app.elements.get("share-status").textContent, "Thanks for sharing.");
checks++;

app = await setup({nativeShare: async () => { throw Object.assign(new Error("Canceled"), {name:"AbortError"}); }});
await app.click();
assert.equal(app.copies.length, 0, "Canceling the native sheet must stay canceled");
assert.equal(app.elements.get("share-status").hidden, true);
checks++;

app = await setup({nativeShare: async () => { throw new Error("Unavailable"); }});
await app.click();
assert.deepEqual(app.copies, [expected], "A failed native share must provide a working copy fallback");
checks++;

app = await setup({copyError: new Error("Clipboard denied")});
await app.click();
assert.equal(app.elements.get("share-status").hidden, false);
assert.equal(app.elements.get("share-status").children[0].href, expected, "Clipboard denial must still leave a shareable link");
checks++;

for (const options of [{status:"pending"}, {fetchError:new Error("Offline")}]) {
  app = await setup(options);
  assert.equal(app.elements.get("share").hidden, true, "An unavailable listing must not be promoted");
  assert.equal(app.elements.get("share").events.click, undefined);
  checks++;
}
console.log(JSON.stringify({suite:"extension sharing",passed:checks,failed:0}));
