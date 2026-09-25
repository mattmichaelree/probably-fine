import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  askSauce, buyLactase, chatTodd, declineRibs, eat, endingCopy, factLines, inspect, leave, leaveBbq, negotiateCat, newRun, orderBurger,
  preview, probablyFines, sit, tellRick, toBbq, worstMark, toPharmacy, toDate, buyItem, pillsActive, tellSam, askServer,
  lookTorte, moveVenue, passTorte, leaveDate, toBiscuit, askJo, daySummary, extendedPanel, toTruck, lookFryer, parseSave, serializeSave, startDay,
  explainSam, samCovers, canAskSamToCover, samKnows, toPizza, freshCutter, lookCutter, CONDITION_DANGER, type State,
} from '../src/systems/rules.ts';

// First seed where the cookie batch is (or isn't) contaminated.
const seedWhere = (dirty: boolean) => {
  for (let s = 1; s < 1000; s++) if (newRun(s).contaminated.cookie === dirty) return s;
  throw new Error('no seed');
};

test('same seed gives same truth', () => {
  assert.deepEqual(newRun(42).contaminated, newRun(42).contaminated);
});

test('safe items are never contaminated', () => {
  for (let s = 1; s < 200; s++) assert.equal(newRun(s).contaminated.bread, false);
});

test('peanut cross-contact causes reaction, and lactase does not prevent it', () => {
  const s = buyLactase(newRun(seedWhere(true)));
  assert.equal(s.lactase, 3);
  const n = eat(s, 'cookie');
  assert.equal(n.outcome, 'reaction');
  assert.equal(n.lactase, 2); // lactase handled the dairy only
  assert.equal(n.bathroomMinutes, 0);
});

test('clean batch cookie: got away, small dairy dose tolerated', () => {
  const n = eat(newRun(seedWhere(false)), 'cookie');
  assert.equal(n.outcome, 'got_away');
  assert.equal(n.status.dairy, 'unknown');
});

test('milkshake sample without lactase triggers intolerance, not allergy', () => {
  const n = eat(newRun(1), 'sample');
  assert.equal(n.outcome, null);
  assert.equal(n.status.dairy, 'confirmed');
  assert.equal(n.bathroomMinutes, 40);
  assert.ok(n.conditionLoad < 8);
});

test('sample with lactase: no complaint, one use consumed', () => {
  const n = eat(buyLactase(newRun(1)), 'sample');
  assert.equal(n.status.dairy, 'unknown');
  assert.equal(n.lactase, 2);
});

test('earlier dairy plus cookie accumulates dose into a stomach ending', () => {
  const s = { ...newRun(seedWhere(false)), doses: { dairy: 2, onion: 0 } };
  assert.equal(eat(s, 'cookie').outcome, 'stomach');
});

test('money and time are charged once; repeats are no-ops', () => {
  const s = newRun(1);
  const a = inspect(s, 'cookie_label');
  assert.equal(a.minute, s.minute + 3);
  assert.equal(inspect(a, 'cookie_label'), a);
  const b = buyLactase(a);
  assert.equal(b.money, 34);
  assert.equal(buyLactase(b), b);
  assert.equal(eat(eat(b, 'sample'), 'sample').eaten.length, 1);
});

test('cannot afford = unchanged', () => {
  const s = { ...newRun(1), money: 2 };
  assert.equal(eat(s, 'bread'), s);
});

test('inspecting changes knowledge, never truth', () => {
  const s = newRun(7);
  assert.equal(factLines(s, 'cookie')[0].mark, '?');
  const n = inspect(s, 'cookie_label');
  assert.equal(factLines(n, 'cookie')[0].mark, '!');
  assert.deepEqual(n.contaminated, s.contaminated);
});

test('checkout line grows after 10:30', () => {
  const early = eat(newRun(1), 'bread');
  const late = eat({ ...newRun(1), minute: 640 }, 'bread');
  assert.equal(early.minute - 600, 2);
  assert.equal(late.minute - 640, 12);
  assert.equal(early.outcome, 'safe_smug');
});

