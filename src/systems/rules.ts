// Pure game rules. No Phaser. Every action returns a new State (or the same
// one when the action is not allowed), so costs apply exactly once.
import {
  BATHROOM_MINUTES, BBQ_ARRIVE, BISCUIT_ARRIVE, CLUES, TEST, TRUCK_ARRIVE, DATE_ARRIVE, ENDINGS, ITEMS, PHARMACY_ARRIVE, PILLS_HOURS, SERVERS, type ItemId, type ServerId, FOODS, INTOLERANT, LACTASE, LINE_GROWS_AT, REACTION_MINUTES, RICK_SAUCE,
  PEOPLE, SEATS, START, STOMACH_LIMIT, TODD_CHAT, type FactLine, type Food, type Mark, type Person, type Seat, type Trigger,
} from '../content/index.ts';

export const TRIGGERS: Trigger[] = ['dairy', 'onion'];
export const TOPIC: Record<Trigger, string> = { dairy: 'Dairy', onion: 'Onion' };
export type Status = 'unknown' | 'suspected' | 'confirmed';
export type SceneId = 'test' | 'grocery' | 'pharmacy' | 'truck' | 'bbq' | 'date' | 'pizza' | 'biscuit';
// Condition load at or above this follows you: you show up to the next thing wiped out.
export const CONDITION_DANGER = 8;

export interface State {
  seed: number;
  scene: SceneId;
  minute: number;
  money: number;
  hunger: number;
  satisfaction: number;
  conditionLoad: number;
  doses: Record<Trigger, number>; // actual accumulated intolerance doses (hidden)
  status: Record<Trigger, Status>; // what the player believes
  lactase: number;
  antacid: number;
  pillsUntil: number; // seasonal pills protect until this minute
  bathroomMinutes: number;
  bathroomAtStart: number; // for "did this scene send you to the bathroom"
  reactions: number; // allergy reactions today
  gambles: number; // foods eaten while something about them was unknown or risky
  peanutGambles: number; // ...of those, ones where peanut itself was the open question
  toddChats: number;
  rel: Record<Person, number>; // relationships with key people, 0-10
  relLog: { who: Person; d: number; why: string }[];
  seat: Seat | null;
  trust: number; // Sam's trust in your judgment, 0-10
  patience: number; // Sam's patience tonight, 0-10; runs out -> Sam leaves
  server: ServerId | null; // tonight's server
  known: string[];
  eaten: string[];
  contaminated: Record<string, boolean>; // actual truth, rolled once
  log: string[];
  outcome: string | null;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number) => Math.max(0, Math.min(10, n));
const trim = (t: string) => t.replace(/\.("?)$/, '$1'); // drop a final period, even inside a closing quote

export function newRun(seed: number): State {
  const rng = mulberry32(seed);
  const contaminated: Record<string, boolean> = {};
  for (const f of Object.values(FOODS)) contaminated[f.id] = f.crossContact > 0 && rng() < f.crossContact;
  return {
    seed, scene: 'grocery', ...START, doses: { dairy: 0, onion: 0 }, status: { dairy: 'unknown', onion: 'unknown' },
    lactase: 0, antacid: 0, pillsUntil: 0, bathroomMinutes: 0, bathroomAtStart: 0, reactions: 0, gambles: 0, peanutGambles: 0, toddChats: 0, seat: null, trust: 5, patience: 10, server: null,
    rel: Object.fromEntries(Object.entries(PEOPLE).map(([p, v]) => [p, v.start])) as Record<Person, number>, relLog: [],
    known: [], eaten: [], contaminated, log: [], outcome: null,
  };
}

// Scene handoffs. Each resets per-scene bits (doses, eaten, seat) and carries everything else.
const arrive = (s: State, scene: SceneId, at: number, hunger: number, line: string): State => note({
  ...s, scene, outcome: null, minute: Math.max(s.minute + 20, at), hunger: clamp(s.hunger + hunger),
  doses: { dairy: 0, onion: 0 }, eaten: [], seat: null, bathroomAtStart: s.bathroomMinutes,
}, line);

export const toPharmacy = (s: State) => arrive(s, 'pharmacy', PHARMACY_ARRIVE, 0, 'Stopped at the pharmacy to prep for the day.');
export const toBiscuit = (s: State) => arrive(s, 'biscuit', BISCUIT_ARRIVE, 1, 'Walked past Biscuit Barn on the way home. It was open. It is always open.');

// -> BBQ. Eating at the truck means arriving less hungry.
export function toBbq(s: State): State {
  const lunch = s.scene === 'truck' && s.eaten.length > 0;
  return note({
    ...s, scene: 'bbq', outcome: null, minute: Math.max(s.minute + 30, BBQ_ARRIVE), hunger: clamp(s.hunger + (lunch ? 0 : 2)),
    doses: { dairy: 0, onion: 0 }, eaten: [], seat: null, bathroomAtStart: s.bathroomMinutes,
  }, lunch ? "Drove to Uncle Rick's with lunch in you." : "Skipped lunch and drove to Uncle Rick's.");
}

export const toTruck = (s: State) => arrive(s, 'truck', TRUCK_ARRIVE, 1, 'Stopped at the food truck on the way. The line was long.');

// Morning allergy test: pay for the extended panel and learn dairy (and a hint about onion) up front.
export function extendedPanel(s: State): State {
  if (s.known.includes('extended_panel') || s.money < TEST.price) return s;
  return note({ ...s, money: s.money - TEST.price, known: [...s.known, 'extended_panel'], status: { dairy: 'confirmed', onion: 'suspected' } },
    'Paid for the extended allergy panel: dairy intolerance confirmed, onion borderline.');
}

// ---------- save / resume ----------

export const SAVE_VERSION = 2;
const SCENES: SceneId[] = ['test', 'grocery', 'pharmacy', 'truck', 'bbq', 'date', 'pizza', 'biscuit'];

// Validate a stored save. Anything from another version or shape is rejected, not migrated.
export function parseSave(raw: string | null): State | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { v?: number; state?: State };
    const st = v.state;
    if (v.v !== SAVE_VERSION || !st || !SCENES.includes(st.scene) || typeof st.minute !== 'number' || typeof st.trust !== 'number' || !st.rel || !st.status) return null;
    return st;
  } catch {
    return null;
  }
}
export const serializeSave = (s: State) => JSON.stringify({ v: SAVE_VERSION, state: s });

