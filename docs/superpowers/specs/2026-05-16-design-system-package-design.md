# Design system package — `@dustinriley/design`

**Date:** 2026-05-16
**Status:** Approved, ready for implementation planning

## Problem

The dustinriley design system currently exists in two hand-maintained copies
across two unrelated stacks:

- **`dustinriley.com`** (Astro) — the canonical source. Tokens in
  `src/styles/tokens.css`, component classes in `src/styles/design-system.css`,
  philosophy in `DESIGN.md`. Also distributed as a Claude Skill
  (`dustinriley-design`).
- **`scorigami`** (Next.js + Tailwind v4 + shadcn/ui) — a hand-copied mirror of
  the same tokens into a single `src/app/globals.css`, plus a Tailwind/shadcn
  bridge.

Keeping the two in sync is manual copy-paste. The mirror also dragged along
site-specific furniture that does not belong to the system (e.g. scorigami has a
`.hero` with decorative blob radials despite not being a marketing site, plus
`.experiment-grid` / `.writing-list` that are dustinriley.com page chunks). The
Tailwind/shadcn bridge contains a *second* copy-paste hazard: its shadcn HSL
variables are hand-converted duplicates of the hex tokens and can silently drift.

Future projects have no shared, low-friction way to adopt the system, and the
stack of those projects is unknown.

## Goals

- One source of truth for the design system, consumable by future projects.
- Kill the cross-repo copy-paste for the parts that are genuinely "the system."
- Use the extraction as a **curation** pass: separate the system from
  site-specific furniture.
- Do not lock future projects into a framework that has not been chosen.
- Validate the package against both existing real consumers.

## Non-goals

- Prebuilt React/Astro components (deferred under YAGNI; the design below does
  not foreclose adding them later).
- Any refactor in either existing app that is unrelated to the design system.
- A monorepo merging the two app repos.

## Architecture

A single public npm package, scoped: **`@dustinriley/design`**. Internally
curated into three CSS tiers plus one optional bridge.

### Curation principle

Every existing class is judged: *is this the system, or is this a particular
site?* Three buckets:

| Bucket | Goes where | Examples |
|---|---|---|
| **The constitution** (universal) | `tokens.css` | all `--ds-*` properties; `:focus-visible` ring; base `body` / `a` / `code` / heading resets |
| **Reusable primitives** (audited in) | `core.css` | `.ds-btn*`, `.ds-container`, `.ds-panel`, `.ds-display`, `.ds-lede`, `.ds-caption`, `.grid-label`, `.ds-mono-note`, `.kbd`, `.ds-back-link`, `.ds-page-header` |
| **Site furniture** (excluded) | stays in each app | `.hero` + `.blob-1/2`, `.experiment-grid`, `.experiment-card`, `.writing-list`, `.writing-item`, `.scorigami-chart-card` and chart internals, `.site-nav` / `.site-footer` as currently specced |

A furniture class may **graduate** into `core.css` later only after it proves
reusable across more than one project. Furniture does not start in the package.

### Package contents

- **`tokens.css`** — the constitution. Pure CSS custom properties + focus ring +
  base element resets. Zero framework assumptions. The single source of truth;
  no value is duplicated anywhere else in the package.
- **`core.css`** — audited reusable primitives. Imports `tokens.css`.
- **`tailwind.css`** — optional opt-in bridge for Tailwind v4 + shadcn projects.
  Contains the Tailwind `@theme` block (radius remap onto the three allowed
  radii; exposure of `--color-*` / `--font-*` utilities) **and** the shadcn HSL
  semantic variables (`--background`, `--primary`, `--border`, `--ring`,
  `--card`, `--destructive`, `--chart-1..5`, `--radius`). Started as a single
  combined file; split into Tailwind-only vs shadcn-only **only if** a
  Tailwind-without-shadcn project ever actually appears.
- **`DESIGN.md`** — the philosophy doc, lifted from dustinriley.com and
  de-scoped to be project-neutral (the source of truth for *why*).
- **Claude Skill** (`dustinriley-design`) — bundled in the package so any
  project's AI tooling applies the system consistently.

### Bridge generation (drift elimination)

The shadcn HSL variables in `tailwind.css` must be **generated from / version-
locked to `tokens.css`**, not hand-maintained. The hex→HSL duplication that
currently exists in scorigami's `globals.css` must not survive the extraction.
(Implementation plan to choose: build-time generation script vs. a single
authoring format that emits both — decided during planning, not here.)

## Consumption

