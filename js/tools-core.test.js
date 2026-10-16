const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const core = require('./tools-core');

function md5Hex(value) {
    const hash = crypto.createHash('md5');
    hash.update(typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value));
    return hash.digest('hex');
}

test('md5 matches node crypto', () => {
    const samples = [
        '',
        'hello',
        'The quick brown fox jumps over the lazy dog',
        'a'.repeat(100),
        '中文測試 MD5',
        'line1\nline2'
    ];
    for (const sample of samples) {
        assert.equal(core.md5(sample), md5Hex(sample));
    }
    const bytes = Uint8Array.from([0, 1, 255, 16, 32, 127]);
    assert.equal(core.md5(bytes), md5Hex(bytes));
    assert.equal(core.md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
});

test('base64 and hex roundtrip', () => {
    assert.equal(core.transcode('hello', 'text', 'base64'), 'aGVsbG8=');
    assert.equal(core.transcode('hello', 'text', 'hex'), '68656c6c6f');
    assert.equal(core.transcode('aGVsbG8=', 'base64', 'hex'), '68656c6c6f');
    assert.equal(core.transcode('68656c6c6f', 'hex', 'base64'), 'aGVsbG8=');
    assert.equal(core.transcode('68656C6C6F', 'hex', 'text'), 'hello');
    assert.equal(core.transcode('68 65 6c 6c 6f', 'hex', 'text'), 'hello');
    const url = core.transcode('hello??', 'text', 'base64url');
    assert.equal(url.includes('+') || url.includes('/'), false);
    assert.equal(core.transcode(url, 'base64url', 'text'), 'hello??');
    assert.equal(core.transcode('中文', 'text', 'hex', { upper: true }), core.transcode('中文', 'text', 'hex').toUpperCase());
});

test('transcode rejects bad input', () => {
    assert.throws(() => core.transcode('zz', 'hex', 'text'), (err) => err.code === 'invalid-hex');
    assert.throws(() => core.transcode('****', 'base64', 'text'), (err) => err.code === 'invalid-base64');
    assert.throws(() => core.transcode('   ', 'text', 'hex'), (err) => err.code === 'empty');
});

test('jwt hmac verification', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'cyt', exp: 4102444800 })).toString('base64url');
    const sig = crypto.createHmac('sha256', 'secret').update(header + '.' + body).digest('base64url');
    const decoded = core.decodeJwt(header + '.' + body + '.' + sig);
    assert.equal(await core.verifyJwtHmac(decoded, 'secret'), true);
    assert.equal(await core.verifyJwtHmac(decoded, 'wrong'), false);
    await assert.rejects(core.verifyJwtHmac(decoded, ''), (err) => err.code === 'empty-secret');
});

test('jwt decode', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = { sub: '1234567890', name: 'Cyt', iat: 1516239022, exp: 4102444800 };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', 'secret').update(header + '.' + body).digest('base64url');
    const token = header + '.' + body + '.' + sig;
    const decoded = core.decodeJwt('Bearer ' + token);
    assert.equal(decoded.header.alg, 'HS256');
    assert.equal(decoded.payload.name, 'Cyt');
    assert.equal(decoded.signature, sig);
    assert.throws(() => core.decodeJwt('not-a-jwt'), (err) => err.code === 'invalid-jwt');
});

test('timestamp units stay exact for large integers', () => {
    const seconds = core.parseTimestamp('1700000000', 'auto');
    assert.equal(seconds.unit, 's');
    assert.equal(seconds.millisecondsText, '1700000000000');
    assert.equal(seconds.secondsText, '1700000000');

    const ms = core.parseTimestamp('1700000000123', 'auto');
    assert.equal(ms.unit, 'ms');
    assert.equal(ms.millisecondsText, '1700000000123');
    assert.equal(ms.secondsText, '1700000000.123');

    const us = core.parseTimestamp('1700000000123000', 'auto');
    assert.equal(us.unit, 'us');
    assert.equal(us.millisecondsText, '1700000000123');

    const ns = core.parseTimestamp('1700000000123000000', 'auto');
    assert.equal(ns.unit, 'ns');
    assert.equal(ns.millisecondsText, '1700000000123');

    assert.equal(core.parseTimestamp('1.5s', 'auto').millisecondsText, '1500');
    assert.equal(core.parseTimestamp('0', 's').msNumber, 0);
    assert.equal(core.parseTimestamp('1,700,000,000', 's').secondsText, '1700000000');
    assert.throws(() => core.parseTimestamp('abc', 'auto'), (err) => err.code === 'invalid-number');
});

