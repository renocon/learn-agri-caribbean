# learn-agri-caribbean

Interactive web tools for **CSEC Agricultural Science** and **CVQ Level 1 — Crop Production (Grow Box Operations)**.

Designed for classroom demos: no server required, no install, no build step.

---

## How to run

**Option A — double-click**
Open `index.html` directly in any modern browser. All tools work from the filesystem (`file://`).

**Option B — basic static server**
```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```
Then open `http://localhost:8080`.

---

## Available tools

### Reference Glossary — `/glossary/`
Open `glossary/index.html` directly in a browser (double-click or serve from root).

- 110 terms across 9 categories: Plant Biology, Soil & Growing Media, Crop Management, Nutrients & Fertilizers, Pests & Diseases, Propagation, Irrigation & Water, Grow Box, Caribbean Agriculture
- Instant search — filters term names and definitions as you type, with highlighted matches
- Category filter pills to narrow by topic
- Designed for projection: large text, high contrast

---

## Project structure

```
learn-agri-caribbean/
├── index.html          ← landing page (links to all tools)
├── README.md
├── CLAUDE.md           ← project conventions for AI-assisted development
└── <tool-name>/
    └── index.html      ← each tool is self-contained in its subfolder
```

## Planned tools

| Tool | Folder | Description |
|------|--------|-------------|
| Reference Glossary | `/glossary/` | Searchable CSEC/CVQ terms and definitions |
| Crop Calendar | `/crop-calendar/` | Visual planting timeline for the Caribbean climate |
| Grow Box Simulator | `/grow-box/` | Layout and planning tool for grow box operations |
| Tomato Growth Simulator | `/tomato-sim/` | Stage-by-stage plant growth with disease demo and autoplay |

---

## License

See [LICENSE](LICENSE).
