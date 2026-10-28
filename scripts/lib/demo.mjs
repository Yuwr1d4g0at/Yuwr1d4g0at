// Sample data for previewing locally without a token: DEMO=1 node scripts/build.mjs
// DEMO_LEVEL and DEMO_SEASON override the level and season to preview evolutions and themes.

import { seeded } from './svg.mjs';
import { levelFromXp } from './github.mjs';

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
    guestbook: [
      { player: 1, login: 'octocat', message: 'cute goat!! :3', createdAt: '2026-10-20T10:00:00Z' },
      { player: 2, login: 'pixel-pal', message: 'thanks for fixing my laptop', createdAt: '2026-10-26T10:00:00Z' },
    ],
  };
}