test('probably-fine counter and leaving', () => {
  const s = inspect(newRun(1), 'clerk_cookie');
  assert.equal(probablyFines(s), 1);
  const n = leave(s);
  assert.equal(n.outcome, 'hungry');
  assert.equal(eat(n, 'bread'), n); // scene over
});

test('Todd small talk escalates, third line reveals the label, then runs out', () => {
  let s = chatTodd(chatTodd(newRun(1)));
  assert.equal(s.known.includes('cookie_label'), false);
  s = chatTodd(s);
  assert.equal(s.known.includes('cookie_label'), true);
  assert.equal(s.minute, 603);
  s = chatTodd(s);
  assert.equal(chatTodd(s), s); // out of lines
});

test('watching the tongs reveals the same bakery fact as asking Todd', () => {
  assert.equal(worstMark(newRun(1), 'muffin'), '?');
  assert.equal(worstMark(inspect(newRun(1), 'tongs_watched'), 'muffin'), '!');
  assert.equal(worstMark(newRun(1), 'bread'), '✓');
});

test('ending copy acknowledges a bathroom detour', () => {
  assert.match(endingCopy(eat(newRun(1), 'bread')).sub, /Zero drama/);
  const detour = eat(eat(newRun(1), 'sample'), 'bread');
  assert.equal(detour.outcome, 'safe_smug');
  assert.doesNotMatch(endingCopy(detour).sub, /Zero drama/);
  assert.match(endingCopy(detour).sub, /40 min/);
});

test('preview matches resolution: clean batch = base, dirty batch = peanut worst case', () => {
  const clean = newRun(seedWhere(false));
  const p1 = preview(clean, 'cookie');
  const a1 = eat(clean, 'cookie');
  assert.deepEqual([p1.base.money, p1.base.minutes, p1.base.hunger, p1.base.fun, p1.base.condition],
    [a1.money - clean.money, a1.minute - clean.minute, a1.hunger - clean.hunger, a1.satisfaction - clean.satisfaction, a1.conditionLoad - clean.conditionLoad]);

  const dirty = newRun(seedWhere(true));
  const peanut = preview(dirty, 'cookie').risks.find((r) => r.topic === 'Peanut')!;
  const a2 = eat(dirty, 'cookie');
  assert.equal(peanut.ifBad!.endsOuting, true);
  assert.equal(peanut.ifBad!.condition, a2.conditionLoad - dirty.conditionLoad);
  assert.equal(peanut.ifBad!.minutes, a2.minute - dirty.minute);
});

test('preview never reveals truth: dirty and clean batches preview identically', () => {
  assert.deepEqual(preview(newRun(seedWhere(true)), 'cookie'), preview(newRun(seedWhere(false)), 'cookie'));
});

test('reading the label sharpens the preview; lactase changes dairy, never peanut', () => {
  const s = newRun(1);
  const before = preview(s, 'cookie').risks;
  const read = inspect(s, 'cookie_label');
  const after = preview(read, 'cookie').risks;
  assert.equal(before[0].mark, '?');
  assert.equal(after[0].mark, '!');
  const withLactase = preview(buyLactase(read), 'cookie').risks;
  assert.equal(withLactase[1].mark, '✓');
  assert.deepEqual(withLactase[0].ifBad && { ...withLactase[0].ifBad, money: 0, minutes: 0 }, after[0].ifBad && { ...after[0].ifBad, money: 0, minutes: 0 });
  assert.equal(withLactase[0].mark, '!');
});

test('milkshake worst case matches what actually happens', () => {
  const s = newRun(1);
  const worst = preview(s, 'sample').risks.find((r) => r.topic === 'Stomach')!.ifBad!;
  const a = eat(s, 'sample');
  assert.equal(worst.minutes, a.minute - s.minute);
  assert.equal(worst.condition, a.conditionLoad - s.conditionLoad);
});

// ---------- BBQ ----------

const atBbq = (seed = 1) => toBbq(newRun(seed));