// Time passes; hunger rises one point per 15-minute boundary crossed.
function tick(s: State, mins: number): State {
  const minute = s.minute + mins;
  return { ...s, minute, hunger: clamp(s.hunger + Math.floor(minute / 15) - Math.floor(s.minute / 15)) };
}

const note = (s: State, line: string): State => ({ ...s, log: [...s.log, line] });

// `known` also holds plain flags (allergy_card, sat_cedar, ...) that have no clue entry.
export const probablyFines = (s: State) => s.known.filter((id) => CLUES[id]?.probablyFine).length;
export const checkoutMinutes = (s: State) => (s.minute >= LINE_GROWS_AT && s.scene === 'grocery' ? 12 : 2);

// Learn a clue or set a flag: costs its time once, never changes what anything contains.
export function inspect(s: State, clueId: string, minutes = CLUES[clueId].minutes): State {
  if (s.outcome || s.known.includes(clueId)) return s;
  return note({ ...tick(s, minutes), known: [...s.known, clueId] }, CLUES[clueId].recap);
}

// Small talk with Todd: 1 min each, escalating. One line reveals the cookie label.
export function chatTodd(s: State): State {
  if (s.outcome || s.toddChats >= TODD_CHAT.length) return s;
  const c = TODD_CHAT[s.toddChats];
  const n = { ...tick(s, 1), toddChats: s.toddChats + 1 };
  if (!c.reveals || s.known.includes(c.reveals)) return n;
  return note({ ...n, known: [...n.known, c.reveals] }, c.recap ?? CLUES[c.reveals].recap);
}

export function buyLactase(s: State): State {
  if (s.outcome || s.lactase > 0 || s.money < LACTASE.price) return s;
  return note({ ...tick(s, 1), money: s.money - LACTASE.price, lactase: LACTASE.uses },
    'Bought lactase. Helps with dairy. Does nothing for peanuts.');
}

// Intolerances: dose-based, per trigger. Lactase absorbs a dairy dose and never touches
// allergy logic. A complaint only teaches what the exposure makes unambiguous:
// one unconfirmed trigger and nothing else to blame -> confirmed; otherwise -> suspected.
function stomach(s: State, doses: Partial<Record<Trigger, number>>, source: string, intolerant: Trigger[]): State {
  let n = s;
  const present: Trigger[] = [];
  let hit = false;
  for (const t of TRIGGERS) {
    const dose = doses[t] ?? 0;
    if (!dose) continue;
    if (t === 'dairy' && n.lactase > 0) {
      n = note({ ...n, lactase: n.lactase - 1 }, `Lactase handled the dairy in the ${source}.`);
      continue;
    }
    present.push(t);
    const acc = n.doses[t] + dose;
    if (intolerant.includes(t) && acc >= STOMACH_LIMIT) { hit = true; n = { ...n, doses: { ...n.doses, [t]: 0 } }; }
    else n = { ...n, doses: { ...n.doses, [t]: acc } };
  }
  if (!present.length) return n;
  if (!hit) return note(n, `A little ${present.join(' and ')} in the ${source}. Your stomach allowed it. For now.`);

  const status = { ...n.status };
  const open = present.filter((t) => status[t] !== 'confirmed');
  const knownCulprit = present.length > open.length;
  for (const t of open) status[t] = !knownCulprit && open.length === 1 ? 'confirmed' : 'suspected';
  const changed = TRIGGERS.filter((t) => status[t] !== n.status[t]).map((t) => `${TOPIC[t]}: ${status[t]}`);
  const antacid = n.antacid > 0;
  const mins = antacid ? BATHROOM_MINUTES / 2 : BATHROOM_MINUTES;
  return note(
    { ...tick(n, mins), status, antacid: n.antacid - (antacid ? 1 : 0), conditionLoad: n.conditionLoad + 3, bathroomMinutes: n.bathroomMinutes + mins },
    `Stomach complaint after the ${source} (it had ${present.join(' and ')}).${changed.length ? ` ${changed.join('. ')}.` : ''}${antacid ? ' The antacid halved the bathroom time.' : ''}`,
  );
}

