// Dreamer Design System Generator — Figma Plugin v2
// Fixes: removed emoji from text, use children[] index for pages, added error catching

const T = {
  bgPrimary:   { r: 8/255,   g: 12/255,  b: 20/255  },
  bgCard:      { r: 15/255,  g: 22/255,  b: 41/255  },
  bgSurface:   { r: 11/255,  g: 17/255,  b: 32/255  },
  accent:      { r: 0,       g: 212/255, b: 255/255 },
  accentPurple:{ r: 124/255, g: 58/255,  b: 237/255 },
  textPrimary: { r: 226/255, g: 232/255, b: 240/255 },
  textSec:     { r: 148/255, g: 163/255, b: 184/255 },
  textMuted:   { r: 71/255,  g: 85/255,  b: 105/255 },
  positive:    { r: 74/255,  g: 222/255, b: 128/255 },
  negative:    { r: 248/255, g: 113/255, b: 113/255 },
  warning:     { r: 251/255, g: 191/255, b: 36/255  },
  white:       { r: 1,       g: 1,       b: 1       },
};

function sf(color, opacity) {
  return [{ type: 'SOLID', color, opacity: (opacity !== undefined && opacity !== null) ? opacity : 1 }];
}

function mkFrame(parent, x, y, w, h, name, fillColor, cornerR, fillOpacity) {
  const f = figma.createFrame();
  f.x = x; f.y = y;
  f.resize(w, h);
  f.name = name || 'Frame';
  if (fillColor !== undefined) {
    f.fills = sf(fillColor, fillOpacity);
  } else {
    f.fills = [];
  }
  if (cornerR) f.cornerRadius = cornerR;
  if (parent) parent.appendChild(f);
  return f;
}

function mkRect(parent, x, y, w, h, color, name, opacity) {
  const r = figma.createRectangle();
  r.x = x; r.y = y;
  r.resize(w, h);
  r.fills = sf(color, (opacity !== undefined) ? opacity : 1);
  if (name) r.name = name;
  if (parent) parent.appendChild(r);
  return r;
}

async function loadFont(bold) {
  await figma.loadFontAsync({ family: 'Inter', style: bold ? 'Bold' : 'Regular' });
}

async function mkText(parent, x, y, content, size, color, name, bold, opacity) {
  await loadFont(bold);
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.fills = sf(color, (opacity !== undefined) ? opacity : 1);
  t.characters = String(content); // ensure string
  t.x = x; t.y = y;
  if (name) t.name = name;
  if (parent) parent.appendChild(t);
  return t;
}

// ─── PAGE 1: Cover & Principles ─────────────────────────────────────────────
async function buildCover(page) {
  const f = mkFrame(page, 0, 0, 800, 640, '01 -- Cover', T.bgPrimary);
  mkRect(f, 0, 0, 800, 4, T.accent);
  await mkText(f, 48, 60,  'Dreamer', 56, T.accent, 'Product Name', true);
  await mkText(f, 48, 132, 'MVP Design System & Screens', 22, T.textSec, 'Subtitle');
  mkRect(f, 48, 176, 704, 1, T.textMuted, 'Divider', 0.4);
  await mkText(f, 48, 196, 'A Jungian dreamwork companion for self-directed reflection.', 15, T.textPrimary, 'Intent');
  await mkText(f, 48, 240, 'UX Principles', 16, T.accentPurple, 'Principles Heading', true);
  await mkText(f, 48, 270, '- Interpretations are hypotheses -- not conclusions', 14, T.textSec);
  await mkText(f, 48, 294, '- User meaning > system meaning', 14, T.textSec);
  await mkText(f, 48, 318, '- Calm, reflective pacing over gamification', 14, T.textSec);
  await mkText(f, 48, 342, '- Symbols are doors, not diagnoses', 14, T.textSec);
  await mkText(f, 48, 390, 'Explicit Non-Goals', 16, T.negative, 'Non-Goals Heading', true);
  await mkText(f, 48, 418, 'x  Therapy or clinical diagnosis', 14, T.textMuted);
  await mkText(f, 48, 442, 'x  Predictive or prescriptive interpretation', 14, T.textMuted);
  await mkText(f, 48, 466, 'x  Gamification or streaks', 14, T.textMuted);
  mkRect(f, 0, 620, 800, 20, T.bgCard);
  await mkText(f, 48, 623, 'Dreamer MVP  v1.0  Design System', 12, T.textMuted);
}

