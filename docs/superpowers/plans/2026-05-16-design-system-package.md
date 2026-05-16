# Design System Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the `--ds-*` design system into a public npm package `@dustin-riley/design`, then convert both dustinriley.com and scorigami to consume it.

**Architecture:** A standalone repo at `/Users/dustin/Development/dustinriley-design` publishing three CSS entry points — `tokens.css` (constitution: variables + focus ring + base element resets), `core.css` (audited reusable primitives), and an optional `tailwind.css` (Tailwind v4 `@theme` + shadcn HSL bridge). The shadcn HSL block is **generated** from `tokens.css` by a script so the hex→HSL duplication cannot drift. `DESIGN.md` and a `dustinriley-design` Claude Skill ship inside the package. The two existing apps are then converted to import the package, validating it.

**Tech Stack:** Plain CSS, Node ESM scripts, `node:test` for tests, npm (public scoped publish), Astro (dustinriley.com), Next.js + Tailwind v4 + shadcn (scorigami).

**Spec:** `dustinriley.com/docs/superpowers/specs/2026-05-16-design-system-package-design.md`

**Canonical sources (read-only inputs, never the package's source of truth after extraction):**
- `/Users/dustin/Development/dustinriley.com/src/styles/tokens.css` — canonical token values (108 lines, includes `--ds-accent-plum`).
- `/Users/dustin/Development/dustinriley.com/src/styles/design-system.css` — canonical component classes.
- `/Users/dustin/Development/scorigami/src/app/globals.css` — canonical base element resets (`@layer base`, lines 191–259), `.ds-panel`, `.kbd`, and the existing Tailwind/shadcn bridge to mirror.
- `/Users/dustin/Development/dustinriley.com/DESIGN.md` — philosophy doc to de-scope, and the basis for the bundled Claude Skill.

**Curation decision (locked — used by Tasks 3 and 4):**

| Selector(s) | Bucket | Rationale |
|---|---|---|
| all `--ds-*`, `:focus-visible` ring | `tokens.css` | the constitution |
| `body`, `h1`–`h6`, `a`, `code`/`pre`/`kbd`/`samp`, `::selection` resets | `tokens.css` | base element behavior, project-neutral |
| `.h1`–`.h6` | `core.css` | typographic helpers, generic |
| `.ds-btn`, `.ds-btn-primary`, `.ds-btn-secondary`, `.ds-btn-ghost` | `core.css` | generic buttons |
| `.ds-container`, `.ds-section` | `core.css` | generic layout |
| `.ds-display`, `.ds-lede`, `.ds-caption`, `.ds-mono-note`, `.grid-label`, `.ds-page-header`, `.ds-back-link` | `core.css` | generic typographic primitives |
| `.ds-panel`, `.kbd` (from scorigami globals) | `core.css` | generic surface + key chip |
| `.hero` + blob rules, `.experiment-grid`, `.experiment-card`, `.writing-list`, `.writing-item`, `.site-nav`, `.site-footer`, `.ds-article`, `.ds-pager`, `.ds-related`, `.ds-search-input`, `.ds-chip-cloud`, `.ds-see-all` | **excluded (site furniture)** — stays in each app | site-specific page furniture; may graduate later |

---

## Phase 1 — Build the package

### Task 1: Scaffold the package repo

**Files:**
- Create: `/Users/dustin/Development/dustinriley-design/.gitignore`
- Create: `/Users/dustin/Development/dustinriley-design/package.json`

- [ ] **Step 1: Create the directory and init git**

```bash
mkdir -p /Users/dustin/Development/dustinriley-design
cd /Users/dustin/Development/dustinriley-design
git init -q
mkdir -p src scripts test skill/dustinriley-design
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "@dustin-riley/design",
  "version": "0.1.0",
  "description": "Dustin Riley design system — warm mid-century modern tokens and primitives.",
  "license": "MIT",
  "type": "module",
  "files": ["src", "DESIGN.md", "skill", "README.md"],
  "exports": {
    "./tokens.css": "./src/tokens.css",
    "./core.css": "./src/core.css",
    "./tailwind.css": "./src/tailwind.css",
    "./DESIGN.md": "./DESIGN.md"
  },
  "scripts": {
    "generate": "node scripts/generate-bridge.mjs",
    "test": "node --test"
  },
  "publishConfig": { "access": "public" },
  "keywords": ["design-system", "css", "design-tokens"]
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git add -A
git commit -q -m "chore: scaffold @dustin-riley/design package"
```

---

### Task 2: Create `tokens.css` (the constitution)

**Files:**
- Create: `/Users/dustin/Development/dustinriley-design/src/tokens.css`
- Test: `/Users/dustin/Development/dustinriley-design/test/tokens.test.mjs`

- [ ] **Step 1: Write the failing test**

`test/tokens.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../src/tokens.css", import.meta.url)),
  "utf8"
);

const REQUIRED_TOKENS = [
  "--ds-bg", "--ds-surface", "--ds-surface-sunken", "--ds-border",
  "--ds-text", "--ds-text-muted",
  "--ds-primary", "--ds-primary-hover", "--ds-primary-pressed",
  "--ds-link", "--ds-link-hover",
  "--ds-accent-ochre", "--ds-accent-teal", "--ds-accent-plum",
  "--ds-success", "--ds-warning", "--ds-error", "--ds-on-primary",
  "--ds-font-display", "--ds-font-body", "--ds-font-mono",
  "--ds-radius-sm", "--ds-radius-md", "--ds-radius-pill",
  "--ds-shadow-sm", "--ds-shadow-md", "--ds-shadow-lg",
  "--ds-ease-standard"
];

test("tokens.css declares every required --ds-* token", () => {
  for (const token of REQUIRED_TOKENS) {
    assert.ok(
      new RegExp(`${token}\\s*:`).test(css),
      `missing token ${token}`
    );
  }
});

test("tokens.css ships base element resets and focus ring", () => {
  assert.ok(/:focus-visible/.test(css), "missing :focus-visible rule");
  assert.ok(/\bbody\s*{/.test(css), "missing body reset");
  assert.ok(/h1\s*,\s*h2/.test(css), "missing heading resets");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/dustin/Development/dustinriley-design && node --test test/tokens.test.mjs`
Expected: FAIL — `ENOENT` opening `../src/tokens.css`.

- [ ] **Step 3: Build `src/tokens.css`**

Copy the canonical token file, then append the canonical base resets.

```bash
cd /Users/dustin/Development/dustinriley-design
cp /Users/dustin/Development/dustinriley.com/src/styles/tokens.css src/tokens.css
```

Then **append** to `src/tokens.css` the base element resets, copied verbatim from `/Users/dustin/Development/scorigami/src/app/globals.css` lines 191–259 (the entire `@layer base { … }` block) but **with the `@layer base {` wrapper and its closing `}` removed** so the rules are layer-neutral, and **excluding** the `*, ::after, …{ border-color: … }` rule (that one is shadcn-bridge-specific and belongs in `tailwind.css`, not the framework-neutral core). Concretely the appended block must contain: `html { font-size:16px }`, the `body { … }` rule (using `var(--ds-*)`), the `h1..h6` + `.h1..h6` rules, the `a` / `a:hover` rules, `code,pre,kbd,samp` + `code` rules, `::selection`, and a `:focus-visible` rule.

> Note: canonical `tokens.css` already ends with its own `:focus-visible { outline:none; box-shadow: var(--ds-focus-ring) … }`. Keep that one and do **not** also append scorigami's outline-style `:focus-visible` — having two would conflict. Delete the appended `:focus-visible` block from the scorigami-sourced resets; the canonical box-shadow ring wins.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/dustin/Development/dustinriley-design && node --test test/tokens.test.mjs`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git add src/tokens.css test/tokens.test.mjs
git commit -q -m "feat: add tokens.css constitution with token presence tests"
```

---

### Task 3: Create `core.css` (audited primitives)

**Files:**
- Create: `/Users/dustin/Development/dustinriley-design/src/core.css`
- Test: `/Users/dustin/Development/dustinriley-design/test/core.test.mjs`

- [ ] **Step 1: Write the failing test**

`test/core.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../src/core.css", import.meta.url)),
  "utf8"
);

