// Coding time from WakaTime. Needs the WAKATIME_API_KEY repo secret; without
// it the coding panel is left off the profile.

export async function fetchWakaTime() {
  const key = process.env.WAKATIME_API_KEY;
  if (!key) return null;
  const res = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
    headers: { Authorization: `Basic ${Buffer.from(key).toString('base64')}` },
  });
  // 202 means WakaTime is still calculating; try again next run.
  if (res.status === 202) return null;
  if (!res.ok) throw new Error(`WakaTime ${res.status}: ${await res.text()}`);
  const { data } = await res.json();
  if (!data || data.total_seconds == null) return null;
  return {
    total: data.human_readable_total ?? '0 secs',
    dailyAverage: data.human_readable_daily_average ?? '0 secs',
    languages: (data.languages ?? []).slice(0, 5).map((l) => ({ name: l.name, text: l.text, percent: l.percent })),
    editors: (data.editors ?? []).slice(0, 2).map((e) => e.name),
    os: (data.operating_systems ?? []).slice(0, 2).map((o) => o.name),
  };
}
