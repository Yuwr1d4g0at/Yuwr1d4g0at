// One function per image on the profile. Each returns a complete SVG string.

import { C, esc, clip, cleanText, f4, svg, panel, heading, subheading, sprite, seeded } from './svg.mjs';
import {
  GOAT,
  GOAT_COLORS,
  GOAT_EYE,
  GOAT_TAIL,
  EVOLUTIONS,
  EVOLUTION_COLORS,
  MINI_GOAT,
  HEART,
  PUMPKIN,
  PUMPKIN_COLORS,
  MOON,
  MOON_COLORS,
  BAT_UP,
  BAT_DOWN,
  ICONS,
} from './sprites.mjs';
import { SHAPES, monsterPalette } from './monsters.mjs';

const loop = (attr, values, dur, extra = '') =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"${extra}/>`;

// ---------------------------------------------------------------- banner

function goat(x, y, px, level) {
  const unlocked = EVOLUTIONS.filter((e) => level != null && level >= e.level);
  const replaced = new Set(unlocked.map((e) => e.replaces).filter(Boolean));
  const gear = unlocked
    .filter((e) => !replaced.has(e.name))
    .map((e) => sprite(e.rows, EVOLUTION_COLORS, x, y, px, e.rowOffset))
    .join('');
  const eyeX = x + GOAT_EYE.col * px;
  const eyeY = y + GOAT_EYE.row * px;
  const tailX = x + GOAT_TAIL.col * px;
  const tailY = y + GOAT_TAIL.row * px;
  return `<g>${sprite(GOAT, GOAT_COLORS, x, y, px)}
<rect x="${eyeX}" y="${eyeY}" width="${px}" height="${px}" fill="${C.border}" opacity="0">${loop('opacity', '0;1;0', 4, ' keyTimes="0;0.9;0.95"')}</rect>
<rect x="${tailX}" y="${tailY}" width="${px}" height="${px}" fill="${C.border}">${loop('opacity', '1;0', 0.8)}</rect>
<rect x="${tailX + px}" y="${tailY}" width="${px}" height="${px}" fill="${C.border}">${loop('opacity', '0;1', 0.8)}</rect>
${gear}
<animateTransform attributeName="transform" type="translate" values="0 0;0 -6" dur="1.2s" calcMode="discrete" repeatCount="indefinite"/></g>`;
}

function falling(rand, count, W, H, make, { rise = false } = {}) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = Math.round(20 + rand() * (W - 60));
    const dur = (4 + rand() * 4).toFixed(1);
    const begin = (-rand() * 8).toFixed(1);
    const [from, to] = rise ? [`0 ${H + 20}`, '0 -40'] : ['0 -20', `0 ${H + 20}`];
    out += `<g>${make(x, i)}<animateTransform attributeName="transform" type="translate" from="${from}" to="${to}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
  }
  return out;
}

function seasonScene(season, W, H) {
  const rand = seeded(42);
  if (season === 'halloween') {
    const bat = (x, y, delay) => `<g>
<g>${sprite(BAT_UP, { X: C.dim }, x, y, 4)}${loop('opacity', '1;0', 0.5, ` begin="${delay}s"`)}</g>
<g opacity="0">${sprite(BAT_DOWN, { X: C.dim }, x, y, 4)}${loop('opacity', '0;1', 0.5, ` begin="${delay}s"`)}</g>
<animateTransform attributeName="transform" type="translate" values="0 0;-30 12;-10 24;20 10;0 0" dur="6s" begin="${delay}s" repeatCount="indefinite"/></g>`;
    return {
      back: sprite(MOON, MOON_COLORS, 610, 30, 4),
      front: `${bat(640, 120, 0)}${bat(710, 160, 0.25)}${bat(600, 70, 0.4)}
