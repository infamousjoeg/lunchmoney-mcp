# lunchmoney-mcp Brand Guidelines

> Design language: **warm charcoal + amber, terminal-native feel**
> A craftsman-workshop aesthetic where financial tools feel like well-made instruments, not cold dashboards.

---

## Color System

### Base Palette (Backgrounds)

| Token | Hex | Role |
|-------|-----|------|
| `--bg-base` | `#141210` | Page background, ground level |
| `--bg-surface` | `#1c1a18` | Cards, terminal windows, panels |
| `--bg-raised` | `#252220` | Hover states, elevated surfaces |
| `--bg-overlay` | `#2e2b27` | Code block headers, nav overlays, titlebar chrome |

The background progression darkens as you scroll: `#141210` at the top graduating to `#0e0d0b` at the bottom. The security section drops to a full-bleed `#0e0d0b` with a 2px amber top border as a deliberate "beat change."

A warm grain texture (inline SVG feTurbulence at 3% opacity) overlays the entire body, giving the page a tactile, paper-like quality.

### Amber Accent Family (Primary Brand Color)

| Token | Hex | Role |
|-------|-----|------|
| `--amber-bright` | `#d4a843` | Primary accent: links, CTAs, badges, active states, stat numbers |
| `--amber-mid` | `#b8922e` | Footer license badge, secondary accent text |
| `--amber-dim` | `#8c6e21` | Active borders, accent bars, section dividers |
| `--amber-subtle` | `#3d3120` | Badge/tag backgrounds, icon containers, section labels |

Amber is the only accent color in the system. There are no blues, purples, or teals competing for attention. Everything that isn't neutral is amber.

**Hover accent:** `#e0b84e` (brighter amber for button hover states)
**Focus ring:** `2px solid var(--amber-bright)` with `outline-offset: 3px`
**Glow:** `rgba(212,168,67,0.18)` as a box-shadow ring on primary button hover

### Text Hierarchy

| Token | Hex | Role |
|-------|-----|------|
| `--text-primary` | `#f0ebe3` | Headings, body copy, card titles (warm off-white, not pure white) |
| `--text-secondary` | `#a89880` | Descriptions, supporting copy, nav links |
| `--text-muted` | `#9e8e7a` | Tertiary labels, comments, terminal muted output |
| `--text-inverse` | `#141210` | Text on amber backgrounds (buttons, featured icons) |

The primary text color is intentionally warm (`#f0ebe3`), not cool white. This reinforces the charcoal warmth and reduces harshness.

### Semantic Colors

| Token | Hex | Role |
|-------|-----|------|
| `--success` | `#6aaa6a` | Checkmarks, response labels, status dots |
| `--success-bg` | `#1a2e1a` | Success badge backgrounds |

Success green is the only non-amber semantic color. There are no error/warning/info colors defined; the design doesn't currently need them.

### Syntax Highlighting

Material-inspired palette used in code blocks and the Try It panel:

| Class | Hex | Semantic |
|-------|-----|----------|
| `.syn-keyword` / `.tryit__key` | `#c792ea` | JSON keys, language keywords (purple) |
| `.syn-string` / `.tryit__value` | `#c3e88d` | String values (green) |
| `.syn-number` / `.tryit__num` | `#f78c6c` | Numbers, booleans (orange) |
| `.syn-flag` / `.tryit__param` | `#89ddff` | CLI flags, parameters (cyan) |
| `.syn-prompt` | `var(--amber-bright)` | Terminal prompt `$` (amber, bold) |
| `.syn-comment` | `var(--text-muted)` | Comments (muted, italic) |

### Borders

| Token | Hex | Role |
|-------|-----|------|
| `--border` | `#2e2b27` | Default card/section borders |
| `--border-strong` | `#3d3830` | Hover states, emphasis borders |

---

## Typography

### Font Stacks

**Sans-serif (body, headings, descriptions):**
```
-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
"Helvetica Neue", Arial, sans-serif
```

**Monospace (code, badges, terminal, labels, tool names, counters):**
```
ui-monospace, "Cascadia Code", "Fira Code", "JetBrains Mono",
"Source Code Pro", Consolas, monospace
```

No external fonts are loaded. The system font stack keeps the page fast and native-feeling.

### Type Scale

| Element | Size | Weight | Tracking | Font |
|---------|------|--------|----------|------|
| Hero headline | `clamp(2rem, 5.5vw, 3.5rem)` | 800 | -0.03em | Sans |
| Section heading | `clamp(1.75rem, 4vw, 2.5rem)` | 700 | -0.02em | Sans |
| Why heading | `clamp(1.5rem, 3.5vw, 2.25rem)` | 800 | -0.025em | Sans |
| Hero subhead | 1.125rem | 400 | default | Sans |
| Body copy | 1.0625rem | 400 | default | Sans |
| Card title | 1rem | 650 | -0.01em | Sans |
| Card description | 0.9rem | 400 | default | Sans |
| Nav link | 0.875rem | 450 | 0.01em | Sans |
| Code body | 0.875rem | 400 | default | Mono |
| Section label | 0.75rem | 600 | 0.12em | Mono (uppercase) |
| Badge text | 0.6875rem | 700 | 0.08em | Mono (uppercase) |
| Stat label | 0.75rem | 400 | 0.08em | Sans (uppercase) |
| Stat value | 1.375rem | 700 | default | Mono |

