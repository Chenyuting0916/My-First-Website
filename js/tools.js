(function () {
    var core = window.ToolsCore;
    var TOOLS = ['timestamp', 'json', 'yaml', 'md5', 'codec', 'jwt'];
    var JSON_SAMPLE = '{"name":"Cyt","ok":true,"tools":["timestamp","json","yaml"]}';
    var YAML_SAMPLE = 'name: Cyt\nrole: engineer\ntools:\n  - timestamp\n  - json\n  - yaml\nactive: true\n';
    var YAML_BAD = 'name: Cyt\ntools: [\n';
    var JWT_VALID = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkN5dCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo0MTAyNDQ0ODAwfQ.90v3uD-D8KsofR_uE6VNqrk6n_zUHXUHEm5Hylr9uDw';
    var JWT_EXPIRED = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkN5dCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIzfQ.YF6G-VZUtTAL27p6J0SUn98ix0NCBzvTlIMCAVEI8_E';
    var state = {
        tool: 'timestamp',
        tsUnit: 'auto',
        jsonIndent: 2,
        file: null,
        jwt: null,
        jwtVerify: null,
        nowMs: 0
    };
    var toastTimer = 0;

    var ZH = {
        'tools.copied': '已複製',
        'tools.copyEmpty': '沒有可以複製的內容',
        'tools.copy': '複製',
        'tools.timestamp.unitLabel': '單位',
        'tools.timestamp.detected': '自動判斷為{unit}',
        'tools.timestamp.local': '本地',
        'tools.timestamp.utc': 'UTC',
        'tools.timestamp.iso': 'ISO',
        'tools.timestamp.weekday': '星期',
        'tools.timestamp.relative': '相對',
        'tools.timestamp.seconds': '秒',
        'tools.timestamp.milliseconds': '毫秒',
        'tools.timestamp.units.s': '秒',
        'tools.timestamp.units.ms': '毫秒',
        'tools.timestamp.units.us': '微秒',
        'tools.timestamp.units.ns': '奈秒',
        'tools.rel.now': '剛剛',
        'tools.rel.ago': '{n} {unit}前',
        'tools.rel.in': '{n} {unit}後',
        'tools.rel.units.second': '秒',
        'tools.rel.units.minute': '分鐘',
        'tools.rel.units.hour': '小時',
        'tools.rel.units.day': '天',
        'tools.rel.units.month': '個月',
        'tools.rel.units.year': '年',
        'tools.json.valid': 'JSON 正確',
        'tools.yaml.valid': 'YAML 正確',
        'tools.yaml.emptyDoc': '這份 YAML 是空的',
        'tools.yaml.docs': '共 {count} 份文件，都正確',
        'tools.yaml.errorAt': '第 {line} 行、第 {column} 欄：{message}',
        'tools.md5.text': '文字',
        'tools.md5.file': '檔案',
        'tools.md5.sha': 'SHA-256',
        'tools.md5.working': '計算中…',
        'tools.md5.fileMeta': '{name} · {size}',
        'tools.jwt.verified': '簽章正確',
        'tools.jwt.invalidSig': '簽章不符',
        'tools.jwt.expired': '已過期',
        'tools.jwt.notYet': '尚未生效',
        'tools.jwt.valid': '有效',
        'tools.jwt.claimExp': '到期 exp',
        'tools.jwt.claimNbf': '生效 nbf',
        'tools.jwt.claimIat': '簽發 iat',
        'tools.jwt.showSecret': '顯示密鑰',
        'tools.jwt.hideSecret': '隱藏密鑰',
        'tools.errors.empty': '請先貼上內容',
        'tools.errors.invalid-number': '這不是時間戳。日期請用右邊的欄位。',
        'tools.errors.invalid-date': '沒辦法讀這個日期。可以試 2024-01-02 15:04:05',
        'tools.errors.invalid-hex': 'Hex 格式不對',
        'tools.errors.invalid-base64': 'Base64 格式不對',
        'tools.errors.invalid-utf8': '轉成文字時遇到不是 UTF-8 的位元組',
        'tools.errors.invalid-json': 'JSON 格式不對',
        'tools.errors.invalid-jwt': '這不像 JWT。需要 header.payload.signature 三段',
        'tools.errors.out-of-range': '這個時間超出可以表示的範圍',
        'tools.errors.unsupported-alg': '目前只驗證 HS256、HS384、HS512',
        'tools.errors.no-signature': '這個 token 沒有簽章',
        'tools.errors.empty-secret': '請輸入密鑰',
        'tools.errors.no-webcrypto': '這個環境不能驗證簽章',
        'tools.errors.generic': '沒辦法處理這份內容',
        'tools.errors.yaml-missing': 'YAML 解析器沒有載入'
    };

    function lang() {
        return (window.i18n && i18n.currentLang) || 'zh';
    }

    function t(key) {
        if (window.i18n && i18n.translations && i18n.t) {
            var value = i18n.t(key);
            if (value && value !== key) return value;
        }
        return ZH[key] || key;
    }

    function tf(key, vars) {
        return t(key).replace(/\{(\w+)\}/g, function (_, name) {
            return vars[name] == null ? '' : String(vars[name]);
        });
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function locale() {
        return { zh: 'zh-Hant', en: 'en', ja: 'ja' }[lang()] || 'zh-Hant';
    }

    function formatLocal(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
            pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function formatUtc(date) {
        return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) + ' ' +
            pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + ' UTC';
    }

    function weekday(date) {
        return new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(date);
    }

    function zoneLabel(date) {
        var tz = 'local';
        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
        } catch (e) {}
        var offset = -date.getTimezoneOffset();
        var sign = offset >= 0 ? '+' : '-';
        var abs = Math.abs(offset);
        return tz + ' (UTC' + sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60) + ')';
    }

    function relativeText(targetMs, nowMs) {
        var parts = core.relativeParts(targetMs, nowMs);
        if (parts.key === 'now') return t('tools.rel.now');
        var unit = t('tools.rel.units.' + parts.unit);
        if (lang() === 'en' && parts.n !== 1) unit += 's';
        return tf(parts.key === 'ago' ? 'tools.rel.ago' : 'tools.rel.in', { n: parts.n, unit: unit });
    }

    function errorText(err) {
        var code = err && err.code ? err.code : 'generic';
        var base = t('tools.errors.' + code);
        if (base === 'tools.errors.' + code) base = t('tools.errors.generic');
        if (err && err.detail && (code === 'invalid-json' || code === 'unsupported-alg')) {
            return base + (err.detail ? ' — ' + err.detail : '');
        }
        return base;
    }

    function toast(message) {
        var el = document.getElementById('tkToast');
        if (!el) return;
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1600);
    }

    function copyText(text) {
        var value = text == null ? '' : String(text);
        if (!value.trim() || value === '—') {
            toast(t('tools.copyEmpty'));
            return;
        }
        var done = function () { toast(t('tools.copied')); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(done).catch(function () {
                fallbackCopy(value);
                done();
            });
            return;
        }
        fallbackCopy(value);
        done();
    }

    function fallbackCopy(value) {
        var area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); } catch (e) {}
        area.remove();
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function setBanner(el, kind, message) {
        if (!el) return;
        if (!message) {
            el.hidden = true;
            el.className = 'tk-banner';
            el.textContent = '';
            return;
        }
        el.hidden = false;
        el.className = 'tk-banner ' + (kind || '');
        el.textContent = message;
    }

    function selectTool(id) {
        if (TOOLS.indexOf(id) < 0) id = 'timestamp';
        state.tool = id;
        document.querySelectorAll('[data-tool]').forEach(function (btn) {
            var on = btn.getAttribute('data-tool') === id;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('[data-panel]').forEach(function (panel) {
            panel.hidden = panel.getAttribute('data-panel') !== id;
        });
        if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    }

    function renderNow() {
        var now = new Date();
        state.nowMs = now.getTime();
        var sec = Math.floor(now.getTime() / 1000);
        var secEl = byId('nowSec');
        secEl.textContent = String(sec);
        secEl.dataset.raw = String(sec);
        secEl.dataset.ms = String(now.getTime());
        byId('nowLocal').textContent = formatLocal(now) + '\n' + weekday(now);
        byId('nowUtc').textContent = formatUtc(now);
        byId('nowIso').textContent = now.toISOString();
        byId('nowZone').textContent = zoneLabel(now);
    }

    function fillResult(el, rows) {
        el.replaceChildren();
        rows.forEach(function (row) {
            var line = document.createElement('div');
            line.className = 'tk-result-row';
            var label = document.createElement('span');
            label.textContent = row.label;
            var value = document.createElement('code');
            value.textContent = row.value;
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'tk-btn tiny';
            button.textContent = t('tools.copy');
            button.addEventListener('click', function () { copyText(row.value); });
            line.append(label, value, button);
            el.append(line);
        });
    }

    function timeRows(msNumber) {
        var date = new Date(msNumber);
        return [
            { label: t('tools.timestamp.local'), value: formatLocal(date) },
            { label: t('tools.timestamp.utc'), value: formatUtc(date) },
            { label: t('tools.timestamp.iso'), value: date.toISOString() },
            { label: t('tools.timestamp.weekday'), value: weekday(date) },
            { label: t('tools.timestamp.relative'), value: relativeText(msNumber, state.nowMs || Date.now()) },
            { label: t('tools.timestamp.seconds'), value: core.parseTimestamp(String(msNumber), 'ms').secondsText },
            { label: t('tools.timestamp.milliseconds'), value: String(msNumber) }
        ];
    }

    function renderTimestamp() {
        var input = byId('tsInput');
        var error = byId('tsError');
        var result = byId('tsResult');
        var hint = byId('tsHint');
        if (!input || !input.value.trim()) {
            setBanner(error, '', '');
            result.replaceChildren();
            hint.hidden = false;
            return;
        }
        hint.hidden = true;
        try {
            var parsed = core.parseTimestamp(input.value, state.tsUnit);
            setBanner(error, '', '');
            var unitName = t('tools.timestamp.units.' + parsed.unit);
            var rows = [{
                label: t('tools.timestamp.unitLabel'),
                value: state.tsUnit === 'auto' ? tf('tools.timestamp.detected', { unit: unitName }) : unitName
            }].concat(timeRows(parsed.msNumber).slice(0, 5), [
                { label: t('tools.timestamp.seconds'), value: parsed.secondsText },
                { label: t('tools.timestamp.milliseconds'), value: parsed.millisecondsText }
            ]);
            fillResult(result, rows);
        } catch (err) {
            result.replaceChildren();
            setBanner(error, 'err', errorText(err));
        }
    }

    function renderDate() {
        var input = byId('dateInput');
        var error = byId('dateError');
        var result = byId('dateResult');
        if (!input || !input.value.trim()) {
            setBanner(error, '', '');
            result.replaceChildren();
            return;
        }
        try {
            var parsed = core.parseDateInput(input.value);
            setBanner(error, '', '');
            var date = new Date(parsed.msNumber);
            fillResult(result, [
                { label: t('tools.timestamp.seconds'), value: parsed.secondsText },
                { label: t('tools.timestamp.milliseconds'), value: parsed.millisecondsText },
                { label: t('tools.timestamp.local'), value: formatLocal(date) },
                { label: t('tools.timestamp.utc'), value: formatUtc(date) },
                { label: t('tools.timestamp.iso'), value: date.toISOString() }
            ]);
        } catch (err) {
            result.replaceChildren();
            setBanner(error, 'err', errorText(err));
        }
    }

    function syncPicker(text) {
        var match = String(text).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (!match) return;
        byId('datePicker').value = match[1] + '-' + match[2] + '-' + match[3] + 'T' + match[4] + ':' + match[5] + ':' + (match[6] || '00');
    }

    function renderJsonStatus() {
        var input = byId('jsonInput');
        var banner = byId('jsonBanner');
        if (!input.value.trim()) {
            setBanner(banner, '', '');
            return;
        }
        try {
            JSON.parse(input.value);
            setBanner(banner, 'ok', t('tools.json.valid'));
        } catch (err) {
            setBanner(banner, 'err', errorText({ code: 'invalid-json', detail: err.message }));
        }
    }

    function runJson(mode) {
        var input = byId('jsonInput');
        var output = byId('jsonOutput');
        try {
            output.value = core.formatJson(input.value, {
                indent: state.jsonIndent,
                sort: byId('jsonSort').checked,
                minify: mode === 'minify'
            });
            renderJsonStatus();
        } catch (err) {
            output.value = '';
            setBanner(byId('jsonBanner'), 'err', errorText(err));
        }
    }

    function loadYamlDocs(text) {
        if (!window.jsyaml || !jsyaml.loadAll) {
            var missing = new Error('yaml');
            missing.code = 'yaml-missing';
            throw missing;
        }
        var docs = [];
        jsyaml.loadAll(text, function (doc) { docs.push(doc); });
        return docs;
    }

    function yamlMessage(err) {
        if (err && err.mark) {
            return {
                message: tf('tools.yaml.errorAt', {
                    line: err.mark.line + 1,
                    column: err.mark.column + 1,
                    message: err.reason || err.message
                }),
                snippet: err.mark.snippet || ''
            };
        }
        return { message: errorText(err), snippet: '' };
    }

    function setYamlBanner(kind, message, snippet) {
        var el = byId('yamlBanner');
        el.replaceChildren();
        if (!message) {
            el.hidden = true;
            el.className = 'tk-banner';
            return;
        }
        el.hidden = false;
        el.className = 'tk-banner ' + kind;
        el.append(document.createTextNode(message));
        if (snippet) {
            var pre = document.createElement('pre');
            pre.className = 'tk-snippet';
            pre.textContent = snippet;
            el.append(pre);
        }
    }

    function renderYamlStatus() {
        var text = byId('yamlInput').value;
        if (!text.trim()) {
            setYamlBanner('', '', '');
            return null;
        }
        try {
            var docs = loadYamlDocs(text);
            if (!docs.length || (docs.length === 1 && typeof docs[0] === 'undefined')) {
                setYamlBanner('info', t('tools.yaml.emptyDoc'), '');
            } else if (docs.length > 1) {
                setYamlBanner('ok', tf('tools.yaml.docs', { count: docs.length }), '');
            } else {
                setYamlBanner('ok', t('tools.yaml.valid'), '');
            }
            return docs;
        } catch (err) {
            var info = yamlMessage(err);
            setYamlBanner('err', info.message, info.snippet);
            return null;
        }
    }

    function dumpYaml(docs) {
        var parts = docs.map(function (doc) {
            return jsyaml.dump(doc, { indent: 2, lineWidth: 100, noRefs: true }).replace(/\n$/, '');
        });
        return parts.join('\n---\n') + (parts.length ? '\n' : '');
    }

    function runYaml(mode) {
        var input = byId('yamlInput').value;
        var output = byId('yamlOutput');
        if (mode === 'fromJson') {
            try {
                var value = JSON.parse(input);
                output.value = jsyaml.dump(value, { indent: 2, lineWidth: 100, noRefs: true });
                setYamlBanner('ok', t('tools.yaml.valid'), '');
            } catch (err) {
                output.value = '';
                setYamlBanner('err', errorText({ code: 'invalid-json', detail: err.message }), '');
            }
            return;
        }
        var docs = renderYamlStatus();
        if (!docs) {
            output.value = '';
            return;
        }
        if (mode === 'json') {
            var jsonValue = docs.length === 1 ? docs[0] : docs;
            output.value = typeof jsonValue === 'undefined' ? '' : JSON.stringify(jsonValue, null, 2);
            return;
        }
        if (mode === 'pretty') output.value = dumpYaml(docs);
    }

    function presentHash(hex) {
        if (!hex) return '';
        return byId('md5Upper').checked ? hex.toUpperCase() : hex.toLowerCase();
    }

    function hashRows(target, prefix, md5hex, shahex) {
        target.replaceChildren();
        [
            { label: 'MD5', value: presentHash(md5hex) },
            { label: t('tools.md5.sha'), value: presentHash(shahex) }
        ].forEach(function (row) {
            if (!row.value) return;
            var line = document.createElement('div');
            line.className = 'tk-hash-row';
            var label = document.createElement('span');
            label.textContent = prefix ? prefix + ' ' + row.label : row.label;
            var code = document.createElement('code');
            code.textContent = row.value;
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'tk-btn tiny';
            button.textContent = t('tools.copy');
            button.addEventListener('click', function () { copyText(row.value); });
            line.append(label, code, button);
            target.append(line);
        });
    }

    function sha256(bytes) {
        if (!window.crypto || !crypto.subtle) return Promise.resolve('');
        return crypto.subtle.digest('SHA-256', bytes).then(function (digest) {
            return core.bytesToHex(new Uint8Array(digest));
        }).catch(function () { return ''; });
    }

    function renderMd5Text() {
        var text = byId('md5Text').value;
        var bytes = new TextEncoder().encode(text);
        var md5hex = core.md5(bytes);
        hashRows(byId('md5TextHashes'), t('tools.md5.text'), md5hex, '');
        sha256(bytes).then(function (hex) {
            if (byId('md5Text').value !== text) return;
            hashRows(byId('md5TextHashes'), t('tools.md5.text'), md5hex, hex);
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function renderFileHashes() {
        var banner = byId('md5FileBanner');
        var target = byId('md5FileHashes');
        if (!state.file) {
            setBanner(banner, '', '');
            target.replaceChildren();
            return;
        }
        setBanner(banner, 'info', tf('tools.md5.fileMeta', { name: state.file.name, size: formatSize(state.file.size) }));
        hashRows(target, t('tools.md5.file'), state.file.md5, state.file.sha256);
    }

    function hashFile(file) {
        setBanner(byId('md5FileBanner'), 'info', t('tools.md5.working'));
        file.arrayBuffer().then(function (buffer) {
            var bytes = new Uint8Array(buffer);
            var md5hex = core.md5(bytes);
            state.file = { name: file.name, size: file.size, md5: md5hex, sha256: '' };
            renderFileHashes();
            return sha256(bytes);
        }).then(function (hex) {
            if (!state.file || state.file.name !== file.name || state.file.size !== file.size) return;
            state.file.sha256 = hex || '';
            renderFileHashes();
        }).catch(function () {
            setBanner(byId('md5FileBanner'), 'err', t('tools.errors.generic'));
        });
    }

    function renderCodec() {
        var input = byId('codecIn');
        var output = byId('codecOut');
        var banner = byId('codecBanner');
        if (!input.value.trim()) {
            output.value = '';
            setBanner(banner, '', '');
            return;
        }
        try {
            output.value = core.transcode(input.value, byId('codecFrom').value, byId('codecTo').value, {
                upper: byId('hexUpper').checked,
                spaced: byId('hexSpace').checked
            });
            setBanner(banner, '', '');
        } catch (err) {
            output.value = '';
            setBanner(banner, 'err', errorText(err));
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function highlightJson(value) {
        var json = JSON.stringify(value, null, 2);
        var re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
        var html = '';
        var last = 0;
        var match;
        while ((match = re.exec(json))) {
            html += escapeHtml(json.slice(last, match.index));
            var token = match[0];
            var cls = 'tok-num';
            if (token.charAt(0) === '"') cls = /:\s*$/.test(token) ? 'tok-key' : 'tok-str';
            else if (token === 'true' || token === 'false' || token === 'null') cls = 'tok-bool';
            html += '<span class="' + cls + '">' + escapeHtml(token) + '</span>';
            last = match.index + token.length;
        }
        html += escapeHtml(json.slice(last));
        return html;
    }

    function claimTime(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value * 1000;
        if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value) * 1000;
        return null;
    }

    function renderJwt() {
        var input = byId('jwtInput').value;
        var banner = byId('jwtBanner');
        var preview = byId('jwtPreview');
        if (!input.trim()) {
            state.jwt = null;
            setBanner(banner, '', '');
            preview.hidden = true;
            preview.textContent = '';
            byId('jwtHeader').textContent = '';
            byId('jwtPayload').textContent = '';
            byId('jwtSignature').textContent = '';
            byId('jwtClaims').replaceChildren();
            return;
        }
        try {
            var decoded = core.decodeJwt(input);
            state.jwt = decoded;
            setBanner(banner, '', '');
            var parts = decoded.token.split('.');
            preview.hidden = false;
            preview.replaceChildren();
            ['jwt-h', 'jwt-p', 'jwt-s'].forEach(function (cls, index) {
                if (index) preview.append(document.createTextNode('.'));
                var span = document.createElement('span');
                span.className = cls;
                span.textContent = parts[index] || '';
                preview.append(span);
            });
            byId('jwtHeader').innerHTML = highlightJson(decoded.header);
            byId('jwtPayload').innerHTML = highlightJson(decoded.payload);
            byId('jwtSignature').textContent = decoded.signature || '—';
            renderClaims(decoded.payload);
        } catch (err) {
            state.jwt = null;
            preview.hidden = true;
            byId('jwtHeader').textContent = '';
            byId('jwtPayload').textContent = '';
            byId('jwtSignature').textContent = '';
            byId('jwtClaims').replaceChildren();
            setBanner(banner, 'err', errorText(err));
        }
    }

    function renderClaims(payload) {
        var box = byId('jwtClaims');
        box.replaceChildren();
        var specs = [
            ['exp', 'tools.jwt.claimExp', 'exp'],
            ['nbf', 'tools.jwt.claimNbf', 'nbf'],
            ['iat', 'tools.jwt.claimIat', 'iat']
        ];
        specs.forEach(function (spec) {
            var ms = claimTime(payload[spec[0]]);
            if (ms == null) return;
            var date = new Date(ms);
            var line = document.createElement('div');
            line.className = 'tk-claim';
            var name = document.createElement('b');
            name.textContent = t(spec[1]);
            var text = document.createElement('span');
            text.textContent = formatLocal(date) + ' · ' + formatUtc(date) + ' · ' + relativeText(ms, Date.now());
            var pill = document.createElement('em');
            pill.className = 'tk-pill';
            var now = Date.now();
            if (spec[2] === 'exp') {
                pill.classList.add(ms < now ? 'bad' : 'ok');
                pill.textContent = ms < now ? t('tools.jwt.expired') : t('tools.jwt.valid');
            } else if (spec[2] === 'nbf') {
                pill.classList.add(ms > now ? 'wait' : 'ok');
                pill.textContent = ms > now ? t('tools.jwt.notYet') : t('tools.jwt.valid');
            } else {
                pill.classList.add('ok');
                pill.textContent = t('tools.jwt.valid');
            }
            line.append(name, text, pill);
            box.append(line);
        });
    }

    function paintVerify() {
        var banner = byId('jwtVerifyBanner');
        if (!state.jwtVerify) {
            setBanner(banner, '', '');
            return;
        }
        if (state.jwtVerify === 'ok') setBanner(banner, 'ok', t('tools.jwt.verified'));
        else if (state.jwtVerify === 'bad') setBanner(banner, 'err', t('tools.jwt.invalidSig'));
        else setBanner(banner, 'err', state.jwtVerify);
    }

    function verifyJwt() {
        if (!state.jwt) {
            renderJwt();
        }
        if (!state.jwt) return;
        core.verifyJwtHmac(state.jwt, byId('jwtSecret').value).then(function (ok) {
            state.jwtVerify = ok ? 'ok' : 'bad';
            paintVerify();
        }).catch(function (err) {
            state.jwtVerify = errorText(err);
            paintVerify();
        });
    }

    function loadJwtSample(token) {
        byId('jwtInput').value = token;
        if (!byId('jwtSecret').value) byId('jwtSecret').value = 'secret';
        state.jwtVerify = null;
        paintVerify();
        renderJwt();
    }

    function debounce(fn, ms) {
        var timer = 0;
        return function () {
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(null, args); }, ms);
        };
    }

    function bind() {
        document.querySelectorAll('[data-tool]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selectTool(btn.getAttribute('data-tool'));
            });
        });
        window.addEventListener('hashchange', function () {
            selectTool(location.hash.replace('#', ''));
        });

        byId('nowSec').addEventListener('click', function () { copyText(byId('nowSec').dataset.raw); });
        byId('copyNowSec').addEventListener('click', function () { copyText(byId('nowSec').dataset.raw); });
        byId('copyNowMs').addEventListener('click', function () { copyText(byId('nowSec').dataset.ms); });
        document.body.addEventListener('click', function (event) {
            var button = event.target.closest('[data-copy-from]');
            if (!button) return;
            var node = byId(button.getAttribute('data-copy-from'));
            if (node) copyText(node.value != null && (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') ? node.value : node.textContent);
        });

        byId('tsUnits').addEventListener('click', function (event) {
            var button = event.target.closest('[data-unit]');
            if (!button) return;
            state.tsUnit = button.getAttribute('data-unit');
            byId('tsUnits').querySelectorAll('[data-unit]').forEach(function (el) {
                el.classList.toggle('is-on', el === button);
            });
            renderTimestamp();
        });
        byId('tsInput').addEventListener('input', debounce(renderTimestamp, 80));
        byId('dateInput').addEventListener('input', debounce(function () {
            syncPicker(byId('dateInput').value);
            renderDate();
        }, 80));
        byId('datePicker').addEventListener('input', function () {
            if (!byId('datePicker').value) return;
            byId('dateInput').value = byId('datePicker').value.replace('T', ' ');
            renderDate();
        });
        byId('dateNow').addEventListener('click', function () {
            var now = new Date();
            byId('dateInput').value = formatLocal(now);
            syncPicker(byId('dateInput').value);
            renderDate();
        });

        byId('jsonFormat').addEventListener('click', function () { runJson('format'); });
        byId('jsonMinify').addEventListener('click', function () { runJson('minify'); });
        byId('jsonSort').addEventListener('change', renderJsonStatus);
        byId('jsonIndent').addEventListener('click', function (event) {
            var button = event.target.closest('[data-indent]');
            if (!button) return;
            state.jsonIndent = Number(button.getAttribute('data-indent'));
            byId('jsonIndent').querySelectorAll('[data-indent]').forEach(function (el) {
                el.classList.toggle('is-on', el === button);
            });
        });
        byId('jsonCopy').addEventListener('click', function () { copyText(byId('jsonOutput').value); });
        byId('jsonSample').addEventListener('click', function () {
            byId('jsonInput').value = JSON_SAMPLE;
            runJson('format');
        });
        byId('jsonClear').addEventListener('click', function () {
            byId('jsonInput').value = '';
            byId('jsonOutput').value = '';
            renderJsonStatus();
        });
        byId('jsonInput').addEventListener('input', debounce(renderJsonStatus, 120));
        byId('jsonInput').addEventListener('keydown', function (event) {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                runJson('format');
            }
        });

        byId('yamlCheck').addEventListener('click', renderYamlStatus);
        byId('yamlPretty').addEventListener('click', function () { runYaml('pretty'); });
        byId('yamlToJson').addEventListener('click', function () { runYaml('json'); });
        byId('yamlFromJson').addEventListener('click', function () { runYaml('fromJson'); });
        byId('yamlCopy').addEventListener('click', function () { copyText(byId('yamlOutput').value); });
        byId('yamlSample').addEventListener('click', function () {
            byId('yamlInput').value = YAML_SAMPLE;
            runYaml('pretty');
        });
        byId('yamlBadSample').addEventListener('click', function () {
            byId('yamlInput').value = YAML_BAD;
            byId('yamlOutput').value = '';
            renderYamlStatus();
        });
        byId('yamlClear').addEventListener('click', function () {
            byId('yamlInput').value = '';
            byId('yamlOutput').value = '';
            renderYamlStatus();
        });
        byId('yamlInput').addEventListener('input', debounce(renderYamlStatus, 150));

        byId('md5Text').addEventListener('input', debounce(renderMd5Text, 40));
        byId('md5Upper').addEventListener('change', function () {
            renderMd5Text();
            renderFileHashes();
        });
        var drop = byId('md5Drop');
        var fileInput = byId('md5File');
        drop.addEventListener('click', function () { fileInput.click(); });
        drop.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInput.click();
            }
        });
        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files[0]) hashFile(fileInput.files[0]);
        });
        ['dragenter', 'dragover'].forEach(function (name) {
            drop.addEventListener(name, function (event) {
                event.preventDefault();
                drop.classList.add('is-drag');
            });
        });
        drop.addEventListener('dragleave', function () { drop.classList.remove('is-drag'); });
        drop.addEventListener('drop', function (event) {
            event.preventDefault();
            drop.classList.remove('is-drag');
            var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (file) hashFile(file);
        });

        byId('codecFrom').addEventListener('change', renderCodec);
        byId('codecTo').addEventListener('change', renderCodec);
        byId('hexUpper').addEventListener('change', renderCodec);
        byId('hexSpace').addEventListener('change', renderCodec);
        byId('codecIn').addEventListener('input', debounce(renderCodec, 60));
        byId('codecCopy').addEventListener('click', function () { copyText(byId('codecOut').value); });
        byId('codecSwap').addEventListener('click', function () {
            var from = byId('codecFrom');
            var to = byId('codecTo');
            var current = from.value;
            from.value = to.value;
            to.value = current;
            if (byId('codecOut').value) byId('codecIn').value = byId('codecOut').value;
            renderCodec();
        });
        document.querySelectorAll('[data-preset]').forEach(function (button) {
            button.addEventListener('click', function () {
                var pair = button.getAttribute('data-preset').split(':');
                byId('codecFrom').value = pair[0];
                byId('codecTo').value = pair[1];
                renderCodec();
            });
        });

        byId('jwtInput').addEventListener('input', debounce(function () {
            state.jwtVerify = null;
            paintVerify();
            renderJwt();
        }, 80));
        byId('jwtSample').addEventListener('click', function () { loadJwtSample(JWT_VALID); });
        byId('jwtExpired').addEventListener('click', function () { loadJwtSample(JWT_EXPIRED); });
        byId('jwtClear').addEventListener('click', function () {
            byId('jwtInput').value = '';
            state.jwtVerify = null;
            paintVerify();
            renderJwt();
        });
        byId('jwtCopyHeader').addEventListener('click', function () {
            copyText(state.jwt ? JSON.stringify(state.jwt.header, null, 2) : '');
        });
        byId('jwtCopyPayload').addEventListener('click', function () {
            copyText(state.jwt ? JSON.stringify(state.jwt.payload, null, 2) : '');
        });
        byId('jwtCopySig').addEventListener('click', function () {
            copyText(state.jwt ? state.jwt.signature : '');
        });
        byId('jwtVerify').addEventListener('click', verifyJwt);
        byId('jwtToggleSecret').addEventListener('click', function () {
            var input = byId('jwtSecret');
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            byId('jwtToggleSecret').textContent = t(show ? 'tools.jwt.hideSecret' : 'tools.jwt.showSecret');
        });

        renderNow();
        setInterval(renderNow, 1000);
        renderMd5Text();
        selectTool(location.hash.replace('#', '') || 'timestamp');
    }

    document.addEventListener('i18n:updated', function () {
        renderNow();
        renderTimestamp();
        renderDate();
        renderJsonStatus();
        if (byId('yamlInput')) renderYamlStatus();
        renderMd5Text();
        renderFileHashes();
        renderCodec();
        renderJwt();
        paintVerify();
        var secretBtn = byId('jwtToggleSecret');
        if (secretBtn && byId('jwtSecret')) {
            secretBtn.textContent = t(byId('jwtSecret').type === 'password' ? 'tools.jwt.showSecret' : 'tools.jwt.hideSecret');
        }
    });

    document.addEventListener('DOMContentLoaded', bind);
})();
