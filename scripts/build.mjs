// Builds the Pixel Quest profile: SVG panels in assets/ and README.md.
// Run locally with `node scripts/build.mjs`. With GITHUB_TOKEN set, stats and
// the quest log come from the GitHub API; without it they fall back to "??"
// and profile.json's fallbackQuests.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(ROOT, 'profile.json'), 'utf8'));

const C = {
  bg: '#1a1c2c',
  border: '#f4f4f4',
  shadow: '#29366f',
  text: '#f4f4f4',
  muted: '#94b0c2',
  dim: '#566c86',
  slot: '#333c57',
  yellow: '#ffcd75',
  green: '#a7f070',
  greenDark: '#38b764',
  blue: '#41a6f6',
  orange: '#ef7d57',
  red: '#b13e53',
  pink: '#ff7eb6',
};

const font = (file) => readFileSync(join(ROOT, 'fonts', file)).toString('base64');
const FONT_CSS =
  `@font-face{font-family:QuestHeading;src:url(data:font/woff2;base64,${font('QuestHeading.woff2')}) format('woff2')}` +
  `@font-face{font-family:QuestBody;src:url(data:font/woff2;base64,${font('QuestBody.woff2')}) format('woff2')}` +
  `.h{font-family:QuestHeading,monospace}.b{font-family:QuestBody,monospace}`;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s, n) => (s.length > n ? s.slice(0, n - 3).trimEnd() + '...' : s);

function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${FONT_CSS}</style>
${body}
</svg>
`;
}

// A pixel panel: offset shadow, dark fill, chunky white border.
function panel(w, h) {
  return `<rect x="12" y="12" width="${w - 16}" height="${h - 16}" fill="${C.shadow}"/>
<rect x="2" y="2" width="${w - 16}" height="${h - 16}" fill="${C.bg}" stroke="${C.border}" stroke-width="4"/>`;
}

function sprite(rows, palette, x, y, px) {
  let out = '';
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (palette[ch]) out += `<rect x="${x + c * px}" y="${y + r * px}" width="${px}" height="${px}" fill="${palette[ch]}"/>`;
    })
  );
  return out;
}

const GOAT = [
  '..........H.H...',
  '..........H.H...',
  '.........WWWW...',
  '.........WKWWW..',
  '.........WWWWWP.',
  '..........WWW...',
  'W........WWG....',
  '.WWWWWWWWWW.....',
  'WWWWWWWWWWWW....',
  'WWWWWWWWWWW.....',
  '.WWWWWWWWWG.....',
  '.W.W.....W.W....',
  '.W.W.....W.W....',
  '.K.K.....K.K....',
];
const GOAT_COLORS = { W: C.border, G: C.muted, H: C.yellow, K: C.dim, P: C.pink };

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

function banner() {
  const W = 880;
  const H = 300;
  const stars = [
    [40, 30, C.yellow, 0],
    [230, 44, C.border, 0.4],
    [520, 26, C.blue, 0.8],
    [690, 250, C.border, 1.2],
    [610, 60, C.yellow, 0.2],
    [250, 250, C.green, 0.6],
    [440, 262, C.border, 1],
  ]
    .map(
      ([x, y, fill, delay]) =>
        `<rect x="${x}" y="${y}" width="6" height="6" fill="${fill}"><animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="${delay}s" calcMode="discrete" repeatCount="indefinite"/></rect>`
    )
    .join('\n');
  const hearts = [0, 1, 2]
    .map((i) => sprite(HEART, { X: C.red }, 730 + i * 36, 34, 4))
    .join('');

  const body = `${panel(W, H)}