// The food as it costs *you* right now: once Sam covers dinner, your share is $0.
export const foodFor = (s: State, id: string): Food => (EVENING[s.scene] && s.known.includes('sam_covered') ? { ...FOODS[id], price: 0 } : FOODS[id]);

export function canEat(s: State, id: string) {
  const f = foodFor(s, id);
  return !s.outcome && s.money >= f.price && (f.endsScene || !s.eaten.includes(id)) && (!f.requires || s.known.includes(f.requires));
}

export function eat(s: State, id: string): State {
  if (!canEat(s, id)) return s;
  const risky = isRisky(s, id);
  let n = resolve(s, foodFor(s, id));
  if (peanutRisk(s, id)) n = { ...n, peanutGambles: n.peanutGambles + 1 };
  if (risky) {
    // resolve's safe line says every fact was known; for a gamble that worked out, it wasn't.
    const log = n.outcome?.startsWith('safe') ? [...n.log.slice(0, -1), `You ate the ${FOODS[id].name}. Not every fact was known. It worked out.`] : n.log;
    n = { ...n, gambles: n.gambles + 1, log };
  }
  return EVENING[s.scene] ? atDinner(s, n, id) : n;
}

// Was peanut itself unanswered when you ate it? (Dairy and onion unknowns are your business.)
export const peanutRisk = (s: State, id: string) => factLines(s, id).some((l) => l.topic === 'Peanut' && l.mark !== '✓');

// What Sam sees when you eat: peanut gambles they know the stakes of, bathroom trips, a
// reaction they were never warned about, the pricey dish on their dime.
function atDinner(s: State, n: State, id: string): State {
  const knows = samKnows(s);
  const name = FOODS[id].name;
  if (peanutRisk(s, id) && knows) n = trust(n, -knows, `Sam knew about the allergy and watched you gamble on the ${name}.`);
  if (n.outcome === 'reaction' && !knows) n = trust(n, -3, 'Sam had no idea about the allergy until the reaction.');
  if (n.bathroomMinutes > s.bathroomMinutes) n = wait(n, 3, `You disappeared to the bathroom for ${n.bathroomMinutes - s.bathroomMinutes} minutes.`);
  if (s.known.includes('sam_covered') && FOODS[id].price >= 14) n = relate(n, 'sam', -1, `You ordered the ${name} on Sam's dime.`);
  return n;
}

// The one place eating is resolved. `preview` runs this same function on hypothetical
// cases, so the numbers shown before a choice can't drift from what happens.
function resolve(s: State, f: Food, intolerant: Trigger[] = INTOLERANT): State {
  const before = s.bathroomMinutes;
  let n = tick(
    {
      ...s, money: s.money - f.price, hunger: clamp(s.hunger + f.hunger), satisfaction: clamp(s.satisfaction + f.satisfaction),
      eaten: [...s.eaten, f.id],
    },
    f.endsScene ? checkoutMinutes(s) : f.minutes ?? 1,
  );
  for (const [p, d] of Object.entries(f.social ?? {}) as [Person, number][]) n = relate(n, p, d, `You ate the ${f.name}.`);
  n = stomach(n, f.doses, f.name, intolerant);

  // True allergy: ingredient or cross-contact. Nothing in the pocket changes this.
  if (f.peanut || n.contaminated[f.id]) {
    const how = f.peanut ? 'had peanut in it' : `had peanut cross-contact (${f.contactSource})`;
    n = note({ ...tick(n, REACTION_MINUTES), conditionLoad: n.conditionLoad + 8, satisfaction: clamp(n.satisfaction - 3), reactions: n.reactions + 1 },
      `The ${f.name} ${how}. Peanut allergy reaction: you used your emergency med, then spent hours getting checked out.`);
    // A gamble that goes wrong at someone's event strains things when they were never told.
    const host = HOSTS[n.scene];
    if (host && !n.known.includes(host.told)) n = relate(n, host.who, -2, host.why);
    return { ...n, outcome: 'reaction' };
  }
  if (!f.endsScene) return n;
  if (n.bathroomMinutes > before) return { ...n, outcome: 'stomach' };
  if (f.crossContact > 0) {
    return { ...note(n, `The ${f.name} could have had peanut contact (${f.contactSource}). This batch didn't. Lucky, not safe.`), outcome: 'got_away' };
  }
  return { ...note(n, `You ate the ${f.name}. Every fact on it was known and safe before you paid.`), outcome: f.satisfaction > 0 ? 'safe_smug' : 'safe_bored' };
}