<g>${sprite(PUMPKIN, PUMPKIN_COLORS, 730, 222, 4)}${sprite(PUMPKIN, PUMPKIN_COLORS, 782, 234, 3)}</g>`,
      tagline: '- TRICK OR TREAT -',
    };
  }
  if (season === 'winter') {
    let ground = '';
    for (let x = 6; x < W - 18; x += 8) ground += `<rect x="${x}" y="${SCENE_H - 18 - Math.round(rand() * 2) * 4}" width="8" height="30" fill="${C.border}"/>`;
    return {
      back: '',
      front:
        falling(rand, 22, W, H, (x) => `<rect x="${x}" y="0" width="4" height="4" fill="${C.border}"/>`) +
        `<g opacity="0.9">${ground}</g>`,
      tagline: '- HAPPY HOLIDAYS -',
    };
  }
  if (season === 'valentine') {
    return {
      back: falling(rand, 10, W, H, (x) => sprite(HEART, { X: C.pink }, x, 0, 3), { rise: true }),
      front: '',
      tagline: '- SPREAD THE LOVE -',
    };
  }
  if (season === 'birthday') {
    const colors = [C.pink, C.yellow, C.blue, C.green, C.orange];
    return {
      back: '',
      front: falling(rand, 26, W, H, (x, i) => `<rect x="${x}" y="0" width="6" height="${i % 2 ? 6 : 3}" fill="${colors[i % colors.length]}"/>`),
      tagline: null,
    };
  }
  return { back: '', front: '', tagline: null };
}

const MOOD_ICONS = {
  happy: { rows: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], color: C.pink },
  ok: { rows: ['.....', '.....', 'X.X.X', '.....', '.....'], color: C.dim },
  sad: { rows: ['..X..', '.XXX.', '.XXX.', 'XXXXX', '.XXX.'], color: C.blue },
};

// A speech bubble over the goat's head showing how cared-for it is.
function moodBubble(mood, x, y) {
  const icon = MOOD_ICONS[mood];
  if (!icon) return '';
  return `<g><rect x="${x}" y="${y}" width="30" height="26" fill="${C.border}"/>
<rect x="${x + 4}" y="${y + 26}" width="6" height="4" fill="${C.border}"/><rect x="${x}" y="${y + 30}" width="4" height="4" fill="${C.border}"/>
${sprite(icon.rows, { X: icon.color }, x + 7, y + 6, 3)}
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3" dur="1.2s" calcMode="discrete" repeatCount="indefinite"/></g>`;
}

// A game-style dialog box along the bottom of the banner.
function encounterBox(monster, y) {
  const x = 22;
  const w = 820;
  const h = 84;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.border}" stroke="${C.dim}" stroke-width="4"/>
<text x="${x + 22}" y="${y + 34}" class="h" font-size="12" fill="${C.bg}">A WILD ${esc(monster.name)} APPEARED!</text>
<text x="${x + 22}" y="${y + 66}" class="b" font-size="24" fill="${C.slot}">${esc(monster.text)}</text>
<g>${sprite(SHAPES[monster.shape], monsterPalette(monster), x + w - 76, y + 17, 5)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -4" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>
<g>${sprite(['XXXXX', '.XXX.', '..X..'], { X: C.red }, x + w - 104, y + 62, 3)}${loop('opacity', '1;0', 0.8)}</g>`;
}

const SCENE_H = 290;

export function banner({ config, level, season, accountYears, mood, monster }) {
  const W = 880;
  const H = monster ? 400 : 300;
  const scene = seasonScene(season, W, H);
  const tagline =
    scene.tagline ?? (season === 'birthday' ? `- ${accountYears} YEARS ON GITHUB -` : '- PRESS START -');
  const stars = [
    [40, 30, C.yellow, 0],
    [230, 44, C.border, 0.4],
    [520, 26, C.blue, 0.8],
    [690, 250, C.border, 1.2],
    [560, 180, C.yellow, 0.2],
    [250, 262, C.green, 0.6],
    [440, 262, C.border, 1],
  ]
    .map(([x, y, fill, delay]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="${fill}">${loop('opacity', '1;0.2', 1.6, ` begin="${delay}s"`)}</rect>`)
    .join('\n');
  const hearts = [0, 1, 2].map((i) => sprite(HEART, { X: C.red }, 730 + i * 36, 30, 4)).join('');
  const next = EVOLUTIONS.find((e) => level == null || level < e.level);
  const evo = next ? `NEXT EVO: LV ${next.level}` : 'MAX EVO';

  const body = `${panel(W, H)}
<clipPath id="inner"><rect x="4" y="4" width="${W - 20}" height="${H - 20}"/></clipPath>
<g clip-path="url(#inner)">
${scene.back}
${stars}
${goat(36, 74, 10, level)}
${moodBubble(mood, 196, 30)}
<text x="830" y="80" class="h" font-size="9" fill="${C.muted}" text-anchor="end">${evo}</text>
${hearts}
<text x="250" y="88" class="h" font-size="12" fill="${C.green}">PLAYER 1</text>
<text x="250" y="134" class="h" font-size="28" fill="${C.pink}">${esc(config.displayName)}</text>
<text x="250" y="180" class="b" font-size="28" fill="${C.text}">CLASS: ${esc(config.class)}</text>
<text x="250" y="210" class="b" font-size="28" fill="${C.text}">ALIGNMENT: ${esc(config.alignment)}</text>
<text x="250" y="250" class="h" font-size="10" fill="${C.muted}">${esc(tagline)}${loop('opacity', '1;0', 1.2)}</text>
${scene.front}
${monster ? encounterBox(monster, SCENE_H) : ''}
</g>`;
  const encounter = monster ? ` A wild ${monster.name} appeared: ${monster.text}` : '';
  return svg(W, H, body, `Player 1: ${config.displayName}. Class: ${config.class}. Alignment: ${config.alignment}.${encounter}`);
}

