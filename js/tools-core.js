/* Offline helpers for the tools page. No network. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ToolsCore = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    function fail(code, detail) {
        const err = new Error(detail || code);
        err.code = code;
        err.detail = detail || '';
        return err;
    }

    function toBytes(input) {
        if (input instanceof Uint8Array) return input;
        if (typeof input === 'string') return new TextEncoder().encode(input);
        throw fail('invalid-input');
    }

    function md5(input) {
        const bytes = toBytes(input);

        function add(a, b) {
            return (a + b) >>> 0;
        }

        function rotl(x, n) {
            return (x << n) | (x >>> (32 - n));
        }

        const s = [
            7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
            5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
            4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
            6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
        ];
        const K = new Uint32Array(64);
        for (let i = 0; i < 64; i++) {
            K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
        }

        const bitLen = bytes.length * 8;
        const padZeros = (64 - ((bytes.length + 1 + 8) % 64)) % 64;
        const total = bytes.length + 1 + padZeros + 8;
        const buf = new Uint8Array(total);
        buf.set(bytes);
        buf[bytes.length] = 0x80;
        const view = new DataView(buf.buffer);
        view.setUint32(total - 8, bitLen >>> 0, true);
        view.setUint32(total - 4, Math.floor(bitLen / 4294967296), true);

        let a0 = 0x67452301;
        let b0 = 0xefcdab89;
        let c0 = 0x98badcfe;
        let d0 = 0x10325476;

        for (let offset = 0; offset < buf.length; offset += 64) {
            const M = new Uint32Array(16);
            for (let j = 0; j < 16; j++) {
                M[j] = view.getUint32(offset + j * 4, true);
            }
            let A = a0;
            let B = b0;
            let C = c0;
            let D = d0;
            for (let i = 0; i < 64; i++) {
                let F;
                let g;
                if (i < 16) {
                    F = (B & C) | (~B & D);
                    g = i;
                } else if (i < 32) {
                    F = (D & B) | (~D & C);
                    g = (5 * i + 1) % 16;
                } else if (i < 48) {
                    F = B ^ C ^ D;
                    g = (3 * i + 5) % 16;
                } else {
                    F = C ^ (B | ~D);
                    g = (7 * i) % 16;
                }
                F = add(add(add(F >>> 0, A), K[i]), M[g]);
                A = D;
                D = C;
                C = B;
                B = add(B, rotl(F, s[i]));
            }
            a0 = add(a0, A);
            b0 = add(b0, B);
            c0 = add(c0, C);
            d0 = add(d0, D);
        }

        function wordToHex(n) {
            let hex = '';
            for (let i = 0; i < 4; i++) {
                hex += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
            }
            return hex;
        }

        return wordToHex(a0) + wordToHex(b0) + wordToHex(c0) + wordToHex(d0);
    }

    function bytesToHex(bytes, options) {
        const upper = options && options.upper;
        const spaced = options && options.spaced;
        const parts = [];
        for (let i = 0; i < bytes.length; i++) {
            parts.push(bytes[i].toString(16).padStart(2, '0'));
        }
        const hex = parts.join(spaced ? ' ' : '');
        return upper ? hex.toUpperCase() : hex;
    }

    function hexToBytes(input) {
        const hex = String(input).replace(/[\s:]/g, '');
        if (!hex) throw fail('empty');
        if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw fail('invalid-hex');
        const out = new Uint8Array(hex.length / 2);
        for (let i = 0; i < out.length; i++) {
            out[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return out;
    }

    function bytesToBinaryString(bytes) {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return bin;
    }

    function bytesToBase64(bytes, options) {
        const url = options && options.url;
        let b64 = btoa(bytesToBinaryString(bytes));
        if (url) {
            b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
        }
        return b64;
    }

    function base64ToBytes(input, options) {
        const url = options && options.url;
        let s = String(input).replace(/\s/g, '');
        if (!s) throw fail('empty');
        if (url) s = s.replace(/-/g, '+').replace(/_/g, '/');
        if (s.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(s)) throw fail('invalid-base64');
        const pad = s.length % 4;
        if (pad) s += '='.repeat(4 - pad);
        let bin;
        try {
            bin = atob(s);
        } catch (e) {
            throw fail('invalid-base64');
        }
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function transcode(input, from, to, options) {
        const text = String(input);
        if (!text.trim()) throw fail('empty');
        let bytes;
        if (from === 'text') bytes = new TextEncoder().encode(text);
        else if (from === 'hex') bytes = hexToBytes(text);
        else if (from === 'base64') bytes = base64ToBytes(text, { url: false });
        else if (from === 'base64url') bytes = base64ToBytes(text, { url: true });
        else throw fail('invalid-input');

        if (to === 'text') {
            try {
                return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            } catch (e) {
                throw fail('invalid-utf8');
            }
        }
        if (to === 'hex') return bytesToHex(bytes, options);
        if (to === 'base64') return bytesToBase64(bytes, { url: false });
        if (to === 'base64url') return bytesToBase64(bytes, { url: true });
        throw fail('invalid-input');
    }

    function decodeB64UrlString(part) {
        const bytes = base64ToBytes(part, { url: true });
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch (e) {
            throw fail('invalid-jwt');
        }
    }

    function decodeJwt(token) {
        let raw = String(token).trim();
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1).trim();
        }
        raw = raw.replace(/^bearer\s+/i, '');
        if (!raw) throw fail('empty');
        const parts = raw.split('.');
        if (parts.length < 2 || parts.length > 3 || parts.some((part) => part.length === 0 && parts.indexOf(part) < 2)) {
            throw fail('invalid-jwt');
        }
        let header;
        let payload;
        try {
            header = JSON.parse(decodeB64UrlString(parts[0]));
            payload = JSON.parse(decodeB64UrlString(parts[1]));
        } catch (e) {
            if (e.code === 'invalid-base64' || e.code === 'invalid-jwt') throw fail('invalid-jwt');
            throw fail('invalid-jwt', e.message);
        }
        if (!header || typeof header !== 'object' || Array.isArray(header)) throw fail('invalid-jwt');
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw fail('invalid-jwt');
        return {
            header: header,
            payload: payload,
            signature: parts[2] || '',
            signingInput: parts[0] + '.' + parts[1],
            token: parts.join('.')
        };
    }

    function parseBigInt(str) {
        const neg = str.startsWith('-');
        let digits = neg ? str.slice(1) : str;
        digits = digits.replace(/^0+(?=\d)/, '');
        if (!digits) digits = '0';
        const n = BigInt(digits);
        return neg ? -n : n;
    }

    function unitFromDigits(intStr) {
        const digits = intStr.replace('-', '').replace(/^0+(?=\d)/, '') || '0';
        const len = digits === '0' ? 1 : digits.length;
        if (len <= 10) return 's';
        if (len <= 13) return 'ms';
        if (len <= 16) return 'us';
        return 'ns';
    }

    function toMillis(intStr, fracStr, unit) {
        const neg = intStr.startsWith('-');
        const whole = (neg ? intStr.slice(1) : intStr).replace(/^0+(?=\d)/, '') || '0';
        const frac = fracStr || '';
        const coeffDigits = (whole + frac).replace(/^0+(?=\d)/, '') || '0';
        const coeff = BigInt(coeffDigits);
        const scale = 10n ** BigInt(frac.length);
        const factors = {
            s: [1000n, 1n],
            ms: [1n, 1n],
            us: [1n, 1000n],
            ns: [1n, 1000000n]
        };
        const factor = factors[unit];
        if (!factor) throw fail('invalid-number');
        const numer = coeff * factor[0];
        const denom = factor[1] * scale;
        const half = denom / 2n;
        let ms = (numer + half) / denom;
        if (neg) ms = -ms;
        const limit = 8640000000000000n;
        if (ms > limit || ms < -limit) throw fail('out-of-range');
        return ms;
    }

    function formatSecondsFromMs(ms) {
        const neg = ms < 0n;
        const abs = neg ? -ms : ms;
        const sec = abs / 1000n;
        const rem = abs % 1000n;
        let body = sec.toString();
        if (rem !== 0n) {
            body += '.' + rem.toString().padStart(3, '0').replace(/0+$/, '');
        }
        return neg ? '-' + body : body;
    }

    function parseTimestamp(raw, unit) {
        const cleaned = String(raw).trim().replace(/,/g, '').replace(/\s+/g, '');
        if (!cleaned) throw fail('empty');
        const match = cleaned.match(/^(-?\d+)(?:\.(\d+))?(ns|us|µs|μs|ms|s)?$/i);
        if (!match) throw fail('invalid-number');
        const intStr = match[1];
        const fracStr = match[2] || '';
        let suffix = (match[3] || '').toLowerCase();
        if (suffix === 'µs' || suffix === 'μs') suffix = 'us';
        let resolved = unit && unit !== 'auto' ? unit : (suffix || unitFromDigits(intStr));
        const ms = toMillis(intStr, fracStr, resolved);
        const asNumber = Number(ms);
        const date = new Date(asNumber);
        if (Number.isNaN(date.getTime())) throw fail('out-of-range');
        return {
            ms: ms,
            msNumber: asNumber,
            unit: resolved,
            secondsText: formatSecondsFromMs(ms),
            millisecondsText: ms.toString()
        };
    }

    function parseDateInput(raw) {
        const s = String(raw).trim();
        if (!s) throw fail('empty');
        if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
            const iso = s.replace(' ', 'T');
            const date = new Date(iso);
            if (Number.isNaN(date.getTime())) throw fail('invalid-date');
            const ms = BigInt(date.getTime());
            return {
                ms: ms,
                msNumber: date.getTime(),
                secondsText: formatSecondsFromMs(ms),
                millisecondsText: ms.toString()
            };
        }
        const match = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (!match) throw fail('invalid-date');
        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4] || 0),
            Number(match[5] || 0),
            Number(match[6] || 0),
            0
        );
        if (Number.isNaN(date.getTime()) || date.getFullYear() !== Number(match[1])) throw fail('invalid-date');
        const ms = BigInt(date.getTime());
        return {
            ms: ms,
            msNumber: date.getTime(),
            secondsText: formatSecondsFromMs(ms),
            millisecondsText: ms.toString()
        };
    }

    function relativeParts(targetMs, nowMs) {
        const delta = Number(targetMs) - Number(nowMs);
        const abs = Math.abs(delta);
        const sec = Math.round(abs / 1000);
        if (sec < 5) return { key: 'now' };
        const table = [
            ['year', 31536000],
            ['month', 2592000],
            ['day', 86400],
            ['hour', 3600],
            ['minute', 60],
            ['second', 1]
        ];
        for (let i = 0; i < table.length; i++) {
            if (sec >= table[i][1] || table[i][0] === 'second') {
                return {
                    key: delta >= 0 ? 'in' : 'ago',
                    unit: table[i][0],
                    n: Math.max(1, Math.floor(sec / table[i][1]))
                };
            }
        }
        return { key: 'now' };
    }

    function sortJson(value) {
        if (Array.isArray(value)) return value.map(sortJson);
        if (value && typeof value === 'object') {
            const out = {};
            const keys = Object.keys(value).sort();
            for (let i = 0; i < keys.length; i++) out[keys[i]] = sortJson(value[keys[i]]);
            return out;
        }
        return value;
    }

    function formatJson(text, options) {
        const raw = String(text);
        if (!raw.trim()) throw fail('empty');
        let value;
        try {
            value = JSON.parse(raw);
        } catch (e) {
            throw fail('invalid-json', e.message);
        }
        if (options && options.sort) value = sortJson(value);
        if (options && options.minify) return JSON.stringify(value);
        const indent = options && options.indent ? options.indent : 2;
        return JSON.stringify(value, null, indent);
    }

    function transformUrl(text, mode) {
        var raw = String(text);
        if (!raw) throw fail('empty');
        if (mode === 'encode') return encodeURIComponent(raw);
        if (mode === 'encode-uri') return encodeURI(raw);
        if (mode === 'decode') {
            try {
                return decodeURIComponent(raw.replace(/\+/g, ' '));
            } catch (e) {
                throw fail('invalid-url');
            }
        }
        throw fail('invalid-input');
    }

    function parseUrlInfo(text) {
        var raw = String(text).trim();
        if (!raw) return null;
        var info = { protocol: '', host: '', pathname: '', params: [] };
        var query = '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
            var url;
            try {
                url = new URL(raw);
            } catch (e) {
                return null;
            }
            info.protocol = url.protocol;
            info.host = url.host;
            info.pathname = url.pathname;
            query = url.search.replace(/^\?/, '');
        } else if (raw.indexOf('=') >= 0) {
            var qPos = raw.indexOf('?');
            if (qPos >= 0) {
                info.pathname = raw.slice(0, qPos);
                query = raw.slice(qPos + 1);
            } else {
                query = raw.replace(/^\?/, '');
            }
        } else {
            return null;
        }
        if (!query) return info;
        query.split('&').forEach(function (part) {
            if (!part) return;
            var eq = part.indexOf('=');
            var key = eq >= 0 ? part.slice(0, eq) : part;
            var value = eq >= 0 ? part.slice(eq + 1) : '';
            try { key = decodeURIComponent(key.replace(/\+/g, ' ')); } catch (e) {}
            try { value = decodeURIComponent(value.replace(/\+/g, ' ')); } catch (e) {}
            info.params.push({ key: key, value: value });
        });
        return info;
    }

    function testRegex(pattern, flags, text) {
        if (!String(pattern)) throw fail('empty');
        var safeFlags = String(flags || '').replace(/[^gimsuy]/g, '');
        var scanFlags = safeFlags.indexOf('g') >= 0 ? safeFlags : safeFlags + 'g';
        var re;
        try {
            re = new RegExp(pattern, scanFlags);
        } catch (e) {
            throw fail('invalid-regex', e.message);
        }
        var matches = [];
        var found;
        var guard = 0;
        while ((found = re.exec(String(text))) && guard < 200) {
            matches.push({
                index: found.index,
                value: found[0],
                groups: found.slice(1)
            });
            if (found[0] === '') re.lastIndex += 1;
            guard += 1;
        }
        return matches;
    }

    function convertRadix(text, fromBase) {
        var raw = String(text).trim().replace(/[\s_]/g, '');
        if (!raw) throw fail('empty');
        var neg = raw.charAt(0) === '-';
        if (neg || raw.charAt(0) === '+') raw = raw.slice(1);
        var base = Number(fromBase);
        if (base === 16 && /^0x/i.test(raw)) raw = raw.slice(2);
        if (base === 2 && /^0b/i.test(raw)) raw = raw.slice(2);
        if (base === 8 && /^0o/i.test(raw)) raw = raw.slice(2);
        if (!raw || !/^[0-9a-z]+$/i.test(raw)) throw fail('invalid-number');
        var digits = '0123456789abcdefghijklmnopqrstuvwxyz';
        for (var i = 0; i < raw.length; i++) {
            if (digits.indexOf(raw.charAt(i).toLowerCase()) >= base) throw fail('invalid-number');
        }
        var value;
        try {
            if (base === 16) value = BigInt('0x' + raw);
            else if (base === 2) value = BigInt('0b' + raw);
            else if (base === 8) value = BigInt('0o' + raw);
            else if (base === 10) value = BigInt(raw);
            else throw fail('invalid-number');
        } catch (e) {
            throw fail('invalid-number');
        }
        if (neg) value = -value;
        function write(baseOut) {
            var n = value < 0n ? -value : value;
            if (n === 0n) return value < 0n ? '-0' : '0';
            var alphabet = '0123456789abcdef';
            var out = '';
            var b = BigInt(baseOut);
            while (n > 0n) {
                out = alphabet[Number(n % b)] + out;
                n = n / b;
            }
            return value < 0n ? '-' + out : out;
        }
        return { bin: write(2), oct: write(8), dec: write(10), hex: write(16) };
    }

    async function verifyJwtHmac(decoded, secret) {
        const alg = decoded && decoded.header ? decoded.header.alg : '';
        const hashes = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
        const hash = hashes[alg];
        if (!hash) throw fail('unsupported-alg', alg || '');
        if (!decoded.signature) throw fail('no-signature');
        if (!secret) throw fail('empty-secret');
        const subtle = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle : null;
        if (!subtle) throw fail('no-webcrypto');
        const key = await subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: hash },
            false,
            ['verify']
        );
        const signature = base64ToBytes(decoded.signature, { url: true });
        return subtle.verify('HMAC', key, signature, new TextEncoder().encode(decoded.signingInput));
    }

    return {
        md5: md5,
        bytesToHex: bytesToHex,
        hexToBytes: hexToBytes,
        bytesToBase64: bytesToBase64,
        base64ToBytes: base64ToBytes,
        transcode: transcode,
        decodeJwt: decodeJwt,
        verifyJwtHmac: verifyJwtHmac,
        parseTimestamp: parseTimestamp,
        parseDateInput: parseDateInput,
        relativeParts: relativeParts,
        formatJson: formatJson,
        sortJson: sortJson,
        transformUrl: transformUrl,
        parseUrlInfo: parseUrlInfo,
        testRegex: testRegex,
        convertRadix: convertRadix
    };
});