export function leave(s: State): State {
  if (s.outcome) return s;
  return { ...note({ ...s, hunger: clamp(s.hunger + 3) }, 'You left with nothing. Safe, and very hungry.'), outcome: 'hungry' };
}

// ---------- BBQ: Uncle Rick ----------

// Whose event it is, and whether you'd told them: a reaction there strains things only if you hadn't.
const HOSTS: Partial<Record<SceneId, { who: Person; told: string; why: string }>> = {
  bbq: { who: 'rick', told: 'told_rick', why: 'You risked his food without telling him about the allergy. He wishes you had.' },
  date: { who: 'sam', told: 'told_sam', why: 'You risked it without telling Sam about the allergy. Sam wishes you had.' },
  pizza: { who: 'sam', told: 'told_sam', why: 'You risked it without telling Sam about the allergy. Sam wishes you had.' },
};

// Relationships: every change carries a plain-language reason for the recap.
export function relate(s: State, who: Person, d: number, why: string): State {
  if (!d) return s;
  return { ...s, rel: { ...s.rel, [who]: clamp(s.rel[who] + d) }, relLog: [...s.relLog, { who, d, why }] };
}

// Rick has three versions of the sauce recipe. Pressing him costs goodwill,
// unless you've told him why you're asking.
export function askSauce(s: State): State {
  const next = RICK_SAUCE.find((c) => !s.known.includes(c));
  if (!next || s.outcome) return s;
  const penalty = s.known.includes('told_rick') || next === RICK_SAUCE[0] ? 0 : 1;
  return relate(inspect(s, next), 'rick', -penalty, 'You kept pressing him about the sauce without saying why.');
}

export const askRub = (s: State) => inspect(s, 'rick_rub');
// Telling Rick after turning down his ribs repairs it: now he knows why.
export function tellRick(s: State): State {
  if (s.known.includes('told_rick') || s.outcome) return s;
  const repair = s.known.includes('declined_ribs');
  return relate(inspect(s, 'told_rick'), 'rick', repair ? 2 : 1, repair ? 'You explained why you passed on the ribs. He gets it now.' : 'You told him about the allergy up front.');
}
export const orderBurger = (s: State) =>
  (!s.known.includes('told_rick') || s.known.includes('burger_ordered') || s.outcome ? s : relate(inspect(s, 'burger_ordered'), 'rick', 1, 'You let him make you something safe.'));
export const declineRibs = (s: State) =>
  (s.known.includes('declined_ribs') || s.outcome ? s
    : relate(inspect(s, 'declined_ribs'), 'rick', s.known.includes('told_rick') ? 0 : -1, 'You turned down the ribs without explaining why.'));
export const negotiateCat = (s: State) => inspect(s, s.known.includes('cat_try') ? 'cat_moved' : 'cat_try');

// Seats: effects apply the first time you sit somewhere; switching back is free.
export function sit(s: State, seat: Seat): State {
  if (s.outcome || s.seat === seat || (seat === 'cat' && !s.known.includes('cat_moved'))) return s;
  const flag = `sat_${seat}`;
  if (s.known.includes(flag)) return { ...tick(s, 1), seat };
  const e = SEATS[seat];
  const pills = pillsActive(s) && e.condition > 0;
  return note({
    ...tick(s, e.minutes), seat, known: [...s.known, flag],
    satisfaction: clamp(s.satisfaction + e.fun), conditionLoad: s.conditionLoad + (pills ? 0 : e.condition),
  }, pills ? `${e.line} The allergy pills handled it.` : e.line);
}

export function leaveBbq(s: State): State {
  if (s.outcome) return s;
  const outcome = s.bathroomMinutes > s.bathroomAtStart ? 'stomach' : s.rel.rick <= 3 ? 'rick_hurt' : s.hunger >= 7 && !s.eaten.length ? 'hungry' : 'social_win';
  return { ...note(s, `Said goodbye to Rick (${s.rel.rick}/10).`), outcome };
}

// ---------- knowledge ----------

// What the player can see about a food right now (knowledge, not truth).
export function factLines(s: State, id: string): { topic: string; mark: Mark; text: string }[] {
  return FOODS[id].facts.map((l: FactLine) =>
    l.clues && !l.clues.some((c) => s.known.includes(c)) ? { topic: l.topic, mark: '?', text: l.unknown ?? '???' } : l,
  );
}

export const isRisky = (s: State, id: string) => preview(s, id).risks.some((r) => r.mark !== '✓');

// Worst visible mark for a food: drives the badge on the prop.
export function worstMark(s: State, id: string): Mark {
  const marks = factLines(s, id).map((l) => l.mark);
  return marks.includes('!') ? '!' : marks.includes('?') ? '?' : '✓';
}

