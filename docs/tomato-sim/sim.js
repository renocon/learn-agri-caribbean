'use strict';
/* globals PP, STAGES, COMMON, BRANCHES, gsap */

/* =====================================================================
   Tomato Growth Simulator — drawing engine + app
   The plant is redrawn from a parameter object P. During stage changes,
   GSAP tweens a progress value and P is interpolated between the old and
   new stage, so the plant visibly grows (stem extends, fork emerges,
   leaves unfurl, fruits swell and change colour). Without GSAP (offline)
   stage changes are instant — everything still works.
   ===================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const W = 380, H = 500;
const BX = 190;   // stem base X
const SY = 355;   // soil surface Y
const LA = { R: 28, L: 152 };  // compound-leaf rachis attachment angles

const svg = document.getElementById('plantSvg');

function el(name, attrs, parent) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function linGrad(defs, id, stops, x1, y1, x2, y2) {
  const g = el('linearGradient', { id, x1, y1, x2, y2 }, defs);
  stops.forEach(s => el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] === undefined ? 1 : s[2] }, g));
}

function radGrad(defs, id, stops, cx, cy, r) {
  const g = el('radialGradient', { id, cx, cy, r }, defs);
  stops.forEach(s => el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] === undefined ? 1 : s[2] }, g));
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);

function mixHex(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

/* ================= Sympodial stem nodes (fractional-count aware) ===== */
function getNodes(stemH, ncF) {
  if (ncF <= 0.05) return [];
  const full = Math.floor(ncF), frac = ncF - full;
  const pts = [{ x: BX, y: SY }];
  for (let i = 1; i <= full; i++) {
    const t = i / ncF;
    const xOff = (i % 2 === 0 ? 5 : -5) * Math.min(t * 1.5, 1);
    pts.push({ x: BX + xOff, y: SY - stemH * t });
  }
  if (frac > 0.02) {
    // partially emerged top node — eases in as ncF grows
    const i = full + 1;
    pts.push({ x: BX + (i % 2 === 0 ? 5 : -5) * frac, y: SY - stemH });
  }
  return pts;
}

/* Y-fork: main stem rises to node FK then splits into two leaders.
   Leader A is the continuation of the main stem (leans left);
   leader B is the kept sucker grown into a second leader (leans right). */
function structure(P) {
  const nodes = getNodes(P.h, P.nc);
  const last = nodes.length - 1;
  const FK = Math.max(2, Math.round(P.nc * 0.5));
  let bNodes = null;
  if (P.fork > 0.02 && last > FK) {
    const f = nodes[FK];
    const hAbove = f.y - nodes[last].y;
    for (let i = FK + 1; i <= last; i++) {
      nodes[i].x -= P.fork * 20 * ((i - FK) / (last - FK));
    }
    const nb = last - FK;
    bNodes = [{ x: f.x, y: f.y }];
    for (let i = 1; i <= nb; i++) {
      const t = i / nb;
      bNodes.push({
        x: f.x + P.fork * (32 * t + (i % 2 ? -3 : 3) * Math.min(t * 2, 1)),
        y: f.y - P.fork * 0.92 * hAbove * t
      });
    }
  }
  return { nodes, bNodes, FK, last };
}

/* ================= Leaflet & fruit path generators =================== */
function leafletPath(len, w) {
  const w2 = w * 0.50;
  return `M 0 0
    C ${-w} ${-len*0.08} ${-w} ${-len*0.28} ${-w} ${-len*0.42}
    C ${-w} ${-len*0.58} ${-w2} ${-len*0.78} ${-w2*0.35} ${-len*0.91}
    C ${-w2*0.08} ${-len*0.97} 0 ${-len} 0 ${-len}
    C 0 ${-len} ${w2*0.08} ${-len*0.97} ${w2*0.35} ${-len*0.91}
    C ${w2} ${-len*0.78} ${w} ${-len*0.58} ${w} ${-len*0.42}
    C ${w} ${-len*0.28} ${w} ${-len*0.08} 0 0 Z`;
}

function fruitPath(cx, cy, r) {
  const w = r * 1.07, h = r, sh = r * 0.10;
  return [
    `M ${cx} ${cy-h+sh}`,
    `C ${cx+w*0.20} ${cy-h}  ${cx+w} ${cy-h*0.56} ${cx+w} ${cy}`,
    `C ${cx+w} ${cy+h*0.64}  ${cx+w*0.60} ${cy+h}  ${cx} ${cy+h}`,
    `C ${cx-w*0.60} ${cy+h}   ${cx-w} ${cy+h*0.64} ${cx-w} ${cy}`,
    `C ${cx-w} ${cy-h*0.56}  ${cx-w*0.20} ${cy-h}  ${cx} ${cy-h+sh}`,
    'Z'
  ].join(' ');
}