${stars}
<g>${sprite(GOAT, GOAT_COLORS, 48, 68, 10)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -6" dur="1.2s" calcMode="discrete" repeatCount="indefinite"/></g>
<text x="770" y="78" class="b" font-size="22" fill="${C.muted}" text-anchor="middle">HP</text>
${hearts}
<text x="250" y="88" class="h" font-size="12" fill="${C.green}">PLAYER 1</text>
<text x="250" y="134" class="h" font-size="28" fill="${C.pink}">${esc(config.displayName)}</text>
<text x="250" y="180" class="b" font-size="28" fill="${C.text}">CLASS: ${esc(config.class)}</text>
<text x="250" y="210" class="b" font-size="28" fill="${C.text}">ALIGNMENT: ${esc(config.alignment)}</text>
<text x="250" y="250" class="h" font-size="10" fill="${C.muted}">- PRESS START -<animate attributeName="opacity" values="1;0" dur="1.2s" calcMode="discrete" repeatCount="indefinite"/></text>`;
  return svg(W, H, body, `Player 1: ${config.displayName}. Class: ${config.class}. Alignment: ${config.alignment}`);
}

function sideHeight() {
  const bioH = 96 + config.bio.length * 32;
  const invH = 96 + Math.ceil(config.inventory.length / 3) * 88;
  return Math.max(bioH, invH);
}

function bio() {
  const W = 430;
  const H = sideHeight();
  const lines = config.bio
    .map(
      (line, i) =>
        `<text x="30" y="${96 + i * 32}" class="b" font-size="26" fill="${C.text}"><tspan fill="${C.green}">&gt;</tspan> ${esc(line)}</text>`
    )
    .join('\n');
  return svg(W, H, `${panel(W, H)}\n<text x="30" y="50" class="h" font-size="13" fill="${C.yellow}">BIO</text>\n${lines}`, `Bio: ${config.bio.join('; ')}`);
}

function inventory() {
  const W = 430;
  const H = sideHeight();
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
  return svg(
    W,
    H,
    `${panel(W, H)}\n<text x="30" y="50" class="h" font-size="13" fill="${C.yellow}">INVENTORY</text>\n${slots}`,
    `Inventory: ${config.inventory.map((i) => i.label).join(', ')}`
  );
}

const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365, 500, 1000];
const nextMilestone = (v, list) => list.find((m) => m > v) ?? v;

function stats(data) {
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
  const foot = data ? `next goal shown on each bar · best streak ${data.bestStreak}d · updated ${data.updated}` : 'stats sync daily from github';
  const body = `${panel(W, H)}
<text x="30" y="50" class="h" font-size="13" fill="${C.yellow}">STATS</text>
<text x="834" y="50" class="h" font-size="12" fill="${C.green}" text-anchor="end">${lv}</text>
${out}
<text x="30" y="${H - 34}" class="b" font-size="20" fill="${C.muted}">${esc(foot)}</text>`;
  const desc = data
    ? `Level ${data.level}, ${data.xp} XP. Commits ${data.commits}, pull requests ${data.prs}, stars ${data.stars}, current streak ${data.streak} days`
    : 'GitHub stats';
  return svg(W, H, body, desc);
}

function quests(list) {
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
<text x="30" y="50" class="h" font-size="13" fill="${C.yellow}">QUEST LOG</text>
${rows}
<text x="30" y="${lockedY}" class="b" font-size="28" fill="${C.dim}">&gt; ??? next quest locked</text>`;
  return svg(W, H, body, `Quest log: ${list.map((q) => q.name).join(', ')}`);
}

function footer() {
  const W = 880;
  const H = 70;
  return svg(
    W,
    H,
    `<text x="${W / 2}" y="40" class="h" font-size="12" fill="${C.muted}" text-anchor="middle">THANKS FOR PLAYING :3</text>
<rect x="${W / 2 + 140}" y="28" width="10" height="14" fill="${C.pink}"><animate attributeName="opacity" values="1;0" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect>`,
    'Thanks for playing :3'
  );
}

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