// ---------------------------------------------------------------- bio + inventory

function sideHeight(config) {
  const bioH = 96 + config.bio.length * 32;
  const invH = 96 + Math.ceil(config.inventory.length / 3) * 88;
  return Math.max(bioH, invH);
}

export function bio(config) {
  const W = 430;
  const H = sideHeight(config);
  const lines = config.bio
    .map(
      (line, i) =>
        `<text x="30" y="${96 + i * 32}" class="b" font-size="26" fill="${C.text}"><tspan fill="${C.green}">&gt;</tspan> ${esc(line)}</text>`
    )
    .join('\n');
  return svg(W, H, `${panel(W, H)}\n${heading('BIO')}\n${lines}`, `Bio: ${config.bio.join('; ')}`);
}

export function inventory(config) {
  const W = 430;
  const H = sideHeight(config);
  const slotW = 112;
  const slotH = 72;
  const slots = config.inventory
    .map((item, i) => {
      const x = 28 + (i % 3) * (slotW + 14);
      const y = 70 + Math.floor(i / 3) * (slotH + 16);
      return `<rect x="${x}" y="${y}" width="${slotW}" height="${slotH}" fill="${C.slot}" stroke="${C.dim}" stroke-width="3"/>
<rect x="${x + slotW / 2 - 9}" y="${y + 12}" width="18" height="18" fill="${item.color}"/>
<rect x="${x + slotW / 2 - 9}" y="${y + 12}" width="6" height="6" fill="#ffffff" fill-opacity="0.45"/>
<text x="${x + slotW / 2}" y="${y + 56}" class="b" font-size="22" fill="${C.text}" text-anchor="middle">${esc(item.label)}</text>`;
    })
    .join('\n');
  return svg(W, H, `${panel(W, H)}\n${heading('INVENTORY')}\n${slots}`, `Inventory: ${config.inventory.map((i) => i.label).join(', ')}`);
}

// ---------------------------------------------------------------- stats

const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365, 500, 1000];
const nextMilestone = (v, list) => list.find((m) => m > v) ?? v;

export function stats(data) {
  const W = 880;
  const H = 300;
  const rows = [
    ['COMMITS', data?.commits, MILESTONES, C.greenDark],
    ['PULL REQS', data?.prs, MILESTONES, C.blue],
    ['STARS', data?.stars, MILESTONES, C.yellow],
    ['STREAK', data?.streak, STREAK_MILESTONES, C.orange],
  ];
  const segs = 28;
  const barX = 220;
  const out = rows
    .map(([label, value, list, color], i) => {
      const y = 100 + i * 42;
      const goal = value == null ? null : nextMilestone(value, list);
      const filled = value == null ? 0 : Math.min(segs, Math.round((value / goal) * segs));
      let bar = `<rect x="${barX - 6}" y="${y - 22}" width="${segs * 16 + 8}" height="28" fill="none" stroke="${C.dim}" stroke-width="3"/>`;
      for (let s = 0; s < segs; s++) {
        bar += `<rect x="${barX + s * 16}" y="${y - 16}" width="12" height="16" fill="${s < filled ? color : C.slot}"/>`;
      }
      const shown = value == null ? '??' : label === 'STREAK' ? `${value}d / ${goal}d` : `${value} / ${goal}`;
      return `<text x="30" y="${y}" class="b" font-size="28" fill="${C.text}">${label}</text>
${bar}
<text x="${barX + segs * 16 + 22}" y="${y}" class="b" font-size="26" fill="${value == null ? C.muted : C.text}">${shown}</text>`;
    })
    .join('\n');
  const lv = data ? `LV ${data.level}  XP ${data.xp}` : 'LV ??  XP ??';
  const foot = data
    ? `next goal shown on each bar · best streak ${data.bestStreak}d · updated ${data.updated}`
    : 'stats sync daily from github';
  const body = `${panel(W, H)}
${heading('STATS')}
${subheading(lv)}
${out}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">${esc(foot)}</text>`;
  const desc = data
    ? `Level ${data.level}, ${data.xp} XP. Commits ${data.commits}, pull requests ${data.prs}, stars ${data.stars}, current streak ${data.streak} days`
    : 'GitHub stats';
  return svg(W, H, body, desc);
}

// ---------------------------------------------------------------- achievements

