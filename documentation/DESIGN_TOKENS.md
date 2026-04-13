# DESIGN_TOKENS.md 

**Dreamer MVP — Visual Foundations**

This document defines the **design tokens and visual language** for the Dreamer MVP.  
All UI components, screens, and interactions must reference these tokens to maintain a calm, reflective, non-authoritative experience aligned with Jungian dreamwork principles.

---

## 1. Design Intent & Tone

**Core qualities**
- Reflective
- Calm
- Grounded
- Human
- Non-clinical
- Non-gamified

**Visual character**
Dark, immersive canvas — deep navy backgrounds, cyan/purple accents, generous whitespace. The interface should feel like a quiet night-time space for introspection, not a productivity dashboard.

**Explicitly avoid**
- Light / high-key backgrounds
- High-contrast analytics aesthetics
- Medical or therapeutic visual cues
- Aggressive success or error signaling
- Saturated or clashing accent colors

---

## 2. Color Tokens

### 2.1 Base Backgrounds
```css
--color-bg-primary:   #080c14;   /* Main app background — deep navy */
--color-bg-surface:   #0b1120;   /* Slightly lighter surface layer */
--color-bg-card:      #0f1629;   /* Cards, modals, elevated surfaces */
--color-border-subtle: rgba(255,255,255,0.08);  /* Dividers, card borders */
```

### 2.2 Text Colors
```css
--color-text-primary:   #e2e8f0;  /* Primary reading text (slate-200) */
--color-text-secondary: #94a3b8;  /* Labels, hints (slate-400) */
--color-text-muted:     #475569;  /* Metadata, placeholders (slate-600) */
```

### 2.3 Accent Colors (Use Sparingly)
```css
--color-accent-primary: #00d4ff;  /* Cyan — primary interactive accent */
--color-accent-purple:  #7c3aed;  /* Violet — secondary / AI accent */
```

### 2.4 Semantic Colors (Soft, Non-Alarmist)
```css
--color-positive: #4ade80;  /* Success / resonance (green-400) */
--color-negative: #f87171;  /* Error / alert (red-400) */
--color-warning:  #fbbf24;  /* Caution (amber-400) */
```

---

## 3. Typography Tokens

### 3.1 Typeface
```css
--font-family-primary: 'Inter', sans-serif;
```
Inter is the sole UI font. Priority: **long-form readability over decorative styling**.

### 3.2 Type Scale
```css
--font-display:    56px / 64px  Bold   /* Hero / product name */
--font-heading-1:  32px / 40px  Bold   /* Page headings */
--font-heading-2:  24px / 32px  Bold   /* Section headings */
--font-body-1:     16px / 26px  Regular /* Primary reading text */
--font-body-2:     14px / 22px  Regular /* Secondary text, labels */
--font-caption:    12px / 18px  Regular /* Meta, timestamps */
--font-accent:     14px / 22px  Bold    /* Accent labels, CTAs */
```

### 3.3 Usage Rules
- Dream text → body-1
- Hypotheses → body-1 (never emphasized as truth)
- Reflective questions → body-2 in `--color-text-secondary`
- Status labels → caption
- Product name / hero → display

---

## 4. Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--space-6: 48px;
```

Rule: If it feels slightly too spacious, it is correct.

---

## 5. Containers & Elevation
```css
--radius-default: 8px;
--radius-small:   4px;
```

- Prefer subtle borders over shadows on dark backgrounds
- Cards feel placed, not floating
- Use `--color-border-subtle` (low-opacity white) for outlines

---

## 6. Motion Guidance
- 150–200ms ease-out
- No bounce or spring
- No celebratory animations

---

## 7. Accessibility
- WCAG AA contrast (text on dark backgrounds must meet 4.5:1)
- ≥ 40px interactive targets
- No color-only signaling
- Accent cyan (#00d4ff) on navy (#080c14) passes AA at body sizes

---

## 8. Figma File Structure

The design system is generated across three pages:

| Page | Content |
|------|---------|
| 01 — Cover & Principles | Product name, design intent, do/don't guidelines |
| 02 — Foundations & Components | Color swatches, type scale, spacing, atoms, molecules |
| 03 — Screens | Full-screen mockups: Onboarding, Journal Entry, Dream Analysis, Insights |

Run the Figma plugin (`Dreamer Design System Generator`) once per page while that page is active.

---

**This file is the single source of truth for Dreamer's visual language.**