const MUST_INCLUDE = [
  ".ds-btn", ".ds-btn-primary", ".ds-btn-secondary", ".ds-btn-ghost",
  ".ds-container", ".ds-section", ".ds-display", ".ds-lede",
  ".ds-caption", ".ds-mono-note", ".grid-label", ".ds-page-header",
  ".ds-back-link", ".ds-panel", ".kbd"
];

const MUST_EXCLUDE = [
  ".hero", ".experiment-grid", ".experiment-card", ".writing-list",
  ".writing-item", ".site-nav", ".site-footer", ".ds-article",
  ".ds-pager", ".ds-related", ".ds-search-input", ".ds-chip-cloud",
  ".blob-1", ".blob-2"
];

test("core.css imports tokens.css", () => {
  assert.ok(/@import\s+["']\.\/tokens\.css["']/.test(css));
});

test("core.css contains every audited-in primitive", () => {
  for (const sel of MUST_INCLUDE) {
    assert.ok(css.includes(sel), `core.css must define ${sel}`);
  }
});

test("core.css contains no excluded site furniture", () => {
  for (const sel of MUST_EXCLUDE) {
    assert.ok(!css.includes(sel), `core.css must NOT contain ${sel}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/dustin/Development/dustinriley-design && node --test test/core.test.mjs`
Expected: FAIL — `ENOENT` opening `../src/core.css`.

- [ ] **Step 3: Build `src/core.css`**

Start the file with the import, then copy in only the audited-in selectors.

First line of `src/core.css`:

```css
@import "./tokens.css";
```

Then append, copied **verbatim from canonical sources**, only these rule blocks:

- From `/Users/dustin/Development/dustinriley.com/src/styles/design-system.css`: the full rule blocks for `.ds-container`, `.ds-section`, `.ds-display`, `.ds-lede`, `.ds-caption`, `.ds-mono-note`, `.grid-label`, `.ds-page-header` (and its `> *` children rules), `.ds-back-link` (+ `:hover`), `.ds-btn`, `.ds-btn-primary` (+ `:hover`/`:active`), `.ds-btn-secondary` (+ `:hover`), `.ds-btn-ghost` (+ `:hover`), and the `.h1`–`.h6` rules.
- From `/Users/dustin/Development/scorigami/src/app/globals.css`: the `.ds-panel` (+ `.ds-panel.interactive:hover`) block (lines ~492–503) and the `.kbd` block (lines ~648–656).

Do **not** copy any selector listed in `MUST_EXCLUDE` or anywhere in the "excluded (site furniture)" row of the curation table. If a copied rule references a token not present in `tokens.css`, that is a bug — stop and reconcile, do not invent a value.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/dustin/Development/dustinriley-design && node --test test/core.test.mjs`
Expected: PASS — all three tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git add src/core.css test/core.test.mjs
git commit -q -m "feat: add curated core.css primitives with inclusion/exclusion tests"
```

---

### Task 4: Bridge generator + generated `tailwind.css`

**Files:**
- Create: `/Users/dustin/Development/dustinriley-design/scripts/generate-bridge.mjs`
- Create: `/Users/dustin/Development/dustinriley-design/src/tailwind.head.css` (static template head)
- Create: `/Users/dustin/Development/dustinriley-design/src/tailwind.css` (generated output, committed)
- Test: `/Users/dustin/Development/dustinriley-design/test/bridge.test.mjs`

- [ ] **Step 1: Write the failing test**

`test/bridge.test.mjs` — proves every generated shadcn HSL var round-trips to the exact hex of its source `--ds-*` token, so the bridge can never drift from `tokens.css`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hexToHslTriplet, extractDsHex } from "../scripts/generate-bridge.mjs";

const url = (p) => fileURLToPath(new URL(p, import.meta.url));
const tokens = readFileSync(url("../src/tokens.css"), "utf8");
const bridge = readFileSync(url("../src/tailwind.css"), "utf8");

// shadcn var -> source --ds-* token it must equal
const MAP = {
  "--background": "--ds-bg",
  "--foreground": "--ds-text",
  "--primary": "--ds-primary",
  "--primary-foreground": "--ds-on-primary",
  "--border": "--ds-border",
  "--ring": "--ds-primary",
  "--destructive": "--ds-error"
};

test("hexToHslTriplet converts known values", () => {
  assert.equal(hexToHslTriplet("#ffffff"), "0 0% 100%");
});

test("every mapped shadcn var equals its --ds-* source in HSL", () => {
  const dsHex = extractDsHex(tokens);
  for (const [shadcnVar, dsVar] of Object.entries(MAP)) {
    const expected = hexToHslTriplet(dsHex[dsVar]);
    const re = new RegExp(`${shadcnVar}\\s*:\\s*([^;]+);`);
    const m = bridge.match(re);
    assert.ok(m, `bridge missing ${shadcnVar}`);
    assert.equal(
      m[1].trim(), expected,
      `${shadcnVar} (${m[1].trim()}) != HSL of ${dsVar} ${dsHex[dsVar]} (${expected})`
    );
  }
});

test("tailwind.css remaps radii onto the three allowed values", () => {
  assert.ok(/--radius-lg:\s*16px/.test(bridge));
  assert.ok(/--radius-md:\s*8px/.test(bridge));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/dustin/Development/dustinriley-design && node --test test/bridge.test.mjs`
Expected: FAIL — cannot import `../scripts/generate-bridge.mjs` (does not exist).

- [ ] **Step 3: Write the static bridge head**

`src/tailwind.head.css` — everything in the bridge that is NOT derived from tokens (the `@theme` radius/font/color exposure and the shadcn border-color base rule). Copy verbatim from `/Users/dustin/Development/scorigami/src/app/globals.css`:
- the `@theme { … }` block (lines ~137–189),
- the `@layer base { *, ::after, … { border-color: hsl(var(--border)); } html { font-size:16px } }` border-color rule only (the shadcn `*{border-color}` reset from lines ~191–196).

Prepend this single line as the file's first line:

```css
@import "./core.css";
```

(Tailwind projects import only `tailwind.css`; it pulls in `core.css`, which pulls in `tokens.css`.)

- [ ] **Step 4: Write `scripts/generate-bridge.mjs`**

```js
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const url = (p) => fileURLToPath(new URL(p, import.meta.url));

export function extractDsHex(tokensCss) {
  const out = {};
  const re = /(--ds-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m;
  while ((m = re.exec(tokensCss))) out[m[1]] = m[2].toLowerCase();
  return out;
}

export function hexToHslTriplet(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lig = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue /= 6;
  }
  const H = Math.round(hue * 360);
  const S = Math.round(sat * 100);
  const L = Math.round(lig * 100);
  return `${H} ${S}% ${L}%`;
}

// shadcn var -> source --ds-* token
const MAP = {
  "--background": "--ds-bg",
  "--foreground": "--ds-text",
  "--card": "--ds-bg",
  "--card-foreground": "--ds-text",
  "--popover": "--ds-bg",
  "--popover-foreground": "--ds-text",
  "--primary": "--ds-primary",
  "--primary-foreground": "--ds-on-primary",
  "--secondary": "--ds-surface",
  "--secondary-foreground": "--ds-text",
  "--muted": "--ds-surface-sunken",
  "--muted-foreground": "--ds-text-muted",
  "--accent": "--ds-surface",
  "--accent-foreground": "--ds-text",
  "--destructive": "--ds-error",
  "--destructive-foreground": "--ds-on-primary",
  "--border": "--ds-border",
  "--input": "--ds-border",
  "--ring": "--ds-primary",
  "--chart-1": "--ds-primary",
  "--chart-2": "--ds-accent-ochre",
  "--chart-3": "--ds-accent-teal",
  "--chart-4": "--ds-success",
  "--chart-5": "--ds-error"
};

function buildShadcnBlock(dsHex) {
  const lines = Object.entries(MAP).map(([v, ds]) => {
    if (!dsHex[ds]) throw new Error(`tokens.css missing ${ds} for ${v}`);
    return `  ${v}: ${hexToHslTriplet(dsHex[ds])};`;
  });
  return `:root {\n${lines.join("\n")}\n  --radius: 1rem;\n}\n`;
}

function main() {
  const tokens = readFileSync(url("../src/tokens.css"), "utf8");
  const head = readFileSync(url("../src/tailwind.head.css"), "utf8");
  const dsHex = extractDsHex(tokens);
  const banner =
    "/* GENERATED by scripts/generate-bridge.mjs from src/tokens.css.\n" +
    "   Do not edit by hand. Run `npm run generate`. */\n";
  const shadcn =
    "/* shadcn HSL bridge — derived from --ds-* tokens */\n" +
    buildShadcnBlock(dsHex);
  writeFileSync(url("../src/tailwind.css"), banner + head + "\n" + shadcn);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 5: Generate `src/tailwind.css` and run tests**

```bash
cd /Users/dustin/Development/dustinriley-design
npm run generate
node --test test/bridge.test.mjs
```
Expected: `tailwind.css` written; all three bridge tests PASS.

- [ ] **Step 6: Run the full suite**

Run: `cd /Users/dustin/Development/dustinriley-design && npm test`
Expected: PASS — tokens, core, and bridge suites all green.

- [ ] **Step 7: Commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git add scripts/generate-bridge.mjs src/tailwind.head.css src/tailwind.css test/bridge.test.mjs
git commit -q -m "feat: generate shadcn/tailwind bridge from tokens with drift test"
```

---

### Task 5: Bundle `DESIGN.md` and the Claude Skill, write README

**Files:**
- Create: `/Users/dustin/Development/dustinriley-design/DESIGN.md`
- Create: `/Users/dustin/Development/dustinriley-design/skill/dustinriley-design/SKILL.md`
- Create: `/Users/dustin/Development/dustinriley-design/README.md`

- [ ] **Step 1: De-scope `DESIGN.md`**

```bash
cd /Users/dustin/Development/dustinriley-design
cp /Users/dustin/Development/dustinriley.com/DESIGN.md DESIGN.md
```

Then edit `DESIGN.md`:
- Change the H1 to `# Design system — @dustin-riley/design`.
- Replace the "Where things live" table file paths with package paths: tokens → `@dustin-riley/design/tokens.css`, components → `@dustin-riley/design/core.css`, Tailwind/shadcn bridge → `@dustin-riley/design/tailwind.css`.
- In the "Component anchors" and "Caveats" sections, delete rows/bullets that reference excluded site furniture (`.hero`, `.experiment-grid`, `.writing-list`, `.ds-article`, `.ds-pager`, `.ds-related`, `.ds-search-input`, the Bookworm/Astro/`Base.astro`/Header.astro wordmark caveats). Keep only primitives that ship in `core.css`.
- Delete the line claiming the skill is "generated at claude.ai/design"; replace with: "This doc is the source of truth; the bundled `dustinriley-design` skill mirrors it."

- [ ] **Step 2: Write the Claude Skill**

`skill/dustinriley-design/SKILL.md`:

```markdown
---
name: dustinriley-design
description: Use when building or modifying any UI in a project that consumes @dustin-riley/design — enforces the warm mid-century-modern token system, the three-radii/three-shadow rules, sentence-case voice, and the curated .ds-* primitive vocabulary.
---

# dustinriley design system

Apply this whenever you add or change UI in a project importing `@dustin-riley/design`.

## Non-negotiables
- One primary (burnt orange `#B8541C`), accents ochre + teal. Never invent colors.
- Three radii only: 8 / 16 / 999px. Three warm-tinted shadows only: sm / md / lg.
- Sentence case everywhere. First person. No emoji. Lucide icons or unicode arrows.
- Color is never the only state signal. Motion resolves under 300ms.
- For text-as-link in burnt orange use `--ds-link`, never `--ds-primary` (WCAG AA).
- Never hard-code a hex/px value — reference a `--ds-*` token.

## How to consume
- Always: `@import "@dustin-riley/design/tokens.css"; @import "@dustin-riley/design/core.css";`
- Tailwind v4 + shadcn projects additionally: `@import "@dustin-riley/design/tailwind.css";`

## Vocabulary (prefer extending these over inventing parallels)
Buttons `.ds-btn` + `.ds-btn-primary|secondary|ghost`; layout `.ds-container`,
`.ds-section`; type `.ds-display`, `.ds-lede`, `.ds-caption`, `.ds-mono-note`,
`.grid-label`, `.h1`–`.h6`; chrome bits `.ds-page-header`, `.ds-back-link`;
surfaces `.ds-panel`, `.kbd`.

Site-specific furniture (nav, footer, hero, grids) is NOT in the package by
design — build it per project from these primitives and tokens.

See the full rationale in `@dustin-riley/design/DESIGN.md`.
```

- [ ] **Step 3: Write `README.md`**

````markdown
# @dustin-riley/design

Warm mid-century-modern design system: tokens, base resets, and a curated set of
reusable CSS primitives. Framework-neutral, with an optional Tailwind v4 +
shadcn bridge.

## Install

```bash
npm i @dustin-riley/design
```

## Use

```css
/* any project */
@import "@dustin-riley/design/tokens.css";
@import "@dustin-riley/design/core.css";

/* Tailwind v4 + shadcn projects instead just need: */
@import "@dustin-riley/design/tailwind.css"; /* pulls in core + tokens */
```

## What's in / out

In: `--ds-*` tokens, base element resets, focus ring, and generic primitives
(`.ds-btn*`, `.ds-container`, `.ds-panel`, typographic helpers, `.kbd`, …).

Out by design: site furniture (nav, footer, hero, content grids). Build those
per project from the tokens. See `DESIGN.md`.

## Maintaining the bridge

`src/tailwind.css` is generated. Never edit it by hand. After changing
`src/tokens.css`, run `npm run generate && npm test`.
````

- [ ] **Step 4: Commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git add DESIGN.md skill README.md
git commit -q -m "docs: bundle de-scoped DESIGN.md, Claude skill, and README"
```

---

### Task 6: Publish `@dustin-riley/design` to public npm

**Files:** none (publish action)

- [ ] **Step 1: Verify the publishable contents**

```bash
cd /Users/dustin/Development/dustinriley-design
npm test
npm pack --dry-run
```
Expected: tests PASS; `npm pack --dry-run` lists exactly `src/tokens.css`, `src/core.css`, `src/tailwind.css`, `src/tailwind.head.css`, `DESIGN.md`, `skill/dustinriley-design/SKILL.md`, `README.md`, `package.json`. No `test/`, no `scripts/` leakage beyond intent (scripts excluded by `files`).

- [ ] **Step 2: Authenticate and publish**

This step needs the user to run an interactive npm login. Ask the user to run in this session:

```
! npm whoami || npm login
```

Then publish:

```bash
cd /Users/dustin/Development/dustinriley-design && npm publish --access public
```
Expected: `+ @dustin-riley/design@0.1.0`.

- [ ] **Step 3: Tag the release and commit**

```bash
cd /Users/dustin/Development/dustinriley-design
git tag v0.1.0
git commit -q --allow-empty -m "chore: release v0.1.0"
```

---

## Phase 2 — Convert dustinriley.com (low-risk validation)

### Task 7: Replace dustinriley.com's tokens/primitives with the package

**Files:**
- Modify: `/Users/dustin/Development/dustinriley.com/package.json` (add dependency)
- Modify: `/Users/dustin/Development/dustinriley.com/src/styles/main.css`
- Modify: `/Users/dustin/Development/dustinriley.com/src/styles/design-system.css`
- Delete: `/Users/dustin/Development/dustinriley.com/src/styles/tokens.css`

- [ ] **Step 1: Capture the baseline build (the equivalence oracle)**

```bash
cd /Users/dustin/Development/dustinriley.com
git stash list >/dev/null 2>&1 || true
npm run build
cp -r dist /tmp/drc-baseline-dist
```
Expected: build succeeds; baseline copied. This is the pixel-equivalence reference required by the spec.

- [ ] **Step 2: Add the dependency**

```bash
cd /Users/dustin/Development/dustinriley.com
npm i @dustin-riley/design@^0.1.0
```

- [ ] **Step 3: Repoint `main.css`**

In `/Users/dustin/Development/dustinriley.com/src/styles/main.css`, replace `@import "./tokens.css";` with `@import "@dustin-riley/design/tokens.css";`. Leave the `@layer components { @import "./design-system.css"; }` line in place for now (next step trims that file).

- [ ] **Step 4: Reduce `design-system.css` to site furniture only**

In `/Users/dustin/Development/dustinriley.com/src/styles/design-system.css`, delete every rule block whose selector is in `core.css` (the audited-in list: `.ds-container`, `.ds-section`, `.ds-display`, `.ds-lede`, `.ds-caption`, `.ds-mono-note`, `.grid-label`, `.ds-page-header`, `.ds-back-link`, `.ds-btn*`, `.h1`–`.h6`). Add this as the file's first line so the now-removed primitives still resolve:

```css
@import "@dustin-riley/design/core.css";
```

Keep all site-furniture rules (`.hero`, `.experiment-grid`, `.experiment-card`, `.writing-list`, `.writing-item`, `.site-nav`, `.site-footer`, `.ds-article`, `.ds-pager`, `.ds-related`, `.ds-search-input`, `.ds-chip-cloud`, `.ds-see-all`) in place.

- [ ] **Step 5: Delete the now-duplicate local tokens**

```bash
cd /Users/dustin/Development/dustinriley.com
rm src/styles/tokens.css
```

- [ ] **Step 6: Rebuild and diff against baseline**

```bash
cd /Users/dustin/Development/dustinriley.com
npm run build
diff -rq /tmp/drc-baseline-dist dist | grep -v '\.map$' || echo "IDENTICAL"
```
Expected: build succeeds. The only differences should be CSS bundle filenames/hashes and their internal ordering — **no differences in HTML output**. If any rendered page HTML differs, stop and reconcile (a primitive was dropped without the package supplying it).

- [ ] **Step 7: Visual spot-check**

Run `npm run preview` and load `/`, `/about`, `/experiments`, a blog post, and `/search`. Confirm buttons, type scale, nav, hero blobs, and focus rings look identical to before. (`npm run preview` serves `dist/`; the user can open the printed URL.)

- [ ] **Step 8: Commit**

```bash
cd /Users/dustin/Development/dustinriley.com
git add -A
git commit -m "$(printf 'refactor: consume @dustin-riley/design for tokens + primitives\n\nReplaces the local tokens.css and primitive classes with the\nextracted package; design-system.css now holds only site furniture.\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>')"
```

---

## Phase 3 — Convert scorigami + purge furniture (high-value test)

### Task 8: Replace scorigami's hand-copied block with the package

**Files:**
- Modify: `/Users/dustin/Development/scorigami/package.json`
- Modify: `/Users/dustin/Development/scorigami/src/app/globals.css`

- [ ] **Step 1: Capture the baseline build**

```bash
cd /Users/dustin/Development/scorigami
npm run build
cp -r .next /tmp/scorigami-baseline-next
```
Expected: build succeeds; baseline copied.

- [ ] **Step 2: Add the dependency**

```bash
cd /Users/dustin/Development/scorigami
npm i @dustin-riley/design@^0.1.0
```

- [ ] **Step 3: Rewrite `globals.css` to consume the package**

Replace the entire contents of `/Users/dustin/Development/scorigami/src/app/globals.css` with:

```css
@import "tailwindcss";
@import "@dustin-riley/design/tailwind.css";

/* ============================================================
   scorigami site furniture — NOT part of the design system.
   Only classes actually used by this app live here.
   ============================================================ */
```

Then, **below that banner**, paste back only the scorigami-specific furniture rule blocks that the app actually uses, copied from the pre-change git version of the file (recover via `git show HEAD:src/app/globals.css`): the chart card internals and any site chrome scorigami renders. Determine which by grep before pasting (next step). Do **not** paste back the `:root { --ds-* }` token block, the shadcn `:root` HSL block, the `@theme` block, the `@layer base` resets, or any primitive now provided by the package — those come from `@dustin-riley/design/tailwind.css`.

- [ ] **Step 4: Grep-confirm furniture usage; drop dead furniture**

```bash
cd /Users/dustin/Development/scorigami
for sel in hero blob-1 blob-2 experiment-grid writing-list site-nav site-footer \
  scorigami-chart-card chart-header-row chart-body stats-grid stat-block \
  helper-strip legend-row legend-swatch heatmap-scroll grid-label \
  ds-container ds-container-wide ds-page-header ds-back-link kbd ds-panel; do
  n=$(grep -rIl --include='*.tsx' --include='*.ts' --include='*.mdx' "\b$sel\b" src 2>/dev/null | wc -l | tr -d ' ')
  echo "$sel: $n file(s)"
done
```
Expected: prints a usage count per selector. **Keep** in `globals.css` only furniture selectors with count ≥ 1 that are NOT provided by the package (the package provides `grid-label`, `ds-container`, `ds-page-header`, `ds-back-link`, `kbd`, `ds-panel`). **Delete** any furniture rule with count 0 — explicitly including `.hero`, `.blob-1`, `.blob-2`, `.experiment-grid`, `.writing-list` if their count is 0 (spec-mandated purge). For `ds-container-wide` (scorigami-only, not in package): keep it if used.

- [ ] **Step 5: Rebuild and diff**

```bash
cd /Users/dustin/Development/scorigami
npm run build
```
Expected: build + typecheck + lint pass. Then run `npm run dev`, load `/`, exercise the heatmap, filters, a tooltip popover, and tab through focusable elements to confirm the warm palette, radii, focus rings, and shadcn components (Button/Dialog/Select/Combobox) render identically to baseline.

- [ ] **Step 6: Confirm the bridge equivalence held**

```bash
cd /Users/dustin/Development/scorigami
grep -c -- '--ds-' src/app/globals.css
```
Expected: `0` — no `--ds-*` token is defined locally anymore; every token now resolves through `@dustin-riley/design`. (References inside furniture rules like `var(--ds-surface)` are fine and expected; this command counts *definitions and uses* — the meaningful check is that there is no `:root { --ds-…: #… }` declaration block left. Visually verify none remain.)

- [ ] **Step 7: Commit**

```bash
cd /Users/dustin/Development/scorigami
git add -A
git commit -m "$(printf 'refactor: consume @dustin-riley/design; purge leaked furniture\n\nReplaces the hand-copied token block + Tailwind/shadcn bridge with\nthe extracted package, and removes dustinriley.com site furniture\n(hero/blobs, experiment-grid, writing-list) that was never used here.\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>')"
```

---

### Task 9: Update both apps' CLAUDE.md / DESIGN.md pointers

**Files:**
- Modify: `/Users/dustin/Development/dustinriley.com/CLAUDE.md`
- Modify: `/Users/dustin/Development/dustinriley.com/DESIGN.md`
- Modify: `/Users/dustin/Development/scorigami/CLAUDE.md`

- [ ] **Step 1: Update dustinriley.com docs**

In `dustinriley.com/CLAUDE.md` and `dustinriley.com/DESIGN.md`, update the "Where things live" / design-system sections to state that tokens and primitives now come from the `@dustin-riley/design` package (imported in `src/styles/main.css` and at the top of `src/styles/design-system.css`), and that `design-system.css` now holds only site furniture. Do not duplicate token values in the docs — point to the package.

- [ ] **Step 2: Update scorigami CLAUDE.md**

In `scorigami/CLAUDE.md`'s "Design System" section, replace "Tokens (defined in `src/app/globals.css`)" with "Tokens and primitives come from `@dustin-riley/design` (imported in `src/app/globals.css` via `@dustin-riley/design/tailwind.css`)"; note that `globals.css` now contains only scorigami furniture; remove the now-false "Mirrors dustinriley.com/src/styles/..." framing.

- [ ] **Step 3: Commit each repo**

```bash
cd /Users/dustin/Development/dustinriley.com && git add CLAUDE.md DESIGN.md && git commit -m "$(printf 'docs: point design-system docs at @dustin-riley/design package\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>')"
cd /Users/dustin/Development/scorigami && git add CLAUDE.md && git commit -m "$(printf 'docs: point design-system docs at @dustin-riley/design package\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>')"
```

---

## Done criteria

- `@dustin-riley/design@0.1.0` is published to public npm with `tokens.css`, `core.css`, `tailwind.css`, `DESIGN.md`, and the `dustinriley-design` skill.
- `npm test` in the package is green, including the bridge round-trip test (drift impossible).
- dustinriley.com builds with **no rendered-HTML differences** vs. baseline and no local `tokens.css`.
- scorigami builds/lints clean, defines zero `--ds-*` tokens locally, and the leaked `.hero`/blobs/`.experiment-grid`/`.writing-list` furniture is gone (when grep-confirmed unused).
- Both apps' CLAUDE.md/DESIGN.md point at the package; no duplicated token values remain anywhere.

---

## Corrective phase (post-0.1.0) — base-reset cascade regression

After 0.1.0 shipped, both apps showed visual regressions (every link
underlined, code re-themed; heading sizes off in drc). Root cause: `tokens.css`
carried base element resets that, imported unlayered, beat all layered
component overrides. See spec addendum (2026-05-16) for the full analysis.

Corrective tasks completed:
- **Package 0.1.1**: `tokens.css` → pure `:root` + `:focus-visible`. New
  `@dustin-riley/design/reset.css`, internally `@layer base` (uniform,
  footgun-free import for every app). Tests updated (13/13). Republished.
- **scorigami**: consume 0.1.1, `@import "@dustin-riley/design/reset.css";`
  (furniture in components/unlayered outranks it → nav no longer underlined).
- **dustinriley.com (normalized, no legacy exception)**: consume 0.1.1, import
  reset.css, remove the duplicate base element block from `design-system.css`,
  and fix legacy `base.css` (headings → display font `font-secondary`/Outfit
  600; body `line-height` → `--ds-lh-body`) so the app-owned base decisions
  live in `base.css`, not the design-system component layer. Shiki `pre`/`pre
  code`, `.ds-article .article-body a`, and all furniture preserved.
- Verified via deterministic emitted-CSS cascade (chrome links `none`, article
  links `underline`, headings Outfit, Shiki `pre code` transparent kept, no
  unlayered package rules) + build/lint. Final visual pass: user.

Uniform forward contract: every app imports `tokens` + `core` + `reset`
(+ `tailwind` if Tailwind/shadcn). No per-app judgment.

### Correction 2 — consumer-side layer(base)

The "internally @layer base" reset.css (0.1.1) was proven wrong: Lightning CSS
flattens a package-internal `@layer` pulled in via `@import`, so reset rules
landed unlayered and re-underlined all links in both apps. Fix: consumers
import with the layer set at their own `@import`:
`@import "@dustin-riley/design/reset.css" layer(base);`. Applied to scorigami
(`src/app/globals.css`) and dustinriley.com (`src/styles/main.css`); verified
with a `@layer`-containment parser of the built CSS (reset `a`→base; nav/footer/
`.ds-article` links + Shiki `pre code`→components, which win). Functional fix
needs no republish; reset.css ships cleaned (plain rules) in 0.1.2 with docs.

### Correction 3 — final: :where() zero-specificity reset (0.1.2)

reset.css wraps all selectors in :where() (zero specificity); plain `@import`,
no @layer, no consumer layer() — deterministic per CSS spec, bundler-proof.
Package 0.1.2 committed. After republish: bump both consumers to ^0.1.2 and
revert their reset import to the plain form; re-verify (specificity reasoning +
build/lint + visual).

### Correction 4 — final: no reset.css, no global underline (0.2.0)

Separate reset (any form) is always unlayered when imported → beats app
layers; :where() doesn't fix layer-origin. Final: base styling folds into
core.css (:where, zero-spec); package ships NO global link text-decoration
(underline is a component/app decision; Preflight keeps links plain).
Contract: tokens+core(+tailwind). Both apps on ^0.2.0, reset import removed,
verified (only underline in built CSS is Preflight abbr / app prose /
.ds-article .article-body a — zero package-origin). dustinriley.com base.css
legacy heading-font fix retained.