export const ACHIEVEMENTS = [
  { name: 'FIRST STEPS', desc: '1 commit', icon: 'boot', color: C.orange, test: (d) => d.stats?.commits >= 1 },
  { name: 'COMMIT CRITTER', desc: '50 commits', icon: 'star', color: C.green, test: (d) => d.stats?.commits >= 50 },
  { name: 'CENTURY', desc: '100 commits', icon: 'trophy', color: C.yellow, test: (d) => d.stats?.commits >= 100 },
  { name: 'BRANCHING OUT', desc: '1 pull request', icon: 'branch', color: C.blue, test: (d) => d.stats?.prs >= 1 },
  { name: 'MERGE MASTER', desc: '25 pull requests', icon: 'merge', color: C.purple, test: (d) => d.stats?.prs >= 25 },
  { name: 'ON FIRE', desc: '7 day streak', icon: 'flame', color: C.orange, accent: C.yellow, test: (d) => d.stats?.bestStreak >= 7 },
  { name: 'UNSTOPPABLE', desc: '30 day streak', icon: 'flame', color: C.blueDark, accent: C.blue, test: (d) => d.stats?.bestStreak >= 30 },
  { name: 'STARGAZER', desc: 'earn 1 star', icon: 'star', color: C.yellow, test: (d) => d.stats?.stars >= 1 },
  { name: 'BUILDER', desc: '3 public repos', icon: 'house', color: C.muted, test: (d) => d.publicRepos >= 3 },
  { name: 'OLD GOAT', desc: '3 yrs on github', icon: 'horn', color: '#c98a4b', test: (d) => d.accountYears >= 3 },
  { name: 'GUEST STAR', desc: '1 guestbook sign', icon: 'scroll', color: C.pink, accent: C.bg, test: (d) => d.guestbook.length >= 1 },
  { name: 'LEVEL 10', desc: 'reach level 10', icon: 'crown', color: C.yellow, accent: C.red, test: (d) => d.stats?.level >= 10 },
  { name: 'WELL FED', desc: 'goat fed 10x', icon: 'heart', color: C.pink, test: (d) => d.care?.fed >= 10 },
  { name: 'BUG SQUASHER', desc: 'defeat 1 boss', icon: 'bugIcon', color: C.green, test: (d) => d.boss?.slain.length >= 1 },
  { name: 'NIGHT OWL', desc: '10 commits 0-5am', icon: 'moon', color: C.yellow, test: (d) => d.activity?.night >= 10 },
  { name: 'EARLY BIRD', desc: '10 commits 5-8am', icon: 'sun', color: C.orange, accent: C.yellow, test: (d) => d.activity?.early >= 10 },
];

export function achievements(data) {
  const W = 880;
  const cols = 4;
  const cellW = 196;
  const cellH = 72;
  const gap = 12;
  const rows = Math.ceil(ACHIEVEMENTS.length / cols);
  const H = 74 + rows * (cellH + gap) + 26;
  let unlocked = 0;
  const cells = ACHIEVEMENTS.map((a, i) => {
    const got = Boolean(a.test(data));
    if (got) unlocked++;
    const x = 30 + (i % cols) * (cellW + gap);
    const y = 74 + Math.floor(i / cols) * (cellH + gap);
    const palette = got ? { X: a.color, Y: a.accent ?? a.color } : { X: C.slot, Y: C.slot };
    return `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${got ? C.slot : C.slotLocked}" stroke="${got ? C.dim : C.slot}" stroke-width="3"/>
${sprite(ICONS[a.icon], palette, x + 12, y + 20, 4)}
<text x="${x + 56}" y="${y + 32}" class="h" font-size="9" fill="${got ? C.text : C.dim}">${got ? esc(a.name) : '???'}</text>
<text x="${x + 56}" y="${y + 56}" class="b" font-size="19" fill="${got ? C.muted : C.dim}">${esc(a.desc)}</text>`;
  }).join('\n');
  const body = `${panel(W, H)}
${heading('ACHIEVEMENTS')}
${subheading(`${unlocked}/${ACHIEVEMENTS.length} UNLOCKED`)}
${cells}`;
  const names = ACHIEVEMENTS.filter((a) => a.test(data)).map((a) => a.name.toLowerCase());
  return svg(W, H, body, `Achievements: ${unlocked} of ${ACHIEVEMENTS.length} unlocked${names.length ? ` (${names.join(', ')})` : ''}`);
}

// ---------------------------------------------------------------- world map

const GRASS = [C.slot, C.teal, C.greenDark, '#73c94a', C.green];

