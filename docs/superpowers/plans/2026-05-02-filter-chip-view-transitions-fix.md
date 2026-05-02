# Filter chip View Transitions fix — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/about` timeline filter chips survive Astro `ClientRouter` soft navigations.

**Architecture:** Wrap the existing inline `<script>` body in `src/pages/about.astro` in a `setup()` function and register it as the sole `astro:page-load` listener. Document is never replaced by `ClientRouter`, so the listener persists across navigations. No markup or CSS changes.

**Tech Stack:** Astro 5.10, TypeScript (inline `<script>` is bundled by Astro/Vite), `astro:transitions` `ClientRouter`.

**Spec:** `docs/superpowers/specs/2026-05-02-filter-chip-view-transitions-fix-design.md`

**Note on testing:** This repo has no test framework installed (no Playwright, Vitest, Jest). Adding one for a 3-line refactor is out of scope and inconsistent with how the rest of `/about` was built. Verification is manual browser-based, matching the codebase's existing pattern.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/pages/about.astro` | Modify lines 146-182 | Wire up filter chips so they survive `astro:page-load` |

No new files. No CSS or markup changes.

---

### Task 1: Refactor the inline script to use `astro:page-load`

**Files:**
- Modify: `src/pages/about.astro:146-182`

- [ ] **Step 1: Replace the script block**

Open `src/pages/about.astro`. Replace the entire current `<script>` block (lines 146-182) with the version below. The body is unchanged — it has only been wrapped in a named `setup` function and bound to `astro:page-load` instead of running at module top level.

```astro
<script>
  // The site mounts <ClientRouter /> in Base.astro, so this runs on every
  // soft navigation that lands on /about, not just the first page load.
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
</script>
```

Notes for the engineer:
- `setup` is intentionally **not** invoked directly. With `ClientRouter` mounted, `astro:page-load` fires on the initial page render too. Calling `setup()` explicitly in addition would attach two click listeners to every chip, making each click cancel itself out (toggle in, then out).
- All `const`s stay scoped inside `setup` so each invocation closes over the current page's DOM. Module-level `const root = ...` would close over a stale snapshot.
- The early return when `.timeline-root` is missing is what makes this safe to fire on every page navigation, not just `/about`.

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: no new errors introduced by this change. (The repo uses `@astrojs/check` per `package.json`.) If pre-existing errors are present, ignore them — only confirm none are inside `src/pages/about.astro`.

- [ ] **Step 3: Start the dev server**

Run: `yarn dev` (or `npm run dev`)
Expected: server boots, prints a local URL (typically `http://localhost:4321`).

- [ ] **Step 4: Verify initial-load behavior**

Open `http://localhost:4321/about` in a browser. Verify:
- All 22 entries render.
- Count reads "22 of 22 moments".
- Clicking the "work" chip hides work entries and updates the count to a smaller number.
- Clicking it again restores them.

If any of those fail, check the browser console for errors before proceeding.

- [ ] **Step 5: Verify View Transitions soft-nav behavior — the actual bug fix**

This is the regression scenario the fix is targeting.

1. From `/about`, click the site logo / nav link to navigate to `/` (the home page) without a hard reload. The URL should change without the page-load spinner spinning a full reload.
2. From `/`, click the nav link back to `/about`.
3. Click any chip on the freshly-navigated `/about`. It must filter and update the count.

Without the fix, step 3 would do nothing (chips inert). With the fix, chips work identically to first load.

If chips don't respond on step 3, open DevTools and confirm `astro:page-load` is firing — `document.addEventListener("astro:page-load", () => console.log("fired"))` in the console, then nav away and back.

- [ ] **Step 6: Verify hard-reload still works**

Hard-reload `/about` (Cmd+Shift+R / Ctrl+Shift+R). Click chips. Behavior must be identical to step 4. This guards against the double-listener regression noted above.

- [ ] **Step 7: Verify keyboard accessibility**

Tab into the filter chip group. Press Space or Enter on a chip. The chip must toggle its category. (Native `<button>` keyboard behavior — the listener on `click` covers Space/Enter activation automatically.)

- [ ] **Step 8: Stop the dev server and commit**

Stop `yarn dev` (Ctrl+C).

```bash
git add src/pages/about.astro docs/superpowers/specs/2026-05-02-filter-chip-view-transitions-fix-design.md docs/superpowers/plans/2026-05-02-filter-chip-view-transitions-fix.md
git commit -m "$(cat <<'EOF'
Fix /about filter chips breaking after View Transitions soft nav

The inline <script> on the about page was attaching click listeners
once at module evaluation time. With <ClientRouter /> mounted in
Base.astro, soft navigations replace the page DOM, so on the second
visit to /about the chips rendered without listeners and clicks did
nothing. Wrap the setup in a function bound to astro:page-load so
listeners are reattached on every navigation that lands on the page.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Note: the spec and plan docs are also staged in this commit so the design rationale lands with the change. If the project conventionally separates docs from code commits, split into two commits instead.

---

## Self-review

**Spec coverage:**
- "Wrap the script body in `setup()`" → Task 1 Step 1. ✓
- "Bind to `astro:page-load`" → Task 1 Step 1, last line. ✓
- "No markup, no CSS, no behavior change" → no other files modified. ✓
- Verification plan steps 1-6 in the spec → Task 1 Steps 2-7. ✓
- Risk: "double-attached listeners on initial load" → mitigated by single-listener form, called out in the inline comment in Step 1. ✓

**Placeholder scan:** None.

**Type consistency:** `setup`, `getActive`, `setActive`, `total`, `chips`, `countEl`, `root` — all match between the spec and the plan. The single behavioral identifier change vs. the existing code is wrapping in `setup` and removing the top-level `if (root)` (the early-return inside `setup` replaces it).

**Scope check:** Single file, single function-shaped change, single commit. Appropriately scoped for one plan.
