const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const personalPages = ['index.html', 'about.html', 'Portfolio.html', 'works.html'];

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

test('the personal pages share one navigation and one footer', () => {
    const html = personalPages.map(read);
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
    for (const name of ['index.html', 'about.html', 'Portfolio.html']) {
        assert.equal(read(name).includes('tools.html'), false);
    }
});

test('the works tree is the only personal page that opens the tools', () => {
    const html = read('works.html');
    assert.match(html, /href="tools\.html"/);
    assert.match(html, /href="https:\/\/disciplineapp\.azurewebsites\.net\/"/);
    assert.match(html, /href="https:\/\/github\.com\/Chenyuting0916\/DisciplineApp"/);
    assert.match(html, /href="https:\/\/github\.com\/Chenyuting0916\/TwStock"/);
    assert.match(html, /href="https:\/\/timeminer\.azurewebsites\.net\/"/);
    assert.match(html, /href="https:\/\/github\.com\/Chenyuting0916\/MinerMVC"/);
    assert.match(html, /href="https:\/\/github\.com\/Chenyuting0916\/Level"/);
    const toolLink = html.match(/<a[^>]*href="tools\.html"[^>]*>/);
    assert.ok(toolLink);
    assert.equal(/target=/.test(toolLink[0]), false);
});

test('the tools page does not link back to the personal site', () => {
    const html = read('tools.html');
    assert.equal(html.includes('index.html'), false);
    assert.equal(html.includes('about.html'), false);
    assert.equal(html.includes('Portfolio.html'), false);
    assert.equal(html.includes('works.html'), false);
    assert.equal(html.includes('Tim Chen'), false);
    assert.equal(html.includes('github.com/Chenyuting0916'), false);
    assert.equal(html.includes('linkedin.com'), false);
    assert.equal(html.includes('tim376755000'), false);
    assert.equal(html.includes('id="footer"'), false);
    assert.match(html, /class="tk-appbar"/);
    assert.match(html, /id="relAmount"/);
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