export function worldMap(calendar) {
  const W = 880;
  const H = 262;
  const step = 15;
  const tile = 13;
  const weeks =
    calendar?.weeks ??
    Array.from({ length: 53 }, () => Array.from({ length: 7 }, (_, weekday) => ({ weekday, level: 0 })));
  const x0 = Math.round((W - 16 - weeks.length * step) / 2) + 2;
  const y0 = 76;

  // The goat walks the map like a lawnmower: down one week, up the next.
  const path = [];
  weeks.forEach((week, wi) => {
    const days = [...week].sort((a, b) => a.weekday - b.weekday);
    if (wi % 2) days.reverse();
    for (const d of days) path.push({ x: x0 + wi * step, y: y0 + d.weekday * step, level: d.level });
  });
  const stepDur = 0.06;
  const T = path.length * stepDur + 3;

  const tiles = path
    .map((p, i) => {
      const eat = p.level > 0 && calendar ? loop('fill', `${GRASS[p.level]};${C.slot}`, f4(T), ` keyTimes="0;${f4(((i + 1) * stepDur) / T)}"`) : '';
      return `<rect x="${p.x}" y="${p.y}" width="${tile}" height="${tile}" fill="${GRASS[p.level]}">${eat}</rect>`;
    })
    .join('');

  const walker = calendar
    ? `<g>${sprite(MINI_GOAT, { ...GOAT_COLORS, B: C.muted }, -5, -3, 2)}<animateTransform attributeName="transform" type="translate" values="${path
        .map((p) => `${p.x},${p.y}`)
        .join(';')}" keyTimes="${path.map((_, i) => f4((i * stepDur) / T)).join(';')}" dur="${f4(T)}s" calcMode="discrete" repeatCount="indefinite"/></g>`
    : `<text x="${W / 2 - 8}" y="${y0 + 58}" class="h" font-size="11" fill="${C.text}" text-anchor="middle">MAP LOADS AFTER THE FIRST SYNC</text>`;

  const legendX = 834 - 5 * 18 - 44;
  const legend =
    `<text x="${legendX - 8}" y="${H - 34}" class="b" font-size="20" fill="${C.muted}" text-anchor="end">less</text>` +
    GRASS.map((g, i) => `<rect x="${legendX + i * 18}" y="${H - 47}" width="13" height="13" fill="${g}"/>`).join('') +
    `<text x="${legendX + 5 * 18 + 4}" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">more</text>`;

  const total = calendar ? `${calendar.total} contributions in the last year` : 'contributions sync daily from github';
  const body = `${panel(W, H)}
${heading('WORLD MAP')}
${subheading('THE GOAT EATS YOUR CONTRIBUTIONS', 834, 50, C.muted)}
${tiles}
${walker}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">${esc(total)}</text>
${legend}`;
  return svg(W, H, body, `Contribution map${calendar ? `: ${calendar.total} contributions in the last year` : ''}, with a pixel goat eating the grass`);
}

// ---------------------------------------------------------------- quests

export function quests(list) {
  const W = 880;
  const rowH = 44;
  const H = 110 + (list.length + 1) * rowH;
  const now = Date.now();
  const rows = list
    .map((q, i) => {
      const y = 96 + i * rowH;
      const active = q.pushedAt ? now - Date.parse(q.pushedAt) < 30 * 864e5 : true;
      const badge = active ? 'ACTIVE' : 'IDLE';
      const badgeW = badge.length * 10 + 16;
      const nameLen = Math.min(q.name.length, 24);
      const desc = q.description ? clip(q.description, 62 - nameLen) : '';
      return `<text x="30" y="${y}" class="b" font-size="28" fill="${C.green}">&gt;</text>
<text x="56" y="${y}" class="b" font-size="28" fill="${C.yellow}">${esc(clip(q.name, 24))}<tspan fill="${C.muted}" font-size="24">  ${esc(desc)}</tspan></text>
<rect x="${834 - badgeW - 40}" y="${y - 16}" width="14" height="14" fill="${q.languageColor || C.dim}"/>
<rect x="${834 - badgeW}" y="${y - 20}" width="${badgeW}" height="24" fill="${active ? C.greenDark : C.dim}"/>
<text x="${834 - badgeW / 2}" y="${y - 3}" class="h" font-size="10" fill="${C.bg}" text-anchor="middle">${badge}</text>`;
    })
    .join('\n');
  const lockedY = 96 + list.length * rowH;
  const body = `${panel(W, H)}
${heading('QUEST LOG')}
${rows}
<text x="30" y="${lockedY}" class="b" font-size="28" fill="${C.dim}">&gt; ??? next quest locked</text>`;
  return svg(W, H, body, `Quest log: ${list.map((q) => q.name).join(', ')}`);
}

