# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design system — read this first

Before any UI, copy, or styling change, read **[DESIGN.md](./DESIGN.md)**. It is the source of truth for tokens, components, voice, motion, and accessibility constraints. The `--ds-*` token system and the reusable `.ds-*` primitives now ship from the **`@dustin-riley/design`** npm package — tokens imported in `src/styles/main.css` (`@import "@dustin-riley/design/tokens.css";`) and primitives via `@import "@dustin-riley/design/core.css";` at the top of `src/styles/design-system.css`. The token system is canonical — never hard-code hex / px values, never invent new colors / radii / shadows. (There is no longer a local `src/styles/tokens.css`.)

The design system is **owned by the `@dustin-riley/design` package**, not this repo. For its rationale, rules, contributor guidance, and the full root-cause history, read the package's own `DESIGN.md`, `CLAUDE.md`, and `docs/SPEC.md` (in `node_modules/@dustin-riley/design/` or github.com/dustin-riley/dustinriley-design). Design-system changes are made there and consumed here via the version bump — not patched locally.

Quick rules pulled forward so they don't get missed:

- **Sentence case everywhere. First person. No emoji.** "experiments", "writing", "about" — not "Experiments".
- **Three radii (8 / 16 / 999), three shadows (sm / md / lg, warm-tinted), one primary (`#B8541C`), two accents (ochre, teal).** Don't add more.
- **For text-as-link in burnt orange use `--ds-link`, not `--ds-primary`** — primary fails WCAG AA on the canvas. This is project-specific and easy to miss.
- **Color is never the only state signal** — pair with elevation, motion, or an icon.
- **Motion resolves under 300ms.** Use `--ds-ease-standard` with `--ds-duration-{fast,base,slow}`.
- Prefer extending the shared `.ds-*` primitives from `@dustin-riley/design/core.css` (see DESIGN.md → "Component anchors") over adding new ones. This site's own furniture lives in `src/styles/design-system.css`.

## Commands

```
npm install
npm run dev       # local Astro dev server with HMR
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run format    # prettier write across the repo (uses prettier-plugin-astro + prettier-plugin-tailwindcss)
```

There is no test suite and no separate lint command — Prettier is the only automated formatter. `npm run build` runs Astro's type / content checks.

Netlify is the deploy target (`netlify.toml` runs `yarn build` on push; `dist/` is the publish dir). The site is static — no SSR runtime.

## Architecture

### Framework + key dependencies

- **Astro 5** with the React, MDX, and sitemap integrations.
- **Tailwind CSS 4** wired through `@tailwindcss/vite` (no PostCSS config) — see `src/styles/main.css` for the entry that pulls everything together.
- **Shiki** (`one-dark-pro` theme) for code highlighting in Markdown / MDX.
- **MDX shortcodes** are auto-imported via `astro-auto-import` (configured in `astro.config.mjs`): `Button`, `Accordion`, `Notice`, `Video`, `Youtube`, `Tabs`, `Tab`. Authors don't need to import them in `.mdx` files.

### Two stacked styling systems — important context

The repo carries **two layered style systems** because it was forked from the Bookworm Astro theme and migrated to a custom design system. Both are still active:

1. **Design system (canonical, prefer this)** — the `--ds-*` CSS custom properties and reusable `.ds-*` primitives come from the **`@dustin-riley/design`** package: tokens imported in `src/styles/main.css` (`@import "@dustin-riley/design/tokens.css";`), primitives via `@import "@dustin-riley/design/core.css";` at the top of `src/styles/design-system.css`. `src/styles/design-system.css` itself now holds **only this site's furniture** (hero/blobs, experiment grid, writing list, site nav/footer, article, pager, related, search input, chip cloud) — no tokens, no shared primitives. There is no local `src/styles/tokens.css`. Site-furniture class names are semantic (`.hero`, `.experiment-card`, `.writing-item`, `.site-nav`).
2. **Legacy Tailwind theme** — `src/tailwind-plugin/tw-theme.mjs` reads `src/config/theme.json` and exposes `--color-*` / `--text-h1` etc. to Tailwind utilities. Drives `.btn`, `.btn-primary`, `.container`, `.nav-link` font-weight, `.content` (prose), the older social-icons utilities. Treat as deprecated; refactor opportunistically when touching surrounding code.

If you find yourself copying a legacy class into new code, that's a signal to use the design-system equivalent instead.

### Content collections

`src/content.config.ts` defines four Zod-validated collections:

- `posts` — Markdown / MDX with `title, date, description, image, categories[], authors[], tags[], draft`. Files in `src/content/posts/`.
- `pages` — generic Markdown pages. Routed via `src/pages/[regular].astro`.
- `about` — single-doc collection rendered by `src/pages/about.astro`.
- `authors` — author profiles with social links.

`src/lib/contentParser.astro` exports `getSinglePage(name)` — the standard accessor. **It strips the `.md` / `.mdx` extension from `id`** so URLs are clean, and **filters out anything with `draft: true`**. Always go through `getSinglePage` rather than `getCollection` directly so drafts and slugs behave correctly.

### Routing

File-based, mostly static-built:

- `src/pages/index.astro` — home (Hero + ExperimentGrid + 5 most recent posts).
- `src/pages/[regular].astro` — catch-all that renders any post or page slug. Posts use `PostSingle.astro`, generic pages use `Default.astro`.
- `src/pages/writing/[...page].astro` — paginated writing index.
- `src/pages/tags/`, `categories/`, `authors/` — taxonomy index + `[single]` detail.
- `src/pages/experiments.astro`, `about.astro`, `404.astro`, `search.astro` — single-purpose pages.
- `src/pages/rss.xml.js` — RSS feed of posts.

### Path aliases (from `tsconfig.json`)

```
@/components/*  → src/layouts/components/*
@/shortcodes/*  → src/layouts/shortcodes/*
@/partials/*    → src/layouts/partials/*
@/helpers/*     → src/layouts/helpers/*
@/*             → src/*
```

Note that "components", "shortcodes", and "partials" all live under `src/layouts/` despite the alias names — that's a quirk inherited from the Bookworm template.

### Layout shell

`src/layouts/Base.astro` is the document. It loads Google Fonts (Outfit / DM Sans / JetBrains Mono) non-render-blocking, wires SEO/OG/Twitter meta from `src/config/config.json` + page props, mounts `ClientRouter` (Astro view transitions), and wraps the `<slot />` with the global `Header` + `Footer` partials.

### Config-driven content

Several site behaviors are JSON-driven so they can be edited without touching components:

- `src/config/config.json` — site title, base URL, meta defaults, pagination size.
- `src/config/menu.json` — main nav items.
- `src/config/social.json` — social URLs used in the footer.
- `src/config/experiments.json` — experiment cards rendered by `ExperimentGrid.astro`.
- `src/config/theme.json` — feeds the legacy Tailwind plugin (colors, font sizes). Editing this changes the Tailwind utility values but **not** the design-system tokens — those live in the `@dustin-riley/design` package, not in this repo.

## Plans / specs

In-flight design specs and implementation plans live under `docs/superpowers/{specs,plans}/`. For non-trivial changes write the spec/plan there first.

The `2026-05-16-design-system-package*` spec/plan here are the **historical extraction record** of how this site adopted `@dustin-riley/design`. The living, canonical design-system spec + decision history now lives **in the package repo** (`@dustin-riley/design` → `docs/SPEC.md`); update it there, not here.
