# Project Rules — learn-agri-caribbean

## Tech stack
- Plain HTML + CSS + JS only. No npm, no build tools, no bundlers, no frameworks.
- CDN dependencies are allowed; always use the `.min` (minified) version.

## Site structure
- `index.html` at the root is the landing page — it lists and links to every tool.
- Each tool lives in its own subfolder (e.g. `/glossary/`, `/grow-box/`) as a **fully self-contained** mini-site with its own `index.html`.
- Self-contained means the subfolder works on its own if shared or opened directly.

## Compatibility requirement
- Every page must open correctly by **double-clicking the HTML file** (file:// protocol) AND from a basic static HTTP server.
- No server-side code. No fetch() calls to relative paths that break on file://.

## When adding a new tool
1. Create the subfolder with a self-contained `index.html`.
2. Add a card/link for it in the root `index.html`.
3. Add a section for it in `README.md` (description + how to open/use).

## Audience
- Primary: teachers using the site for classroom demos (projected screen, internet available).
- Design for clarity at projection resolution; prefer large text and high contrast.

## Tools planned
| Folder | Name |
|--------|------|
| `/glossary/` | Reference Glossary |
| `/crop-calendar/` | Crop Calendar / Planner |
| `/grow-box/` | Grow Box Simulator |
| `/tomato-sim/` | Tomato Growth Simulator |