// ---------------------------------------------------------------- guestbook

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function guestbook(entries, show) {
  const W = 880;
  const rowH = 40;
  const H = 74 + show * rowH + 64;
  const latest = [...entries].reverse().slice(0, show);
  const rows = Array.from({ length: show }, (_, i) => {
    const y = 104 + i * rowH;
    const e = latest[i];
    if (!e) {
      return `<text x="${W / 2 - 8}" y="${y}" class="b" font-size="24" fill="${C.dim}" text-anchor="middle">- - -  INSERT COIN  - - -</text>`;
    }
    const d = new Date(e.createdAt);
    const msg = cleanText(e.message) || '(waved hi)';
    return `<text x="30" y="${y}" class="h" font-size="11" fill="${C.green}">P${String(e.player).padStart(2, '0')}</text>
<text x="96" y="${y}" class="b" font-size="26" fill="${C.yellow}">${esc(clip(e.login, 18))}</text>
<text x="300" y="${y}" class="b" font-size="24" fill="${C.text}">${esc(clip(msg, 42))}</text>
<text x="834" y="${y}" class="b" font-size="22" fill="${C.muted}" text-anchor="end">${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}</text>`;
  }).join('\n');
  const body = `${panel(W, H)}
${heading('GUESTBOOK')}
${subheading(`${entries.length} PLAYER${entries.length === 1 ? '' : 'S'} SIGNED`)}
${rows}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">click this board to sign the guestbook · new names show up within a minute or two</text>`;
  const who = latest.map((e) => `${e.login}: ${cleanText(e.message)}`).join('; ');
  return svg(W, H, body, `Guestbook, ${entries.length} signed${who ? `. Latest: ${who}` : ''}`);
}

// ---------------------------------------------------------------- tip of the day

export function tip(text) {
  const W = 880;
  const H = 128;
  const segs = 12;
  let bar = `<rect x="${834 - segs * 16 - 6}" y="28" width="${segs * 16 + 8}" height="26" fill="none" stroke="${C.dim}" stroke-width="3"/>`;
  for (let s = 0; s < segs; s++) {
    const on = f4((s + 1) / (segs + 4));
    bar += `<rect x="${834 - segs * 16 + s * 16}" y="34" width="12" height="14" fill="${C.greenDark}" opacity="0">${loop('opacity', '0;1', 3, ` keyTimes="0;${on}"`)}</rect>`;
  }
  const body = `${panel(W, H)}
${heading('TIP OF THE DAY')}
<text x="${834 - segs * 16 - 18}" y="47" class="h" font-size="9" fill="${C.muted}" text-anchor="end">LOADING</text>
${bar}
<text x="30" y="92" class="b" font-size="28" fill="${C.text}"><tspan fill="${C.green}">&gt;</tspan> ${esc(text)}</text>`;
  return svg(W, H, body, `Tip of the day: ${text}`);
}

// ---------------------------------------------------------------- buttons + footer

export function button(label, color) {
  const W = 280;
  const H = 68;
  const body = `<rect x="8" y="8" width="${W - 8}" height="${H - 8}" fill="${C.shadow}"/>
<rect x="0" y="0" width="${W - 8}" height="${H - 8}" fill="${C.bg}"/>
<rect x="4" y="4" width="${W - 16}" height="${H - 16}" fill="${color}"/>
<rect x="4" y="4" width="${W - 16}" height="4" fill="#ffffff" fill-opacity="0.4"/>
<rect x="4" y="${H - 18}" width="${W - 16}" height="6" fill="#000000" fill-opacity="0.25"/>
<text x="${(W - 8) / 2}" y="${H / 2 + 2}" class="h" font-size="11" fill="${C.bg}" text-anchor="middle">${esc(label)}</text>`;
  return svg(W, H, body, label);
}

export function footer() {
  const W = 880;
  const H = 70;
  return svg(
    W,
    H,
    `<text x="${W / 2}" y="40" class="h" font-size="12" fill="${C.muted}" text-anchor="middle">THANKS FOR PLAYING :3</text>
<rect x="${W / 2 + 140}" y="28" width="10" height="14" fill="${C.pink}">${loop('opacity', '1;0', 1)}</rect>`,
    'Thanks for playing :3'
  );
}

// ---------------------------------------------------------------- goat care + boss fight

const SIDE_GAME_H = 380;

function meter(x, y, value, max, segs, color) {
  const filled = Math.round((value / max) * segs);
  let out = `<rect x="${x - 6}" y="${y - 6}" width="${segs * 16 + 8}" height="28" fill="none" stroke="${C.dim}" stroke-width="3"/>`;
  for (let s = 0; s < segs; s++) out += `<rect x="${x + s * 16}" y="${y}" width="12" height="16" fill="${s < filled ? color : C.slot}"/>`;
  return out;
}

