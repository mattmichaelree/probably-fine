import * as Phaser from 'phaser';
import { CLUES, FOODS, PEOPLE, type Mark, type Person } from '../content/index.ts';
import {
  CONDITION_DANGER, diff, endingCopy, foodFor, isEvening, parseSave, preview, probablyFines, samKnows, serializeSave, TOPIC, TRIGGERS, worstMark,
  type Delta, type State,
} from '../systems/rules.ts';
import { sfx } from '../sfx.ts';

export const TITLE = '"Luckiest Guy", "Arial Black", sans-serif';
export const BODY = 'Fredoka, "Trebuchet MS", sans-serif';
export const INK = 0x2a1b12;
export const MARK_COLOR: Record<Mark, number> = { '✓': 0x3f9a5b, '!': 0xd9412f, '?': 0xe8a317 };
// Reduced motion: the player's saved choice, else the OS setting. A live binding, so toggling applies everywhere.
const osReduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const readReduce = () => { try { const v = localStorage.getItem('pf-reduce-motion'); return v === null ? osReduce() : v === '1'; } catch { return osReduce(); } };
export let reduceMotion = readReduce();
export function setReduceMotion(on: boolean) {
  reduceMotion = on;
  try { localStorage.setItem('pf-reduce-motion', on ? '1' : '0'); } catch { /* private mode: setting lasts this session */ }
}

// Saves: one slot, written at the start of every scene. Resume restarts that scene.
export const SAVE_KEY = 'pf-save';
export function loadSave(): State | null { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing to clear */ } }
// 88 logical px ≈ 45 CSS px on a 375px-tall landscape phone.
export const BTN_H = 88;
const CARD_W = 600;

const ART = {
  player_body: 'characters/player_body', face_neutral: 'characters/face_neutral', face_suspicious: 'characters/face_suspicious',
  face_happy: 'characters/face_happy', face_sick: 'characters/face_sick', tp_roll: 'items/tp_roll',
  // grocery
  store_bg: 'locations/store_bg', checkout: 'locations/checkout', clerk: 'characters/clerk',
  cookie_box: 'food/cookie_box', cookie_back: 'food/cookie_back', bakery_case: 'food/bakery_case',
  sample_table: 'food/sample_table', fancy_bread: 'food/fancy_bread', rice_cakes: 'food/rice_cakes',
  lactase: 'items/lactase', tongs: 'items/tongs',
  // bbq
  backyard_bg: 'locations/backyard_bg', cedar_tree: 'locations/cedar_tree', rick: 'characters/rick', cat_chair: 'characters/cat_chair', cat_chair_empty: 'characters/cat_chair_empty',
  grill: 'items/grill', brush: 'items/brush', lawn_chair: 'items/lawn_chair', sauce_bottle: 'food/sauce_bottle', sauce_back: 'food/sauce_back',
  potato_salad: 'food/potato_salad', casserole: 'food/casserole', corn: 'food/corn', burger: 'food/burger',
  // pharmacy
  pharmacy_bg: 'locations/pharmacy_bg', pharmacist: 'characters/pharmacist', pills_clear: 'items/pills_clear',
  pills_snooze: 'items/pills_snooze', antacid: 'items/antacid', allergy_card: 'items/allergy_card',
  // date
  restaurant_bg: 'locations/restaurant_bg', specials_board: 'items/specials_board', sam: 'characters/sam', server: 'characters/server',
  date_table: 'items/date_table', candle: 'items/candle', torte: 'food/torte', taco_truck: 'items/taco_truck',
  // biscuit + end of day
  biscuit_bg: 'locations/biscuit_bg', night_bg: 'locations/night_bg', jo: 'characters/jo', hero_biscuit: 'food/hero_biscuit',
  plain_biscuits: 'food/plain_biscuits', pastry_board: 'items/pastry_board',
  // allergy test + food truck
  office_bg: 'locations/office_bg', doctor: 'characters/doctor', results: 'items/results',
  truck_bg: 'locations/truck_bg', cook: 'characters/cook', fryer: 'items/fryer', fries: 'food/fries', wrap: 'food/wrap',
  // moods: swapped in place over the base sprite
  rick_proud: 'characters/rick_proud', rick_hurt: 'characters/rick_hurt', rick_panicked: 'characters/rick_panicked', rick_sheepish: 'characters/rick_sheepish',
  sam_happy: 'characters/sam_happy', sam_annoyed: 'characters/sam_annoyed', sam_worried: 'characters/sam_worried',
  // servers (one per venue per run) + the pizza place
  server_careful: 'characters/server_careful', server_friendly: 'characters/server_friendly', server_busy: 'characters/server_busy', server_dismissive: 'characters/server_dismissive',
  pizza_bg: 'locations/pizza_bg', pizza_menu: 'items/pizza_menu', pizza_slices: 'food/pizza_slices', garlic_knots: 'food/garlic_knots',
  custom_pie: 'food/custom_pie', pizza_cutter: 'items/pizza_cutter', pesto_tub: 'items/pesto_tub',
};

