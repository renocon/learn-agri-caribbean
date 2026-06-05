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

*No tools added yet — check back soon.*

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