test('grocery -> bbq handoff keeps knowledge and resources, resets doses', () => {
  const g = eat(newRun(1), 'sample'); // dairy confirmed at the grocery
  const b = toBbq(g);
  assert.equal(b.scene, 'bbq');
  assert.ok(b.minute >= 14 * 60);
  assert.equal(b.status.dairy, 'confirmed');
  assert.deepEqual(b.doses, { dairy: 0, onion: 0 });
  assert.equal(b.bathroomAtStart, g.bathroomMinutes);
});

test('ribs sauce is peanut: always a reaction, whatever Rick says', () => {
  const s = tellRick(atBbq());
  const n = eat(s, 'ribs');
  assert.equal(n.outcome, 'reaction');
});

test('Rick escalates the sauce recipe; pressing costs goodwill unless you told him', () => {
  let s = atBbq();
  s = askSauce(askSauce(askSauce(s)));
  assert.equal(s.known.includes('rick_sauce_3'), true);
  assert.equal(s.rel.rick, 4); // 6 - 0 - 1 - 1
  let t = tellRick(atBbq());
  t = askSauce(askSauce(askSauce(t)));
  assert.equal(t.rel.rick, 7); // 6 + 1, no penalties
  assert.equal(worstMark(t, 'ribs'), '!');
});

test('plain burger needs telling Rick first, then is safe', () => {
  const s = atBbq();
  assert.equal(orderBurger(s), s);
  assert.equal(eat(s, 'burger'), s);
  const n = eat(orderBurger(tellRick(s)), 'burger');
  assert.equal(n.outcome, null);
  assert.equal(n.conditionLoad, s.conditionLoad);
});

test('ambiguity: casserole (dairy+onion) with dairy already confirmed only makes onion suspected', () => {
  const s = toBbq(eat(newRun(1), 'sample'));
  const n = eat(s, 'casserole');
  assert.equal(n.status.onion, 'suspected');
  assert.equal(n.status.dairy, 'confirmed');
});

test('ambiguity: casserole with nothing known makes both suspected; brisket (onion only) confirms onion', () => {
  const s = eat(atBbq(), 'casserole');
  assert.deepEqual(s.status, { dairy: 'suspected', onion: 'suspected' });
  const clean = { ...s, contaminated: { ...s.contaminated, brisket: false } };
  const n = eat({ ...clean, doses: { dairy: 0, onion: 1 } }, 'brisket'); // 1 + 3 crosses the limit
  assert.equal(n.status.onion, 'confirmed');
  assert.equal(n.status.dairy, 'suspected');
});

test('lactase covers dairy in the casserole but not onion', () => {
  const s = { ...atBbq(), lactase: 3 };
  const n = eat(s, 'casserole');
  assert.equal(n.lactase, 2);
  assert.equal(n.status.onion, 'confirmed'); // only onion was in play
});

test('bbq preview never leaks truth: brisket previews the same dirty or clean', () => {
  const s = atBbq();
  const dirty = { ...s, contaminated: { ...s.contaminated, brisket: true } };
  const clean = { ...s, contaminated: { ...s.contaminated, brisket: false } };
  assert.deepEqual(preview(dirty, 'brisket'), preview(clean, 'brisket'));
});

test('preview shows Rick mood change', () => {
  assert.equal(preview(atBbq(), 'ribs').base.rel.rick, 2);
});

test('seats: cedar costs condition once; cat chair needs two tries', () => {
  const s = atBbq();
  const c = sit(s, 'cedar');
  assert.equal(c.conditionLoad, s.conditionLoad + 2);
  assert.equal(sit(s, 'cat'), s);
  const cat = negotiateCat(negotiateCat(c));
  const back = sit(sit(cat, 'cat'), 'cedar');
  assert.equal(back.conditionLoad, c.conditionLoad); // no double charge for returning
});

test('leaving the bbq: priority stomach > rick hurt > hungry > win', () => {
  assert.equal(leaveBbq(eat(atBbq(), 'casserole')).outcome, 'stomach');
  assert.equal(leaveBbq({ ...atBbq(), rel: { rick: 2, sam: 5 } }).outcome, 'rick_hurt');
  assert.equal(leaveBbq({ ...atBbq(), hunger: 9 }).outcome, 'hungry');
  assert.equal(leaveBbq({ ...atBbq(), hunger: 3 }).outcome, 'social_win');
  assert.equal(declineRibs(atBbq()).rel.rick, 5);
});