// Player notebook: discoveries survive across Saturdays; the Saturday itself does not.
const NOTE_KEY = 'pf-notebook';
export function loadNotebook(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(NOTE_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
function recordDiscoveries(s: State) {
  const seen = new Set(loadNotebook());
  const before = seen.size;
  for (const k of s.known) if (CLUES[k]) seen.add(k);
  for (const t of TRIGGERS) if (s.status[t] === 'confirmed') seen.add(`status_${t}`);
  if (seen.size !== before) try { localStorage.setItem(NOTE_KEY, JSON.stringify([...seen])); } catch { /* no storage: the notebook stays blank */ }
}

// A stat chip for choice panels: a readable bar plus the exact number.
export interface Chip { label: string; text?: string; from?: number; to?: number; color?: number; bad?: boolean }

export type Face = 'neutral' | 'suspicious' | 'happy' | 'sick';
export type Who = 'player' | 'npc' | 'npc2' | 'pa';
type GO = Phaser.GameObjects.GameObject;
export interface Btn { label: string; fill: number; onClick: () => void; enabled?: boolean }
export interface Line { topic?: string; mark: Mark; text: string }

export const clock = (m: number) => {
  const h = Math.floor(m / 60) % 24;
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const dur = (min: number) => (min >= 60 ? `+${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `+${min} min`);

// Shared scene machinery: two cameras (zooming world, fixed UI), HUD, speech, cards,
// close-ups, badges, stickies, choice previews and the ending card.
export abstract class BaseScene extends Phaser.Scene {
  protected s!: State;
  protected worldL!: Phaser.GameObjects.Layer;
  protected uiL!: Phaser.GameObjects.Layer;
  protected uiCam!: Phaser.Cameras.Scene2D.Camera;
  protected face!: Phaser.GameObjects.Image;
  protected npc!: Phaser.GameObjects.Image;
  protected npcTag!: Phaser.GameObjects.Container;
  protected npc2?: Phaser.GameObjects.Image; // a second speaker (e.g. the server at the Date)
  protected hud!: Phaser.GameObjects.Container;
  protected portrait?: Phaser.GameObjects.Container;
  protected closeUp?: Phaser.GameObjects.Container;
  protected props: Record<string, Phaser.GameObjects.Image> = {};
  protected badges: Record<string, { mark: Mark; obj: Phaser.GameObjects.Container }> = {};
  protected stuck = new Set<string>();
  protected bubbles: Partial<Record<Who, Phaser.GameObjects.Container>> = {};
  protected card?: Phaser.GameObjects.Container;
  protected pulse?: { img: Phaser.GameObjects.Image; tween: Phaser.Tweens.Tween };
  protected zoomed = false;
  protected choiceFrom?: State;
  protected lastTag!: Phaser.GameObjects.Container;
  protected startMinute = 0;
  protected choiceLabel = 'THIS CHOICE';
  // Evidence notes that stay stuck to props once you learn something.
  protected abstract stickies: Record<string, { x: number; y: number; text: string; angle: number }>;
  // Scene-specific reactions after the shared commit work.
  protected onCommit(_prev: State, _next: State) {}
  protected abstract endButtons(): Btn[];

  protected reset(s: State, save = true) {
    this.s = s;
    if (save) try { localStorage.setItem(SAVE_KEY, serializeSave(s)); } catch { /* no storage: play on without saves */ }
    this.startMinute = s.minute;
    this.props = {};
    this.spots = {};
    this.badges = {};
    this.stuck = new Set();
    this.bubbles = {};
    this.card = this.pulse = this.portrait = this.closeUp = this.choiceFrom = this.toastObj = undefined;
    this.zoomed = false;
    this.choiceLabel = 'THIS CHOICE';
  }

  preload() {
    for (const [key, path] of Object.entries(ART)) this.load.svg(key, `assets/${path}.svg`, { scale: 2 });
  }

  // Route every object to exactly one camera. Setting the other camera's filter on the
  // object itself also keeps input hit-tests honest while the world is zoomed.
  protected W<T extends GO>(o: T): T { this.worldL.add(o); this.uiCam.ignore(o); return o; }
  protected U<T extends GO>(o: T): T { this.uiL.add(o); this.cameras.main.ignore(o); return o; }

  protected setupStage(bgKey: string) {
    this.worldL = this.add.layer();
    this.uiL = this.add.layer();
    this.uiCam = this.cameras.add(0, 0, 1280, 720);
    this.cameras.main.ignore(this.uiL);
    this.uiCam.ignore(this.worldL);
    // Tapping empty world closes the current card.
    this.W(this.add.image(0, 0, bgKey).setOrigin(0).setScale(0.5).setDepth(-10).setInteractive()).on('pointerdown', () => this.closeCard());
  }

  protected addPlayer(onTap: () => string) {
    const body = this.W(this.add.image(150, 722, 'player_body').setOrigin(0.5, 1).setScale(0.5).setDepth(20));
    this.face = this.W(this.add.image(150, 722, 'face_neutral').setOrigin(0.5, 1).setScale(0.5).setDepth(20));
    body.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.worldTap(() => this.say('player', onTap())));
    if (!reduceMotion) this.tweens.add({ targets: [body, this.face], scaleY: 0.51, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
  }

  protected finishSetup() {
    this.hud = this.U(this.add.container(0, 0).setDepth(40));
    this.drawHud();
    this.drawBadges();
  }

  // ---------- world helpers ----------

  protected txt(x: number, y: number, str: string, size: number, style: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    // On a landscape phone the 720px stage shrinks to ~375px; bump small text so it stays readable.
    if (size < 19 && this.scale.displaySize.height < 500) size = Math.round(size * 1.2);
    return this.add.text(x, y, str, { fontFamily: BODY, fontSize: `${size}px`, color: '#2a1b12', resolution: 2, ...style });
  }

  // Name tags are tappable too: tapping the label does what tapping the thing does.
  protected tag(x: number, y: number, label: string, onTap?: () => void) {
    const t = this.txt(0, 0, label, 17, { color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const g = this.add.graphics().fillStyle(INK, 0.85).fillRoundedRect(-t.width / 2 - 10, -15, t.width + 20, 30, 12);
    this.lastTag = this.W(this.add.container(x, y, [g, t]).setDepth(30).setSize(t.width + 20, 40));
    if (onTap) this.lastTag.setInteractive({ useHandCursor: true }).on('pointerdown', onTap);
    return this.lastTag;
  }

  protected setTagText(tag: Phaser.GameObjects.Container, label: string) {
    const [g, t] = tag.list as [Phaser.GameObjects.Graphics, Phaser.GameObjects.Text];
    t.setText(label);
    g.clear().fillStyle(INK, 0.85).fillRoundedRect(-t.width / 2 - 10, -15, t.width + 20, 30, 12);
    tag.setSize(t.width + 20, 40);
    if (tag.input) tag.input.hitArea.setSize(t.width + 20, 40);
  }

  // Swap an NPC into a mood for a moment (hurt, proud, panicked...). A mood set as the scene
  // ends stays, so the ending card shows how they took it.
  protected npcBase = '';
  protected mood(key: string, ms = 2600) {
    if (!this.npc || !this.textures.exists(key)) return;
    this.npc.setTexture(key);
    this.time.delayedCall(ms, () => { if (this.npc.texture.key === key && !this.s.outcome) this.npc.setTexture(this.npcBase); });
  }

  // World taps are ignored while zoomed into a close-up.
  protected worldTap(fn: () => void) { if (!this.zoomed) { sfx('tap'); fn(); } }

  protected prop(id: string, key: string, x: number, y: number, label: string, onClick: () => void, tagDy = 18) {
    const img = this.W(this.add.image(x, y, key).setOrigin(0.5, 1).setScale(0.5).setInteractive({ useHandCursor: true }));
    const tap = () => this.worldTap(() => {
      if (!reduceMotion && this.pulse?.img !== img) this.tweens.add({ targets: img, scaleX: 0.56, scaleY: 0.45, yoyo: true, duration: 90 });
      onClick();
      this.highlight(img);
    });
    img.on('pointerdown', tap);
    this.tag(x, y + tagDy, label, tap);
    this.props[id] = img;
    return img;
  }

  // An invisible tap area over part of a prop (e.g. one side of the grill).
  protected spots: Record<string, Phaser.GameObjects.Zone> = {}; // by label, for automated playthroughs
  protected hotspot(x: number, y: number, w: number, h: number, label: string, onClick: () => void, tagY: number) {
    const tap = () => this.worldTap(onClick);
    this.spots[label] = this.W(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true })).on('pointerdown', tap);
    return this.tag(x, tagY, label, tap);
  }

  protected highlight(img: Phaser.GameObjects.Image) {
    if (!this.card || reduceMotion) return;
    this.stopPulse();
    this.pulse = { img, tween: this.tweens.add({ targets: img, scale: 0.53, yoyo: true, repeat: -1, duration: 450, ease: 'Sine.easeInOut' }) };
  }

  protected stopPulse() {
    if (!this.pulse) return;
    this.pulse.tween.stop();
    this.pulse.img.setScale(0.5);
    this.pulse = undefined;
  }

  protected setFace(f: Face) {
    this.face.setTexture(`face_${f}`);
    (this.portrait?.getAt(2) as Phaser.GameObjects.Image | undefined)?.setTexture(`face_${f}`);
  }

  protected hop(target: Phaser.GameObjects.Image) {
    if (!reduceMotion) this.tweens.add({ targets: target, y: target.y - 14, yoyo: true, duration: 110, repeat: 1 });
  }

  // Speech bubbles: one slot per speaker so the NPC can talk back.
  protected say(who: Who, str: string, ms = 3000) {
    if (this.zoomed && who !== 'player') return; // no background chatter over a close-up
    this.bubbles[who]?.destroy();
    const pa = who === 'pa';
    const t = this.txt(0, 0, pa ? `📢  ${str}` : str, pa ? 19 : 20,
      { wordWrap: { width: pa ? 820 : 320 }, align: 'center', color: pa ? '#ffe36b' : '#2a1b12', fontStyle: pa ? 'bold' : 'normal' }).setOrigin(0.5);
    const w = t.width + 36, h = t.height + 26;
    const g = this.add.graphics().fillStyle(pa ? 0x1d2a3a : 0xffffff).lineStyle(4, INK)
      .fillRoundedRect(-w / 2, -h / 2, w, h, 18).strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    if (who === 'player') g.fillTriangle(-w / 2 + 20, h / 2 - 3, -w / 2 + 50, h / 2 - 3, -w / 2 + 6, h / 2 + 24);
    if (who === 'npc' || who === 'npc2') g.fillTriangle(w / 2 - 50, h / 2 - 3, w / 2 - 20, h / 2 - 3, w / 2 + 14, h / 2 + 30);
    // In a close-up the player "speaks" from the portrait; the NPC from wherever they stand.
    const pos = {
      player: [this.zoomed ? 170 + w / 2 : Math.max(w / 2 + 8, 250), this.zoomed ? 150 : 300],
      npc: [Phaser.Math.Clamp(this.npc.x + 20 - w / 2, w / 2 + 8, 1272 - w / 2), 215],
      npc2: [Phaser.Math.Clamp((this.npc2?.x ?? 900) + 20 - w / 2, w / 2 + 8, 1272 - w / 2), 215],
      pa: [640, 132],
    }[who];
    const b = this.U(this.add.container(pos[0], Math.max(pos[1], h / 2 + 104), [g, t]).setDepth(pa ? 85 : 80));
    this.bubbles[who] = b;
    if (who === 'npc') this.hop(this.npc);
    if (who === 'npc2' && this.npc2) this.hop(this.npc2);
    if (!reduceMotion) { b.setScale(0.3); this.tweens.add({ targets: b, scale: 1, duration: 160, ease: 'Back.easeOut' }); }
    this.time.delayedCall(ms, () => { if (this.bubbles[who] === b) { b.destroy(); delete this.bubbles[who]; } });
  }

  protected stick(key: string) {
    if (this.stuck.has(key)) return;
    this.stuck.add(key);
    const n = this.stickies[key];
    const t = this.W(this.txt(n.x, n.y, n.text, 17, { backgroundColor: '#fff27a', padding: { x: 10, y: 8 }, fontStyle: 'bold', align: 'center', color: '#9a1f12' })
      .setOrigin(0.5).setAngle(n.angle).setDepth(32));
    if (!reduceMotion) { t.setScale(2.4).setAlpha(0); this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' }); }
  }

  protected npcWalk(x: number, ms = 600) {
    this.tweens.add({ targets: [this.npc, this.npcTag], x, duration: reduceMotion ? 0 : ms, ease: 'Sine.easeInOut' });
  }

  // Block input while a little in-world beat plays out.
  protected beat(ms: number, then: () => void) {
    this.input.enabled = false;
    this.time.delayedCall(reduceMotion ? Math.min(ms, 300) : ms, () => { this.input.enabled = true; then(); });
  }

  // ---------- preview text ----------

  // Turn the rules' preview into card text: known costs up top, then each risk with its stakes.
  protected previewText(id: string): { stats: Chip[]; lines: Line[] } {
    const s = this.s;
    const f = foodFor(s, id);
    const { base, risks } = preview(s, id);
    const risky = risks.some((r) => r.ifBad);
    const stats: Chip[] = [
      { label: 'Cost', text: f.price ? `$${f.price}` : FOODS[id].price ? 'Sam pays' : 'Free' },
      { label: 'Time', text: `${f.endsScene ? 'checkout ' : ''}${dur(base.minutes)}` },
      ...this.deltaChips(s, base),
    ];
    if (risky) {
      const worst = Math.max(...risks.map((r) => r.ifBad?.condition ?? 0));
      const cond = stats.find((c) => c.label === 'Condition');
      if (cond) { cond.text = `${cond.to} or up to ${s.conditionLoad + worst}`; cond.bad = true; }
      else stats.push({ label: 'Condition', from: s.conditionLoad, to: s.conditionLoad, color: 0xd9412f, text: `+0, or +${worst} if bad`, bad: true });
    }
    const stakes = (b: Delta) => [
      b.condition ? `condition +${b.condition}` : '',
      b.minutes - base.minutes > 0 ? `${dur(b.minutes - base.minutes)} lost` : '',
      b.fun < base.fun ? `fun only ${s.satisfaction + b.fun}` : '',
      b.hunger > base.hunger ? `hunger back to ${s.hunger + b.hunger}` : '',
      ...(Object.keys(b.rel) as Person[]).filter((p) => b.rel[p] < base.rel[p]).map((p) => `${PEOPLE[p].short} only ${s.rel[p] + b.rel[p]}`),
      b.trust < base.trust ? `Sam's trust ${s.trust + b.trust}` : '',
      b.patience < base.patience ? `Sam's patience ${s.patience + b.patience}` : '',
      b.endsOuting ? 'the outing is over' : '',
    ].filter(Boolean).join(', ');
    const lead: Record<string, string> = {
      'Peanut?': 'If peanut is in there', 'Peanut!': 'If contact happened', 'Stomach?': 'If it disagrees with you', 'Stomach!': 'Result',
    };
    const lines = risks.map((r) => ({
      mark: r.mark,
      text: `${r.topic}: ${r.text}${r.ifBad ? `\n→ ${lead[r.topic + r.mark] ?? 'If it goes wrong'}: ${stakes(r.ifBad)}.` : ''}`,
    }));
    return { stats, lines };
  }

  // Same idea for non-food actions: show exactly what the rules will do.
  protected actionStats(next: State) {
    const d = diff(this.s, next);
    return [
      d.minutes ? dur(d.minutes) : '', d.money ? `${d.money < 0 ? '−' : '+'}$${Math.abs(d.money)}` : '',
      d.fun ? `Fun ${this.s.satisfaction} → ${next.satisfaction}` : '', d.condition ? `Condition ${this.s.conditionLoad} → ${next.conditionLoad}` : '',
      this.relText(this.s, d.rel),
      d.trust ? `Trust ${this.s.trust} → ${next.trust}` : '', d.patience ? `Patience ${this.s.patience} → ${next.patience}` : '',
    ].filter(Boolean).join(' · ');
  }

  // Chips for an action (a seat, a question): time and money first, then every meter it moves.
  protected actionChips(next: State): Chip[] {
    const d = diff(this.s, next);
    return [
      ...(d.money ? [{ label: 'Cost', text: `$${-d.money}` }] : []),
      ...(d.minutes ? [{ label: 'Time', text: dur(d.minutes) }] : []),
      ...this.deltaChips(this.s, d),
    ];
  }

  // One chip per meter a change moves: hunger and fun always, the rest only when they move.
  private deltaChips(s: State, d: Delta): Chip[] {
    const chips: Chip[] = [
      { label: 'Hunger', from: s.hunger, to: s.hunger + d.hunger, color: 0xf28b3d },
      { label: 'Fun', from: s.satisfaction, to: s.satisfaction + d.fun, color: 0x4fc1b5 },
    ];
    if (d.condition) chips.push({ label: 'Condition', from: s.conditionLoad, to: s.conditionLoad + d.condition, color: 0xd9412f, bad: true });
    for (const p of Object.keys(d.rel) as Person[]) if (d.rel[p]) chips.push({ label: PEOPLE[p].short, from: s.rel[p], to: s.rel[p] + d.rel[p], color: 0xe56b9f, bad: d.rel[p] < 0 });
    if (d.trust) chips.push({ label: 'Sam trust', from: s.trust, to: s.trust + d.trust, color: 0x8a6fc0, bad: d.trust < 0 });
    if (d.patience) chips.push({ label: 'Sam patience', from: s.patience, to: s.patience + d.patience, color: 0x4f9bd1, bad: true });
    return chips;
  }

  // Lay chips out in rows inside `c`; returns the height used.
  protected chipRow(c: Phaser.GameObjects.Container, x0: number, y0: number, maxW: number, chips: Chip[]): number {
    let x = x0, y = y0, rowH = 0;
    for (const ch of chips) {
      const bar = ch.from !== undefined && ch.to !== undefined;
      const d = bar ? ch.to! - ch.from! : 0;
      const value = ch.text ?? `${ch.from}→${ch.to}${d ? ` (${d > 0 ? '+' : '−'}${Math.abs(d)})` : ''}`;
      const lab = this.txt(0, 0, ch.label.toUpperCase(), 12, { fontStyle: 'bold', color: '#7a6a58' });
      const val = this.txt(0, 0, value, 16, { fontStyle: 'bold', color: ch.bad ? '#b8321f' : '#1d4f7a' });
      const w = Math.max(lab.width, val.width, bar ? 84 : 0) + 16;
      const h = bar ? 54 : 44;
      if (x > x0 && x + w > x0 + maxW) { x = x0; y += rowH + 6; rowH = 0; }
      const g = this.add.graphics().fillStyle(0xf4ead2).lineStyle(2, INK).fillRoundedRect(x, y, w, h, 8).strokeRoundedRect(x, y, w, h, 8);
      c.add([g, lab.setPosition(x + 8, y + 4), val.setPosition(x + 8, y + 19)]);
      if (bar) {
        const bw = w - 16, seg = (v: number) => (Math.max(0, Math.min(10, v)) / 10) * bw;
        g.fillStyle(0xd8ccb0).fillRoundedRect(x + 8, y + 41, bw, 7, 3);
        g.fillStyle(ch.color ?? 0x1d4f7a).fillRoundedRect(x + 8, y + 41, Math.max(2, seg(ch.to!)), 7, 3);
        g.fillStyle(INK).fillRect(x + 8 + seg(ch.from!) - 1, y + 38, 2, 13); // where you are now
      }
      x += w + 6;
      rowH = Math.max(rowH, h);
    }
    return chips.length ? y + rowH - y0 : 0;
  }

  // "Rick 6 → 7" for anyone whose relationship this changes.
  protected relText(s: State, d: Record<Person, number>) {
    return (Object.keys(d) as Person[]).filter((p) => d[p]).map((p) => `${PEOPLE[p].short} ${s.rel[p]} → ${s.rel[p] + d[p]}`).join(' · ');
  }

  // ---------- HUD, deltas, badges ----------

  protected drawHud() {
    const s = this.s;
    this.hud.removeAll(true);
    const g = this.add.graphics().fillStyle(0x1d2a3a, 0.94).fillRect(0, 0, 1280, 58);
    this.hud.add(g);
    this.hud.add(this.txt(18, 10, `$${s.money}`, 30, { fontFamily: TITLE, color: '#7ee08a' }));
    this.hud.add(this.txt(120, 10, clock(s.minute), 30, { fontFamily: TITLE, color: '#fff' }));
    const bar = (x: number, label: string, v: number, color: number) => {
      this.hud.add(this.txt(x, 17, label, 18, { color: '#fff', fontStyle: 'bold' }));
      const bx = x + (label.length > 6 ? 95 : 72);
      g.fillStyle(0x0e151e).fillRoundedRect(bx, 18, 124, 22, 8);
      if (v > 0) g.fillStyle(color).fillRoundedRect(bx + 2, 20, Math.min(10, v) * 12, 18, 7);
      this.hud.add(this.txt(bx + 132, 17, `${v}`, 18, { color: '#fff' }));
    };
    bar(320, 'Hunger', s.hunger, 0xf28b3d);
    bar(560, 'Fun', s.satisfaction, 0x4fc1b5);
    bar(800, 'Condition', s.conditionLoad, 0xd9412f);
    // The danger line: past it, the day follows you to the next stop.
    g.fillStyle(0xffffff).fillRect(895 + 2 + CONDITION_DANGER * 12 - 1, 13, 3, 32);

    // Status chips: mark char + color, never color alone.
    let x = 12;
    const y = 80;
    const chip = (mark: Mark, text: string) => {
      const t = this.txt(10, 0, `${mark}  ${text}`, 17, { color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
      const w = t.width + 20;
      this.hud.add(this.add.container(x, y, [this.add.graphics().fillStyle(MARK_COLOR[mark]).lineStyle(3, INK)
        .fillRoundedRect(0, -15, w, 30, 10).strokeRoundedRect(0, -15, w, 30, 10), t]));
      x += w + 8;
    };
    const word = (t: (typeof TRIGGERS)[number]) => (s.status[t] === 'confirmed' ? 'intolerant' : s.status[t] === 'suspected' ? 'suspected' : '???');
    if (isEvening(s)) {
      // At dinner the social facts matter as much as the allergy ones.
      chip('!', 'PEANUT');
      for (const t of TRIGGERS) chip(s.status[t] === 'confirmed' ? '!' : '?', `${TOPIC[t].toUpperCase()}${s.status[t] === 'confirmed' ? ': no' : ' ?'}`);
      x += 10;
      const knows = samKnows(s);
      chip((['?', '!', '✓'] as Mark[])[knows], `SAM ${["doesn't know", 'knows', 'gets it'][knows]}`);
      chip(s.trust >= 6 ? '✓' : s.trust <= 3 ? '!' : '?', `TRUST ${s.trust}`);
      chip(s.patience >= 6 ? '✓' : s.patience <= 3 ? '!' : '?', `PATIENCE ${s.patience}`);
    } else {
      chip('!', 'PEANUT: severe allergy');
      for (const t of TRIGGERS) chip(s.status[t] === 'confirmed' ? '!' : '?', `${TOPIC[t].toUpperCase()}: ${word(t)}`);
      chip('!', 'CEDAR POLLEN: seasonal');
    }
    const pocket = [
      s.lactase ? `Lactase x${s.lactase}` : '', s.antacid ? `Antacid x${s.antacid}` : '',
      s.known.includes('allergy_card') ? 'Allergy card' : '', s.minute < s.pillsUntil ? `Pills until ${clock(s.pillsUntil)}` : '',
      isEvening(s) && s.known.includes('sam_covered') ? 'Sam is paying' : '',
    ].filter(Boolean).join(' · ');
    this.hud.add(this.txt(1268, 80, `Pocket: ${pocket || 'lint'}`, 18,
      { fontStyle: 'bold', backgroundColor: '#fff8e6', padding: { x: 10, y: 4 } }).setOrigin(1, 0.5));
  }

  // Floating "+40 min", "+3 condition" etc. under the status strip, so a face change
  // always comes with a readable number.
  protected deltas(prev: State, next: State) {
    const items: [number, number, string, string][] = [
      [60, next.money - prev.money, '$', '#7ee08a'],
      [200, next.minute - prev.minute, ' min', '#ffffff'],
      [480, next.hunger - prev.hunger, ' hunger', '#f28b3d'],
      [700, next.satisfaction - prev.satisfaction, ' fun', '#4fc1b5'],
      [950, next.conditionLoad - prev.conditionLoad, ' condition', '#ff7a66'],
      ...(Object.keys(PEOPLE) as Person[]).map((p) => [1150, next.rel[p] - prev.rel[p], ` ${PEOPLE[p].short}`, '#ffb3c7'] as [number, number, string, string]),
    ];
    const y0 = 118;
    for (const [x, d, unit, color] of items) {
      if (!d) continue;
      const str = unit === '$' ? `${d > 0 ? '+' : '-'}$${Math.abs(d)}` : `${d > 0 ? '+' : ''}${d}${unit}`;
      const t = this.U(this.txt(x, y0, str, 22, { fontFamily: TITLE, color, stroke: '#1d2a3a', strokeThickness: 6 }).setOrigin(0.5).setDepth(90));
      this.tweens.add({ targets: t, y: y0 + 32, alpha: 0, delay: 900, duration: 900, onComplete: () => t.destroy() });
    }
  }

  protected badgeAt(id: string): [number, number] {
    const b = this.props[id].getBounds();
    return [Math.min(b.right - 10, 1258), b.top + 10]; // stay on screen
  }

  // Knowledge badge on each food prop: ✓ / ! / ? from what the player knows, not the truth.
  protected drawBadges() {
    for (const id of Object.keys(FOODS)) {
      if (!this.props[id]) continue;
      const mark = worstMark(this.s, id);
      if (this.badges[id]?.mark === mark) continue;
      this.badges[id]?.obj.destroy();
      const [x, y] = this.badgeAt(id);
      const obj = this.W(this.add.container(x, y, [
        this.add.graphics().fillStyle(MARK_COLOR[mark]).lineStyle(3, INK).fillCircle(0, 0, 17).strokeCircle(0, 0, 17),
        this.txt(0, 0, mark, 20, { color: '#fff', fontStyle: 'bold' }).setOrigin(0.5),
      ]).setDepth(31));
      if (this.badges[id] && !reduceMotion) { obj.setScale(2); this.tweens.add({ targets: obj, scale: 1, duration: 300, ease: 'Back.easeOut' }); }
      this.badges[id] = { mark, obj };
    }
  }

  // Apply a new state and let the scene react to what changed.
  protected commit(next: State, endDelay = 900) {
    const prev = this.s;
    if (next === prev) return;
    this.s = next;
    this.drawHud();
    this.deltas(prev, next);
    this.drawBadges();
    if (next.bathroomMinutes > prev.bathroomMinutes) {
      this.setFace('sick');
      sfx('bad');
      if (!reduceMotion) this.cameras.main.shake(300, 0.006);
      if (!next.outcome) this.say('player', 'My stomach has filed\na formal complaint.', 3600);
    }
    this.onCommit(prev, next);
    recordDiscoveries(next);
    // Every consequence punches back right away: the newest line of the day, as a caption.
    if (!next.outcome && next.log.length > prev.log.length) this.toast(next.log[next.log.length - 1]);
    if (next.outcome) this.time.delayedCall(endDelay, () => this.ending());
  }

  private toastObj?: Phaser.GameObjects.Container;
  protected toast(str: string) {
    if (this.zoomed) return; // the close-up panel already says it
    this.toastObj?.destroy();
    const t = this.txt(0, 0, str, 17, { color: '#fff', align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5);
    const w = t.width + 32, h = t.height + 18;
    const c = this.U(this.add.container(640, 700 - h / 2, [
      this.add.graphics().fillStyle(0x1d2a3a, 0.92).lineStyle(3, INK).fillRoundedRect(-w / 2, -h / 2, w, h, 14).strokeRoundedRect(-w / 2, -h / 2, w, h, 14), t,
    ]).setDepth(78));
    this.toastObj = c;
    if (!reduceMotion) { c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 160 }); }
    this.time.delayedCall(3400, () => { if (this.toastObj === c) { c.destroy(); this.toastObj = undefined; } });
  }

  // ---------- camera close-up ----------
  // Wide scene -> push into the prop -> choose there -> cut back to the reaction.

  protected zoomIn(x: number, y: number, then: () => void, zoom = 2.3) {
    this.closeCard();
    Object.values(this.bubbles).forEach((b) => b?.destroy()); // the close-up gets the stage to itself
    this.bubbles = {};
    this.zoomed = true;
    this.setFace('suspicious');
    const ms = reduceMotion ? 0 : 550;
    this.cameras.main.pan(x, y, ms, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(zoom, ms, 'Cubic.easeInOut');
    this.showPortrait();
    this.beat(ms + 20, then);
  }

  protected zoomOut(then: () => void) {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const ms = reduceMotion ? 0 : 450;
    this.cameras.main.pan(640, 360, ms, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(1, ms, 'Cubic.easeInOut');
    this.portrait?.destroy();
    this.portrait = undefined;
    this.beat(ms + 30, () => { this.zoomed = false; then(); });
  }

  private showPortrait() {
    // Small head-and-shoulders portrait so his condition stays visible while the camera is away.
    const crop = (img: Phaser.GameObjects.Image) => img.setOrigin(0).setScale(0.36).setCrop(80, 30, 360, 480).setPosition(-29, -11);
    const c = this.U(this.add.container(16, 104, [
      this.add.graphics().fillStyle(0xf4e6c6).lineStyle(5, INK).fillRoundedRect(0, 0, 136, 176, 18).strokeRoundedRect(0, 0, 136, 176, 18),
      crop(this.add.image(0, 0, 'player_body')),
      crop(this.add.image(0, 0, this.face.texture.key)),
    ]).setDepth(70));
    this.portrait = c;
    if (!reduceMotion) { c.setX(-160); this.tweens.add({ targets: c, x: 16, duration: 250, ease: 'Back.easeOut' }); }
  }

  // Readable facts panel on the right + big buttons along the bottom.
  // The in-world print is the joke; this panel is the information.
  protected closeUpPanel(title: string, sub: string, foodId: string, btns: Btn[]) {
    this.closeUp?.destroy();
    const c = this.U(this.add.container(0, 0).setDepth(65));
    this.closeUp = c;
    const pv = this.previewText(foodId);
    const panel = this.add.container(860, 110);
    const t1 = this.txt(18, 14, title, 24, { fontFamily: TITLE, wordWrap: { width: 370 } });
    const t2 = this.txt(18, t1.y + t1.height + 4, sub, 16, { fontStyle: 'italic', wordWrap: { width: 370 } });
    panel.add([t1, t2]);
    let y = t2.y + t2.height + 8;
    y += this.chipRow(panel, 18, y, 370, pv.stats) + 10;
    for (const l of pv.lines) {
      panel.add(this.add.graphics().fillStyle(MARK_COLOR[l.mark]).lineStyle(3, INK).fillCircle(32, y + 13, 14).strokeCircle(32, y + 13, 14));
      panel.add(this.txt(32, y + 13, l.mark, 17, { color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
      const t = this.txt(54, y + 1, l.text, 17, { wordWrap: { width: 340 } });
      panel.add(t);
      y += Math.max(34, t.height + 8);
    }
    panel.addAt(this.add.graphics().fillStyle(0xfff8e6, 0.96).lineStyle(5, INK).fillRoundedRect(0, 0, 404, y + 12, 20).strokeRoundedRect(0, 0, 404, y + 12, 20), 0);
    c.add(panel);
    const bw = 260;
    btns.forEach((b, i) => c.add(this.button(640 + (i - (btns.length - 1) / 2) * (bw + 16), 720 - 20 - BTN_H / 2, bw, BTN_H, b)));
    if (!reduceMotion) { c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 180 }); }
  }

  // ---------- compact cards ----------

  protected closeCard() {
    this.stopPulse();
    if (!this.card) return;
    this.card.destroy();
    this.card = undefined;
    if (!this.s.outcome) this.setFace('neutral');
  }

  // A small card beside the prop. The world stays visible and tappable. Up to 3 buttons per row.
  protected openCard(propX: number, title: string, sub: string, lines: Line[], paper: string | null, buttons: Btn[], stats?: Chip[]) {
    this.closeCard();
    const c = this.U(this.add.container(propX < 640 ? 660 : 20, 110).setDepth(82)); // above speech bubbles
    this.card = c;
    const hit = this.add.zone(0, 0, CARD_W, 10).setOrigin(0).setInteractive(); // swallow taps on the card
    c.add(hit);
    c.add(this.txt(20, 14, title, 28, { fontFamily: TITLE, wordWrap: { width: CARD_W - 120 } }));
    const st = this.txt(20, 52, sub, 16, { fontStyle: 'italic', wordWrap: { width: CARD_W - 110 } });
    c.add(st);
    let y = st.y + st.height + 10;
    if (stats?.length) y += this.chipRow(c, 20, y, CARD_W - 40, stats) + 10;
    for (const l of lines) {
      c.add(this.add.graphics().fillStyle(MARK_COLOR[l.mark]).lineStyle(3, INK).fillCircle(34, y + 13, 14).strokeCircle(34, y + 13, 14));
      c.add(this.txt(34, y + 13, l.mark, 17, { color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
      const t = this.txt(58, y + 1, l.topic ? `${l.topic}: ${l.text}` : l.text, 18, { wordWrap: { width: CARD_W - 80 } });
      c.add(t);
      y += Math.max(34, t.height + 8);
    }
    if (paper) {
      const p = this.txt(20, y + 4, paper, 16, { backgroundColor: '#fff1b8', padding: { x: 10, y: 8 }, wordWrap: { width: CARD_W - 60 }, fontStyle: 'bold' });
      c.add(p);
      y += p.height + 12;
    }
    for (let r = 0; r < buttons.length; r += 3) {
      const row = buttons.slice(r, r + 3);
      const bw = (CARD_W - 40 - (row.length - 1) * 12) / row.length;
      y += 8;
      row.forEach((b, i) => c.add(this.button(20 + bw / 2 + i * (bw + 12), y + BTN_H / 2, bw, BTN_H, b)));
      y += BTN_H;
    }
    const H = y + 18;
    hit.setSize(CARD_W, H);
    c.addAt(this.add.graphics().fillStyle(0xfff8e6).lineStyle(5, INK).fillRoundedRect(0, 0, CARD_W, H, 22).strokeRoundedRect(0, 0, CARD_W, H, 22), 0);
    const close = this.add.zone(CARD_W - 44, 44, BTN_H, BTN_H).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.closeCard());
    c.add([this.txt(CARD_W - 44, 40, '✕', 32, { fontStyle: 'bold' }).setOrigin(0.5), close]);
    if (!reduceMotion) { c.setAlpha(0).setY(130); this.tweens.add({ targets: c, alpha: 1, y: 110, duration: 140, ease: 'Cubic.easeOut' }); }
  }

  protected button(x: number, y: number, w: number, h: number, b: Btn) {
    const enabled = b.enabled !== false;
    const g = this.add.graphics().fillStyle(enabled ? b.fill : 0xb8bcc0).lineStyle(4, INK)
      .fillRoundedRect(-w / 2, -h / 2, w, h, 16).strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const t = this.txt(0, 0, b.label, 19, { color: enabled ? '#fff' : '#5b6167', fontStyle: 'bold', align: 'center', wordWrap: { width: w - 16 } }).setOrigin(0.5);
    for (let size = 18; t.height > h - 8 && size >= 14; size--) t.setFontSize(size); // long labels shrink to fit
    const c = this.add.container(x, y, [g, t]).setSize(w, h);
    if (enabled) c.setInteractive({ useHandCursor: true }).on('pointerdown', () => { sfx('tap'); b.onClick(); });
    return c;
  }

  // ---------- ending ----------

  protected ending() {
    const s = this.s;
    const o = s.outcome!;
    const copy = endingCopy(s);
    const bad = o === 'reaction' || o === 'stomach';
    // Jingle only for endings that were safe on purpose; luck gets a plain blip (stomach already buzzed on commit).
    sfx(o === 'reaction' ? 'bad' : /^(safe_|honest_win|social_win|fine|cheap_charming)/.test(o) ? 'good' : 'tap');
    this.setFace(bad ? 'sick' : o === 'hungry' || o === 'rick_hurt' ? 'neutral' : 'happy');
    if (bad && !reduceMotion) { this.cameras.main.shake(450, 0.01); this.cameras.main.flash(250, 255, 120, 90); }
    Object.values(this.bubbles).forEach((b) => b?.destroy());

    const m = this.U(this.add.container(0, 0).setDepth(200));
    m.add(this.add.rectangle(640, 360, 1280, 720, 0x0e151e, 0.72).setInteractive());
    const W = 940, H = 690;
    const card = this.add.container(640, 360);
    m.add(card);
    card.add(this.add.graphics().fillStyle(0xfff8e6).lineStyle(6, INK).fillRoundedRect(-W / 2, -H / 2, W, H, 26).strokeRoundedRect(-W / 2, -H / 2, W, H, 26));
    const color = bad ? '#d9412f' : ['got_away', 'rick_hurt', 'walked_out', 'impatient', 'unprepared', 'awkward', 'charmed_unsure'].includes(o) ? '#e0662f' : o === 'hungry' ? '#7a5a2a' : '#3f9a5b';
    card.add(this.txt(0, -H / 2 + 20, copy.title, 54, { fontFamily: TITLE, color }).setOrigin(0.5, 0));
    card.add(this.txt(0, -H / 2 + 86, copy.sub, 21, { fontStyle: 'italic', align: 'center', wordWrap: { width: W - 80 } }).setOrigin(0.5, 0));
    if (o === 'stomach' || s.bathroomMinutes) card.add(this.add.image(W / 2 - 110, -H / 2 + 250, 'tp_roll').setScale(0.42).setAngle(8));

    const spent = s.minute - this.startMinute;
    const stats: [string, string][] = [
      ['Money left', `$${s.money}`],
      ['Clock', `${clock(s.minute)} (${Math.floor(spent / 60)}h ${spent % 60}m here)`],
      ['Hunger / Fun', `${s.hunger}/10 · ${s.satisfaction}/10`],
      ['Condition load', `${s.conditionLoad}`],
      ['Bathroom time (today)', `${s.bathroomMinutes} min`],
      ['Times someone said "probably fine"', `${probablyFines(s)}`],
    ];
    let y = -H / 2 + 146;
    if (this.choiceFrom) {
      const a = this.choiceFrom;
      const t = this.txt(-W / 2 + 50, y - 16, `${this.choiceLabel}: $${a.money}→$${s.money} · ${dur(s.minute - a.minute)} · Hunger ${a.hunger}→${s.hunger} · Fun ${a.satisfaction}→${s.satisfaction} · Condition ${a.conditionLoad}→${s.conditionLoad}${isEvening(s) ? ` · Sam's trust ${a.trust}→${s.trust} · patience ${a.patience}→${s.patience}` : ''}`,
        17, { fontStyle: 'bold', color: '#1d4f7a', wordWrap: { width: W - 100 } });
      card.add(t);
      y += t.height + 2;
    }
    for (const [k, v] of stats) {
      card.add(this.txt(-W / 2 + 50, y, k, 19));
      card.add(this.txt(-W / 2 + 420, y, v, 19, { fontStyle: 'bold', color: '#9a3b1e' }));
      y += 26;
    }
    // People you've met today: meter plus the most recent reason it moved.
    for (const p of (Object.keys(PEOPLE) as Person[]).filter((q) => s.relLog.some((r) => r.who === q))) {
      const last = [...s.relLog].reverse().find((r) => r.who === p)!;
      card.add(this.txt(-W / 2 + 50, y, PEOPLE[p].name, 19));
      const t = this.txt(-W / 2 + 420, y, `${s.rel[p]}/10  (${last.d > 0 ? '+' : ''}${last.d}: ${last.why})`, 17, { fontStyle: 'bold', color: '#9a3b1e', wordWrap: { width: W - 470 } });
      card.add(t);
      y += Math.max(26, t.height + 4);
    }
    y += 6;
    card.add(this.txt(-W / 2 + 50, y, 'WHY:', 22, { fontFamily: TITLE }));
    y += 30;
    for (const line of s.log.slice(-5)) {
      const t = this.txt(-W / 2 + 70, y, `• ${line}`, 16, { wordWrap: { width: W - 130 } });
      if (y + t.height > H / 2 - 30 - BTN_H) { t.destroy(); break; } // never under the buttons
      card.add(t);
      y += t.height + 4;
    }
    card.add(this.txt(W / 2 - 24, H / 2 - 12, `Saturday #${s.seed}`, 13, { color: '#8a7a6a' }).setOrigin(1, 1));
    const btns = this.endButtons();
    const bw = Math.min(300, (W - 60 - 16 * (btns.length - 1)) / btns.length);
    btns.forEach((b, i) => card.add(this.button((i - (btns.length - 1) / 2) * (bw + 16), H / 2 - 24 - BTN_H / 2, bw, BTN_H, b)));

    if (!reduceMotion) { card.setScale(0.6); this.tweens.add({ targets: card, scale: 1, duration: 260, ease: 'Back.easeOut', delay: bad ? 350 : 0 }); }
  }
}
