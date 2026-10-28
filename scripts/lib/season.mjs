// Picks the banner's seasonal theme for a date. profile.json's "season" can
// force one ("halloween", "winter", "valentine", "birthday") or turn them "off".

export const SEASONS = ['halloween', 'winter', 'valentine', 'birthday'];

export function pickSeason(setting, now, createdAt) {
  if (setting && setting !== 'auto') return SEASONS.includes(setting) ? setting : null;
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  if (createdAt) {
    const c = new Date(createdAt);
    const anniversary = Date.UTC(now.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate());
    const since = (now - anniversary) / 864e5;
    if (now.getUTCFullYear() > c.getUTCFullYear() && since >= 0 && since < 7) return 'birthday';
  }
  if (m === 10) return 'halloween';
  if (m === 12 || (m === 1 && d <= 6)) return 'winter';
  if (m === 2 && d >= 7 && d <= 14) return 'valentine';
  return null;
}