// ─── PAGE 2: Foundations & Components ───────────────────────────────────────
async function buildFoundations(page) {
  let yOff = 0;

  async function sHead(label) {
    const heading = mkFrame(page, 0, yOff, 1200, 48, label + ' Section', T.bgSurface);
    await mkText(heading, 24, 14, label, 18, T.textPrimary, 'Heading', true);
    yOff += 56;
  }

  // ===== COLOR TOKENS =====
  await sHead('Color Tokens');

  const colorData = [
    { name: 'bg-primary / #080c14',    color: T.bgPrimary,    textColor: T.textSec },
    { name: 'bg-card / #0f1629',       color: T.bgCard,       textColor: T.textSec },
    { name: 'bg-surface / #0b1120',    color: T.bgSurface,    textColor: T.textSec },
    { name: 'accent / #00d4ff',        color: T.accent,       textColor: T.bgPrimary },
    { name: 'accent-purple / #7c3aed', color: T.accentPurple, textColor: T.white },
    { name: 'text-primary / #e2e8f0',  color: T.textPrimary,  textColor: T.bgPrimary },
    { name: 'text-secondary / #94a3b8',color: T.textSec,      textColor: T.bgPrimary },
    { name: 'text-muted / #475569',    color: T.textMuted,    textColor: T.white },
    { name: 'positive / #4ade80',      color: T.positive,     textColor: T.bgPrimary },
    { name: 'negative / #f87171',      color: T.negative,     textColor: T.bgPrimary },
    { name: 'warning / #fbbf24',       color: T.warning,      textColor: T.bgPrimary },
  ];

  for (let i = 0; i < colorData.length; i++) {
    const c = colorData[i];
    const cx = 24 + (i % 6) * 192;
    const cy = yOff + Math.floor(i / 6) * 120;
    const sw = mkFrame(page, cx, cy, 172, 96, c.name.split('/')[0].trim(), c.color, 8);
    const parts = c.name.split('/');
    await mkText(sw, 12, 12, parts[0].trim(), 12, c.textColor, 'Token Name', true);
    await mkText(sw, 12, 32, parts[1].trim(), 11, c.textColor, 'Hex Value');
  }
  yOff += Math.ceil(colorData.length / 6) * 120 + 40;

  // ===== TYPOGRAPHY =====
  await sHead('Typography');

  const typoEntries = [
    { label: 'H1  32px Bold',     size: 32, color: T.textPrimary, bold: true },
    { label: 'H2  24px Bold',     size: 24, color: T.textPrimary, bold: true },
    { label: 'Body1  16px',       size: 16, color: T.textPrimary, bold: false },
    { label: 'Body2  14px',       size: 14, color: T.textSec,     bold: false },
    { label: 'Caption  12px',     size: 12, color: T.textMuted,   bold: false },
    { label: 'Accent  14px Bold', size: 14, color: T.accent,      bold: true  },
  ];

  for (const entry of typoEntries) {
    await mkText(page, 24, yOff, entry.label, entry.size, entry.color, entry.label, entry.bold);
    yOff += entry.size + 16;
  }
  yOff += 24;

  // ===== ATOMS =====
  await sHead('Atoms');

  // Buttons row label
  await mkText(page, 24, yOff, 'Button', 13, T.textSec, 'Button Label', true);
  yOff += 24;

  const btnP = mkFrame(page, 24, yOff, 152, 48, 'Atom/Button -- Primary', T.accent, 6);
  await mkText(btnP, 36, 14, 'Continue', 14, T.bgPrimary, 'Label', true);
  await mkText(page, 24, yOff + 54, 'Primary', 11, T.textMuted);

  const btnS = mkFrame(page, 200, yOff, 152, 48, 'Atom/Button -- Secondary', T.bgCard, 6);
  btnS.strokes = sf(T.accent);
  btnS.strokeWeight = 1;
  await mkText(btnS, 24, 14, 'Save Draft', 14, T.accent, 'Label');
  await mkText(page, 200, yOff + 54, 'Secondary', 11, T.textMuted);

  const btnD = mkFrame(page, 376, yOff, 152, 48, 'Atom/Button -- Destructive', T.negative, 6, 0.15);
  btnD.strokes = sf(T.negative);
  btnD.strokeWeight = 1;
  await mkText(btnD, 44, 14, 'Delete', 14, T.negative, 'Label');
  await mkText(page, 376, yOff + 54, 'Destructive', 11, T.textMuted);

  const btnDis = mkFrame(page, 552, yOff, 152, 48, 'Atom/Button -- Disabled', T.textMuted, 6, 0.25);
  await mkText(btnDis, 36, 14, 'Continue', 14, T.textMuted, 'Label');
  await mkText(page, 552, yOff + 54, 'Disabled', 11, T.textMuted);

  yOff += 88;

  // Input row
  await mkText(page, 24, yOff, 'Text Input', 13, T.textSec, 'Input Label', true);
  yOff += 24;

  const inp1 = mkFrame(page, 24, yOff, 320, 48, 'Atom/Input -- Single', T.bgSurface, 6);
  inp1.strokes = sf(T.textMuted, 0.6);
  inp1.strokeWeight = 1;
  await mkText(inp1, 14, 14, 'Enter dream title...', 14, T.textMuted);
  await mkText(page, 24, yOff + 54, 'Single-line', 11, T.textMuted);

  const inp2 = mkFrame(page, 368, yOff, 320, 120, 'Atom/Input -- Multiline', T.bgSurface, 6);
  inp2.strokes = sf(T.accent, 0.4);
  inp2.strokeWeight = 1;
  await mkText(inp2, 14, 14, 'Describe your dream in as much\ndetail as you remember...', 14, T.textMuted);
  await mkText(page, 368, yOff + 126, 'Multiline (focused state)', 11, T.textMuted);

  yOff += 168;

  // Badge row
  await mkText(page, 24, yOff, 'Status Badge', 13, T.textSec, 'Badge Label', true);
  yOff += 24;

  const badges = [
    { label: 'Draft',    bg: T.textMuted,    fg: T.textPrimary, op: 0.4 },
    { label: 'Active',   bg: T.accent,       fg: T.bgPrimary,   op: 1 },
    { label: 'Done',     bg: T.positive,     fg: T.bgPrimary,   op: 1 },
    { label: 'Shadow',   bg: T.accentPurple, fg: T.white,       op: 0.9 },
    { label: 'Anima',    bg: { r: 236/255, g: 72/255, b: 153/255 }, fg: T.white, op: 0.9 },
    { label: 'Self',     bg: T.warning,      fg: T.bgPrimary,   op: 0.9 },
  ];

  for (let i = 0; i < badges.length; i++) {
    const b = badges[i];
    const badge = mkFrame(page, 24 + i * 120, yOff, 100, 28, 'Atom/Badge -- ' + b.label, b.bg, 14, b.op);
    await mkText(badge, 10, 6, b.label, 12, b.fg, 'Label', true);
  }
  yOff += 60;

  // Divider
  await mkText(page, 24, yOff, 'Divider', 13, T.textSec, 'Divider Label', true);
  yOff += 24;
  mkRect(page, 24, yOff, 600, 1, T.textMuted, 'Atom/Divider', 0.3);
  yOff += 40;

  // ===== MOLECULES =====
  await sHead('Molecules');

  // DreamListItem
  await mkText(page, 24, yOff, 'Molecule/DreamListItem', 13, T.accent, 'DLI Label', true);
  yOff += 22;
  const dli = mkFrame(page, 24, yOff, 500, 80, 'Molecule/DreamListItem', T.bgCard, 8);
  mkRect(dli, 0, 0, 4, 80, T.accent, 'Accent Bar');
  await mkText(dli, 20, 14, 'The Forest of Mirrors', 16, T.textPrimary, 'Title', true);
  await mkText(dli, 20, 40, 'Apr 12, 2026  |  3 elements  |  2 hypotheses', 12, T.textMuted, 'Meta');
  const dliS = mkFrame(dli, 408, 28, 68, 24, 'Status', T.positive, 4, 0.2);
  await mkText(dliS, 8, 4, 'Done', 11, T.positive);
  yOff += 104;

  // ElementCard
  await mkText(page, 24, yOff, 'Molecule/ElementCard', 13, T.accent, 'EC Label', true);
  yOff += 22;
  const ec = mkFrame(page, 24, yOff, 300, 108, 'Molecule/ElementCard', T.bgCard, 8);
  await mkText(ec, 16, 14, 'Water', 16, T.textPrimary, 'Symbol', true);
  await mkText(ec, 16, 44, 'The rushing river I couldn\'t cross', 13, T.textSec, 'Context');
  const ecB = mkFrame(ec, 16, 72, 74, 24, 'Archetype', T.accentPurple, 12, 0.25);
  await mkText(ecB, 8, 4, 'Shadow', 11, T.accentPurple);
  yOff += 132;

  // AssociationCard
  await mkText(page, 24, yOff, 'Molecule/AssociationCard', 13, T.accent, 'AC Label', true);
  yOff += 22;
  const ac = mkFrame(page, 24, yOff, 400, 128, 'Molecule/AssociationCard', T.bgCard, 8);
  await mkText(ac, 16, 12, 'Water', 12, T.accent, 'Element', true);
  await mkText(ac, 16, 36, 'Reminds me of feeling overwhelmed at\nwork, swept away by events.', 13, T.textPrimary, 'Text');
  const acV = mkFrame(ac, 16, 96, 72, 22, 'Valence', T.positive, 11, 0.2);
  await mkText(acV, 8, 4, 'Positive', 11, T.positive);
  await mkText(ac, 100, 99, 'Salience: 3/5', 12, T.accent);
  yOff += 152;

  // HypothesisCard
  await mkText(page, 24, yOff, 'Molecule/HypothesisCard', 13, T.accent, 'HC Label', true);
  yOff += 22;
  const hc = mkFrame(page, 24, yOff, 520, 200, 'Molecule/HypothesisCard', T.bgCard, 8);
  const hcL = mkFrame(hc, 16, 14, 76, 24, 'Lens Badge', T.accentPurple, 12, 0.25);
  await mkText(hcL, 8, 4, 'Shadow', 11, T.accentPurple);
  await mkText(hc, 16, 50, 'The water may represent aspects of your emotional life\nthat feel beyond control -- the Shadow pressing\nagainst conscious boundaries.', 13, T.textPrimary, 'Hypothesis');
  await mkText(hc, 16, 130, 'One possible interpretation -- not a conclusion.', 12, T.textMuted, 'Disclaimer');
  await mkText(hc, 16, 152, 'What in waking life feels like a current you cannot swim against?', 12, T.textSec, 'Question');
  const hcR = mkFrame(hc, 340, 164, 80, 28, 'Resonates', T.positive, 4, 0.15);
  hcR.strokes = sf(T.positive, 0.5);
  hcR.strokeWeight = 1;
  await mkText(hcR, 8, 6, 'Resonates', 11, T.positive);
  const hcN = mkFrame(hc, 428, 164, 80, 28, 'No Fit', T.negative, 4, 0.15);
  hcN.strokes = sf(T.negative, 0.5);
  hcN.strokeWeight = 1;
  await mkText(hcN, 10, 6, 'No fit', 11, T.negative);
  yOff += 224;

  // IntegrationBlock
  await mkText(page, 24, yOff, 'Molecule/IntegrationBlock', 13, T.accent, 'IB Label', true);
  yOff += 22;
  const ib = mkFrame(page, 24, yOff, 520, 148, 'Molecule/IntegrationBlock', T.accent, 8, 0.05);
  ib.strokes = sf(T.accent, 0.25);
  ib.strokeWeight = 1;
  await mkText(ib, 16, 14, 'My Integration Note', 16, T.textPrimary, 'Title', true);
  await mkText(ib, 16, 44, 'I recognize this shadow element in my daily frustrations\nwith powerlessness. I will practice noticing when I feel\nswept away, and pause to choose my response.', 13, T.textSec);
  const ibB = mkFrame(ib, 384, 116, 120, 24, 'Status', T.positive, 12, 0.2);
  await mkText(ibB, 10, 4, 'Integrated', 11, T.positive);
}