export function endingCopy(s: State): { title: string; sub: string } {
  const table = ENDINGS[s.scene] as Record<string, { title: string; sub: string; detour?: string }>;
  const host = HOSTS[s.scene];
  const untold = s.outcome === 'reaction' && host && !s.known.includes(host.told) && table.reaction_untold;
  const e = table[untold ? 'reaction_untold' : s.outcome!];
  const sub = s.bathroomMinutes > 0 && e.detour ? e.detour.replace('{bath}', String(s.bathroomMinutes)) : e.sub;
  return { title: e.title, sub };
}

// ---------- choice preview ----------

export interface Delta {
  money: number; minutes: number; hunger: number; fun: number; condition: number; trust: number; patience: number;
  rel: Record<Person, number>; endsOuting: boolean;
}
export interface RiskLine { topic: string; mark: Mark; text: string; ifBad?: Delta; bad?: State }
export interface Preview { base: Delta; risks: RiskLine[] }

export const diff = (a: State, b: State): Delta => ({
  money: b.money - a.money, minutes: b.minute - a.minute, hunger: b.hunger - a.hunger, fun: b.satisfaction - a.satisfaction,
  condition: b.conditionLoad - a.conditionLoad, trust: b.trust - a.trust, patience: b.patience - a.patience,
  rel: Object.fromEntries(Object.keys(a.rel).map((p) => [p, b.rel[p as Person] - a.rel[p as Person]])) as Record<Person, number>,
  endsOuting: b.outcome === 'reaction' || b.outcome === 'walked_out',
});

const STATUS_WORD: Record<Status, string> = { unknown: 'unknown', suspected: 'suspected', confirmed: 'intolerant' };

// What the player can reasonably expect from eating `id`, built only from what they know.
// Unknowns become "if it goes wrong" cases, resolved by the same rules as the real choice
// but with assumed worst-case inputs, so hidden truth never leaks into the numbers.
export function preview(s: State, id: string): Preview {
  const facts = Object.fromEntries(factLines(s, id).map((l) => [l.topic, l]));
  const calm: State = { ...s, contaminated: { ...s.contaminated, [id]: false } };
  const f = foodFor(s, id);
  const calmBase = resolve(calm, { ...f, doses: {}, peanut: false });
  let base = diff(s, calmBase);
  const risks: RiskLine[] = [];

  const p = facts.Peanut;
  if (p) risks.push(p.mark === '✓' ? { ...p } : { ...p, bad: resolve(calm, { ...f, doses: {}, peanut: true }) });

  const open: Trigger[] = [];
  for (const t of TRIGGERS) {
    const l = facts[TOPIC[t]];
    if (!l) continue;
    if (l.mark === '✓') risks.push({ ...l });
    else if (t === 'dairy' && s.lactase > 0) risks.push({ topic: l.topic, mark: '✓', text: `${trim(l.text)}. Lactase covers it (uses 1 of ${s.lactase}).` });
    else {
      risks.push({ topic: l.topic, mark: l.mark, text: `${trim(l.text)}. You: ${STATUS_WORD[s.status[t]]}.` });
      open.push(t);
    }
  }
  if (open.length) {
    // Only when every open trigger is both known-present and known-intolerant do we resolve the real dose.
    const sure = open.every((t) => s.status[t] === 'confirmed' && facts[TOPIC[t]].mark === '!');
    const r = sure
      ? resolve(calm, { ...f, peanut: false })
      : resolve(calm, { ...f, peanut: false, doses: Object.fromEntries(open.map((t) => [t, STOMACH_LIMIT])) }, TRIGGERS);
    const upset = r.minute > calmBase.minute;
    risks.push(!sure
      ? { topic: 'Stomach', mark: '?', text: 'Might not agree with you.', bad: r }
      : upset
        ? { topic: 'Stomach', mark: '!', text: 'This will upset your stomach.', bad: r }
        : { topic: 'Stomach', mark: '✓', text: 'A small dose. Your stomach should cope.' });
  }
  // At dinner, Sam's reaction to the choice goes through the same rule as the real meal.
  const dine = (n: State) => (EVENING[s.scene] ? atDinner(s, n, id) : n);
  base = diff(s, dine(calmBase));
  return { base, risks: risks.map(({ bad, ...r }) => (bad ? { ...r, ifBad: diff(s, dine(bad)) } : r)) };
}

// ---------- Pharmacy ----------

export const pillsActive = (s: State) => s.minute < s.pillsUntil;

export function canBuy(s: State, id: ItemId | 'lactase'): boolean {
  if (s.outcome) return false;
  if (id === 'lactase') return s.lactase === 0 && s.money >= LACTASE.price;
  if (s.money < ITEMS[id].price) return false;
  if (id === 'pills' || id === 'drowsy') return !pillsActive(s);
  if (id === 'antacid') return s.antacid === 0;
  return !s.known.includes('allergy_card');
}