async function fetchGitHub() {
  const login = config.username;
  const base = await gql(
    `query($login: String!) {
      user(login: $login) {
        createdAt
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes { name description url isFork stargazerCount pushedAt primaryLanguage { name color } }
        }
        contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } }
      }
    }`,
    { login }
  );
  const user = base.user;

  // contributionsCollection spans at most one year, so ask once per year.
  const firstYear = new Date(user.createdAt).getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();
  const years = [];
  for (let y = firstYear; y <= thisYear; y++) years.push(y);
  const yearly = await gql(
    `query($login: String!) { user(login: $login) { ${years
      .map(
        (y) =>
          `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { totalCommitContributions totalPullRequestContributions contributionCalendar { totalContributions } }`
      )
      .join('\n')} } }`,
    { login }
  );
  const totals = Object.values(yearly.user);
  const commits = totals.reduce((n, t) => n + t.totalCommitContributions, 0);
  const prs = totals.reduce((n, t) => n + t.totalPullRequestContributions, 0);
  const xp = totals.reduce((n, t) => n + t.contributionCalendar.totalContributions, 0);

  const repos = user.repositories.nodes.filter((r) => !r.isFork);
  const stars = repos.reduce((n, r) => n + r.stargazerCount, 0);

  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  let streak = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--; // today isn't over yet
  for (; i >= 0 && days[i].contributionCount > 0; i--) streak++;
  let bestStreak = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  const hidden = new Set(config.hiddenRepos.map((n) => n.toLowerCase()));
  const questList = repos
    .filter((r) => !hidden.has(r.name.toLowerCase()))
    .slice(0, config.maxQuests)
    .map((r) => ({
      name: r.name,
      description: r.description ?? '',
      url: r.url,
      language: r.primaryLanguage?.name,
      languageColor: r.primaryLanguage?.color,
      pushedAt: r.pushedAt,
    }));

  return {
    stats: {
      commits,
      prs,
      stars,
      streak,
      bestStreak,
      xp,
      level: Math.floor(Math.sqrt(xp / 5)) + 1,
      updated: new Date().toISOString().slice(0, 10),
    },
    quests: questList,
  };
}

function readme(questList) {
  const u = config.username;
  const links = questList.map((q) => `[${q.name}](${q.url})`).join(' · ');
  return `<!-- Generated by scripts/build.mjs. Edit profile.json instead, then let the workflow rebuild. -->
<div align="center">

<img src="assets/banner.svg" width="100%" alt="Pixel art goat beside the text: Player 1, ${esc(config.displayName)}. Class: ${esc(config.class)}. Alignment: ${esc(config.alignment)}">

<img src="assets/bio.svg" width="49%" alt="Bio: ${esc(config.bio.join('; '))}"> <img src="assets/inventory.svg" width="49%" alt="Inventory: ${esc(config.inventory.map((i) => i.label).join(', '))}">

<img src="assets/stats.svg" width="100%" alt="GitHub stats: commits, pull requests, stars and contribution streak">

<a href="https://github.com/${u}?tab=repositories"><img src="assets/quests.svg" width="100%" alt="Quest log: ${esc(questList.map((q) => q.name).join(', '))}"></a>

${links}

<img src="assets/footer.svg" width="100%" alt="Thanks for playing :3">

</div>
`;
}

let liveStats = null;
let questList = config.fallbackQuests;
if (process.env.GITHUB_TOKEN) {
  try {
    const live = await fetchGitHub();
    liveStats = live.stats;
    if (live.quests.length) questList = live.quests;
  } catch (err) {
    console.error('GitHub API failed, using fallbacks:', err.message);
  }
} else {
  console.log('No GITHUB_TOKEN: stats show ?? and quests come from profile.json.');
}

const out = {
  'assets/banner.svg': banner(),
  'assets/bio.svg': bio(),
  'assets/inventory.svg': inventory(),
  'assets/stats.svg': stats(liveStats),
  'assets/quests.svg': quests(questList),
  'assets/footer.svg': footer(),
  'README.md': readme(questList),
};
mkdirSync(join(ROOT, 'assets'), { recursive: true });
for (const [path, content] of Object.entries(out)) writeFileSync(join(ROOT, path), content);
console.log(`Wrote ${Object.keys(out).join(', ')}`);