test('date input parses local wall time and zoned strings', () => {
    const local = core.parseDateInput('2024-01-02 03:04:05');
    const expected = new Date(2024, 0, 2, 3, 4, 5, 0).getTime();
    assert.equal(local.msNumber, expected);

    const zoned = core.parseDateInput('1970-01-01T00:00:00Z');
    assert.equal(zoned.msNumber, 0);
    assert.throws(() => core.parseDateInput('not a date'), (err) => err.code === 'invalid-date');
});

test('json format, minify, and sort', () => {
    assert.equal(core.formatJson('{"b":1,"a":2}', { indent: 2, sort: true }), '{\n  "a": 2,\n  "b": 1\n}');
    assert.equal(core.formatJson('{"b":1,"a":[3,2]}', { minify: true, sort: true }), '{"a":[3,2],"b":1}');
    assert.throws(() => core.formatJson('{', {}), (err) => err.code === 'invalid-json' && /position|end|Expected/i.test(err.detail));
});

test('relative time buckets', () => {
    assert.equal(core.relativeParts(2000, 0).key, 'now');
    assert.deepEqual(core.relativeParts(0, 120000), { key: 'ago', unit: 'minute', n: 2 });
    assert.deepEqual(core.relativeParts(7200000, 0), { key: 'in', unit: 'hour', n: 2 });
});

test('relative offset follows the local calendar', () => {
    const now = new Date(2024, 2, 31, 15, 4, 5).getTime();
    const monthAgo = new Date(core.shiftRelative(now, 1, 'month', 'ago'));
    assert.equal(monthAgo.getFullYear(), 2024);
    assert.equal(monthAgo.getMonth(), 1);
    assert.equal(monthAgo.getDate(), 29);
    assert.equal(monthAgo.getHours(), 15);
    assert.equal(monthAgo.getMinutes(), 4);
    assert.equal(monthAgo.getSeconds(), 5);

    const nonLeap = new Date(2023, 2, 31, 8, 0, 0).getTime();
    assert.equal(new Date(core.shiftRelative(nonLeap, 1, 'month', 'ago')).getDate(), 28);

    const jan = new Date(2024, 0, 31, 10, 0, 0).getTime();
    const feb = new Date(core.shiftRelative(jan, 1, 'month', 'in'));
    assert.equal(feb.getMonth(), 1);
    assert.equal(feb.getDate(), 29);
    assert.equal(feb.getHours(), 10);

    const ahead = new Date(core.shiftRelative(now, 1, 'year', 'in'));
    assert.equal(ahead.getFullYear(), 2025);
    assert.equal(ahead.getMonth(), 2);
    assert.equal(ahead.getDate(), 31);

    const week = new Date(core.shiftRelative(now, 2, 'week', 'in'));
    assert.equal(week.getMonth(), 3);
    assert.equal(week.getDate(), 14);
    assert.equal(week.getHours(), 15);

    const hour = new Date(core.shiftRelative(now, 3, 'hour', 'ago'));
    assert.equal(hour.getDate(), 31);
    assert.equal(hour.getHours(), 12);

    assert.equal(core.shiftRelative(now, 0, 'day', 'ago'), now);
    assert.throws(() => core.shiftRelative(now, -1, 'day', 'ago'), (err) => err.code === 'invalid-relative');
    assert.throws(() => core.shiftRelative(now, 1.5, 'day', 'ago'), (err) => err.code === 'invalid-relative');
    assert.throws(() => core.shiftRelative(now, 1, 'decade', 'in'), (err) => err.code === 'invalid-relative');
    assert.throws(() => core.shiftRelative(now, 1, 'day', 'later'), (err) => err.code === 'invalid-relative');
});