const MOOD_TEXT = { happy: 'HAPPY GOAT :3', ok: 'DOING OKAY', sad: 'SAD... FEED ME' };

export function goatCare(care) {
  const W = 430;
  const H = SIDE_GAME_H;
  const icon = MOOD_ICONS[care.mood];
  const fans = care.fans.length
    ? care.fans
        .map(
          (f, i) => `<text x="30" y="${292 + i * 28}" class="b" font-size="24" fill="${C.yellow}">${esc(clip(f.login, 16))}</text>
<text x="400" y="${292 + i * 28}" class="b" font-size="22" fill="${C.muted}" text-anchor="end">${f.feeds} fed · ${f.pets} pet${f.pets === 1 ? '' : 's'}</text>`
        )
        .join('\n')
    : `<text x="30" y="292" class="b" font-size="24" fill="${C.dim}">no fans yet. be the first!</text>`;
  const body = `${panel(W, H)}
${heading('GOAT CARE')}
${sprite(icon.rows, { X: icon.color === C.dim ? C.muted : icon.color }, 30, 76, 4)}
<text x="62" y="96" class="b" font-size="28" fill="${C.text}">${MOOD_TEXT[care.mood]}</text>
<text x="30" y="148" class="b" font-size="26" fill="${C.text}">FOOD</text>
${meter(104, 132, care.food, 100, 11, C.orange)}
<text x="400" y="148" class="b" font-size="24" fill="${C.muted}" text-anchor="end">${care.food}</text>
<text x="30" y="192" class="b" font-size="26" fill="${C.text}">LOVE</text>
${meter(104, 176, care.love, 100, 11, C.pink)}
<text x="400" y="192" class="b" font-size="24" fill="${C.muted}" text-anchor="end">${care.love}</text>
<text x="30" y="230" class="b" font-size="22" fill="${C.muted}">fed ${care.fed}x · petted ${care.pets}x · meters drop over time</text>
<text x="30" y="262" class="h" font-size="10" fill="${C.green}">TOP FANS</text>
${fans}`;
  return svg(W, H, body, `Goat care: ${MOOD_TEXT[care.mood].toLowerCase()}. Food ${care.food} of 100, love ${care.love} of 100. Fed ${care.fed} times, petted ${care.pets} times.`);
}

export function bossFight(boss) {
  const W = 430;
  const H = SIDE_GAME_H;
  const hits = boss.hits.length
    ? boss.hits
        .map(
          (h, i) => `<text x="30" y="${240 + i * 28}" class="b" font-size="24" fill="${C.yellow}">${esc(clip(h.login, 16))}</text>
<text x="400" y="${240 + i * 28}" class="b" font-size="22" fill="${h.crit ? C.orange : C.muted}" text-anchor="end">-${h.dmg}${h.crit ? ' CRIT!' : ''}</text>`
        )
        .join('\n')
    : `<text x="30" y="240" class="b" font-size="24" fill="${C.dim}">no hits yet. strike first!</text>`;
  const palette = { X: boss.color, Y: boss.accent, W: C.border, K: C.bg, L: C.muted };
  const flicker = boss.name.startsWith('HEISENBUG') ? loop('opacity', '1;0.3;1;1', 1.4) : '';
  const body = `${panel(W, H)}
${heading('BOSS FIGHT')}
${subheading(`#${boss.index + 1}`, 400)}
<g>${sprite(SHAPES.bug, palette, 30, 76, 7)}${flicker}<animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0;-3 0" dur="0.8s" calcMode="discrete" repeatCount="indefinite"/></g>
<text x="122" y="100" class="h" font-size="11" fill="${C.text}">${esc(boss.name)}</text>
${meter(128, 118, boss.current, boss.hp, 17, C.red)}
<text x="122" y="168" class="b" font-size="24" fill="${C.muted}">HP ${boss.current} / ${boss.hp}</text>
<text x="30" y="210" class="h" font-size="10" fill="${C.green}">LAST HITS</text>
${hits}
<text x="30" y="${H - 34}" class="b" font-size="22" fill="${C.muted}">bosses slain: ${boss.slain.length}${boss.mvp ? ` · mvp: ${esc(clip(boss.mvp, 14))}` : ''}</text>`;
  return svg(W, H, body, `Boss fight #${boss.index + 1}: ${boss.name}, ${boss.current} of ${boss.hp} HP left. ${boss.slain.length} bosses slain.`);
}

// ---------------------------------------------------------------- coding time

