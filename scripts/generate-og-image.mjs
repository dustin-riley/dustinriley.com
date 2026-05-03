#!/usr/bin/env node
/**
 * Regenerate public/images/og-image.png (1200x630).
 *
 * Renders SVG with embedded font files via resvg, so the wordmark uses real
 * Outfit / DM Sans / JetBrains Mono instead of system-sans fallbacks.
 *
 * Usage:
 *   node scripts/generate-og-image.mjs
 *
 * Edits: change the lede text or layout below. Tokens come from DESIGN.md.
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
  {
    file: "dmsans-400.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-normal.ttf",
  },
  {
    file: "jbmono-500.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-500-normal.ttf",
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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="b1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C9922B" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#C9922B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#B8541C" stop-opacity="0.22"/>
      <stop offset="70%" stop-color="#B8541C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#FAF6F0"/>
  <circle cx="1080" cy="120" r="320" fill="url(#b1)"/>
  <circle cx="180" cy="540" r="280" fill="url(#b2)"/>

  <circle cx="124" cy="266" r="32" fill="#B8541C"/>
  <text x="180" y="305"
        font-family="Outfit SemiBold"
        font-size="110"
        fill="#1F1A14"
        letter-spacing="-2.4">dustinriley</text>

  <text x="96" y="410"
        font-family="DM Sans"
        font-size="36"
        fill="#6B5F50">small things at the edges of software</text>
  <text x="96" y="460"
        font-family="DM Sans"
        font-size="36"
        fill="#6B5F50">and whatever hobby I&apos;m deep in this month.</text>

  <text x="96" y="568"
        font-family="JetBrains Mono Medium"
        font-size="22"
        fill="#6B5F50"
        letter-spacing="2">DUSTINRILEY.COM</text>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    fontFiles: FONTS.map((f) => join(fontDir, f.file)),
    loadSystemFonts: false,
  },
  fitTo: { mode: "width", value: W },
});

const png = resvg.render().asPng();
const outPath = "public/images/og-image.png";
writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
