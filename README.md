# Tim Chen — Portfolio & Developer Tools

個人網站：後端工程師 Tim Chen（陳昱廷／Yu-Ting Chen）的介紹、工作案例，以及在瀏覽器裡運算的開發工具。

Live site: [https://chenyuting0916.github.io/My-First-Website/](https://chenyuting0916.github.io/My-First-Website/)  
Tools: [https://chenyuting0916.github.io/My-First-Website/tools.html](https://chenyuting0916.github.io/My-First-Website/tools.html)

This repository is a static site. It introduces a C#/.NET backend engineer and hosts small developer utilities. The site itself is not a .NET application.

## What is included

- **Home** (`index.html`): role, three scoped results, short case links, experience, skills, and contact.
- **About** (`about.html`): how Tim works, Japanese language study and JLPT N1, and an engineering reading group.
- **Work** (`Portfolio.html`): de-identified work cases, then earlier side projects and student work. The filename is case-sensitive.
- **Tools** (`tools.html`): utilities that calculate in the browser after the page has loaded.
- **Languages**: Traditional Chinese (default), English, and Japanese. Copy lives in `js/translations/`.

| Tool | What it does |
| --- | --- |
| Timestamp | Unix time and local/UTC dates. Units are inferred from digit length. |
| JSON | Format, minify, sort keys, and validate. |
| YAML | Check a document and convert to or from JSON, using vendored js-yaml 4.1.0. |
| Hash | MD5 (local implementation) and SHA-256 (`crypto.subtle`) for text and files. MD5 here is a checksum, not a password hash. |
| Encoding | Text, Base64, Base64URL, and hex. |
| JWT | Decode header/payload and verify HMAC signatures for HS256, HS384, and HS512 only. This is not an application authorization check. |
| URL | Encode, decode, and list query parameters. |
| UUID | Random UUID v4 via `crypto.randomUUID`. |
| Regex | Find matches. The scan is always global; `i` and `m` can be toggled. |
| Radix | Convert an integer among base 2, 8, 10, and 16 with `BigInt`. |

Tool inputs are not sent to a remote calculator. Loading the site still requests HTML, CSS, JavaScript, and translation JSON. There is no service worker, so the first visit is not an offline or PWA experience.

## Tech stack

HTML, CSS, and JavaScript, with local copies of Bootstrap 4, jQuery 3.4.1, and Font Awesome. YAML parsing uses `js/vendor/js-yaml.min.js` (MIT). There is no bundler and no `package.json`. Python is only a way to preview the files; it is not the site runtime.

## Run locally

```bash
git clone https://github.com/Chenyuting0916/My-First-Website.git
cd My-First-Website
python3 -m http.server 8000
```

On Windows, if `python3` is not on the path:

```bash
py -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/) and [http://localhost:8000/tools.html](http://localhost:8000/tools.html). Translations are loaded with `fetch`, so opening an HTML file directly will not switch languages reliably.

## Validation

Previewing the site needs Python (or any static file server). Running the tool tests needs Node.js. No minimum version or coverage number is recorded here.

```bash
node --test js/tools-core.test.js
```

When changing copy or layout, also check the four pages in Traditional Chinese, English, and Japanese, the collapsed navigation on a narrow viewport, the main links, and one action in each tool.

## Project structure

| Path | Role |
| --- | --- |
| `index.html`, `about.html`, `Portfolio.html`, `tools.html` | Pages. Keep the `Portfolio.html` capitalization. |
| `css/site.css`, `css/tools.css`, `css/style.css` | Shared page chrome, tool layout, and older base styles. |
| `js/i18n.js` | Loads a translation file and updates `data-i18n` nodes. |
| `js/translations/zh.json`, `en.json`, `ja.json` | Visible copy. |
| `js/tools-core.js` | Tool calculations, covered by `js/tools-core.test.js`. |
| `js/tools.js` | Tool page behavior. |
| `js/vendor/js-yaml.min.js` | Vendored YAML library. |

Personal facts, dates, and metrics must match across the three language files. The default HTML text is Traditional Chinese so the page is still readable if translations fail to load.

A new tool needs a calculation in `js/tools-core.js`, a test in `js/tools-core.test.js`, UI in `tools.html` and `js/tools.js`, and strings in all three translation files.

## Hosting

The public project site is [https://chenyuting0916.github.io/My-First-Website/](https://chenyuting0916.github.io/My-First-Website/). Links inside the site are relative, which fits the `/My-First-Website/` path. On 2026-10-06 the GitHub Pages API reported source branch `master` and folder `/`, and a push to `master` produced a successful Pages build. Current settings are under the repository’s Settings → Pages. The root `.nojekyll` file only tells Pages not to run Jekyll; it does not by itself choose the branch.

The professional pages do not load advertising. Tool inputs are not uploaded for processing.

## Author

- GitHub: [Chenyuting0916](https://github.com/Chenyuting0916)
- LinkedIn: [Yu-Ting Chen](https://www.linkedin.com/in/yuting-chen-63738b135/)
- Email: [tim376755000@gmail.com](mailto:tim376755000@gmail.com)

js-yaml is MIT, as marked in `js/vendor/js-yaml.min.js`. This repository does not add a project-wide license.