// ---------- relationships ----------

test('disclosing never lowers a relationship', () => {
  const s = atBbq();
  assert.ok(tellRick(s).rel.rick >= s.rel.rick);
  assert.ok(tellRick({ ...s, rel: { rick: 0, sam: 5 } }).rel.rick >= 0);
});

test('a reaction at Rick\'s strains things only if you never told him', () => {
  const untold = eat(atBbq(), 'ribs');
  assert.equal(untold.outcome, 'reaction');
  assert.equal(untold.rel.rick, 6 + 2 - 2); // enjoyed the ribs (+2), then "wishes you had told him" (-2)
  assert.match(untold.relLog[untold.relLog.length - 1].why, /without telling him/);
  const told = eat(tellRick(atBbq()), 'ribs');
  assert.equal(told.rel.rick, 6 + 1 + 2);
});

test('every relationship change is logged with a reason', () => {
  const s = declineRibs(askSauce(askSauce(atBbq())));
  assert.deepEqual(s.relLog.map((r) => r.d), [-1, -1]);
  assert.ok(s.relLog.every((r) => r.who === 'rick' && r.why.length > 10));
});

// ---------- Pharmacy ----------

const atPharmacy = () => toPharmacy(eat(newRun(1), 'bread')); // $31 left

test('seasonal pills protect at the cedar tree, and wear off before dinner', () => {
  const p = buyItem(atPharmacy(), 'pills');
  assert.equal(p.money, 19);
  const b = toBbq(p);
  assert.equal(pillsActive(b), true);
  assert.equal(sit(b, 'cedar').conditionLoad, b.conditionLoad); // pollen handled
  assert.equal(pillsActive(toDate(b)), false);
});

test('drowsy pills: cheap, same protection, costs fun and a nap', () => {
  const s = atPharmacy();
  const d = buyItem(s, 'drowsy');
  assert.equal(d.money, s.money - 4);
  assert.equal(d.satisfaction, s.satisfaction - 2);
  assert.ok(d.minute >= s.minute + 20);
  assert.equal(buyItem(d, 'pills'), d); // one dose at a time
});

test('pills never touch peanut outcomes', () => {
  const b = toBbq(buyItem(atPharmacy(), 'pills'));
  assert.equal(eat(b, 'ribs').outcome, 'reaction');
});

test('antacid halves bathroom time, once per use', () => {
  const b = toBbq(buyItem(atPharmacy(), 'antacid'));
  const n = eat(b, 'casserole');
  assert.equal(n.bathroomMinutes - b.bathroomMinutes, 20);
  assert.equal(n.antacid, 1);
});

// ---------- The Date ----------

// Tyler, the friendly server, behaves like the original single server: guess first, then a real check.
const atDate = (s = newRun(1)): State => ({ ...toDate(toBbq(s)), server: 'friendly' });

test('allergy card: the server checks quickly and reliably', () => {
  const s = atDate(toPharmacy(buyItem(toPharmacy(newRun(1)), 'card')));
  const n = askServer(s);
  assert.equal(n.known.includes('server_checked'), true);
  assert.equal(n.minute - s.minute, 3);
  assert.equal(n.known.includes('server_guess'), false);
});

test('no card: server guesses first, then a long check that costs Sam goodwill unless told', () => {
  const s = atDate();
  const g = askServer(s);
  assert.equal(g.known.includes('server_guess'), true);
  const c = askServer(g);
  assert.equal(c.minute - g.minute, 10);
  assert.equal(c.rel.sam, 4);
  assert.equal(askServer(askServer(tellSam(s))).rel.sam, 6);
});

test('the torte is peanut; untold reaction strains Sam, told does not', () => {
  const untold = eat(atDate(), 'torte');
  assert.equal(untold.outcome, 'reaction');
  assert.equal(untold.rel.sam, 5 + 2 - 2);
  assert.equal(eat(tellSam(atDate()), 'torte').rel.sam, 5 + 1 + 2);
  assert.equal(worstMark(lookTorte(atDate()), 'torte'), '!');
});

