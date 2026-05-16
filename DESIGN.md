# Design system — dustinriley.com

This file is the source of truth for visual / interaction decisions on this site. If you are an agent or contributor about to add UI, **read this file first**. The actual tokens and reusable primitives ship from the **`@dustin-riley/design`** npm package (`tokens.css` / `core.css`); this site's own furniture lives in `src/styles/design-system.css`.

The design is also distributed as a Claude Skill (`dustinriley-design`) generated at claude.ai/design — this doc reflects what that skill specifies and what the codebase has actually shipped.

---

## Tl;dr — non-negotiables

- **One primary** (burnt orange `#B8541C`), **two accents** (ochre, teal). Don't invent colors.
- **Three radii only**: `8px` (inputs/chips), `16px` (cards/modals), `999px` (buttons/toggles). Nothing else.
- **Three shadows only**: `sm`, `md`, `lg` — all warm-tinted (`rgba(74, 52, 28, …)`), never gray or black.
- **Sentence case everywhere.** No Title Case. No ALL CAPS for emphasis. Even nav: "experiments", "writing", "about".
- **First person.** Address the reader as "you". No marketing puffery.
- **No emoji.** Use Lucide icons or unicode arrows (`→ ↗ ↓ ←`).
- **Color is never the only state signal.** Pair it with elevation, motion, or an icon.
- **Motion is feedback, not decoration.** Spring-based, resolves under 300ms.
- **WCAG AA throughout.** For burnt-orange text-as-link, use `--ds-link` (`#9E4615`), not `--ds-primary` — primary doesn't clear 4.5:1 against the canvas.

---

## Where things live

| Concern | File |
|---|---|
| Design tokens (color, type, spacing, radius, shadow, motion) | `@dustin-riley/design/tokens.css` (imported in `src/styles/main.css`) |
| Reusable `.ds-*` primitives | `@dustin-riley/design/core.css` (imported at top of `src/styles/design-system.css`) |
| This site's own furniture (nav, hero/blobs, experiment grid, writing list, article, pager, related, search input, chip cloud, footer) | `src/styles/design-system.css` |
| Tailwind base / Tailwind plugin theme bridge | `src/styles/main.css`, `src/styles/base.css`, `src/tailwind-plugin/tw-theme.mjs` |
| Layout wrapper + font loading | `src/layouts/Base.astro` |
| Header / Footer | `src/layouts/partials/Header.astro`, `src/layouts/partials/Footer.astro` |
| Reusable page chunks | `src/layouts/components/Hero.astro`, `ExperimentGrid.astro`, `WritingList.astro` |

**All design tokens are CSS custom properties prefixed `--ds-*`.** Always reference the token, never hard-code a hex / px value. If you need something the token set doesn't cover, that's a signal to push back on the design, not invent a one-off value.

---

## Voice & content

The site is personal but not confessional. A builder showing his work, not a brand selling something. Curious, plainspoken, slightly dry.

- **Casing:** sentence case, always.
- **First person:** "I built this", "I'm Dustin".
- **Address the reader as "you":** "drag the slider", "try changing the seed".
- **Verb-first button labels:** "open it", "try the demo", "read the notes" — lowercase, no ceremony.
- **Punctuation:** em-dashes ok, oxford commas on, sentence fragments fine. Avoid semicolons in UI copy.
- **Numbers:** spell out one through nine in prose; numerals for ten and up, and always for measurements/dates. Dates as "April 2026", not "04/18/26".
- **Empty states:** terse. e.g. "Nothing here yet. Check back."
- **Avoid:** marketing puffery ("revolutionary", "seamless"), exclamation points in running copy, onboarding-speak ("welcome aboard!"), placeholder copy ("your content here"), emoji.

---

## Color

Warm-neutral canvas with one primary and two accents. Color is reserved for interaction and emphasis — chrome stays neutral.