export function buyItem(s: State, id: ItemId | 'lactase'): State {
  if (!canBuy(s, id)) return s;
  if (id === 'lactase') return buyLactase(s);
  const it = ITEMS[id];
  const n = { ...s, money: s.money - it.price };
  if (id === 'pills' || id === 'drowsy') {
    const t = tick(n, id === 'drowsy' ? 20 : 1);
    return note({ ...t, pillsUntil: t.minute + PILLS_HOURS * 60, satisfaction: clamp(t.satisfaction - (id === 'drowsy' ? 2 : 0)) },
      id === 'drowsy' ? 'Took the cheap allergy pills and napped in the car.' : 'Took non-drowsy allergy pills: good for about six hours.');
  }
  if (id === 'antacid') return note({ ...tick(n, 1), antacid: ITEMS.antacid.uses }, 'Bought antacid: cleanup, not prevention.');
  return note({ ...tick(n, ITEMS.card.minutes), known: [...n.known, 'allergy_card'] }, 'Wrote an allergy card for servers.');
}

// ---------- The Date (Trattoria or Slice Society) ----------

// Per-venue clue ids, the thing Sam wants to share, and the cheapest thing you could
// order (below it, you can't pay for dinner).
const EVENING: Partial<Record<SceneId, { guess: string; partial: string; checked: string; passed: string; cheapest: number }>> = {
  date: { guess: 'server_guess', partial: 'server_partial', checked: 'server_checked', passed: 'passed_torte', cheapest: 12 },
  pizza: { guess: 'pizza_guess', partial: 'pizza_partial', checked: 'pizza_checked', passed: 'passed_pesto', cheapest: 4 },
};
export const isEvening = (s: State) => !!EVENING[s.scene];
export const venueChecked = (s: State) => !!EVENING[s.scene] && s.known.includes(EVENING[s.scene]!.checked);

// 0 = Sam knows nothing, 1 = knows about the allergy, 2 = understands how serious it is.
export const samKnows = (s: State) => (s.known.includes('told_sam') ? (s.known.includes('sam_understands') ? 2 : 1) : 0);

const trust = (s: State, d: number, why: string): State => (d ? note({ ...s, trust: clamp(s.trust + d) }, why) : s);

// Tonight's delays. When Sam's patience runs out, Sam leaves.
export function wait(s: State, d: number, why: string): State {
  if (!d || !EVENING[s.scene]) return s;
  let n = note({ ...s, patience: Math.max(0, s.patience - d) }, why);
  if (n.patience === 0 && !n.outcome) n = { ...note(n, "Sam's patience ran out. Sam called it a night."), outcome: 'walked_out' };
  return n;
}

const SERVER_IDS = Object.keys(SERVERS) as ServerId[];
export const pickServer = (seed: number, scene: SceneId): ServerId =>
  SERVER_IDS[Math.floor(mulberry32(seed * 31 + (scene === 'pizza' ? 7 : 3))() * SERVER_IDS.length)];

// Arriving at dinner is where the day catches up: running late, arriving wiped out,
// Rick's plate for the road (or Rick's voicemails).
function toEvening(s: State, scene: 'date' | 'pizza'): State {
  const where = scene === 'date' ? 'the restaurant' : 'Slice Society';
  let n: State = { ...arrive(s, scene, DATE_ARRIVE, 2, `Went home, changed shirts twice, and met Sam at ${where}.`), patience: 10, server: pickServer(s.seed, scene) };
  const late = n.minute - DATE_ARRIVE;
  if (late >= 20) n = wait(n, Math.min(4, Math.ceil(late / 30)), `You showed up ${late} minutes late.`);
  if (s.conditionLoad >= CONDITION_DANGER) n = wait(n, 2, 'You arrived wiped out from earlier. Sam noticed right away.');
  if (s.rel.rick >= 8) n = note({ ...n, hunger: clamp(n.hunger - 2) }, "Rick's plate for the road took the edge off your hunger.");
  else if (s.rel.rick <= 3) n = wait(n, 1, 'Rick called twice during appetizers. You let it ring. Sam noticed.');
  return n;
}
export const toDate = (s: State) => toEvening(s, 'date');
export const toPizza = (s: State) => toEvening(s, 'pizza');

export function tellSam(s: State): State {
  if (s.known.includes('told_sam') || s.outcome) return s;
  const early = !s.eaten.length;
  const n = relate(inspect(s, 'told_sam'), 'sam', early ? 1 : 0, 'You told Sam about the allergy before ordering.');
  return early ? trust(n, 1, 'Sam trusts your judgment more for hearing it up front.') : note(n, 'You told Sam, after you had already started eating.');
}

