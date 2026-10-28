// Sample data for previewing locally without a token: DEMO=1 node scripts/build.mjs
// DEMO_LEVEL and DEMO_SEASON override the level and season to preview evolutions and themes.

import { seeded } from './svg.mjs';
import { levelFromXp, activityFrom } from './github.mjs';

export function demoData(config) {
  const rand = seeded(7);
  const weeks = [];
  const start = Date.UTC(2025, 9, 26);
  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const r = rand();
      const count = r < 0.75 ? 0 : Math.ceil((r - 0.75) * 24);
      week.push({
        date: new Date(start + (w * 7 + d) * 864e5).toISOString().slice(0, 10),
        weekday: d,
        count,
        level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2)),
      });
    }
    weeks.push(week);
  }
  const times = [];
  for (let i = 0; i < 160; i++) {
    const hour = Math.floor((rand() < 0.6 ? 18 + rand() * 6 : rand() * 24) % 24);
    const day = 1 + Math.floor(rand() * 28);
    times.push(`2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:15:00-03:00`);
  }
  const at = (h) => new Date(Date.now() - h * 36e5).toISOString();
  const xp = 154;
  return {
    stats: {
      commits: 46,
      prs: 13,
      stars: 0,
      streak: 3,
      bestStreak: 4,
      xp,
      level: process.env.DEMO_LEVEL ? Number(process.env.DEMO_LEVEL) : levelFromXp(xp),
      updated: 'demo',
    },
    createdAt: '2022-06-24T09:17:33Z',
    publicRepos: 2,
    quests: config.fallbackQuests,
    websiteUrl: null,
    calendar: { total: weeks.flat().reduce((n, d) => n + d.count, 0), weeks },
    issues: [
      { number: 1, kind: 'guestbook', login: 'octocat', message: 'cute goat!! :3', createdAt: '2026-10-20T10:00:00Z' },
      { number: 2, kind: 'feed', login: 'octocat', createdAt: at(30) },
      { number: 3, kind: 'attack', login: 'octocat', createdAt: at(29) },
      { number: 4, kind: 'pet', login: 'pixel-pal', createdAt: at(20) },
      { number: 5, kind: 'attack', login: 'pixel-pal', createdAt: at(19) },
      { number: 6, kind: 'feed', login: 'pixel-pal', createdAt: at(6) },
      { number: 7, kind: 'attack', login: 'Yuwr1d4g0at', createdAt: at(5) },
      { number: 8, kind: 'pet', login: 'octocat', createdAt: at(2) },
      { number: 9, kind: 'guestbook', login: 'pixel-pal', message: 'thanks for fixing my laptop', createdAt: '2026-10-26T10:00:00Z' },
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    activity: activityFrom(times),
    waka: {
      total: '9 hrs 42 mins',
      dailyAverage: '1 hr 23 mins',
      languages: [
        { name: 'HTML', text: '4 hrs 10 mins', percent: 43 },
        { name: 'CSS', text: '2 hrs 31 mins', percent: 26 },
        { name: 'JavaScript', text: '1 hr 50 mins', percent: 19 },
        { name: 'Markdown', text: '1 hr 11 mins', percent: 12 },
      ],
      editors: ['VS Code'],
      os: ['Windows'],
    },
  };
}