| Token | Hex | Use |
|---|---|---|
| `--ds-bg` | `#FAF6F0` | Page canvas |
| `--ds-surface` | `#F3ECE0` | Cards, raised surfaces, nav-link hover |
| `--ds-surface-sunken` | `#EDE4D3` | Insets, code, segmented "off" track |
| `--ds-border` | `#E0D5C2` | 1px hairlines (never heavier) |
| `--ds-text` | `#1F1A14` | Body text (warm-shifted near-black) |
| `--ds-text-muted` | `#6B5F50` | Captions, secondary, mono meta |
| `--ds-primary` | `#B8541C` | Brand surfaces (button bg, brand dot, focus ring). **Not for text.** |
| `--ds-primary-hover` | `#9E4615` | Hover state for primary surfaces |
| `--ds-primary-pressed` | `#85390F` | Active/pressed state |
| `--ds-link` | `#9E4615` | Text-as-link (passes AA on bg + surface) |
| `--ds-link-hover` | `#85390F` | Link hover |
| `--ds-accent-ochre` | `#C9922B` | Accent + warning |
| `--ds-accent-teal` | `#2E7D7A` | Accent |
| `--ds-success` | `#5C7A3E` | Warm olive |
| `--ds-error` | `#A8392E` | Warm brick red |

**Backgrounds:** flat warm neutrals only. No gradients behind content, no photo backgrounds, no repeating patterns, no noise/grain. The **one permitted flourish** is the soft warm "blob" radial in hero areas / empty states (see `.hero .blob-1`, `.hero .blob-2` in `design-system.css`) — never behind anything that needs focus.

**Shadows are warm-tinted**, never gray:
```
--ds-shadow-sm   resting cards
--ds-shadow-md   hover lift, dropdowns
--ds-shadow-lg   modals, popovers
```

**Borders disappear when elevation replaces them.** Cards use shadow, not border, unless they sit on a same-color surface.

**Transparency / blur:** modal scrims only (`rgba(31, 26, 20, 0.4)` over a blur). No glassmorphism, no frosted chrome.

---

## Type

Outfit (display) × DM Sans (body) — geometric × rounded — JetBrains Mono for code and meta only. No italics in UI chrome.

| Token | Family | Use |
|---|---|---|
| `--ds-font-display` | Outfit | h1–h6, brand wordmark, post titles, hero headline |
| `--ds-font-body` | DM Sans | Paragraph, buttons, inputs |
| `--ds-font-mono` | JetBrains Mono | Captions, dates, tags, eyebrow labels (`.grid-label`), code |

Scale (1.25 ratio, 16px root) — see `tokens.css` for the full set. h1=36, h2=28, h3=22, h4=18, h5=16, h6=14. h4–h6 land at body sizes intentionally — they read as headings via the display font + 600 weight, not via raw size, and are rare in practice. Tracking tightens as type grows: `-0.02em` at display, `0` at body. Body weight 400; display 500–600.

**Mono is the "meta" face.** Anything date-y, tag-y, or label-y belongs in mono with `text-transform: uppercase` and `letter-spacing: 0.06em` (see `.grid-label`, `.tag`, `.read-time`).

---

## Spacing

Strict 4px base scale: `--ds-space-{0..9}` = `0, 4, 8, 12, 16, 24, 32, 48, 64, 96`.

- `16 → 24 → 32` is the "room rhythm" inside components.
- `48+` is reserved for section-level breaks.
- Two density modes: comfortable (default) and compact.

---

## Radius

Three values. **No others allowed.**

| Token | Value | Use |
|---|---|---|
| `--ds-radius-sm` | `8px` | Inputs, chips, code, inline keys |
| `--ds-radius-md` | `16px` | Cards, modals, panels, hero images |
| `--ds-radius-pill` | `999px` | Buttons, toggles, segmented controls, tag chips |

Corners are continuous / squircle-adjacent — that's why `16px` and `999px` feel right.

---

## Motion

Spring easing over linear. **Everything resolves under 300ms.**

For CSS, use `--ds-ease-standard` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) at one of:
- `--ds-duration-fast` (120ms) — color shifts, tiny chrome moves
- `--ds-duration-base` (200ms) — most transitions, hover lifts
- `--ds-duration-slow` (280ms) — layout, modal in/out

For framework motion (Framer Motion etc.), use spring presets:
- `spring-snappy` — stiffness 400, damping 30 — buttons, toggles, presses
- `spring-smooth` — stiffness 260, damping 26 — cards, modals, layout
- `spring-gentle` — stiffness 180, damping 24 — page transitions

---

## Interactive states