// Once Sam knows, you can explain how serious it is: then Sam is on your side, not just aware.
export const explainSam = (s: State) =>
  (!s.known.includes('told_sam') || s.known.includes('sam_understands') || s.outcome ? s
    : relate(trust(inspect(s, 'sam_understands'), 1, 'Sam understands what is at stake now.'), 'sam', 1, 'You let Sam in on something real.'));

// Broke at dinner: Sam can cover it. Sam is nice about it. Sam also notices.
export const canAskSamToCover = (s: State) => !!EVENING[s.scene] && !s.outcome && !s.known.includes('sam_covered') && s.money < EVENING[s.scene]!.cheapest;
export const samCovers = (s: State) =>
  (!canAskSamToCover(s) ? s
    : trust(relate(inspect(s, 'sam_covered'), 'sam', -1, 'Sam covered dinner because you were out of money.'), -1, 'Showing up with no money made Sam wonder about the rest of your planning.'));

// Servers differ: some guess before checking, some rush a partial check, some make asking
// twice cost you. With your allergy card, the real check is quicker for everyone.
export function askServer(s: State): State {
  const v = EVENING[s.scene];
  if (!v || !s.server || s.outcome || s.known.includes(v.checked)) return s;
  const sv = SERVERS[s.server];
  const card = s.known.includes('allergy_card');
  const told = s.known.includes('told_sam');
  const guessed = s.known.includes(v.guess);
  let n = sv.forgets && !s.known.includes(v.partial) ? inspect(s, v.partial, card ? sv.cardMinutes : 2)
    : !card && sv.guesses && !guessed ? inspect(s, v.guess, 2)
      : inspect(s, v.checked, card ? sv.cardMinutes : sv.checkMinutes);
  if (sv.pressure && guessed) n = { ...note(n, `${sv.name} sighed, loudly. Asking again cost you some fun.`), satisfaction: clamp(n.satisfaction - 1) };
  if (n.known.includes(v.checked)) {
    if (n.minute - s.minute >= 10 && !told) n = relate(n, 'sam', -1, 'Sam waited through a long kitchen check without knowing why.');
    if (told) n = trust(n, 1, 'Sam watched you get a real answer from the kitchen.');
  }
  return wait(n, Math.max(0, sv.askPatience - (told ? 1 : 0)), 'Sam waited while you questioned the server.');
}

export const lookTorte = (s: State) => inspect(s, 'torte_looked');
export const lookCutter = (s: State) => inspect(s, 'cutter_looked');
export const lookPesto = (s: State) => inspect(s, 'pesto_looked');

// The safe pizza: a whole plain pie cut in the back. Only offered once the kitchen admits the cutter.
export const freshCutter = (s: State) =>
  (s.scene !== 'pizza' || !s.known.includes('pizza_checked') || s.known.includes('fresh_cutter') || s.outcome ? s
    : wait(inspect(s, 'fresh_cutter'), s.known.includes('told_sam') ? 0 : 1, 'Twenty more minutes for a whole pie, and Sam did not know why.'));

export const moveVenue = (s: State) =>
  (s.known.includes('moved_venue') || s.outcome ? s
    : s.known.includes('told_sam') ? relate(inspect(s, 'moved_venue'), 'sam', 1, 'Sam liked the change of plans.')
      : wait(relate(inspect(s, 'moved_venue'), 'sam', -1, 'You moved dinner across the street without explaining why.'), 1, 'Walking out mid-date, with no reason given.'));

// Passing on the thing Sam is excited to share (the torte, the famous pesto).
export function passDessert(s: State): State {
  const v = EVENING[s.scene];
  if (!v || s.known.includes(v.passed) || s.outcome) return s;
  return relate(inspect(s, v.passed), 'sam', s.known.includes('told_sam') ? 0 : -1, 'You passed on the thing Sam was excited to share, with no explanation.');
}
export const passTorte = passDessert;

export function leaveDate(s: State): State {
  if (s.outcome) return s;
  const outcome = s.bathroomMinutes > s.bathroomAtStart ? 'stomach'
    : s.patience <= 2 ? 'impatient'
      : s.rel.sam <= 3 ? 'awkward'
        : s.hunger >= 7 && !s.eaten.length ? 'hungry'
          : s.known.includes('sam_covered') ? (s.rel.sam >= 6 ? 'cheap_charming' : 'unprepared')
            : s.rel.sam >= 7 ? (s.trust >= 6 ? 'honest_win' : 'charmed_unsure') : 'fine';
  return { ...note(s, `Said goodnight to Sam (interest ${s.rel.sam}/10, trust ${s.trust}/10).`), outcome };
}

// ---------- The Biscuit ----------

// Jo answers "love and lard" first. Your allergy card gets the straight answer right away.
export function askJo(s: State): State {
  if (s.outcome || s.known.includes('jo_board')) return s;
  if (s.known.includes('allergy_card') || s.known.includes('jo_love')) return inspect(s, 'jo_board');
  return inspect(s, 'jo_love');
}

export const lookBoard = (s: State) => inspect(s, 'board_looked');
export const leaveBiscuit = leave;

