# Project Rules — learn-agri-caribbean

## Hosting
- The site is hosted on **GitHub Pages** at `https://renocon.github.io/learn-agri-caribbean/`
- All web-served files live in the **`docs/`** directory (GitHub Pages source).
- `docs/index.html` is the landing page; each tool is a subfolder inside `docs/`.

## Tech stack
- Plain HTML + CSS + JS only. No npm, no build tools, no bundlers, no frameworks.
- CDN dependencies are allowed; always use the `.min` (minified) version.

## Site structure
- `docs/index.html` is the landing page — it lists and links to every tool.
- Each tool lives in its own subfolder under `docs/` (e.g. `docs/glossary/`, `docs/grow-box/`) as a **fully self-contained** mini-site with its own `index.html`.
- Self-contained means the subfolder works on its own if shared or opened directly.

## Compatibility requirement
- Every page must open correctly by **double-clicking the HTML file** (file:// protocol) AND when served from GitHub Pages or any basic static HTTP server.
- No server-side code. No fetch() calls to relative paths that break on file://.

## SEO — required on every page
This is a free public resource; discoverability is critical. Every HTML page must include:

**In `<head>`, after `<title>`:**
```html
<meta name="description" content="[unique 150-160 char description]">
<meta name="keywords" content="[relevant comma-separated keywords]">
<meta name="author" content="learn-agri-caribbean">
<link rel="canonical" href="https://renocon.github.io/learn-agri-caribbean/[path/]">

<meta property="og:type" content="website">
<meta property="og:url" content="https://renocon.github.io/learn-agri-caribbean/[path/]">
<meta property="og:title" content="[page title]">
<meta property="og:description" content="[same as meta description]">
<meta property="og:site_name" content="Learn Agri Caribbean">

<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="[page title]">
<meta name="twitter:description" content="[same as meta description]">

<script type="application/ld+json">{ /* page-appropriate schema.org JSON-LD */ }</script>
```

**Rules:**
- `<title>` format for tool pages: `[Tool Name] | Learn Agri Caribbean`
- Use `WebSite` schema on the home page; use `WebPage` + `EducationalAudience` on tool pages.
- Canonical URLs must be absolute and point to the GitHub Pages URL.
- Keep `docs/sitemap.xml` updated when adding tools.

## Disclaimer — required on every page
The site carries a legal disclaimer at `docs/disclaimer/index.html`. Every page **must** link to it.

- **Footer pattern for root-level pages** (e.g. `docs/index.html`):
  `<a href="disclaimer/index.html">Disclaimer</a>`
- **Footer pattern for tool pages** (e.g. `docs/glossary/index.html`):
  `<a href="../disclaimer/index.html">Disclaimer</a>`

The disclaimer page itself uses `<meta name="robots" content="noindex, follow">` and does not need to be added to `sitemap.xml`.

## When adding a new tool
1. Create `docs/<tool-name>/index.html` with full SEO head block.
2. Add a disclaimer link in the footer using the tool-page pattern above.
3. Add a card/link for it in `docs/index.html`.
4. Add a section for it in `README.md` (description + how to open/use).
5. Add the new URL to `docs/sitemap.xml`.

## Audience
- Primary: teachers using the site for classroom demos (projected screen, internet available).
- Design for clarity at projection resolution; prefer large text and high contrast.

## Tools
| Folder | Name | Status |
|--------|------|--------|
| `docs/glossary/` | Reference Glossary | ✅ Live |
| `docs/weedicide-calc/` | Weedicide Rate Calculator | ✅ Live |
| `docs/crop-calendar/` | Crop Calendar / Planner | Planned |
| `docs/grow-box/` | Grow Box Simulator | Planned |
| `docs/tomato-sim/` | Tomato Growth Simulator | Planned |
| `docs/nutrients/` | Nutrients Learning Tool | Future |
