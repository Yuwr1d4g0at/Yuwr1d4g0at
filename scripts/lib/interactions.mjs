// Visitor interactions. Each button opens an issue whose title starts with a
// prefix; the whole history of those issues is replayed on every build, so no
// state file is needed and the result is the same every time.

export const PREFIX = { guestbook: '[GUESTBOOK]', feed: '[FEED]', pet: '[PET]', attack: '[ATTACK]' };
export const COOLDOWN_MIN = { feed: 30, pet: 10, attack: 5 };

const CARE = { start: 80, feed: 20, pet: 15, max: 100, decayPerHour: 1 / 3 };

export const BOSSES = [
  { name: 'NULL POINTER', hp: 100, color: '#c7cfdd', accent: '#566c86' },
  { name: 'INFINITE LOOP', hp: 150, color: '#38b764', accent: '#a7f070' },
  { name: 'MEMORY LEAK', hp: 200, color: '#257179', accent: '#41a6f6' },
  { name: 'BLUE SCREEN', hp: 300, color: '#3b5dc9', accent: '#f4f4f4' },
  { name: 'RACE CONDITION', hp: 400, color: '#ef7d57', accent: '#ffcd75' },
  { name: 'HEISENBUG', hp: 500, color: '#ff7eb6', accent: '#f4f4f4' },
];

const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

export function bossAt(k) {
  const base = BOSSES[k % BOSSES.length];
  const tier = Math.floor(k / BOSSES.length);
  return { ...base, index: k, name: base.name + (ROMAN[tier] ?? ` ${tier + 1}`), hp: base.hp * (tier + 1) };
}

export function kindOf(title) {
  for (const [kind, prefix] of Object.entries(PREFIX)) if (title.startsWith(prefix)) return kind;
  return null;
}

// Same issue number, same hit: 10 to 20 damage, 1 in 8 is a double-damage crit.
function damageFor(number) {
  const h = Math.imul(number, 2654435761) >>> 0;
  const crit = (h >>> 8) % 8 === 0;
  const base = 10 + (h % 11);
  return { dmg: crit ? base * 2 : base, crit };
}

export const moodOf = (care) => {
  const avg = (care.food + care.love) / 2;
  return avg >= 60 ? 'happy' : avg >= 25 ? 'ok' : 'sad';
};

const FOOTER = '\n\n_This issue closes by itself. Thanks for playing!_';

// `events` are action issues ({number, kind, login, createdAt, open}) sorted oldest first.
export function simulate(events, { born, now }) {
  let food = CARE.start;
  let love = CARE.start;
  let clock = Date.parse(born);
  const decayTo = (t) => {
    if (t <= clock) return;
    const loss = ((t - clock) / 36e5) * CARE.decayPerHour;
    food = Math.max(0, food - loss);
    love = Math.max(0, love - loss);
    clock = t;
  };

  const fans = new Map();
  const fan = (login) => fans.get(login) ?? fans.set(login, { login, feeds: 0, pets: 0, damage: 0 }).get(login);
  let fed = 0;
  let pets = 0;

  let boss = bossAt(0);
  let hp = boss.hp;
  let bossDamage = new Map();
  const hits = [];
  const slain = [];

  const lastAction = new Map();
  const replies = [];

  for (const ev of events) {
    const t = Date.parse(ev.createdAt);
    decayTo(t);
    const key = `${ev.kind}:${ev.login}`;
    const prev = lastAction.get(key);
    const wait = prev == null ? 0 : COOLDOWN_MIN[ev.kind] - (t - prev) / 6e4;
    let reply;

    if (wait > 0) {
      const mins = Math.ceil(wait);
      reply = {
        feed: `The goat is still chewing, @${ev.login}. You can feed it again in about ${mins} min.`,
        pet: `The goat needs a little space, @${ev.login}. Pets again in about ${mins} min.`,
        attack: `@${ev.login} is catching their breath. Attack again in about ${mins} min.`,
      }[ev.kind];
    } else {
      lastAction.set(key, t);
      const f = fan(ev.login);
      if (ev.kind === 'feed') {
        food = Math.min(CARE.max, food + CARE.feed);
        fed++;
        f.feeds++;
        reply = `Nom nom! @${ev.login} fed the goat. FOOD is now ${Math.round(food)}/100 :3`;
      } else if (ev.kind === 'pet') {
        love = Math.min(CARE.max, love + CARE.pet);
        pets++;
        f.pets++;
        reply = `The goat leans into the pets from @${ev.login}. LOVE is now ${Math.round(love)}/100 :3`;
      } else {
        const { dmg, crit } = damageFor(ev.number);
        hp -= dmg;
        f.damage += dmg;
        bossDamage.set(ev.login, (bossDamage.get(ev.login) ?? 0) + dmg);
        hits.push({ login: ev.login, dmg, crit, at: ev.createdAt });
        const hitText = `@${ev.login} hit **${boss.name}** for ${dmg} damage${crit ? ' (CRITICAL HIT!)' : ''}`;
        if (hp <= 0) {
          const mvp = [...bossDamage.entries()].sort((a, b) => b[1] - a[1])[0][0];
          slain.push({ name: boss.name, finisher: ev.login, mvp, at: ev.createdAt });
          const defeated = boss.name;
          boss = bossAt(boss.index + 1);
          hp = boss.hp;
          bossDamage = new Map();
          reply = `${hitText} and landed the final blow! **${defeated} is defeated!** MVP: @${mvp}\n\nA wild **${boss.name}** appears with ${boss.hp} HP...`;
        } else {
          reply = `${hitText}. ${boss.name} has ${hp}/${boss.hp} HP left.`;
        }
      }
    }
    if (ev.open) replies.push({ number: ev.number, body: reply + FOOTER });
  }
  decayTo(Date.parse(now));

  const care = { food: Math.round(food), love: Math.round(love), fed, pets };
  care.mood = moodOf(care);
  care.fans = [...fans.values()]
    .filter((f) => f.feeds + f.pets > 0)
    .sort((a, b) => b.feeds + b.pets - (a.feeds + a.pets))
    .slice(0, 3);

  const mvp = [...bossDamage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    care,
    boss: { ...boss, current: Math.max(0, hp), hits: hits.slice(-3).reverse(), slain, mvp },
    replies,
  };
}