### Typographic Rules

- Headlines use tight negative letter-spacing (-0.02em to -0.03em)
- Section labels and badges are always uppercase monospace with wide letter-spacing
- Monospace is used for anything technical: tool names, parameter hints, version numbers, counters, code
- `font-weight: 650` is used at the card-title level (between semi-bold and bold)
- Italics are reserved for two specific uses: the word *definitive* in the hero headline, and blockquote pull-quotes
- Line height: 1.1 for headlines, 1.6 for body, 1.7 for code and terminal, 1.75 for the Why section prose

---

## Spacing

8-point base grid, rem-based:

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |
| `--space-20` | 5rem | 80px |
| `--space-24` | 6rem | 96px |

### Layout Constants

| Token | Value |
|-------|-------|
| `--max-width` | 1100px |
| `--nav-height` | 64px |
| Section padding | `--space-24` (96px) top and bottom |
| Container inline padding | `--space-6` (24px) |

---

## Surface & Elevation

### Elevation Model

```
Ground:   --bg-base     #141210    (page background)
Card:     --bg-surface  #1c1a18    (cards, terminals, panels)
Hover:    --bg-raised   #252220    (interactive hover states)
Chrome:   --bg-overlay  #2e2b27    (headers, titlebars, code block headers)
```

Each level is separated by a 1px border at `--border`. Hover states promote the border to `--border-strong`.

### Shadow Language

- **Terminal/output panels:** `0 4px 6px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.25)`
- **Inner highlight:** `inset 0 1px 0 rgba(255,255,255,0.04)` (top-edge sheen on terminals)
- **Scrolled nav:** `0 1px 0 rgba(212,168,67,0.06)` (subtle amber glow below nav)
- **Security section:** `0 -1px 0 0 rgba(212,168,67,0.08)` (amber halo above)

Shadows are deep and dark. No diffuse colored glows except for the amber button hover ring.

### Border Radius

| Context | Radius |
|---------|--------|
| Cards, code blocks | 8px |
| Buttons, nav items | 6px |
| Large buttons | 8px |
| Terminal windows, output panels | 10px |
| Badges, tags (square) | 3px |
| Pill badges (version, step numbers) | 99px or 50% |
| Favicon outer rect | 14px |

---

## Component Library

### Buttons

**Primary (`btn--primary`):**
- Background: `--amber-bright`
- Text: `--text-inverse`
- Border: 1px solid `--amber-bright`
- Hover: `#e0b84e` background + `box-shadow: 0 0 0 3px rgba(212,168,67,0.18)`
- Min height: 44px

**Outline (`btn--outline`):**
- Background: transparent
- Text: `--amber-bright`
- Border: 1px solid `--amber-dim`
- Hover: fills to `--amber-subtle`, border promotes to `--amber-bright`

**Ghost (`btn--ghost`):**
- Background: transparent
- Text: `--text-secondary`
- Border: 1px solid `--border-strong`
- Hover: text promotes to `--text-primary`, background raises to `--bg-raised`

**Large variant (`btn--lg`):** Adds `--space-3` vertical / `--space-8` horizontal padding, 1rem font, 8px radius.

### Cards

- Background: `--bg-surface`
- Border: 1px solid `--border`
- Radius: 8px
- Padding: `--space-6`
- Hover: border promotes to `--border-strong`, background raises to `--bg-raised`
- Hover accent: 2px amber bar appears on the left edge (20% inset from top/bottom, `--amber-dim`)

**Featured variant:** Background uses `linear-gradient(135deg, var(--bg-surface) 0%, rgba(61,49,32,0.5) 100%)` with an `--amber-dim` border. Featured icon containers use `--amber-dim` background with inverse text.

### Terminal Window

- Background: `--bg-surface`
- Border: 1px solid `--border-strong`
- Radius: 10px
- Shadow: deep layered shadow (see Shadow Language above)
- Titlebar: `--bg-overlay` with 1px bottom border
- Traffic light dots: red `#ff5f57`, amber `#febc2e`, green `#28c840` (standard macOS)
- Title: centered, `--text-muted`, mono 0.75rem
- Body: mono 0.875rem, line-height 1.7
- Cursor: 9px wide amber block, 1.1s step-end blink animation

### Code Blocks

- Background: `--bg-surface`
- Border: 1px solid `--border-strong`
- Radius: 8px
- Header: `--bg-overlay` with language label (mono, uppercase, 0.6875rem, 0.1em tracking)
- Copy button: mono, uppercase, 0.6875rem, muted text with border; hovers to amber
- Body padding: `--space-5`
- Code: mono 0.875rem, line-height 1.7

