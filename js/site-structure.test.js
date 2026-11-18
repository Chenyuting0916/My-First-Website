const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const personalPages = ['index.html', 'about.html', 'Portfolio.html', 'works.html', 'tools.html'];

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
    for (const name of personalPages) {
        assert.match(read(name), /href="tools\.html"/);
        assert.match(read(name), /data-i18n="nav\.tools"/);
    }
});

test('home, about, and the portfolio use one set of role facts', () => {
    const home = read('index.html');
    const about = read('about.html');
    for (const key of ['home.gogoroBody', 'home.japanBody', 'home.titansoftBody', 'home.schoolBody']) {
        assert.match(home, new RegExp(`data-i18n="${key}"`));
        assert.match(about, new RegExp(`data-i18n="${key}"`));
    }
});

test('home result titles match the portfolio case titles', () => {
    for (const lang of ['zh', 'en', 'ja']) {
        const data = JSON.parse(read('js/translations/' + lang + '.json'));
        assert.equal(data.home.result1Title, data.work.case1Title);
        assert.equal(data.home.result2Title, data.work.case2Title);
        assert.equal(data.home.result3Title, data.work.case3Title);
    }
});

const programIds = ['tools', 'discipline', 'twstock', 'timeminer', 'level'];

test('the portfolio and the works tree list the same programs in the same order', () => {
    function positions(html) {
        return programIds.map((id) => {
            const at = html.indexOf(`id="${id}"`);
            assert.ok(at >= 0, id);
            return at;
        });
    }
    const portfolio = positions(read('Portfolio.html'));
    const works = positions(read('works.html'));
    assert.deepEqual(portfolio, [...portfolio].sort((a, b) => a - b));
    assert.deepEqual(works, [...works].sort((a, b) => a - b));
    const worksHtml = read('works.html');
    for (const id of programIds) {
        assert.match(worksHtml, new RegExp(`href="Portfolio\\.html#${id}"`));
    }
});

test('the works tree opens each program, and the tools stay on this site', () => {
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

test('the tools page keeps its tool shell inside the shared site chrome', () => {
    const html = read('tools.html');
    assert.match(html, /class="tk-shell"/);
    assert.match(html, /id="relAmount"/);
    assert.match(html, /href="index\.html"/);
    assert.match(html, /href="about\.html"/);
    assert.match(html, /href="Portfolio\.html"/);
    assert.match(html, /href="works\.html"/);
    assert.equal(html.includes('tk-appbar'), false);
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
