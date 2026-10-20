import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const numericSource = source.slice(source.indexOf('class UnsupportedNumberError'), source.indexOf('function formatParseError'));
const numeric = vm.runInNewContext(numericSource + '\n({ assertSupportedNumbers, normalizedDecimal });');
const accepted = [
  'null', 'true', 'false', '0', '0.00000', '0e400', '0e-400', '1', '-1', '2.5', '-2.5',
  '9007199254740991', '9007199254740992', '-9007199254740992', '0.1', '0.1000000000', '9007199254740993000000',
  '1000e-3', '1e+21', '10e20', '1E000000000000000000000000000000000021',
  '1e-6', '1e-7', '5e-324', '1.7976931348623157e308',
  '{"numberText":"9007199254740993 1e400 1e-400 -0","9007199254740993":"x"}',
  '{"escaped":"a\\\"1e400\\\" b\\\\9007199254740993","n":1}',
  '{"data":[0,1.25,-3,1e20,1e21,null,"1e400"]}',
  '"Unicode 😀 שלום \\u0031e400"',
];
const rejected = [
  '9007199254740993', '-9007199254740993', '0.12345678901234567890', '1e400', '1e-400',
  '-1e400', '-1e-400', '-0', '-0.00', '-0e999999',
  '4e-324', '1.7976931348623159e308', '1.0000000000000001', '1000000000000000000001',
  '{"a":9007199254740993,"a":1}', '{"quoted":"1e400","actual":1e400}',
  '[1,{"actual":1e-400}]',
];
let count = 0;
for (const value of accepted) {
  JSON.parse(value);
  assert.doesNotThrow(() => numeric.assertSupportedNumbers(value), value);
  count++;
}
for (const value of rejected) {
  JSON.parse(value);
  assert.throws(() => numeric.assertSupportedNumbers(value), {name:'Error', message:/Unsupported numeric value:/}, value);
  count++;
}
assert.throws(() => numeric.assertSupportedNumbers('{\n  "bad": 1e400\n}'), /line 2, column 10/);
count++;
// Long exponents/zero runs must remain bounded and should not trip false alarms.
numeric.assertSupportedNumbers('1e+' + '0'.repeat(10000) + '2'); count++;
numeric.assertSupportedNumbers('0e' + '9'.repeat(10000)); count++;
assert.throws(() => numeric.assertSupportedNumbers('1e' + '9'.repeat(10000)), /Unsupported numeric value/); count++;
// Stress ordinary decimal values from JSON.stringify: these all survive reserialization.
for (let i = 1; i <= 10000; i++) {
  const value = Math.sin(i) * 10 ** ((i % 617) - 308);
  if (Number.isFinite(value)) { numeric.assertSupportedNumbers(JSON.stringify(value)); count++; }
}
// Long coefficients must not stall formatting on the browser's main thread.
const longContext = vm.createContext({ assert });
vm.runInContext(numericSource, longContext);
vm.runInContext(`
  const zeros = '0'.repeat(100000);
  assert.throws(() => assertSupportedNumbers('1' + zeros + '1e-100001'), /Unsupported numeric value:/);
  assert.doesNotThrow(() => assertSupportedNumbers('1' + zeros + 'e-100000'));
`, longContext, { timeout: 2000 });
count += 2;
// A cached production page predates Copy TS. Core viewer startup must still wire.
const listeners = new Map();
const legacyDocument = {
  getElementById(id) {
    if (id === 'btn-ts') return null;
    return { addEventListener(event, handler) { listeners.set(id + ':' + event, handler); } };
  },
  addEventListener() {},
};
const runtimeSource = source.replace(/import\s+\{[^}]*\}\s+from\s+"[^"\n]+";\s*/g, '');
assert.doesNotThrow(() => vm.runInNewContext(runtimeSource, { document: legacyDocument, isPro: () => false }, { timeout: 2000 }));
assert.equal(typeof listeners.get('btn-format:click'), 'function');
count += 2;
const html = fs.readFileSync(new URL('./app.html', import.meta.url), 'utf8');
const version = (await import('node:crypto')).createHash('sha256').update(source).digest('hex').slice(0, 12);
assert.ok(html.includes('src="app.js?v=' + version + '"'), 'New HTML must request the current entry script rather than a cached production script');
count++;
console.log(JSON.stringify({suite:'numeric', passed:count, failed:0, acceptedCases:accepted.length, rejectedCases:rejected.length, longCoefficientCases:2}));