test('url encode, decode, and query parse', () => {
    assert.equal(core.transformUrl('a b', 'encode'), 'a%20b');
    assert.equal(core.transformUrl('a%20b', 'decode'), 'a b');
    assert.equal(core.transformUrl('https://example.com/a b', 'encode-uri'), 'https://example.com/a%20b');
    const info = core.parseUrlInfo('https://example.com/path?name=Cyt&q=a%20b');
    assert.equal(info.host, 'example.com');
    assert.equal(info.pathname, '/path');
    assert.deepEqual(info.params, [{ key: 'name', value: 'Cyt' }, { key: 'q', value: 'a b' }]);
    assert.deepEqual(core.parseUrlInfo('name=Cyt&ok=1').params, [{ key: 'name', value: 'Cyt' }, { key: 'ok', value: '1' }]);
    assert.throws(() => core.transformUrl('%', 'decode'), (err) => err.code === 'invalid-url');
});

test('regex lists matches and rejects a bad pattern', () => {
    const matches = core.testRegex('(\\w+)=(\\d+)', 'g', 'a=1 b=2');
    assert.equal(matches.length, 2);
    assert.deepEqual(matches[0].groups, ['a', '1']);
    assert.equal(matches[1].index, 4);
    assert.throws(() => core.testRegex('(', '', 'abc'), (err) => err.code === 'invalid-regex');
});

test('radix conversion keeps big integers exact', () => {
    assert.deepEqual(core.convertRadix('255', 10), { bin: '11111111', oct: '377', dec: '255', hex: 'ff' });
    assert.equal(core.convertRadix('0xff', 16).dec, '255');
    assert.equal(core.convertRadix('17000000000000000000', 10).hex, BigInt('17000000000000000000').toString(16));
    assert.throws(() => core.convertRadix('12', 2), (err) => err.code === 'invalid-number');
});

test('line diff marks inserts, deletes, and matching line endings', () => {
    const same = core.diffLines('a\nb\nc', 'a\r\nb\nc\n');
    assert.equal(same.added, 0);
    assert.equal(same.removed, 0);
    assert.deepEqual(same.rows.map((row) => row.type), ['same', 'same', 'same']);

    const changed = core.diffLines('a\nb\nc', 'a\nB\nc\nd');
    assert.equal(changed.removed, 1);
    assert.equal(changed.added, 2);
    assert.deepEqual(changed.rows.map((row) => row.type), ['same', 'remove', 'add', 'same', 'add']);
    assert.equal(changed.rows[2].text, 'B');

    assert.deepEqual(core.diffLines('', 'hi').rows, [{ type: 'add', text: 'hi' }]);
    assert.equal(core.diffLines('', '').rows.length, 0);
    assert.throws(() => core.diffLines(('x\n').repeat(401), 'y'), (err) => err.code === 'too-large');
});

test('identifier case conversion splits camel, acronyms, and separators', () => {
    assert.deepEqual(core.convertCase('userId'), {
        camel: 'userId',
        pascal: 'UserId',
        snake: 'user_id',
        kebab: 'user-id',
        constant: 'USER_ID'
    });
    assert.equal(core.convertCase('UserID').snake, 'user_id');
    assert.equal(core.convertCase('HTTPResponse').camel, 'httpResponse');
    assert.equal(core.convertCase('getHTTPResponseCode').pascal, 'GetHttpResponseCode');
    assert.equal(core.convertCase('XMLHttpRequest').kebab, 'xml-http-request');
    assert.equal(core.convertCase('  already-kebab_case  ').constant, 'ALREADY_KEBAB_CASE');
    assert.throws(() => core.convertCase('   '), (err) => err.code === 'empty');
    assert.throws(() => core.convertCase('---'), (err) => err.code === 'empty');
});

test('vendored js-yaml loads and rejects broken documents', () => {
    const yaml = require('./vendor/js-yaml.min.js');
    const doc = yaml.load('name: Cyt\ntools:\n  - timestamp\n');
    assert.equal(doc.name, 'Cyt');
    assert.deepEqual(doc.tools, ['timestamp']);
    assert.throws(() => yaml.load('a: [\n'));
    const dumped = yaml.dump({ b: 1, a: true }, { sortKeys: true, lineWidth: 80 });
    assert.match(dumped, /a: true/);
});
