// Everything that talks to the GitHub API. Needs GITHUB_TOKEN.

const API = 'https://api.github.com';
export const GUESTBOOK_PREFIX = '[GUESTBOOK]';

const headers = () => ({
  Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'pixel-quest-profile',
});

async function gql(query, variables) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

async function rest(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers(), ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

export const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 5)) + 1;

export async function fetchGitHub(config) {
  const login = config.username;
  const base = await gql(
    `query($login: String!) {
      user(login: $login) {
        createdAt
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes { name description url homepageUrl isFork stargazerCount pushedAt primaryLanguage { name color } }
        }
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date weekday contributionCount contributionLevel } }
          }
        }
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

  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
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
  const quests = repos
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

  const siteRepo = repos.find((r) => r.name.toLowerCase() === (config.websiteRepo ?? '').toLowerCase());

  return {
    stats: {
      commits,
      prs,
      stars,
      streak,
      bestStreak,
      xp,
      level: levelFromXp(xp),
      updated: new Date().toISOString().slice(0, 10),
    },
    createdAt: user.createdAt,
    publicRepos: repos.length,
    quests,
    websiteUrl: config.website || siteRepo?.homepageUrl || siteRepo?.url || null,
    calendar: {
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) =>
        w.contributionDays.map((d) => ({
          date: d.date,
          weekday: d.weekday,
          count: d.contributionCount,
          level: LEVELS[d.contributionLevel] ?? 0,
        }))
      ),
    },
    guestbook: await fetchGuestbook(config),
  };
}

function parseMessage(issue) {
  const fromForm = /###\s*Message\s*\n+([\s\S]*?)(?:\n###|$)/i.exec(issue.body ?? '');
  const text = fromForm ? fromForm[1] : issue.title.slice(GUESTBOOK_PREFIX.length);
  return text.trim() === '_No response_' ? '' : text;
}

// Guestbook entries are issues titled "[GUESTBOOK] ...". Closing one as
// "not planned", or labelling it "hidden", takes it off the board.
export async function fetchGuestbook(config) {
  const repo = `${config.username}/${config.username}`;
  const issues = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await rest(`/repos/${repo}/issues?state=all&per_page=100&page=${page}&sort=created&direction=asc`);
    issues.push(...batch);
    if (batch.length < 100) break;
  }
  return issues
    .filter(
      (i) =>
        !i.pull_request &&
        i.user?.type !== 'Bot' &&
        i.title.startsWith(GUESTBOOK_PREFIX) &&
        i.state_reason !== 'not_planned' &&
        !i.labels.some((l) => (l.name ?? l) === 'hidden')
    )
    .map((i, n) => ({
      player: n + 1,
      number: i.number,
      login: i.user.login,
      message: parseMessage(i),
      createdAt: i.created_at,
      open: i.state === 'open',
    }));
}

// Replies to new signatures and closes them, so each is thanked once.
export async function thankGuestbook(config, entries) {
  const repo = `${config.username}/${config.username}`;
  for (const e of entries.filter((x) => x.open)) {
    const tag = `P${String(e.player).padStart(2, '0')}`;
    await rest(`/repos/${repo}/issues/${e.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: `Thanks for signing the guestbook, @${e.login}! You're player **${tag}** :3\n\nYour message shows on the profile within a minute or two.`,
      }),
    });
    await rest(`/repos/${repo}/issues/${e.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    });
    console.log(`Thanked ${e.login} (#${e.number}) as ${tag}`);
  }
}