/* Compound leaf: rachis along +X carrying terminal, lateral and
   intercalary leaflets — the signature pinnately compound tomato leaf */
const LEAFLETS = [
  { x: 38,          r: 90,  len: 26, w: 11 },
  { x: 38 * 0.68,   r: 48,  len: 21, w: 9 },
  { x: 38 * 0.68,   r: 132, len: 21, w: 9 },
  { x: 38 * 0.38,   r: 44,  len: 16, w: 7 },
  { x: 38 * 0.38,   r: 136, len: 16, w: 7 },
  { x: 38 * 0.53,   r: 66,  len: 10, w: 4.5 },
  { x: 38 * 0.53,   r: 114, len: 10, w: 4.5 },
];

function compoundLeaf(parent, x, y, side, scale, fill, vein) {
  if (scale < 0.02) return;
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${LA[side]}) scale(${scale})` }, parent);
  el('path', { d: 'M 0 0 C 12 -2 26 -2 38 0', stroke: vein, 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, g);
  LEAFLETS.forEach(L => {
    const lg = el('g', { transform: `translate(${L.x} 0) rotate(${L.r})` }, g);
    el('path', { d: leafletPath(L.len, L.w), fill, stroke: vein, 'stroke-width': 0.5 }, lg);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -L.len * 0.8, stroke: vein, 'stroke-width': 0.8, opacity: 0.7 }, lg);
  });
}

/* ================= Parameter normalisation & interpolation =========== */
const FRUIT_COLS = {
  tg: ['#8ecc44', '#5ba022', '#2d6210'],
  mg: ['#76bc32', '#4e8c18', '#286010'],
  or: ['#fcd452', '#f97316', '#c2410c'],
  rd: ['#fc8a8a', '#dc2626', '#8b1212'],
};

const NUM_FIELDS = ['h', 'nW', 'nc', 'lc', 'cots', 'fls', 'seed', 'sk', 'fork', 'st2', 'lat', 'stress', 'severe', 'truss'];

function normalize(pp) {
  const fruits = [0, 1, 2].map(i => {
    const f = pp.fruits[i];
    return f ? { r: f.r, cols: FRUIT_COLS[f.cs].slice(), b: f.b } : null;
  });
  return {
    h: pp.h, nW: pp.nW, nc: pp.nc, lc: pp.lc,
    cots: pp.cots || 0, fls: pp.fls || 0, seed: pp.seed || 0,
    sk: pp.sk || 0, fork: pp.fork || 0, st2: pp.st2 || 0,
    lat: pp.lateral || 0, stress: pp.stress || 0, severe: pp.severe || 0,
    truss: pp.fruits.length ? 1 : 0,
    fruits
  };
}

function lerpP(A, B, t) {
  const o = {};
  NUM_FIELDS.forEach(k => { o[k] = lerp(A[k], B[k], t); });
  o.fruits = [0, 1, 2].map(i => {
    const a = A.fruits[i], b = B.fruits[i];
    if (!a && !b) return null;
    const cols = (a && b)
      ? a.cols.map((c, s) => mixHex(c, b.cols[s], t))
      : (a ? a.cols : b.cols);
    return {
      r: lerp(a ? a.r : 0.01, b ? b.r : 0.01, t),
      cols,
      b: lerp(a ? a.b : 0, b ? b.b : 0, t)
    };
  });
  return o;
}

function palette(P) {
  const leaf = mixHex('#4f9e2b', '#608a22', P.stress);
  const vein = mixHex('#3a7a1c', '#4a7218', P.stress);
  return {
    leaf, vein,
    leafLow: mixHex(leaf, '#909a28', P.severe),
    veinLow: mixHex(vein, '#6f7a1f', P.severe),
    stem: mixHex('#3e7c1f', '#5d8024', P.stress),
    node: mixHex('#346a18', '#4d6c1c', P.stress),
  };
}

/* ================= Static background (built once) ==================== */
let gStatic, gPlant;

function buildStatic() {
  gStatic = el('g', {}, svg);
  gPlant = el('g', {}, svg);

  const defs = el('defs', {}, gStatic);
  linGrad(defs, 'gSky', [['0%', '#5b9fd9'], ['100%', '#b8dcf2']], 0, 0, 0, 1);
  linGrad(defs, 'gWood', [['0%', '#a8743c'], ['100%', '#6e441d']], 0, 0, 0, 1);
  linGrad(defs, 'gSoil', [['0%', '#4a3018'], ['100%', '#221204']], 0, 0, 0, 1);
  radGrad(defs, 'berSoft', [['0%', '#1a0000'], ['55%', '#5c1c0c'], ['100%', '#5c1c0c', 0]], '50%', '50%', '50%');
  radGrad(defs, 'berHard', [['0%', '#030000'], ['35%', '#0d0000'], ['70%', '#3d1010'], ['100%', '#3d1010', 0]], '50%', '50%', '50%');

  // sky
  el('rect', { x: 0, y: 0, width: W, height: SY, fill: 'url(#gSky)' }, gStatic);
  // sun
  const sun = el('g', { stroke: '#ffd93b', 'stroke-width': 3, 'stroke-linecap': 'round' }, gStatic);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    el('line', {
      x1: 318 + Math.cos(a) * 30, y1: 60 + Math.sin(a) * 30,
      x2: 318 + Math.cos(a) * 41, y2: 60 + Math.sin(a) * 41
    }, sun);
  }
  el('circle', { cx: 318, cy: 60, r: 25, fill: '#ffd93b', stroke: '#f3c318', 'stroke-width': 1.5 }, gStatic);
  // clouds
  [[78, 78, 1], [160, 42, 0.8], [55, 150, 0.7]].forEach(c => {
    const g = el('g', { fill: '#fff', opacity: 0.85 }, gStatic);
    el('ellipse', { cx: c[0], cy: c[1], rx: 26 * c[2], ry: 10 * c[2] }, g);
    el('ellipse', { cx: c[0] + 18 * c[2], cy: c[1] + 4 * c[2], rx: 20 * c[2], ry: 8 * c[2] }, g);
    el('ellipse', { cx: c[0] - 16 * c[2], cy: c[1] + 5 * c[2], rx: 16 * c[2], ry: 7 * c[2] }, g);
  });
  // grow box
  el('rect', { x: 24, y: SY, width: 332, height: 140, rx: 3, fill: 'url(#gWood)', stroke: '#4a2f14', 'stroke-width': 2 }, gStatic);
  el('rect', { x: 31, y: SY + 5, width: 318, height: 128, fill: 'url(#gSoil)' }, gStatic);
  [SY + 47, SY + 94].forEach(y => {
    el('line', { x1: 26, y1: y, x2: 354, y2: y, stroke: '#4a2f14', 'stroke-width': 1.6, opacity: 0.5 }, gStatic);
  });
  [[60, 3, 7], [105, 5, 5], [150, 2, 6], [205, 4, 5], [250, 3, 7], [300, 5, 5], [330, 2, 4]].forEach(t => {
    el('ellipse', { cx: t[0], cy: SY + 7 + t[1], rx: t[2], ry: 2, fill: '#5a3c1e', opacity: 0.9 }, gStatic);
  });
}

/* ================= Plant drawing (rebuilt per frame) ================= */
function drawRoots(P) {
  const depth = Math.min(P.h * 0.40, 90);
  if (depth < 3) return;
  const g = el('g', { opacity: 0.36 * clamp(P.h / 14, 0, 1), stroke: '#ead9b4', fill: 'none', 'stroke-linecap': 'round' }, gPlant);
  el('line', { x1: BX, y1: SY + 5, x2: BX, y2: SY + 5 + depth, 'stroke-width': 2.4 }, g);
  const lats = [[0.14, -1, 0.92], [0.20, 1, 0.82], [0.36, -1, 0.74], [0.44, 1, 0.95],
                [0.58, -1, 0.62], [0.68, 1, 0.70], [0.80, -1, 0.46], [0.88, 1, 0.40]];
  lats.forEach(L => {
    const f = L[0], s = L[1], len = L[2];
    const y0 = SY + 5 + depth * f;
    const x1 = BX + s * depth * len * 0.95;
    const y1 = y0 + depth * (1 - f) * 0.45 + 5;
    el('path', { d: `M ${BX} ${y0} Q ${BX + s * depth * len * 0.5} ${y0 + 2} ${x1} ${y1}`, 'stroke-width': 1.3 }, g);
    el('circle', { cx: x1, cy: y1, r: 1.1, fill: '#ead9b4', stroke: 'none' }, g);
  });
  [[0.26, -1], [0.34, 1], [0.54, -1], [0.72, 1]].forEach(L => {
    const y0 = SY + 5 + depth * L[0];
    el('line', { x1: BX, y1: y0, x2: BX + L[1] * depth * 0.34, y2: y0 + depth * 0.16 + 3, 'stroke-width': 0.6 }, g);
  });
}

function drawOneStake(x, amt, tieFrom) {
  if (amt < 0.03) return;
  const yb = SY + 22, yt = SY - 285 * amt;
  const op = clamp(amt * 3, 0, 1);
  el('line', { x1: x, y1: yb, x2: x, y2: yt, stroke: '#c9a86b', 'stroke-width': 5.5, 'stroke-linecap': 'round', opacity: op }, gPlant);
  for (let y = yb - 20; y > yt + 8; y -= 38) {
    el('ellipse', { cx: x, cy: y, rx: 3.1, ry: 1.3, fill: '#9c7a44', opacity: op }, gPlant);
  }
  if (tieFrom) {
    el('path', { d: `M ${tieFrom.x} ${tieFrom.y} C ${tieFrom.x - (tieFrom.x - x) * 0.3} ${tieFrom.y + 6} ${x + (tieFrom.x - x) * 0.3} ${tieFrom.y + 6} ${x} ${tieFrom.y - 2}`,
      stroke: '#d9c08a', 'stroke-width': 1.5, fill: 'none', opacity: op }, gPlant);
  }
}

function drawStakes(P, S) {
  // stake 1 (left) supports the main stem / leader A
  const tie1 = P.h > 60 ? { x: BX - 2, y: SY - P.h * 0.52 } : null;
  drawOneStake(158, clamp(P.sk, 0, 1), tie1);
  // stake 2 (right) appears with the second leader
  const tie2 = (S.bNodes && S.bNodes.length > 2) ? { x: S.bNodes[2].x, y: S.bNodes[2].y } : null;
  drawOneStake(236, clamp(P.st2, 0, 1), tie2);
}

function stemPathD(pts) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], c = pts[i];
    const cpx = (a.x + c.x) / 2;
    d += ` C ${cpx} ${a.y} ${cpx} ${c.y} ${c.x} ${c.y}`;
  }
  return d;
}

function drawStem(P, S, pal) {
  const { nodes, bNodes } = S;
  if (nodes.length < 2) return;
  // main stem + leader A (one continuous sympodial zigzag path)
  el('path', { d: stemPathD(nodes), stroke: pal.stem, 'stroke-width': P.nW, fill: 'none', 'stroke-linecap': 'round' }, gPlant);
  for (let i = 1; i < nodes.length - 1; i++) {
    const r = P.nW * 0.85 * clamp((P.nc - i) * 1.2, 0, 1);
    if (r > 0.2) el('circle', { cx: nodes[i].x, cy: nodes[i].y, r, fill: pal.node }, gPlant);
  }
  // leader B — the kept sucker grown into a second stem
  if (bNodes && bNodes.length > 1) {
    el('path', { d: stemPathD(bNodes), stroke: pal.stem, 'stroke-width': P.nW * 0.8, fill: 'none', 'stroke-linecap': 'round' }, gPlant);
    for (let i = 1; i < bNodes.length - 1; i++) {
      const r = P.nW * 0.68 * clamp(P.fork * 2 - 0.5, 0, 1);
      if (r > 0.2) el('circle', { cx: bNodes[i].x, cy: bNodes[i].y, r, fill: pal.node }, gPlant);
    }
  }
}

function drawSucker(P, S, pal) {
  const amt = clamp(P.lat, 0, 1);
  if (amt < 0.03 || S.nodes.length < 3) return;
  const n = S.nodes[2];
  const g = el('g', { transform: `translate(${n.x} ${n.y}) scale(${amt})` }, gPlant);
  el('path', { d: 'M 0 0 C -9 -1 -17 -6 -26 -14', stroke: pal.stem, 'stroke-width': P.nW * 0.45, fill: 'none', 'stroke-linecap': 'round' }, g);
  compoundLeaf(g, -26, -14, 'L', 0.48, pal.leaf, pal.vein);
  compoundLeaf(g, -14, -5, 'L', 0.36, pal.leaf, pal.vein);
}

function leafAnchor(j, S) {
  const { nodes, bNodes, FK, last } = S;
  if (!bNodes || j < FK) {
    // lower main-stem leaves
    return { n: nodes[Math.min(j + 1, last)], side: j % 2 === 0 ? 'R' : 'L' };
  }
  if ((j - FK) % 2 === 0) {
    // leader A leaf — spreads outward left
    return { n: nodes[Math.min(last, FK + Math.max(1, Math.round((last - FK) * 0.55)))], side: 'L' };
  }
  // leader B leaf — spreads outward right
  return { n: bNodes[Math.max(1, Math.round((bNodes.length - 1) * 0.5))], side: 'R' };
}

function drawLeaves(P, S, pal) {
  if (S.nodes.length < 2) return;
  const count = Math.min(6, Math.ceil(P.lc - 0.02));
  for (let j = 0; j < count; j++) {
    const es = clamp(P.lc - j, 0, 1);
    if (es < 0.03) continue;
    const a = leafAnchor(j, S);
    if (!a.n) continue;
    const scale = (0.78 + 0.28 * j / 5) * es;
    const fill = j < 2 ? pal.leafLow : pal.leaf;
    const vein = j < 2 ? pal.veinLow : pal.vein;
    compoundLeaf(gPlant, a.n.x, a.n.y, a.side, scale, fill, vein);
  }
}

function drawCots(P, S) {
  const amt = clamp(P.cots, 0, 1);
  if (amt < 0.03 || S.nodes.length < 2) return;
  const t = S.nodes[S.last];
  const s = (0.85 + 0.3 * clamp(P.nc - 1, 0, 1)) * amt;
  // smooth oval cotyledons — deliberately distinct from compound true leaves
  el('ellipse', { cx: t.x - 8.5 * s, cy: t.y - 2, rx: 8.5 * s, ry: 3.4 * s, fill: '#5fae35',
    stroke: '#3f8a20', 'stroke-width': 0.7, transform: `rotate(-16 ${t.x - 8.5 * s} ${t.y - 2})` }, gPlant);
  el('ellipse', { cx: t.x + 8.5 * s, cy: t.y - 2, rx: 8.5 * s, ry: 3.4 * s, fill: '#5fae35',
    stroke: '#3f8a20', 'stroke-width': 0.7, transform: `rotate(16 ${t.x + 8.5 * s} ${t.y - 2})` }, gPlant);
}

function drawApexBud(P, S, pal) {
  const amt = (1 - clamp(P.cots, 0, 1)) * clamp(P.nc - 1.2, 0, 1);
  if (amt < 0.05 || S.nodes.length < 2) return;
  const tips = [S.nodes[S.last]];
  if (S.bNodes) tips.push(S.bNodes[S.bNodes.length - 1]);
  tips.forEach(t => {
    el('ellipse', { cx: t.x - 4.5, cy: t.y - 3.5, rx: 5.5 * amt, ry: 2.2 * amt, fill: pal.leaf, stroke: pal.vein,
      'stroke-width': 0.5, transform: `rotate(-38 ${t.x - 4.5} ${t.y - 3.5})` }, gPlant);
    el('ellipse', { cx: t.x + 4.5, cy: t.y - 3.5, rx: 5.5 * amt, ry: 2.2 * amt, fill: pal.leaf, stroke: pal.vein,
      'stroke-width': 0.5, transform: `rotate(38 ${t.x + 4.5} ${t.y - 3.5})` }, gPlant);
  });
}

function drawFlowerHead(parent, cx, cy, scale) {
  if (scale < 0.03) return;
  const g = el('g', { transform: `translate(${cx} ${cy}) scale(${scale})` }, parent);
  for (let k = 0; k < 5; k++) {
    el('path', {
      d: 'M 0 0 C 2.8 -2.2 3.6 -6.2 1.1 -9.5 C 0.4 -10.4 -0.4 -10.4 -1.1 -9.5 C -3.6 -6.2 -2.8 -2.2 0 0 Z',
      fill: '#FFE000', stroke: '#d6b400', 'stroke-width': 0.4, transform: `rotate(${k * 72})`
    }, g);
  }
  el('path', { d: 'M -2.4 -1 L 0 7.5 L 2.4 -1 Z', fill: '#cfe23a', stroke: '#9fb024', 'stroke-width': 0.5 }, g);
}

function drawFruitBody(defs, parent, cx, cy, f, idx) {
  const r = f.r;
  radGrad(defs, 'fgr' + idx, [['0%', f.cols[0]], ['55%', f.cols[1]], ['100%', f.cols[2]]], '35%', '28%', '80%');
  const clip = el('clipPath', { id: 'fcl' + idx }, defs);
  el('path', { d: fruitPath(cx, cy, r) }, clip);

  el('path', { d: fruitPath(cx, cy, r), fill: `url(#fgr${idx})`,
    stroke: 'rgba(30,40,10,0.45)', 'stroke-width': 0.6 }, parent);

  // specular highlight, upper-left
  el('ellipse', { cx: cx - r * 0.38, cy: cy - r * 0.38, rx: r * 0.34, ry: r * 0.20, fill: '#ffffff',
    opacity: 0.22, transform: `rotate(-28 ${cx - r * 0.38} ${cy - r * 0.38})` }, parent);

  // blossom end rot — starts at the blossom (bottom) end, grows upward
  if (f.b > 0.005) {
    const bg = el('g', { 'clip-path': `url(#fcl${idx})` }, parent);
    const br = r * (0.48 + f.b * 1.25);
    const hardO = clamp((f.b - 0.34) * 12, 0, 1);
    if (hardO < 1) el('circle', { cx, cy: cy + r * 0.44, r: br, fill: 'url(#berSoft)', opacity: 1 - hardO }, bg);
    if (hardO > 0) el('circle', { cx, cy: cy + r * 0.44, r: br, fill: 'url(#berHard)', opacity: hardO }, bg);
    const crackO = clamp((f.b - 0.30) * 8, 0, 1) * 0.85;
    if (crackO > 0.02) {
      const tipY = cy + r * 0.78;
      for (let k = 0; k < 7; k++) {
        const a = (-150 + k * 50) * Math.PI / 180;
        const len = r * (0.45 + (k % 3) * 0.13);
        el('line', { x1: cx, y1: tipY, x2: cx + Math.cos(a) * len, y2: tipY + Math.sin(a) * len * 0.7,
          stroke: '#2a0703', 'stroke-width': 0.7, opacity: crackO }, bg);
      }
    }
    const sunkO = clamp((f.b - 0.50) * 8, 0, 1) * 0.7;
    if (sunkO > 0.02) {
      el('ellipse', { cx, cy: cy + r * 0.74, rx: r * 0.46, ry: r * 0.20, fill: '#0a0202',
        opacity: sunkO, stroke: '#1d0703', 'stroke-width': 0.6 }, bg);
    }
  }

  // 5-sepal calyx at the stem (top) end
  const ty = cy - r + r * 0.10;
  const cal = el('g', { transform: `translate(${cx} ${ty})`, stroke: '#2f6e1a',
    'stroke-width': 1.4, 'stroke-linecap': 'round' }, parent);
  for (let k = 0; k < 5; k++) {
    const a = (k * 72 - 90) * Math.PI / 180;
    el('line', { x1: 0, y1: 0, x2: Math.cos(a) * r * 0.42, y2: Math.sin(a) * r * 0.26 + 1.5 }, cal);
  }
  el('circle', { cx: 0, cy: 0, r: Math.max(1.1, r * 0.10), fill: '#2f6e1a', stroke: 'none' }, cal);
}

