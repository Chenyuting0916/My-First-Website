const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'about.html', 'Portfolio.html', 'tools.html'];

function read(name) {
    return fs.readFileSync(path.join(root, name), 'utf8');
}

function navSignature(html) {
    const nav = html.match(/<nav class="navbar[\s\S]*?<\/nav>/);
    assert.ok(nav, 'page is missing the top navigation');
    return nav[0]
        .replace(/\saria-current="page"/g, '')
        .replace(/ class="nav-item active"/g, ' class="nav-item"')
        .replace(/\s+/g, ' ');
}

function footerHrefs(html) {
    const footer = html.match(/<nav id="footer"[\s\S]*?<\/nav>/);
    assert.ok(footer, 'page is missing the footer');
    return [...footer[0].matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

function flatten(value, prefix, out) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const key of Object.keys(value)) {
            flatten(value[key], prefix ? prefix + '.' + key : key, out);
        }
        return;
    }
    out.push(prefix);
}

test('the four pages share one navigation and one footer', () => {
    const html = pages.map(read);
    const navs = html.map(navSignature);
    for (const nav of navs) {
        assert.equal(nav, navs[0]);
    }
    const footers = html.map(footerHrefs);
    for (const footer of footers) {
        assert.deepEqual(footer, footers[0]);
    }
    assert.deepEqual(footers[0], [
        'https://github.com/Chenyuting0916',
        'https://www.linkedin.com/in/yuting-chen-63738b135/',
        'mailto:tim376755000@gmail.com'
    ]);
});

test('zh, en, and ja use the same translation keys', () => {
    const langs = ['zh', 'en', 'ja'].map((lang) => {
        const keys = [];
        flatten(JSON.parse(read('js/translations/' + lang + '.json')), '', keys);
        return keys.sort();
    });
    assert.deepEqual(langs[1], langs[0]);
    assert.deepEqual(langs[2], langs[0]);
});