### Badges

Three variants, all monospace uppercase at 0.6875rem with 0.08em tracking:

| Variant | Text Color | Background |
|---------|-----------|------------|
| `badge--amber` | `--amber-bright` | `--amber-subtle` |
| `badge--success` | `--success` | `--success-bg` |
| `badge--muted` | `--text-muted` | `--bg-overlay` + 1px border |

Padding: 2px 8px. Radius: 3px.

### Section Labels

Uppercase monospace at 0.75rem, 0.12em letter-spacing. Amber text on amber-subtle background with `--space-1` / `--space-3` padding. 2px border-radius.

### Stats Ribbon

4-column grid (2 on mobile) with 1px gap, `--border` background showing through as dividers. Each cell: `--bg-surface`, centered, with mono stat value in amber at 1.375rem/700 and uppercase label in muted at 0.75rem.

### Threat/Data Tables

- Full width, collapsed borders
- Header: `--bg-surface` background, 2px bottom border in `--amber-dim`, uppercase mono labels
- Cells: `--space-3` / `--space-4` padding, 1px `--border` bottom
- First column: mono, `--text-primary`, nowrap
- Row hover: `--bg-surface` background
- Status badges use the `threat-badge--mitigated` (success) or `threat-badge--design` (amber) variants

### Scenario Tabs (Try It)

- Default: `--bg-surface`, 1px `--border`, 8px radius, full width
- Hover: border promotes, background raises
- Active: `--amber-dim` border, gradient background matching featured cards, 3px amber bar on left edge

---

## Background Textures

Three distinctive treatments that give the page tactile depth:

1. **Body grain:** Inline SVG feTurbulence fractal noise (baseFrequency 0.75, 4 octaves) at 3% opacity. Warm, felt-not-seen.

2. **Hero ruled lines:** Horizontal repeating gradient at 48px intervals, amber at 4% opacity. Evokes a legal pad or ledger.

3. **Security vertical lines:** Vertical repeating gradient at 100px intervals, amber at 2.5% opacity. Rotated version of the hero pattern for visual continuity.

---

## Motion & Animation

| Token | Value |
|-------|-------|
| `--duration-fast` | 150ms |
| `--duration-base` | 250ms |
| `--duration-slow` | 400ms |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |

### Behaviors

- **Scroll-reveal:** Elements fade up 20px with staggered delays (60ms increments per sibling, up to 360ms)
- **Terminal typing:** Character-by-character at 38ms +/- 9ms randomization, output lines reveal all at once after 60ms
- **Counter animation:** Ease-out cubic from 0 to target over 900ms, triggered by IntersectionObserver
- **Tab/panel switching:** 250ms fade + translateY(8px) using `panel-fade` keyframes
- **Status dot pulse:** 2.4s ease-in-out infinite, opacity 1 > 0.5, scale 1 > 0.75
- **Cursor blink:** 1.1s step-end infinite

### Reduced Motion

All animations and transitions are disabled when `prefers-reduced-motion: reduce` is active. Scroll behavior falls back to `auto`. All reveal elements render immediately as visible.

---

## Logo / Favicon

The logo mark is a `$` dollar sign styled as a terminal prompt:

- **Outer rect:** `#1c1a18`, 14px radius
- **Inner rect:** `#2a2520`, 8px radius, 10px inset
- **`$` glyph:** `#d4a843` (amber-bright), mono font, 28px, weight 700, centered
- **Cursor underscore:** `#d4a843` at 70% opacity, 9x3px, positioned to the right of the `$`

In the nav, this appears as a 28x28px square with `--amber-subtle` background, 1px `--amber-dim` border, 6px radius, containing the `$` in mono 0.8125rem/700 amber-bright.

---

## Responsive Breakpoints

| Breakpoint | Purpose |
|------------|---------|
| 480px | Stats ribbon: 2-col to 4-col |
| 600px | Feature grid: 1-col to 2-col; Deploy grid: 1-col to 2-col; Footer: stacks to inline |
| 768px | Desktop nav links visible; hamburger hidden |
| 900px | Hero: 1-col to 2-col; Quick Start: 1-col to sidebar+code; Try It: stacked to side-by-side; Why: 1-col to 2fr/3fr; Security: 1-col to 2-col |
| 960px | Feature grid: 2-col to 3-col; Deploy grid: 2-col to 3-col |

---

## Do / Don't

**Do:**
- Use amber as the sole accent color
- Use monospace for anything technical or data-driven
- Use tight negative tracking on headlines
- Use the 4-level surface elevation model
- Respect the grain texture and ruled-line motifs
- Support `prefers-reduced-motion`

**Don't:**
- Introduce blue, purple, or teal accents
- Use pure white (`#ffffff`) for text; always use the warm `#f0ebe3`
- Use custom gradients outside the defined featured-card and active-tab patterns
- Use border-radius above 10px (except pill badges at 99px)
- Use shadows with colored tints (shadows are always black-based)
- Skip the monospace treatment on badges, labels, or technical content