/* Truss anchors: indeterminate tomatoes carry a flower/fruit truss at
   many axils, not one cluster. We distribute up to three trusses across
   the plant — one on the lower main stem, one on leader A, one on
   leader B — each hanging out to one side. Returns {x, y, dir}. */
function trussAnchors(S) {
  const { nodes, bNodes, FK, last } = S;
  const out = [];
  if (bNodes && bNodes.length > 2) {
    const low = nodes[Math.max(1, Math.min(FK - 1, 3))];       // lower main stem
    const aMid = nodes[Math.min(last, FK + Math.max(1, Math.round((last - FK) * 0.55)))]; // leader A
    const bMid = bNodes[Math.max(1, Math.round((bNodes.length - 1) * 0.5))];              // leader B
    out.push({ x: low.x, y: low.y, dir: 1 });    // hangs right
    out.push({ x: aMid.x, y: aMid.y, dir: -1 });  // hangs left
    out.push({ x: bMid.x, y: bMid.y, dir: 1 });   // hangs right
  } else if (last >= 1) {
    const a = nodes[Math.max(1, Math.round(0.66 * last))];
    out.push({ x: a.x, y: a.y, dir: 1 });
  }
  return out;
}

/* One truss at a node: short peduncle to a knuckle joint, then a single
   pedicel (with its own secondary joint) to either a flower or a fruit.
   dir = +1 hangs to the right, -1 to the left. */