// ─── PAGE 3: Screens — Core Flow ─────────────────────────────────────────────
async function buildScreens(page) {
  const SW = 390, SH = 844, GAP = 60;

  async function makeScreen(idx, name) {
    const sx = idx * (SW + GAP);
    const s = mkFrame(page, sx, 0, SW, SH, 'Screen/' + name, T.bgPrimary, 16);
    const sb = mkFrame(s, 0, 0, SW, 44, 'Status Bar', T.bgSurface);
    await mkText(sb, 16, 14, '9:41', 13, T.textPrimary);
    const nb = mkFrame(s, 0, 44, SW, 56, 'Nav Bar', T.bgSurface);
    mkRect(nb, 0, 55, SW, 1, T.textMuted, 'Border', 0.2);
    const navLabel = name === 'Dashboard' ? 'Dreamer' : '< ' + name;
    await mkText(nb, 16, 17, navLabel, 17, T.textPrimary, 'Nav Title', name === 'Dashboard');
    return { s, cY: 112 };
  }

  // Dashboard
  {
    const { s, cY } = await makeScreen(0, 'Dashboard');
    await mkText(s, 16, cY, 'Your Dreams', 22, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, 'April 2026', 13, T.textMuted);
    const items = [
      { t: 'The Forest of Mirrors',  m: 'Apr 12  |  3 elements', st: 'Done',  sc: T.positive },
      { t: 'Falling Through Clouds', m: 'Apr 10  |  2 elements', st: 'Draft', sc: T.textMuted },
      { t: 'The Empty House',        m: 'Apr 7   |  4 elements', st: 'Draft', sc: T.textMuted },
      { t: 'Strange City at Night',  m: 'Apr 3   |  5 elements', st: 'Done',  sc: T.positive },
    ];
    for (let d = 0; d < items.length; d++) {
      const it = items[d];
      const dc = mkFrame(s, 16, cY + 70 + d * 96, SW - 32, 80, 'DreamItem/' + (d+1), T.bgCard, 8);
      mkRect(dc, 0, 0, 4, 80, T.accent);
      await mkText(dc, 20, 12, it.t, 14, T.textPrimary, 'Title', true);
      await mkText(dc, 20, 36, it.m, 12, T.textMuted);
      const ds = mkFrame(dc, 272, 28, 64, 24, 'Status', it.sc, 4, 0.2);
      await mkText(ds, 8, 4, it.st, 11, it.sc);
    }
    const fab = mkFrame(s, SW - 72, SH - 96, 56, 56, 'FAB', T.accent, 28);
    await mkText(fab, 16, 10, '+', 28, T.bgPrimary, 'Icon', true);
  }

  // Dream Entry
  {
    const { s, cY } = await makeScreen(1, 'Dream Entry');
    await mkText(s, 16, cY, 'Record Your Dream', 20, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, 'Write as much as you remember.\nDo not edit -- let the imagery flow.', 14, T.textSec);
    const ti = mkFrame(s, 16, cY + 96, SW - 32, 48, 'Title Input', T.bgSurface, 8);
    ti.strokes = sf(T.textMuted, 0.5);
    ti.strokeWeight = 1;
    await mkText(ti, 14, 14, 'Dream title...', 14, T.textMuted);
    const bi = mkFrame(s, 16, cY + 160, SW - 32, 340, 'Body Input', T.bgSurface, 8);
    bi.strokes = sf(T.accent, 0.4);
    bi.strokeWeight = 1;
    await mkText(bi, 14, 14, 'I was in a forest...\n\nThe trees were like mirrors, each\nreflecting a different version of me.\nI walked deeper and deeper but\nnever found the center...', 14, T.textPrimary);
    const saveBtn = mkFrame(s, 16, cY + 516, SW - 32, 48, 'Save Button', T.accent, 8);
    await mkText(saveBtn, 88, 14, 'Save & Analyze', 14, T.bgPrimary, 'Label', true);
  }

  // Dream Breakdown
  {
    const { s, cY } = await makeScreen(2, 'Dream Breakdown');
    await mkText(s, 16, cY, 'Dream Elements', 20, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, 'AI identified these symbols.\nReview, add, or remove.', 13, T.textSec);
    const elems = [
      { sym: 'Forest',  ctx: 'The place where the dream begins', arch: 'Self' },
      { sym: 'Mirror',  ctx: 'Showed a distorted reflection', arch: 'Shadow' },
      { sym: 'Fog',     ctx: 'Blocked the path forward', arch: 'Anima' },
    ];
    for (let i = 0; i < elems.length; i++) {
      const el = elems[i];
      const ec2 = mkFrame(s, 16, cY + 86 + i * 116, SW - 32, 100, 'Element/' + el.sym, T.bgCard, 8);
      await mkText(ec2, 16, 12, el.sym, 15, T.textPrimary, 'Symbol', true);
      await mkText(ec2, 16, 38, el.ctx, 13, T.textSec);
      const eb = mkFrame(ec2, 16, 66, 72, 24, 'Archetype', T.accentPurple, 12, 0.25);
      await mkText(eb, 8, 4, el.arch, 11, T.accentPurple);
    }
    const contBtn = mkFrame(s, 16, SH - 112, SW - 32, 48, 'Continue', T.accent, 8);
    await mkText(contBtn, 72, 14, 'Continue to Associations', 14, T.bgPrimary, 'Label', true);
  }

  // Associations
  {
    const { s, cY } = await makeScreen(3, 'Associations');
    await mkText(s, 16, cY, 'Your Associations', 20, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, 'What does each symbol mean to you\npersonally? Write freely.', 13, T.textSec);
    const elems2 = ['Forest', 'Mirror', 'Fog'];
    for (let i = 0; i < elems2.length; i++) {
      const ac2 = mkFrame(s, 16, cY + 86 + i * 140, SW - 32, 124, 'Assoc/' + elems2[i], T.bgCard, 8);
      await mkText(ac2, 14, 10, elems2[i], 13, T.accent, 'Symbol', true);
      const ainp = mkFrame(ac2, 14, 34, SW - 60, 72, 'Input', T.bgSurface, 6);
      ainp.strokes = sf(i === 0 ? T.accent : T.textMuted, i === 0 ? 0.4 : 0.3);
      ainp.strokeWeight = 1;
      await mkText(ainp, 10, 10, i === 0 ? 'Safety, but also getting lost...' : 'What does this mean to me?', 13, i === 0 ? T.textPrimary : T.textMuted);
    }
    const contBtn2 = mkFrame(s, 16, SH - 112, SW - 32, 48, 'Continue', T.accent, 8);
    await mkText(contBtn2, 80, 14, 'Continue to Hypotheses', 14, T.bgPrimary, 'Label', true);
  }

  // Interpretation
  {
    const { s, cY } = await makeScreen(4, 'Interpretation');
    await mkText(s, 16, cY, 'Interpretations', 20, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, '2 hypotheses generated', 13, T.textMuted);
    const hyps = [
      {
        lens: 'Shadow',
        text: 'The mirror-forest may represent\nunacknowledged aspects of self\nthe psyche is asking you to face.',
        q: 'What do you see in mirrors you do not show others?',
      },
      {
        lens: 'Self',
        text: 'The journey deeper into the forest\nmay symbolize the individuation\nprocess -- moving toward wholeness.',
        q: 'Where are you seeking a center you have not yet found?',
      },
    ];
    for (let i = 0; i < hyps.length; i++) {
      const h = hyps[i];
      const hf = mkFrame(s, 16, cY + 66 + i * 222, SW - 32, 208, 'Hypothesis/' + (i+1), T.bgCard, 8);
      const hl = mkFrame(hf, 14, 12, 76, 24, 'Lens', T.accentPurple, 12, 0.25);
      await mkText(hl, 8, 4, h.lens, 11, T.accentPurple);
      await mkText(hf, 14, 46, h.text, 13, T.textPrimary);
      await mkText(hf, 14, 128, 'One possible interpretation -- not a conclusion.', 11, T.textMuted);
      await mkText(hf, 14, 148, h.q, 12, T.textSec);
      const rb = mkFrame(hf, 168, 174, 88, 26, 'Resonates', T.positive, 4, 0.15);
      rb.strokes = sf(T.positive, 0.4);
      rb.strokeWeight = 1;
      await mkText(rb, 8, 5, 'Resonates', 12, T.positive);
    }
  }

  // Integration
  {
    const { s, cY } = await makeScreen(5, 'Integration');
    await mkText(s, 16, cY, 'Integration', 20, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 34, 'What will you carry forward\nfrom this dream?', 13, T.textSec);
    const pf = mkFrame(s, 16, cY + 86, SW - 32, 72, 'Reflection Prompt', T.accentPurple, 8, 0.1);
    pf.strokes = sf(T.accentPurple, 0.3);
    pf.strokeWeight = 1;
    await mkText(pf, 14, 10, 'Shadow prompt', 11, T.accentPurple, 'Label', true);
    await mkText(pf, 14, 30, 'The mirror shows what you hide. Where do\nyou avoid your own reflection?', 12, T.textSec);
    const intInp = mkFrame(s, 16, cY + 174, SW - 32, 240, 'Integration Input', T.bgSurface, 8);
    intInp.strokes = sf(T.accent, 0.35);
    intInp.strokeWeight = 1;
    await mkText(intInp, 14, 14, 'I notice this pattern of feeling unseen...\n\nI will pay attention to moments when I\nfeel like a reflection of expectations\nand practice choosing my own response.', 14, T.textPrimary);
    const cb = mkFrame(s, 16, SH - 128, SW - 32, 48, 'Complete Session', T.accent, 8);
    await mkText(cb, 80, 14, 'Complete Session', 14, T.bgPrimary, 'Label', true);
  }

  // Session View (Read-only)
  {
    const { s, cY } = await makeScreen(6, 'Session View');
    await mkText(s, 16, cY, 'The Forest of Mirrors', 18, T.textPrimary, 'Title', true);
    await mkText(s, 16, cY + 28, 'Apr 12, 2026  |  Completed', 12, T.textMuted);
    const sections = [
      { label: 'Raw Dream',      sub: 'I was in a forest where every tree was a mirror...' },
      { label: 'Elements',       sub: '3 elements: Forest (Self), Mirror (Shadow), Fog (Anima)' },
      { label: 'Interpretations',sub: '2 hypotheses -- Shadow & Self -- 1 resonated' },
      { label: 'Integration',    sub: 'I notice this pattern of feeling unseen in waking life...' },
    ];
    for (let i = 0; i < sections.length; i++) {
      const sec = mkFrame(s, 16, cY + 60 + i * 108, SW - 32, 92, 'Section/' + sections[i].label, T.bgCard, 8);
      await mkText(sec, 14, 12, sections[i].label, 14, T.accent, 'Label', true);
      await mkText(sec, 14, 38, sections[i].sub, 12, T.textSec);
    }
  }
}

// ─── MAIN — page-aware (run from each page) ───────────────────────────────
async function main() {
  const page = figma.currentPage;
  const name = page.name.toLowerCase();
  figma.notify('Running on: ' + page.name.substring(0, 40));

  try {
    if (name.includes('01') || name.includes('cover') || name.includes('principle')) {
      await buildCover(page);
      figma.notify('Cover & Principles done!');
    } else if (name.includes('02') || name.includes('found') || name.includes('component')) {
      await buildFoundations(page);
      figma.notify('Foundations & Components done!');
    } else if (name.includes('03') || name.includes('screen')) {
      await buildScreens(page);
      figma.notify('Screens done!');
    } else {
      figma.notify('Unknown page: ' + page.name.substring(0, 40));
    }
  } catch(e) {
    figma.notify('Error: ' + e.message, { error: true });
    console.error(e);
  }
  figma.closePlugin();
}

main();