| State | Effect |
|---|---|
| Hover (cards, buttons) | `translateY(-1px)` + elevation bump `sm → md`. Color shift secondary. |
| Hover (text links) | Color shift only — no underline toggling. |
| Press / active | `scale(0.97)` snappy spring. Buttons may shift to `--ds-primary-pressed`. Elevation drops to resting. |
| Focus | `--ds-focus-ring` (2px primary at 40% opacity, 2px offset). Always visible. **Never `outline: none` without a replacement** — `Base.astro` already wires `:focus-visible` to the ring globally. |
| Disabled | 40% opacity, no pointer events, no hover lift. Never communicated by color alone. |

---

## Layout

- Site container tops out at **960px** (`.ds-container`, `max-width: 960px` + `--ds-space-5` horizontal padding).
- Long-form articles narrow to **680px** (`.ds-article`) so the reading measure stays ~65–75ch.
- Headers are static; **no sticky/blur-over-content navs.** If a header needs to be sticky later, it must remain neutral chrome — never tinted glass.

---

## Iconography

- **Set:** [Lucide](https://lucide.dev). Substitution from the spec — Lucide's clean line style matches the type pairing. If you swap to another set, swap the whole set, not one icon at a time.
- **Stroke:** `1.5px`. Never 1 (spindly), never ≥2 (cartoonish).
- **Sizes:** 20px inline with body, 24px standalone, 16px caption minimum, never above 32px outside empty-state illustrations.
- **Color:** `currentColor`. Inherit `--ds-text` in chrome, `--ds-text-muted` for supporting rails, `--ds-link` only when the icon itself is a CTA / active marker.
- **Unicode arrows are fair game** in button labels and footer links: `→ ↗ ↓ ←`. Set in the body face so they align with adjacent text. No other unicode substitutions (use Lucide `star`, not `★`).
- **No emoji. Anywhere.**
- **No custom illustrations** at the system level. The only non-icon graphic is the hero blob. Per-experiment illustrations are scoped to that experiment.

---

## Component anchors

When building or modifying UI, prefer extending these existing patterns over inventing parallel ones. The reusable `.ds-*` primitives come from `@dustin-riley/design/core.css`; the semantic site-furniture patterns (`.hero`, `.experiment-grid`, `.writing-list`, `.site-nav`, `.site-footer`) are defined locally in `src/styles/design-system.css`:

| Pattern | Class |
|---|---|
| Page container | `.ds-container` |
| Display headline | `.ds-display` |
| Lede paragraph | `.ds-lede` |
| Mono caption / label | `.ds-caption`, `.grid-label`, `.ds-mono-note` |
| Page header (eyebrow + h1 + lede) | `.ds-page-header` |
| Site nav | `.site-nav`, `.brand`, `.nav-link.active` |
| Buttons | `.ds-btn`, `.ds-btn-primary`, `.ds-btn-secondary`, `.ds-btn-ghost` |
| Hero with blobs | `.hero` (+ `.blob-1`, `.blob-2`) |
| Experiment card grid | `.experiment-grid`, `.experiment-card` |
| Writing post list | `.writing-list`, `.writing-item` |
| Article body | `.ds-article` (article body sized at `--ds-fs-body-lg` for comfortable reading) |
| Tag / chip | `a.tag-chip`, `.ds-chip-cloud` |
| Search input | `.ds-search-input` |
| Pager | `.ds-pager` |
| Related posts block | `.ds-related` |
| Footer | `.site-footer` |

---

## Anti-overdesign checklist

If you are about to do any of the following, stop and reconsider:

- Adding a new color token, accent, or semantic shade
- Adding a fourth radius
- Adding a fourth shadow, or any cool-toned / pure-gray shadow
- Reaching for italics in UI chrome
- Using gradients behind content
- Title-casing something
- Adding an emoji
- Removing a focus outline without replacing it
- Communicating state with color alone
- Hard-coding a hex / px value instead of a `--ds-*` token

The system is intentionally lean. **Cohesion is the product; novelty is a liability.**

---

## Caveats

- Some legacy Tailwind utilities (`.btn`, `.btn-primary`, `.container`, `.nav-link` font-weight) survive from the original Bookworm template in `buttons.css`, `components.css`, `navigation.css`. Prefer the `--ds-*` / `.ds-*` system. Treat the legacy classes as deprecated; refactor opportunistically when touching surrounding code.
- Fonts load from Google Fonts via `Base.astro`. If self-hosting later, drop `.woff2` files into a `fonts/` dir and update the font tokens in the `@dustin-riley/design` package (not this repo).
- The wordmark is currently the brand-dot + "dustinriley" lockup in `Header.astro`. There is no real logo asset yet.