```css
/* plain CSS / Astro / anything */
@import "@dustinriley/design/tokens.css";
@import "@dustinriley/design/core.css";

/* Tailwind v4 + shadcn projects additionally: */
@import "@dustinriley/design/tailwind.css";
```

`tokens.css` stays framework-free so non-Tailwind projects never receive
Tailwind-shaped CSS. "Optional" refers to composability, not expected frequency
— Tailwind projects will import the bridge routinely; the cost is one import
line.

## Distribution

Public npm, scope `@dustinriley/design`. The design system is already public via
dustinriley.com, so there is no value in access control, and public npm is the
lowest-friction install for any future project.

## Migration & validation

Extraction is not complete until both existing consumers are converted —
otherwise the package is untested and a third copy has been created.

1. Extract canonical CSS from dustinriley.com into a new standalone package
   repo. Build the `tokens` / `core` / `tailwind` tiers. Generate the bridge
   from tokens.
2. **Convert dustinriley.com** to consume the package. Sanity check: rendered
   output is pixel-identical to today — the package must reproduce the canonical
   source exactly. (Done first because it is the lower-risk check.)
3. **Convert scorigami** to consume the package: replace the hand-copied
   `:root` token block and bridge with the package imports. **Then** delete
   leaked site furniture (`.hero`/blobs, and `.experiment-grid` /
   `.writing-list` *only after grep confirms they are unused*). Done second
   because it is the harder, higher-value test and surfaces the curation
   questions.
4. Out of scope: any non-design-system refactor in either app.

## Spec & repo locations

- This spec lives in `dustinriley.com/docs/superpowers/specs/` because
  dustinriley.com is the canonical source and already follows the
  `docs/superpowers/` convention; the package repo does not exist yet.
- The package itself will live in its own new repository (not a monorepo with
  the apps), consumed by both apps and future projects via public npm.

## Open questions deferred to implementation planning

- Exact mechanism for generating the shadcn HSL bridge from `tokens.css`.
- Package build tooling / publish workflow (versioning, CI).
- Whether `DESIGN.md` de-scoping requires content edits beyond removing
  dustinriley.com-specific references.

---

## Addendum 2026-05-16 — base resets are not tokens (post-implementation correction)

**Problem found after shipping 0.1.0:** dustinriley.com showed visual
regressions (every link underlined, article code re-themed, non-responsive
headings). Root cause: the original plan put "base body/a/code/heading resets"
into `tokens.css`, sourced from scorigami's `globals.css`. Consumers import
`tokens.css` **unlayered**; in the CSS cascade unlayered rules beat every
`@layer`, so those resets overrode the consumers' own layered component/prose
rules (e.g. `.site-nav a {text-decoration:none}`, Tailwind `prose`). The resets
themselves were the shared system's own rules — the defect was their *unlayered
delivery via tokens.css*, not their content.

**Correction:** Base element resets are project-opinionated, not tokens — but
the consumption contract must be **uniform across every app** (no per-app
"do you have your own base layer?" judgment, since app #3+ are coming).
- `tokens.css` = `:root` custom properties + `:focus-visible` ONLY. Cascade-safe
  to import anywhere/unlayered.
- New `@dustin-riley/design/reset.css` carries the element resets, **wrapped
  internally in `@layer base`** (the same base layer Tailwind v4 defines). Every
  consuming app imports it the same way — `@import "@dustin-riley/design/reset.css";`
  — with no `@layer` wrapper to remember and no footgun: app `@layer
  components`/`utilities`, prose/typography plugins, and unlayered app CSS all
  win over it automatically. It only sets the baseline where nothing else applies.
- **No legacy exception.** dustinriley.com is normalized to the same contract:
  its duplicate base element rules (`body`/`a`/`code`/heading `font-*`) are
  removed from `src/styles/design-system.css`; it imports `reset.css` like every
  other app. Its app-owned, intentionally-different rules stay where they belong
  (responsive heading sizes in `base.css`; `.ds-article .article-body a`,
  nav/footer/button `text-decoration:none` in `@layer components` — all of which
  outrank `reset.css`'s `@layer base`).
- Uniform forward contract for any app N: `tokens` + `core` + `reset`
  (+ `tailwind` if Tailwind/shadcn). Shipped as 0.1.1.

**Process flaw:** Task 7's "equivalence oracle" diffed only rendered HTML, so it
was structurally blind to a pure-CSS cascade regression and the per-task +
holistic reviews all passed. Verification for consumer conversions MUST include
a computed-style/visual check (key elements: link `text-decoration`, code block
rendering, responsive heading sizes), not an HTML diff alone.