test('money limits the menu after pharmacy spending', () => {
  const broke = atDate(toPharmacy(buyItem(buyItem(atPharmacy(), 'pills'), 'antacid'))); // $14 left
  assert.equal(eat(broke, 'salmon'), broke);
  assert.notEqual(eat(broke, 'bruschetta'), broke);
});

test('moving venue and passing on the torte: explanation changes how Sam takes it', () => {
  assert.equal(moveVenue(atDate()).rel.sam, 4);
  assert.equal(moveVenue(tellSam(atDate())).rel.sam, 7);
  assert.equal(passTorte(atDate()).rel.sam, 4);
  assert.equal(passTorte(tellSam(atDate())).rel.sam, 6);
});

test('date endings', () => {
  assert.equal(leaveDate({ ...atDate(), hunger: 3, rel: { rick: 6, sam: 8 }, trust: 6 }).outcome, 'honest_win');
  assert.equal(leaveDate({ ...atDate(), hunger: 3, rel: { rick: 6, sam: 8 } }).outcome, 'charmed_unsure');
  assert.equal(leaveDate({ ...atDate(), hunger: 3, patience: 2 }).outcome, 'impatient');
  assert.equal(leaveDate({ ...atDate(), rel: { rick: 6, sam: 2 } }).outcome, 'awkward');
  assert.equal(leaveDate({ ...atDate(), hunger: 9 }).outcome, 'hungry');
  assert.equal(leaveDate({ ...atDate(), hunger: 3 }).outcome, 'fine');
});

// ---------- Biscuit + End of Day ----------

const atBiscuit = (s = newRun(1)) => toBiscuit(toDate(toBbq(s)));

test('Jo says "love and lard" first; the allergy card gets the straight answer', () => {
  const s = atBiscuit();
  const a = askJo(s);
  assert.equal(a.known.includes('jo_love'), true);
  assert.equal(worstMark(a, 'biscuit'), '!'); // dairy is on the menu either way
  assert.equal(askJo(a).known.includes('jo_board'), true);
  const carded = atBiscuit(buyItem(toPharmacy(newRun(1)), 'card'));
  assert.equal(askJo(carded).known.includes('jo_board'), true);
  assert.equal(askJo(carded).known.includes('jo_love'), false);
});

test('the biscuit gamble: contamination is rolled per run, the plain biscuit is safe', () => {
  let dirty = 0;
  for (let seed = 1; seed < 60; seed++) if (eat({ ...atBiscuit(newRun(seed)), lactase: 3 }, 'biscuit').outcome === 'reaction') dirty++;
  assert.ok(dirty > 5 && dirty < 55);
  const plain = eat({ ...atBiscuit(), lactase: 3 }, 'plain_biscuit');
  assert.equal(plain.outcome, 'safe_smug');
  // Dairy still unknown: it worked out, but the log must not claim every fact was known.
  const lucky = eat({ ...atBiscuit(), lactase: 0 }, 'plain_biscuit');
  assert.equal(lucky.gambles, 1);
  assert.match(lucky.log.at(-1)!, /Not every fact was known/);
});

test('day summary counts gambles, reactions and discoveries; grade reflects the day', () => {
  const g = eat(newRun(seedWhere(true)), 'cookie'); // an unread cookie with peanut contact
  const d = daySummary(g);
  assert.equal(d.gambles, 1);
  assert.equal(d.reactions, 1);
  const good = daySummary({ ...toDate(tellSam(atDate())), hunger: 2, satisfaction: 7, rel: { rick: 8, sam: 8 } });
  assert.ok(good.score > d.score);
  assert.ok(['A', 'B'].includes(good.grade[0]));
});

// ---------- Morning test, Food Truck, saves ----------

test('extended panel: $15 for dairy confirmed and onion suspected; once only', () => {
  const s = extendedPanel(newRun(1));
  assert.equal(s.money, 25);
  assert.deepEqual(s.status, { dairy: 'confirmed', onion: 'suspected' });
  assert.equal(extendedPanel(s), s);
});

