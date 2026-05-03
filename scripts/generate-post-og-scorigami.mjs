#!/usr/bin/env node
/**
 * Regenerate public/images/posts/scorigami-grid.png (1200x630).
 *
 * Hero/share image for the College Football Scorigami blog post.
 * The grid IS the image — oversized cells in burnt-orange intensity ramp on
 * warm canvas, with a subtle brand mark. Title/description are already on
 * the post and in OG meta, so the image avoids duplicating them.
 *
 * Intensities are hand-painted: lighter empties + a dense cluster in the
 * lower-right (the common-score zone in real scorigami data).
 *
 * Usage:
 *   node scripts/generate-post-og-scorigami.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FONTS = [
  {
    file: "outfit-600.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-600-normal.ttf",
  },
];

const fontDir = join(tmpdir(), "dustinriley-og-fonts");
if (!existsSync(fontDir)) mkdirSync(fontDir, { recursive: true });
for (const f of FONTS) {
  const path = join(fontDir, f.file);
  if (!existsSync(path)) {
    process.stdout.write(`fetch ${f.file}... `);
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`failed to fetch ${f.url}: ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    console.log("ok");
  }
}

const W = 1200;
const H = 630;

// 6 cols × 3 rows of oversized cells. 18 cells total — "a handful".
const COLS = 6;
const ROWS = 3;
const CELL = 168;
const GAP = 14;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;     // 1078
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;     // 532
const GRID_X = Math.round((W - GRID_W) / 2);       // 61
const GRID_Y = Math.round((H - GRID_H) / 2);       // 49

// Pattern: empty cells scattered like a real scorigami chart, dense burnt-
// orange cluster in lower-right (common scores), lighter periphery.
//                w0    w1    w2    w3    w4    w5
const PATTERN = [
  /* l=0 */     [0.18, 0.30, 0.00, 0.45, 0.22, 0.00],
  /* l=1 */     [0.00, 0.50, 0.75, 1.00, 0.62, 0.28],
  /* l=2 */     [0.32, 0.00, 0.58, 0.88, 0.95, 0.55],
];

// Build cell rects
const cells = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const intensity = PATTERN[r][c];
    const x = GRID_X + c * (CELL + GAP);
    const y = GRID_Y + r * (CELL + GAP);
    const fill =
      intensity === 0
        ? "#EDE4D3" // surface-sunken
        : `rgba(184, 84, 28, ${(0.16 + intensity * 0.84).toFixed(3)})`;
    cells.push(
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="8" fill="${fill}"/>`
    );
  }
}

// Brand mark sits in the bottom-right gutter — small, present but not loud.
const BRAND_DOT_X = 1000;
const BRAND_Y = 600;
const DOT_R = 9;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="b1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C9922B" stop-opacity="0.28"/>
      <stop offset="70%" stop-color="#C9922B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#B8541C" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#B8541C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#FAF6F0"/>
  <circle cx="${W}" cy="0" r="380" fill="url(#b1)"/>
  <circle cx="0" cy="${H}" r="320" fill="url(#b2)"/>

  ${cells.join("\n  ")}

  <!-- Brand mark, bottom-right gutter -->
  <circle cx="${BRAND_DOT_X}" cy="${BRAND_Y}" r="${DOT_R}" fill="#B8541C"/>
  <text x="${BRAND_DOT_X + 18}" y="${BRAND_Y + 7}"
        font-family="Outfit SemiBold"
        font-size="22"
        fill="#1F1A14"
        letter-spacing="-0.4">dustinriley</text>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    fontFiles: FONTS.map((f) => join(fontDir, f.file)),
    loadSystemFonts: false,
  },
  fitTo: { mode: "width", value: W },
});
const png = resvg.render().asPng();
const outPath = "public/images/posts/scorigami-grid.png";
writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