function drawMiniTruss(parent, defs, anchor, dir, flowerScale, fruit, idx, pal) {
  const g = el('g', { transform: `translate(${anchor.x} ${anchor.y})` }, parent);
  const kx = dir * 16, ky = 18;  // knuckle joint position

  const hasFruit = fruit && fruit.r > 0.5;
  if (!hasFruit && flowerScale > 0.05) {
    const fg = el('g', { transform: `scale(${clamp(flowerScale, 0, 1)})` }, g);
    el('path', { d: `M 0 0 Q ${kx * 0.55} ${ky * 0.5} ${kx} ${ky}`, stroke: pal.stem,
      'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, fg);
    el('circle', { cx: kx, cy: ky, r: 2.6, fill: '#2d5a1b' }, fg);
    el('path', { d: `M ${kx} ${ky} q ${dir * 2} 6 0 9`, stroke: pal.stem, 'stroke-width': 1.5, fill: 'none' }, fg);
    drawFlowerHead(fg, kx, ky + 10, 1);
    return;
  }

  if (hasFruit) {
    el('path', { d: `M 0 0 Q ${kx * 0.55} ${ky * 0.55} ${kx} ${ky}`, stroke: pal.stem,
      'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: kx, cy: ky, r: 3, fill: '#2d5a1b' }, g);  // knuckle joint
    const r = fruit.r;
    const cy = ky + 13 + r;
    const calyxY = cy - r + r * 0.10;
    el('path', { d: `M ${kx} ${ky} Q ${kx + dir * 4} ${(ky + calyxY) / 2} ${kx} ${calyxY - 1.5}`,
      stroke: pal.stem, 'stroke-width': 2, fill: 'none' }, g);
    el('circle', { cx: kx + dir * 1.5, cy: (ky + calyxY) / 2 + 1, r: 1.7, fill: '#2d5a1b' }, g); // secondary joint
    drawFruitBody(defs, g, kx, cy, fruit, idx);
  }
}

function drawTruss(P, S, pal, defs) {
  const anchors = trussAnchors(S);
  if (!anchors.length) return;
  const n = Math.min(3, anchors.length);
  for (let i = 0; i < n; i++) {
    const flowerScale = clamp(P.fls - i, 0, 1);
    const fruit = P.fruits[i];
    const hasFruit = fruit && fruit.r > 0.5;
    if (flowerScale < 0.05 && !hasFruit) continue;
    drawMiniTruss(gPlant, defs, anchors[i], anchors[i].dir, flowerScale, fruit, i, pal);
  }
}

function drawSeed(P) {
  const amt = clamp(P.seed, 0, 1);
  if (amt < 0.03) return;
  el('ellipse', { cx: BX, cy: SY + 18, rx: 4.5, ry: 6, fill: '#d8b56a', stroke: '#8a6a30',
    'stroke-width': 1, opacity: amt, transform: `rotate(18 ${BX} ${SY + 18})` }, gPlant);
  el('circle', { cx: BX, cy: SY + 18, r: 13, fill: 'none', stroke: '#fff', 'stroke-width': 1.2,
    'stroke-dasharray': '3 3', opacity: 0.7 * amt }, gPlant);
}

function buildPlant(P) {
  while (gPlant.firstChild) gPlant.removeChild(gPlant.firstChild);
  const defs = el('defs', {}, gPlant);
  const pal = palette(P);
  const S = structure(P);
  drawRoots(P);
  drawStakes(P, S);
  drawStem(P, S, pal);
  drawSucker(P, S, pal);
  drawLeaves(P, S, pal);
  drawCots(P, S);
  drawApexBud(P, S, pal);
  drawTruss(P, S, pal, defs);
  drawSeed(P);
}

/* ================= Stage transitions ================================= */
const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = null;
let tween = null;
const prog = { t: 0 };

function showStage(id, instant) {
  const target = normalize(PP[id]);
  if (tween) { tween.kill(); tween = null; }
  if (instant || !window.gsap || prefersReduced || !current) {
    current = target;
    buildPlant(current);
    return;
  }
  const from = current;
  prog.t = 0;
  tween = gsap.to(prog, {
    t: 1, duration: 1.15, ease: 'power2.inOut',
    onUpdate() { current = lerpP(from, target, prog.t); buildPlant(current); },
    onComplete() { current = target; buildPlant(current); tween = null; }
  });
}

/* ================= App state & UI ==================================== */
const state = { idx: 0, branch: null };
let playTimer = null;

const stageNameEl = document.getElementById('stageName');
const stageMetaEl = document.getElementById('stageMeta');
const timelineEl = document.getElementById('timeline');
const cardsEl = document.getElementById('cards');
const branchPanelEl = document.getElementById('branchPanel');
const badgeEl = document.getElementById('branchBadge');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playBtn = document.getElementById('playBtn');

function currentPath() {
  return COMMON.concat(state.branch ? BRANCHES[state.branch] : []);
}
function currentStage() {
  return STAGES[currentPath()[state.idx]];
}

function renderHeader(stage) {
  stageNameEl.textContent = stage.name;
  let branchChip = '';
  if (stage.branch === 'healthy') branchChip = ' <span class="branch-chip healthy">✓ Healthy path</span>';
  if (stage.branch === 'ber') branchChip = ' <span class="branch-chip">⚠ BER path</span>';
  if (stage.isBranch) branchChip = ' <span class="branch-chip">⭑ Decision point</span>';
  stageMetaEl.innerHTML =
    '<span class="day-chip">' + stage.days + '</span>' +
    'Stage ' + (state.idx + 1) + ' of ' + currentPath().length + branchChip;
}

function renderTimeline() {
  timelineEl.innerHTML = '';
  currentPath().forEach((id, i) => {
    if (i === COMMON.length) {
      const sep = document.createElement('span');
      sep.className = 'tsep';
      sep.textContent = '›';
      timelineEl.appendChild(sep);
    }
    const dot = document.createElement('button');
    dot.type = 'button';
    let cls = 'dot';
    if (i < state.idx) cls += ' past';
    if (i === state.idx) cls += ' active';
    if (state.branch === 'ber' && i >= COMMON.length) cls += ' berdot';
    dot.className = cls;
    dot.title = STAGES[id].name + ' (' + STAGES[id].days + ')';
    dot.setAttribute('aria-label', STAGES[id].name);
    dot.addEventListener('click', () => { stopPlay(); state.idx = i; update(); });
    timelineEl.appendChild(dot);
  });
}

function card(title, body, extraClass) {
  return '<div class="card' + (extraClass ? ' ' + extraClass : '') + '"><h3>' + title + '</h3>' + body + '</div>';
}
function bullets(items) {
  return '<ul>' + items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
}

function renderCards(stage) {
  const berNote = stage.branch === 'ber' ? 'ber-note' : '';
  cardsEl.innerHTML =
    card('🌱 What is happening', '<p>' + stage.happening + '</p>', berNote) +
    card('🧑🏾‍🌾 Farmer actions', bullets(stage.actions)) +
    card('🔍 What to observe', bullets(stage.observe)) +
    card('🧪 Nutrition', '<p>' + stage.nutrition + '</p>') +
    card('🌦️ Weather conditions', '<p>' + stage.weather + '</p>');
}

function renderBadge(stage) {
  if (state.idx >= COMMON.length && stage.branch) {
    badgeEl.className = 'branch-badge ' + stage.branch;
    badgeEl.textContent = stage.branch === 'healthy' ? '✓ HEALTHY PATH' : '⚠ BER PATH';
  } else {
    badgeEl.className = 'branch-badge';
    badgeEl.textContent = '';
  }
}

let initialized = false;

function update() {
  const stage = currentStage();
  showStage(stage.id, !initialized);
  initialized = true;
  renderHeader(stage);
  renderTimeline();
  renderCards(stage);
  renderBadge(stage);
  branchPanelEl.style.display = stage.isBranch ? 'block' : 'none';
  prevBtn.disabled = state.idx === 0;
  nextBtn.disabled = state.branch !== null && state.idx === currentPath().length - 1;
}

function choose(branch) {
  state.branch = branch;
  state.idx = COMMON.length;  // first stage of the chosen path
  update();
}

function next() {
  if (currentStage().isBranch && !state.branch) {
    choose('healthy');  // default / autoplay choice at the decision point
    return;
  }
  if (state.idx < currentPath().length - 1) {
    state.idx++;
    update();
  } else {
    stopPlay();
  }
}

function prev() {
  if (state.idx === COMMON.length) {
    // leaving the branched path backwards clears the branch choice
    state.branch = null;
    state.idx = COMMON.length - 1;
    update();
  } else if (state.idx > 0) {
    state.idx--;
    update();
  }
}

function startPlay() {
  playTimer = setInterval(next, 5000);
  playBtn.textContent = '⏸ Pause';
  playBtn.classList.add('playing');
}
function stopPlay() {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
  playBtn.textContent = '▶ Autoplay';
  playBtn.classList.remove('playing');
}

prevBtn.addEventListener('click', () => { stopPlay(); prev(); });
nextBtn.addEventListener('click', () => { stopPlay(); next(); });
playBtn.addEventListener('click', () => { playTimer ? stopPlay() : startPlay(); });
document.getElementById('chooseHealthy').addEventListener('click', () => { stopPlay(); choose('healthy'); });
document.getElementById('chooseBer').addEventListener('click', () => { stopPlay(); choose('ber'); });
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { stopPlay(); next(); }
  if (e.key === 'ArrowLeft') { stopPlay(); prev(); }
});

buildStatic();
update();
