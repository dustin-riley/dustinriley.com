# Timeline filter chip — View Transitions fix

**Date:** 2026-05-02
**Branch:** `dustin/update-about-me`
**Files affected:** `src/pages/about.astro` (script block only)

## Problem

The `/about` page renders a category-filtered timeline of life events. Filter chips at the top of the timeline toggle visibility of entries. Their click handlers are wired up by an inline `<script>` block at the bottom of `src/pages/about.astro`.

The site's root layout (`src/layouts/Base.astro:8,87`) mounts Astro's `ClientRouter`, which intercepts internal navigations and swaps page content client-side. Inline module scripts are bundled and run **once per session** — they do not re-execute on subsequent soft navigations.

The current script attaches listeners directly to the `.tl-chip` elements that exist at first page load:

```js
const chips = root.querySelectorAll<HTMLButtonElement>(".tl-chip");
// ...
chips.forEach((chip) => {
  chip.addEventListener("click", () => { /* ... */ });
});
```

After a soft navigation away from `/about` and back, those original elements are discarded. The new chips render correctly but have no listeners. Clicking a chip does nothing.

## Goal

Make the filter chip wiring survive Astro `ClientRouter` soft navigations, with the smallest viable change. No markup change, no CSS change, no behavior change for users on first load or with JavaScript disabled.

## Non-goals

- Pure-CSS filter rewrite. (Considered and rejected as out of scope for this fix.)
- Empty-state handling when all chips are deselected. (Tracked separately; not in scope.)
- Migrating timeline data from `src/config/timeline.json` into a content collection. (Separate concern.)
- Any change to the WCAG `--ds-primary`-as-text contrast issue flagged in code review. (Separate fix.)

## Design

Wrap the script body in a `setup()` function. Call it once on initial load, then bind it to Astro's `astro:page-load` event.

```js
const setup = () => {
  const root = document.querySelector<HTMLElement>(".timeline-root");
  if (!root) return;

  const chips = root.querySelectorAll<HTMLButtonElement>(".tl-chip");
  const countEl = root.querySelector<HTMLElement>(".count");
  const total = countEl ? Number(countEl.dataset.total ?? 0) : 0;

  const getActive = (): string[] =>
    (root.dataset.activeCats ?? "").split(/\s+/).filter(Boolean);

  const setActive = (cats: string[]) => {
    root.dataset.activeCats = cats.join(" ");
    const active = new Set(cats);
    let visible = 0;
    root.querySelectorAll<HTMLElement>(".tl-entry").forEach((el) => {
      if (active.has(el.dataset.cat ?? "")) visible++;
    });
    if (countEl) countEl.textContent = `${visible} of ${total} moments`;
    chips.forEach((chip) => {
      const cat = chip.dataset.cat ?? "";
      chip.setAttribute("aria-pressed", String(active.has(cat)));
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const cat = chip.dataset.cat ?? "";
      if (!cat) return;
      const cats = getActive();
      const idx = cats.indexOf(cat);
      if (idx >= 0) cats.splice(idx, 1);
      else cats.push(cat);
      setActive(cats);
    });
  });
};

document.addEventListener("astro:page-load", setup);
```

Note: `astro:page-load` fires on the initial page load when `ClientRouter` is mounted (it is, in `Base.astro`). The event listener alone covers both first load and subsequent soft navigations — calling `setup()` explicitly in addition would double-attach listeners on initial load and cause every chip click to register twice (net-zero toggle). The single-listener form is the canonical Astro pattern.

### Why this works

- `setup()` re-queries the DOM each time it runs, so the `root`, `chips`, and `countEl` references always point at the current page's elements.
- All locals are scoped inside `setup()`. There are no module-level `const`s closing over a stale DOM snapshot.
- `document` is never replaced by `ClientRouter`, so the `astro:page-load` listener registered on it persists across navigations.
- The first call (`setup()`) handles the initial-load case. The event listener handles every subsequent navigation back into `/about`.
- On non-`/about` pages, `setup()` returns early because `.timeline-root` doesn't exist.

### Why not `data-astro-rerun`

Adding `data-astro-rerun` to the `<script>` tag would re-execute the entire module on every navigation. Functionally equivalent, slightly smaller diff. Rejected for clarity: `astro:page-load` makes the intent ("re-wire on each soft nav") explicit at the call site. The official Astro docs use the `astro:page-load` pattern in their View Transitions guide, so this matches what reviewers will expect.

### Why not document-level click delegation

Attaching a single `click` listener to `document` would also survive navigations and avoid the re-wiring problem. Rejected because it would still leave the count-update path stateful and split state management between SSR-rendered `data-active-cats` and runtime delegation. The `astro:page-load` pattern keeps all the logic in one place and matches Astro idiom.

## Verification plan

1. Build the site (`yarn build` or equivalent) — confirm no TypeScript errors.
2. Run `yarn dev`, load `/about`, click chips → entries filter correctly, count updates correctly.
3. From `/about`, navigate to `/` (or any other internal page) via a normal link → then back to `/about` via a normal link.
4. Click chips on the second visit. They must still filter and update the count. (Without the fix, they are inert.)
5. Hard-reload `/about` directly → behavior identical to step 2.
6. Tab through chips with the keyboard, press Space/Enter → toggling still works (native button behavior).

## Risks & mitigations

- **Multiple listeners on the same chip across navigations.** Because `setup()` re-queries `.tl-chip` each time it runs, listeners are only attached to the *current* DOM's chips. Old elements are garbage-collected with the previous DOM. No duplication.
- **`astro:page-load` not firing on the initial load.** Only a concern if `ClientRouter` is removed. With `ClientRouter` mounted in `Base.astro:87`, the initial page load fires `astro:page-load` after the document is ready. If `ClientRouter` is ever removed in a future change, the chips would silently stop working on first load — worth flagging in the implementation comment.
- **Browsers without JavaScript.** Page renders fully via SSR with all 22 entries visible (initial state). No regression: filtering simply doesn't work, which is the same behavior as today.

## Acceptance criteria

- After a `/about → / → /about` soft navigation cycle, clicking any filter chip toggles its category and updates the count.
- No console errors on any page.
- No visual change on initial load.
- Net script size in `about.astro` increases by no more than ~5 lines.