test('food truck: fries share the peanut fryer; lunch means arriving at Rick\'s less hungry', () => {
  const t = toTruck(toPharmacy(newRun(1)));
  assert.equal(t.scene, 'truck');
  assert.equal(worstMark(lookFryer(t), 'fries'), '!');
  const ate = eat(t, 'wrap');
  assert.equal(toBbq(ate).hunger, ate.hunger);
  assert.equal(toBbq(t).hunger, Math.min(10, t.hunger + 2));
});

test('saves round-trip and reject bad data', () => {
  const s = toBbq(newRun(3));
  assert.deepEqual(parseSave(serializeSave(s)), s);
  assert.equal(parseSave(null), null);
  assert.equal(parseSave('not json'), null);
  assert.equal(parseSave(JSON.stringify({ v: 99, state: s })), null);
});

test('summary and counters survive flags that are not clues (allergy card, seats, panel)', () => {
  const s = sit(toBbq(buyItem(toPharmacy(extendedPanel(startDay(1))), 'card')), 'cedar');
  assert.doesNotThrow(() => daySummary(s));
  assert.equal(probablyFines(s), 0);
});

// ---------- Pass A/C: consequences carry into the evening ----------

const atPizza = (s = newRun(1), server: State['server'] = 'friendly'): State => ({ ...toPizza(toBbq(s)), server });

test('servers differ: careful checks straight away, busy rushes a partial check, dismissive makes insisting cost fun', () => {
  const careful = askServer({ ...atDate(), server: 'careful' });
  assert.equal(careful.known.includes('server_checked'), true);
  assert.equal(careful.known.includes('server_guess'), false);

  const busy = { ...atDate(), server: 'busy' as const };
  const partial = askServer(busy);
  assert.equal(partial.known.includes('server_partial'), true);
  assert.equal(worstMark(partial, 'pasta'), '!'); // mains' peanut line is answered (dairy is still '!')
  assert.equal(factLines(partial, 'pasta').find((l) => l.topic === 'Peanut')!.mark, '✓');
  assert.equal(factLines(partial, 'torte').find((l) => l.topic === 'Peanut')!.mark, '?'); // nobody mentioned dessert
  assert.equal(askServer(partial).known.includes('server_checked'), true);

  const rude = { ...atDate(), server: 'dismissive' as const };
  const guessed = askServer(rude);
  assert.equal(askServer(guessed).satisfaction, guessed.satisfaction - 1);
});

test('patience: questioning the server costs Sam patience unless Sam knows why; at zero Sam leaves', () => {
  const s = atDate();
  assert.equal(askServer(s).patience, s.patience - 1);
  assert.equal(askServer(tellSam(s)).patience, s.patience);
  const gone = askServer({ ...s, patience: 1 });
  assert.equal(gone.outcome, 'walked_out');
});

test('the day catches up at dinner: wiped out, Rick plate, Rick voicemails', () => {
  const base = toBbq(newRun(1));
  assert.equal(toDate({ ...base, conditionLoad: CONDITION_DANGER }).patience, 8);
  assert.equal(toDate({ ...base, rel: { rick: 9, sam: 5 } }).hunger, toDate(base).hunger - 2);
  assert.equal(toDate({ ...base, rel: { rick: 2, sam: 5 } }).patience, 9);
});

test('broke at dinner: Sam can cover it, food is free, and it costs trust and interest', () => {
  const rich = atDate();
  assert.equal(canAskSamToCover(rich), false);
  const broke = { ...atDate(), money: 3 };
  assert.equal(eat(broke, 'bruschetta'), broke); // can't pay
  const c = samCovers(broke);
  assert.equal(c.rel.sam, 4);
  assert.equal(c.trust, 4);
  const ate = eat(c, 'salmon');
  assert.equal(ate.money, 3); // Sam paid
  assert.equal(ate.rel.sam, 3); // ...and you ordered the priciest thing on Sam's dime
  assert.equal(leaveDate({ ...c, hunger: 3, rel: { rick: 6, sam: 7 } }).outcome, 'cheap_charming');
  assert.equal(leaveDate({ ...c, hunger: 3 }).outcome, 'unprepared');
  assert.equal(canAskSamToCover({ ...atPizza(), money: 5 }), false); // $4 slices: you can still pay at the pizza place
});

