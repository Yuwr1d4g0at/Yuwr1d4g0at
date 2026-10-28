// Shared SVG helpers: palette, embedded pixel fonts, panel frames, sprites.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const C = {
  bg: '#1a1c2c',
  border: '#f4f4f4',
  shadow: '#29366f',
  text: '#f4f4f4',
  muted: '#94b0c2',
  dim: '#566c86',
  slot: '#333c57',
  slotLocked: '#222539',
  yellow: '#ffcd75',
  green: '#a7f070',
  greenDark: '#38b764',
  teal: '#257179',
  blue: '#41a6f6',
  blueDark: '#3b5dc9',
  orange: '#ef7d57',
  red: '#b13e53',
  pink: '#ff7eb6',
  purple: '#8f5fd6',
};

const font = (file) => readFileSync(join(ROOT, 'fonts', file)).toString('base64');
const FONT_CSS =
  `@font-face{font-family:QuestHeading;src:url(data:font/woff2;base64,${font('QuestHeading.woff2')}) format('woff2')}` +
  `@font-face{font-family:QuestBody;src:url(data:font/woff2;base64,${font('QuestBody.woff2')}) format('woff2')}` +
  `.h{font-family:QuestHeading,monospace}.b{font-family:QuestBody,monospace}`;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const clip = (s, n) => (s.length > n ? s.slice(0, n - 3).trimEnd() + '...' : s);

// Text typed by visitors: drop control characters and stacked combining marks.
export const cleanText = (s) =>
  String(s ?? '')
    .normalize('NFKC')
    .replace(/\p{M}/gu, '')
    .replace(/\p{C}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const f4 = (n) => Number(n.toFixed(4));

export function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${FONT_CSS}</style>
${body}
</svg>
`;
}

// A pixel panel: offset shadow, dark fill, chunky white border.
export function panel(w, h) {
  return `<rect x="12" y="12" width="${w - 16}" height="${h - 16}" fill="${C.shadow}"/>
<rect x="2" y="2" width="${w - 16}" height="${h - 16}" fill="${C.bg}" stroke="${C.border}" stroke-width="4"/>`;
}

export const heading = (text, x = 30, y = 50, color = C.yellow) =>
  `<text x="${x}" y="${y}" class="h" font-size="13" fill="${color}">${esc(text)}</text>`;

export const subheading = (text, x = 834, y = 50, color = C.green) =>
  `<text x="${x}" y="${y}" class="h" font-size="11" fill="${color}" text-anchor="end">${esc(text)}</text>`;

// Draws a sprite given as rows of characters; each character maps to a color
// in `palette` and anything else is transparent. `rowOffset` lets overlays
// (hats, scarves) sit above row 0 of the sprite they decorate.
export function sprite(rows, palette, x, y, px, rowOffset = 0) {
  let out = '';
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (palette[ch]) {
        out += `<rect x="${x + c * px}" y="${y + (r + rowOffset) * px}" width="${px}" height="${px}" fill="${palette[ch]}"/>`;
      }
    })
  );
  return out;
}

// Deterministic pseudo-random numbers so generated files only change when data does.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
