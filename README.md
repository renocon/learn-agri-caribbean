# learn-agri-caribbean

Free interactive tools for **CSEC Agricultural Science** and **CVQ Level 1 — Crop Production (Grow Box Operations)**.

**Live site:** https://renocon.github.io/learn-agri-caribbean/

Designed for classroom demos: no server required, no install, no build step. Works offline by double-clicking any HTML file.

---

## How to use

### Online
Visit **https://renocon.github.io/learn-agri-caribbean/** — no setup needed.

### Run locally

**Option A — double-click**
Open `docs/index.html` directly in any modern browser. All tools work from the filesystem (`file://`).

**Option B — local static server**
```bash
# Python 3
python3 -m http.server 8080 --directory docs

# Node (npx)
npx serve docs
```
Then open `http://localhost:8080`.

---

## Available tools

### Reference Glossary — `docs/glossary/`
**Live:** https://renocon.github.io/learn-agri-caribbean/glossary/

- 110 searchable definitions across 9 categories: Plant Biology, Soil & Growing Media, Crop Management, Nutrients & Fertilizers, Pests & Diseases, Propagation, Irrigation & Water, Grow Box, Caribbean Agriculture
- Instant search — filters term names and definitions as you type, with highlighted matches
- Category filter pills to narrow by topic
- Projection-friendly: large text, high contrast

### Weedicide Rate Calculator — `docs/weedicide-calc/`
**Live:** https://renocon.github.io/learn-agri-caribbean/weedicide-calc/

- Enter a label rate (mL/ha or L/ha) and your garden area (m² or sq ft)
- Choose your sprayer: spray bottle, hand-pump, or knapsack — with editable tank size
- Outputs per-tank concentrate amount with kitchen teaspoon/tablespoon equivalents
- Handles full tanks + a partial last tank automatically
- One-time safety acknowledgement modal; safety reminders shown with every result
- Advanced setting: adjust spray coverage rate (default 300 L/ha)

---

## Project structure

```
learn-agri-caribbean/
├── docs/                   ← GitHub Pages source (all web files live here)
│   ├── index.html          ← landing page
│   ├── robots.txt
│   ├── sitemap.xml
│   └── <tool-name>/
│       └── index.html      ← each tool is self-contained
├── README.md
├── CLAUDE.md               ← project conventions for AI-assisted development
└── LICENSE
```

## Planned tools

| Tool | Path | Description |
|------|------|-------------|
| Reference Glossary | `docs/glossary/` | Searchable CSEC/CVQ terms and definitions |
| Crop Calendar | `docs/crop-calendar/` | Visual planting timeline for the Caribbean climate |
| Grow Box Simulator | `docs/grow-box/` | Layout and planning tool for grow box operations |
| Tomato Growth Simulator | `docs/tomato-sim/` | Stage-by-stage plant growth with disease demo and autoplay |

---

## Contributing

Each tool is a single self-contained folder with one `index.html`. No build tools, no npm. See [CLAUDE.md](CLAUDE.md) for full project conventions.

## License

See [LICENSE](LICENSE).