export function coding(waka) {
  const W = 880;
  const langs = waka.languages;
  const H = 172 + Math.max(1, langs.length) * 38 + 30;
  const segs = 24;
  const colors = [C.green, C.blue, C.yellow, C.pink, C.orange];
  const rows = langs.length
    ? langs
        .map((l, i) => {
          const y = 176 + i * 38;
          const filled = Math.max(1, Math.round((l.percent / 100) * segs));
          let bar = '';
          for (let s = 0; s < segs; s++) bar += `<rect x="${240 + s * 16}" y="${y - 18}" width="12" height="16" fill="${s < filled ? colors[i] : C.slot}"/>`;
          return `<text x="30" y="${y}" class="b" font-size="26" fill="${C.text}">${esc(clip(l.name, 16))}</text>
${bar}
<text x="834" y="${y}" class="b" font-size="24" fill="${C.muted}" text-anchor="end">${esc(l.text)}</text>`;
        })
        .join('\n')
    : `<text x="30" y="176" class="b" font-size="24" fill="${C.dim}">no coding tracked this week yet</text>`;
  const extras = [waka.editors.length && `editor: ${waka.editors.join(', ')}`, waka.os.length && `os: ${waka.os.join(', ')}`]
    .filter(Boolean)
    .join(' · ');
  const body = `${panel(W, H)}
${heading('CODING TIME')}
${subheading('LAST 7 DAYS')}
<text x="30" y="104" class="h" font-size="20" fill="${C.pink}">${esc(waka.total.toUpperCase())}</text>
<text x="30" y="134" class="b" font-size="22" fill="${C.muted}">daily average: ${esc(waka.dailyAverage)}</text>
${rows}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">${esc(extras || 'tracked with wakatime')}</text>`;
  return svg(W, H, body, `Coding time in the last 7 days: ${waka.total}. ${langs.map((l) => `${l.name} ${l.text}`).join(', ')}`);
}

// ---------------------------------------------------------------- activity clock

const PERIODS = [
  { name: 'NIGHT OWL', from: 0, to: 5 },
  { name: 'EARLY BIRD', from: 5, to: 9 },
  { name: 'DAY WALKER', from: 9, to: 17 },
  { name: 'EVENING HACKER', from: 17, to: 24 },
];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function bars(values, x0, step, base, maxH, color, labels) {
  const max = Math.max(1, ...values);
  return values
    .map((v, i) => {
      const blocks = v ? Math.max(1, Math.round((v / max) * (maxH / 8))) : 0;
      let out = `<rect x="${x0 + i * step}" y="${base + 4}" width="${step - 4}" height="4" fill="${C.slot}"/>`;
      for (let b = 0; b < blocks; b++) out += `<rect x="${x0 + i * step}" y="${base - (b + 1) * 8}" width="${step - 4}" height="6" fill="${color}"/>`;
      const label = labels(i);
      if (label != null) out += `<text x="${x0 + i * step + (step - 4) / 2}" y="${base + 30}" class="b" font-size="20" fill="${C.muted}" text-anchor="middle">${label}</text>`;
      return out;
    })
    .join('');
}

export function activityClock(activity) {
  const W = 880;
  const H = 320;
  const base = 226;
  let cls = 'NO DATA YET';
  let peakText = '';
  if (activity?.total) {
    const sums = PERIODS.map((p) => activity.hours.slice(p.from, p.to).reduce((a, b) => a + b, 0) / (p.to - p.from));
    cls = PERIODS[sums.indexOf(Math.max(...sums))].name;
    const peak = activity.hours.indexOf(Math.max(...activity.hours));
    const weekend = activity.weekdays[0] + activity.weekdays[6];
    peakText = `peak hour ${String(peak).padStart(2, '0')}:00 · ${Math.round((weekend / activity.total) * 100)}% on weekends · `;
  }
  const hours = activity?.hours ?? Array(24).fill(0);
  const weekdays = activity?.weekdays ?? Array(7).fill(0);
  const body = `${panel(W, H)}
${heading('ACTIVITY CLOCK')}
${subheading(`CLASS: ${cls}`)}
<text x="30" y="88" class="b" font-size="20" fill="${C.muted}">hour of day</text>
${bars(hours, 30, 25, base, 120, C.blue, (i) => (i % 6 === 0 ? String(i).padStart(2, '0') : null))}
<text x="660" y="88" class="b" font-size="20" fill="${C.muted}">day of week</text>
${bars(weekdays, 660, 25, base, 120, C.orange, (i) => DAYS[i])}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">${esc(peakText)}${activity?.total ?? 0} commits in the last year, in your own time zone</text>`;
  return svg(W, H, body, `Activity clock: ${cls.toLowerCase()}. ${peakText}`);
}
