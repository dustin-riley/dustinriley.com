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

---

## Addendum 2 2026-05-16 — the layer must be set at the consumer import

The first addendum's plan (wrap resets in `@layer base` *inside* reset.css and
import it plainly) was **proven wrong by build evidence**. Lightning CSS (used
by both Astro `@tailwindcss/vite` and Next + Tailwind v4) **flattens a
package-internal `@layer` when the file is pulled in via `@import`** — the
rules end up *unlayered*, which beats every `@layer` and re-underlined every
link in both apps. A consumer's own `@layer components {}` block survives;
an imported file's `@layer` does not.

**Corrected uniform contract:** the cascade layer must be declared at the
**consumer's import statement**:

    @import "@dustin-riley/design/reset.css" layer(base);

This is still one uniform line for every app (no per-app judgment), and the
layer assignment is reliably honored because it is the consumer's own
`@import`. `reset.css` therefore ships as **plain element rules** (no internal
`@layer`, no `@import "./tokens.css"`); the consumer owns layering and already
imports tokens. Verified with a deterministic `@layer`-containment parser of
the built CSS (reset `a` → `base`; nav/footer/`.ds-article` links + Shiki `pre
code` → `components`, which wins). Shipped: reset.css cleaned in 0.1.2; the
functional fix works on 0.1.1 too (it is purely the consumer import form).

**Process note:** verification must parse the *resolved `@layer` containment of
the competing rules in the built CSS* (or use real computed styles), not merely
confirm a rule/selector is present. "Rule exists" is not "rule wins."

---

## Addendum 3 2026-05-16 — final: `:where()` zero-specificity, plain import

Requiring consumers to write `layer(base)` (addendum 2) works but is still an
incantation to remember. Final approach: `reset.css` wraps every selector in
`:where()`, giving it **zero specificity (0,0,0)**. Any author rule — a bare
`a {}`, a component class, a prose/typography plugin — outranks it by normal
specificity, with **no `@layer` and no consumer-side layer assignment**. This
is deterministic per the CSS spec (not bundler-dependent like `@layer`), so it
survives Lightning CSS / any pipeline. `::selection` stays a plain rule
(pseudo-elements can't be `:where()`-wrapped; it is low-stakes and an app
`::selection` still wins by source order).

**Final uniform contract** (every app, plain import, nothing to remember):

    @import "@dustin-riley/design/tokens.css";
    @import "@dustin-riley/design/core.css";
    @import "@dustin-riley/design/reset.css";
    /* + @import "@dustin-riley/design/tailwind.css"; for Tailwind/shadcn */

Shipped in 0.1.2. `reset.css` is plain, self-contained (no internal `@layer`,
no `@import tokens`). Supersedes the addendum-2 `layer(base)` form; consumers
revert to the plain `@import` once on 0.1.2.

---

## Addendum 4 2026-05-16 — final architecture: no reset, no global underline

Addendum 3's `:where()`-but-still-separately-imported reset failed too: a
plainly-`@import`ed package file is **unlayered**, and unlayered beats every
`@layer` regardless of specificity — `:where()` zeroes specificity but not
layer origin. So an imported package reset always beat Tailwind Preflight
(`@layer base`) and app components (`@layer components`) → links underlined.

**Final, structural resolution (0.2.0):**
- There is **no separate `reset.css`** and no consumer `@layer`/`layer()`
  ceremony. Minimal base element styling (body, headings, mono code,
  `::selection`) folds into `core.css`, which apps already consume. Wrapped in
  `:where()` so it never out-specifies app rules within an origin.
- The system ships **no global link `text-decoration`**. Per DESIGN.md links
  are color-only; underline is an intentional, component-scoped app decision
  (e.g. `.ds-article .article-body a`, or the app's own Tailwind Typography
  `prose`). Tailwind Preflight's `a{text-decoration:inherit}` then keeps links
  un-underlined by default. Removing the conflicting declaration makes the
  regression **structurally impossible** rather than cascade-managed.
- Final contract, every app, nothing per-app:
  `tokens` + `core` (+ `tailwind` for Tailwind/shadcn).
- Legacy app quirks are fixed in the legacy app, not accommodated in the
  package (dustinriley.com `base.css`: headings → display font; line-height).

**Lesson:** don't ship a globally-applied opinionated declaration that a
consumer's chrome must fight; and verify cascades by parsing resolved
`@layer`/origin of competing rules in built CSS (or computed styles), never by
"the rule/selector exists."

---

## Addendum 5 2026-05-16 — no global `a` rule at all (color too)

Addendum 4 removed the global link *underline* but left
`:where(a){color:var(--ds-link)}` in core.css. Same defect, different
property: scorigami pulls core.css **unlayered** (via tailwind.css), so that
rule beat scorigami's `@layer components .site-nav a.nav-link{color:--ds-text}`
→ orange nav links; dustinriley.com imports core.css *inside* `@layer
components` so its nav rule won → black. The inconsistency exposed that any
global `a` declaration is wrong: `<a>` is simultaneously chrome (nav, brand,
footer, back-link) and content (prose links), so no single system-wide value
is correct, and unlayered delivery beats consumer layers regardless.

**Final rule (0.2.1):** core.css ships **no `a` rule whatsoever** — no color,
no decoration. Links inherit text color via Tailwind Preflight; link
color/underline is exclusively a component/prose decision the app makes
(`.ds-article .article-body a`, the app's `prose` plugin, `.nav-link.active`,
etc.). Enforced by a test asserting core.css contains no `:where(a)`/bare `a`
rule. Consumer note: a truly bare `<a>` (outside nav/prose/component context)
now inherits text color instead of `--ds-link` — intended; give such links a
component/utility class to opt into link color.