// ---------- End of Day ----------

export interface DaySummary {
  gambles: number; reactions: number; bathroom: number; money: number; probablyFine: number;
  discovered: string[]; people: { who: Person; rel: number }[]; score: number; grade: string;
  verdict: string; biscuit: string; next: string[];
}

// Did you risk it for the biscuit? Read from what you ate and what you knew when you ate it.
function biscuitCall(s: State): string {
  const knew = s.known.includes('jo_board') || s.known.includes('board_looked');
  if (s.eaten.includes('biscuit')) {
    if (s.reactions && s.scene === 'biscuit' && s.outcome === 'reaction') return knew ? 'You saw the crumbs and risked it for the biscuit anyway. It was not worth it.' : 'You risked it for the biscuit without asking. It was not worth it.';
    return knew ? 'You saw the crumbs and risked it for the biscuit anyway. You got lucky.' : 'You risked it for the biscuit without asking. You got lucky.';
  }
  if (s.eaten.includes('plain_biscuit')) return knew ? 'You checked, then took the safe biscuit. Honestly? Still great.' : 'You took the safe biscuit.';
  return s.scene === 'biscuit' ? 'You walked past the biscuit. It will be there next Saturday.' : 'You never made it to the biscuit.';
}

// The storyboard's recap card. The grade rewards a good day, not a cautious one or a lucky one:
// relationships, fun and a fed player count up; reactions, condition and hunger count down.
export function daySummary(s: State): DaySummary {
  const discovered = TRIGGERS.filter((t) => s.status[t] !== 'unknown').map((t) => `${TOPIC[t]} (${s.status[t]})`);
  const met = (Object.keys(s.rel) as Person[]).filter((p) => s.relLog.some((r) => r.who === p));
  const avgRel = met.length ? met.reduce((a, p) => a + s.rel[p], 0) / met.length : 5;
  // Someone at 4 or below caps the day at B+: a great day doesn't leave anyone feeling that way.
  const strained = met.filter((p) => s.rel[p] <= 4);
  const score = Math.round(Math.max(0, Math.min(strained.length ? 84 : 100,
    60 + (avgRel - 5) * 6 + s.satisfaction * 2 - s.hunger * 2 - s.conditionLoad - s.reactions * 12 + discovered.length * 3 + (met.includes('sam') ? (s.trust - 5) * 2 : 0) - met.filter((p) => s.rel[p] <= 4).length * 8 - (s.gambles === 0 && !met.length ? 10 : 0))));
  const letter = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  const mod = letter !== 'F' && score % 15 >= 10 ? '+' : letter !== 'F' && score % 15 < 4 ? '−' : '';
  const singed = met.filter((p) => s.rel[p] <= 3);
  const verdict = s.reactions > 1 ? 'A ROUGH SATURDAY'
    : s.reactions ? 'IT HAPPENED. YOU GOT THROUGH IT.'
      : singed.length ? 'SAFE, BUT BRIDGES SINGED'
        : s.peanutGambles >= 2 ? 'SURVIVED ON LUCK'
          : strained.length ? 'SAFE, BUT SOMEONE NOTICED'
          : avgRel >= 6.5 && s.hunger <= 5 ? 'A GOOD SATURDAY' : 'YOU SURVIVED';
  // What this Saturday sets up for the next one.
  const next = [
    s.relLog.some((r) => r.who === 'rick') ? (s.rel.rick >= 7 ? 'Rick is already planning the next BBQ, with a foil burger on the menu.' : s.rel.rick <= 3 ? 'Rick might "forget" to invite you next time.' : '') : '',
    s.relLog.some((r) => r.who === 'sam') ? (s.rel.sam >= 7 && s.trust >= 6 ? 'Sam wants a second date and is already reading menus for you.' : s.rel.sam >= 7 ? 'Sam wants a second date, and is a little worried about you.' : s.rel.sam <= 3 ? 'Sam is "pretty busy next weekend."' : 'Sam might text you. Might.') : '',
    ...discovered.map((d) => `You know about ${d.toLowerCase()} now.`),
  ].filter(Boolean);
  return {
    gambles: s.gambles, reactions: s.reactions, bathroom: s.bathroomMinutes, money: s.money, probablyFine: probablyFines(s),
    discovered, people: met.map((who) => ({ who, rel: s.rel[who] })), score, grade: letter + mod, verdict, biscuit: biscuitCall(s), next,
  };
}

export const lookFryer = (s: State) => inspect(s, 'fryer_looked');
export const askCook = (s: State) => inspect(s, 'cook_fries');

// The day starts at the doctor's office at 9:30, then heads to the grocery store at 10:00.
export const startDay = (seed: number): State => note({ ...newRun(seed), scene: 'test', minute: 570 }, 'Allergy test results at 9:30.');
export const toGrocery = (s: State) => arrive(s, 'grocery', 600, 0, 'Drove to the grocery store.');