test('trust: telling early helps, explaining helps more, gambling in front of someone who knows costs it', () => {
  const s = atDate();
  const told = tellSam(s);
  assert.equal(told.trust, s.trust + 1);
  assert.equal(samKnows(told), 1);
  const knows = explainSam(told);
  assert.equal(samKnows(knows), 2);
  assert.equal(knows.trust, s.trust + 2);
  assert.equal(eat(knows, 'bruschetta').trust, knows.trust - 2); // onion unknown: a gamble, and Sam knows the stakes
  const blind = eat(s, 'torte');
  assert.equal(blind.trust, s.trust - 3);
  assert.equal(endingCopy(blind).title, 'IT HAPPENED (SAM HAD NO IDEA)');
  assert.equal(endingCopy(eat(told, 'torte')).title, 'IT HAPPENED');
});

test('pizza: "no pesto on it" is not the same as safe; the clean cutter is', () => {
  const s = atPizza();
  const guess = askServer(s);
  assert.equal(guess.known.includes('pizza_guess'), true);
  assert.equal(factLines(guess, 'margherita').find((l) => l.topic === 'Peanut')!.mark, '?');
  const checked = askServer(guess);
  assert.equal(factLines(checked, 'margherita').find((l) => l.topic === 'Peanut')!.mark, '!');
  assert.equal(worstMark(lookCutter(s), 'margherita'), '!');
  assert.equal(freshCutter(s), s); // not offered until the kitchen admits the cutter
  const pie = freshCutter(checked);
  assert.equal(eat(pie, 'custom_pie').outcome, null); // safe for peanut; dairy is a separate question
  assert.equal(eat(s, 'pesto').outcome, 'reaction');
  let dirty = 0;
  for (let seed = 1; seed < 60; seed++) if (eat({ ...atPizza(newRun(seed)), lactase: 3 }, 'margherita').outcome === 'reaction') dirty++;
  assert.ok(dirty > 5 && dirty < 55); // the cutter is a real, seeded risk
});

test('telling Rick after declining the ribs repairs it', () => {
  const b = toBbq(newRun(1));
  const declined = declineRibs(b);
  assert.equal(declined.rel.rick, b.rel.rick - 1);
  assert.equal(tellRick(declined).rel.rick, b.rel.rick + 1);
});

test('day verdict, the biscuit call, and what next Saturday looks like', () => {
  const plain = eat({ ...atBiscuit(), lactase: 3 }, 'plain_biscuit');
  const d = daySummary(plain);
  assert.equal(d.biscuit, 'You took the safe biscuit.');
  const risked = eat({ ...atBiscuit(), lactase: 3 }, 'biscuit');
  assert.match(daySummary(risked).biscuit, /risked it for the biscuit/);
  const singed = daySummary({ ...atBiscuit(), rel: { rick: 2, sam: 5 }, relLog: [{ who: 'rick', d: -4, why: 'x' }] });
  assert.equal(singed.verdict, 'SAFE, BUT BRIDGES SINGED');
  assert.ok(singed.next.some((l) => l.includes('Rick')));
});

test('old saves are rejected', () => {
  assert.equal(parseSave(JSON.stringify({ v: 1, state: newRun(1) })), null);
});

test('only peanut gambles count as luck, and only they cost Sam trust', () => {
  const told = explainSam(tellSam(atPizza()));
  const pie = eat(freshCutter(askServer(askServer(told))), 'custom_pie'); // dairy unknown, peanut answered
  assert.equal(pie.peanutGambles, 0);
  assert.equal(pie.trust, freshCutter(askServer(askServer(told))).trust);
  const slice = eat(told, 'margherita'); // cutter never asked about
  assert.equal(slice.peanutGambles, 1);
});

test('dinner previews use the same rule as dinner', () => {
  const told = explainSam(tellSam(atDate()));
  for (const id of ['bruschetta', 'pasta', 'salmon']) {
    const p = preview(told, id);
    const calm = { ...told, contaminated: { ...told.contaminated, [id]: false } };
    assert.equal(p.base.trust, eat(calm, id).trust - told.trust, id);
  }
});
