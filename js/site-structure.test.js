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
    const footer = html.match(/<footer id="footer"[\s\S]*?<\/footer>/);
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

test('inner pages publish open graph and canonical urls', () => {
    const pages = {
        'about.html': 'https://chenyuting0916.github.io/My-First-Website/about.html',
        'Portfolio.html': 'https://chenyuting0916.github.io/My-First-Website/Portfolio.html',
        'works.html': 'https://chenyuting0916.github.io/My-First-Website/works.html'
    };
    for (const [name, url] of Object.entries(pages)) {
        const html = read(name);
        assert.match(html, new RegExp('property="og:url" content="' + url + '"'));
        assert.match(html, new RegExp('rel="canonical" href="' + url + '"'));
        assert.match(html, /property="og:title"/);
        assert.match(html, /property="og:description"/);
    }
    const tools = read('tools.html');
    assert.equal(tools.includes('og:'), false);
    assert.equal(tools.includes('rel="canonical"'), false);
});

test('lowercase portfolio url redirects to Portfolio.html', () => {
    const html = read('portfolio.html');
    assert.match(html, /url=Portfolio\.html/);
    assert.match(html, /src="js\/portfolio-redirect\.js"/);
    assert.match(read('js/portfolio-redirect.js'), /Portfolio\.html/);
    assert.equal(html.includes('id="footer"'), false);
    assert.equal(html.includes('checksum'), false);
});

test('tools page has a main heading and names the unlabeled controls', () => {
    const html = read('tools.html');
    assert.match(html, /<main\b[^>]*\bid="content"/);
    assert.match(html, /<h1\b[\s\S]*?<\/h1>/);
    const controls = {
        datePicker: 'dateToUnixTitle',
        weekDate: 'weekPickTitle',
        jsonInput: 'jsonInputLabel',
        jsonOutput: 'jsonOutputLabel',
        yamlInput: 'yamlInputLabel',
        yamlOutput: 'yamlOutputLabel',
        codecIn: 'codecInLabel',
        codecOut: 'codecOutLabel',
        urlIn: 'urlInLabel',
        urlOut: 'urlOutLabel',
        md5Text: 'md5TextLabel',
        jwtInput: 'jwtTitle',
        radixIn: 'radixTitle'
    };
    for (const [id, labelId] of Object.entries(controls)) {
        const tag = html.match(new RegExp('<(?:input|textarea)\\b[^>]*\\bid="' + id + '"[^>]*>'));
        assert.ok(tag, id);
        assert.match(tag[0], new RegExp('aria-labelledby="' + labelId + '"'));
        assert.match(html, new RegExp('\\bid="' + labelId + '"'));
    }
});

test('style.css does not remove the keyboard focus outline', () => {
    const css = read('css/style.css');
    assert.match(css, /a:focus:not\(:focus-visible\)/);
    assert.match(css, /\.navbar-custom \.nav li a:focus:not\(:focus-visible\)\s*\{[^}]*outline:\s*0/);
    assert.equal(/a:focus\s*\{[^}]*outline:\s*none/.test(css), false);
    assert.equal(/\.navbar-custom \.nav li a:focus\s*,\s*\.navbar-custom \.nav li a:active\s*\{[^}]*outline/.test(css), false);
});
