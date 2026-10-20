import assert from "node:assert";
import { repairJson } from "./repair.js";
import { toTypeScript } from "./json-to-ts.js";

console.log("Starting test suite for JSON Viewer & Formatter enhancements...");

// --- 1. Test repairJson ---
console.log("\nTesting repairJson...");

// Case: Already valid
const valid = '{"valid": true, "count": 10}';
assert.strictEqual(repairJson(valid), valid, "Valid JSON should return untouched");

// Case: Trailing comma in object
const trailingObj = '{"name": "test", "age": 25, }';
const rTrailingObj = repairJson(trailingObj);
assert(rTrailingObj !== null, "Trailing comma in object should be repaired");
assert.deepStrictEqual(JSON.parse(rTrailingObj), { name: "test", age: 25 });

// Case: Trailing comma in array
const trailingArr = '[1, 2, 3, ]';
const rTrailingArr = repairJson(trailingArr);
assert(rTrailingArr !== null, "Trailing comma in array should be repaired");
assert.deepStrictEqual(JSON.parse(rTrailingArr), [1, 2, 3]);

// Case: Single quotes
const singleQuotes = "{'title': 'Hello World', 'active': true}";
const rSingleQuotes = repairJson(singleQuotes);
assert(rSingleQuotes !== null, "Single quotes should be converted to double quotes");
assert.deepStrictEqual(JSON.parse(rSingleQuotes), { title: "Hello World", active: true });

// Case: Unquoted keys
const unquoted = '{name: "Alice", id: 101, nested: {val: 2}}';
const rUnquoted = repairJson(unquoted);
assert(rUnquoted !== null, "Unquoted keys should be quoted");
assert.deepStrictEqual(JSON.parse(rUnquoted), { name: "Alice", id: 101, nested: { val: 2 } });

// Case: Comments
const withComments = '{\n  // User name\n  "name": "Bob",\n  /* User age */\n  "age": 40\n}';
const rWithComments = repairJson(withComments);
assert(rWithComments !== null, "Comments should be stripped");
assert.deepStrictEqual(JSON.parse(rWithComments), { name: "Bob", age: 40 });

// Case: NDJSON
const ndjson = '{"id": 1, "status": "ok"}\n{"id": 2, "status": "pending"}';
const rNdjson = repairJson(ndjson);
assert(rNdjson !== null, "NDJSON should be converted to JSON array");
assert.deepStrictEqual(JSON.parse(rNdjson), [{ id: 1, status: "ok" }, { id: 2, status: "pending" }]);

// Case: Irreparable garbage
const garbage = 'this is completely random text that is not json at all';
assert.strictEqual(repairJson(garbage), null, "Unfixable text should return null");

console.log("✓ repairJson passed all 8 test categories.");

// --- 2. Test toTypeScript ---
console.log("\nTesting toTypeScript...");

const sampleObj = {
  id: 123,
  username: "octocat",
  isVerified: true,
  tags: ["dev", "oss"],
  meta: {
    loginCount: 5,
    lastSeen: "2026-09-07"
  }
};

const tsOutput = toTypeScript(sampleObj, "User");
assert(tsOutput.includes("export interface User {"), "Should export Root/User interface");
assert(tsOutput.includes("id: number;"), "Should type id as number");
assert(tsOutput.includes("username: string;"), "Should type username as string");
assert(tsOutput.includes("isVerified: boolean;"), "Should type isVerified as boolean");
assert(tsOutput.includes("tags: string[];"), "Should type tags as string array");
assert(tsOutput.includes("meta: Meta;"), "Should type nested meta as Meta interface");
assert(tsOutput.includes("export interface Meta {"), "Should generate Meta interface");

console.log("✓ toTypeScript passed all schema generation assertions.");

// --- 3. Test Large Payload performance ---
console.log("\nTesting Large Payload parsing & formatting performance...");
const largeArray = [];
for (let i = 0; i < 50000; i++) {
  largeArray.push({ id: i, name: `user_${i}`, score: i * 1.5, flags: [i % 2 === 0] });
}
const largeJson = JSON.stringify(largeArray);
const t0 = performance.now();
const parsed = JSON.parse(largeJson);
const tsGen = toTypeScript(parsed, "DataList");
const t1 = performance.now();

console.log(`✓ 50,000 object records (${(largeJson.length / (1024 * 1024)).toFixed(2)} MB) processed & typed in ${(t1 - t0).toFixed(1)} ms.`);

console.log("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
