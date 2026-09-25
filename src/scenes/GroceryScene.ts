import * as Phaser from 'phaser';
import { CLUES, FOODS, LACTASE, LINE_GROWS_AT, PA, TODD_CHAT, TODD_REACT } from '../content/index.ts';
import {
  buyLactase, canEat, chatTodd, checkoutMinutes, eat, inspect, isRisky, leave, newRun, toPharmacy, type State,
} from '../systems/rules.ts';
import { BaseScene, INK, reduceMotion, type Btn } from './BaseScene.ts';

const COOKIE = { x: 380, y: 470, tinyX: 382, tinyY: 531 }; // box center and its 3px "may contain" line

export class GroceryScene extends BaseScene {
  private tongs!: Phaser.GameObjects.Image;
  private queue = false;
  protected stickies = {
    cookie: { x: 380, y: 360, text: 'MAY CONTAIN\nPEANUTS', angle: -8 },
    bakery: { x: 722, y: 336, text: 'SAME TONGS AS\nPB BLONDIES', angle: 6 },
    dairy: { x: 560, y: 560, text: '*not for you', angle: -10 },
  };

  constructor() { super('grocery'); }

  init(data: { seed?: number; run?: State }) {
    this.reset(data.run ?? newRun(data.seed ?? Math.floor(Math.random() * 1e6)));
    this.queue = false;
  }

  create() {
    this.setupStage('store_bg');
    this.prop('cookie', 'cookie_box', 380, 640, 'Cookie  $4', () => this.cookieCloseUp());
    this.prop('muffin', 'bakery_case', 650, 530, 'Bakery muffin  $3', () => this.foodCard('muffin'));
    this.tongs = this.W(this.add.image(650, 376, 'tongs').setOrigin(0.5, 0).setScale(0.5).setDepth(1));
    this.prop('bread', 'fancy_bread', 858, 345, 'Bread  $9', () => this.foodCard('bread'));
    this.prop('ricecakes', 'rice_cakes', 962, 345, 'Rice cakes  $3', () => this.foodCard('ricecakes'));
    // Todd sits behind shelves and counter (depth -5) so he can walk "behind the aisle".
    this.npc = this.prop('todd', 'clerk', 1062, 560, 'Todd (clerk)', () => this.toddCard(), -150).setDepth(-5);
    this.npcTag = this.lastTag;
    this.W(this.add.image(1060, 665, 'checkout').setOrigin(0.5, 1).setScale(0.5));
    this.prop('lactase', 'lactase', 955, 492, 'Lactase  $6', () => this.lactaseCard());
    this.prop('sample', 'sample_table', 520, 715, 'Free sample!', () => this.foodCard('sample'), -12);
    this.hotspot(1228, 330, 96, 300, 'Exit', () => this.exitCard(), 500);

    this.addPlayer(() => this.s.status.dairy === 'confirmed'
      ? 'Peanuts: absolutely not.\nDairy: apparently also no.\nStill hungry.'
      : 'Peanuts: absolutely not.\nDairy: ...unclear?\nMostly: hungry.');
    if (!reduceMotion) this.idleTongs();
    this.finishSetup();
    this.time.delayedCall(400, () => this.say('player', 'Goal: buy something edible\nbefore the checkout line\nbecomes a lifestyle.', 4200));
  }

  protected badgeAt(id: string): [number, number] {
    const b = this.props[id].getBounds();
    return id === 'muffin' ? [b.left + 60, b.top + 10] : [b.right - 10, b.top + 10]; // away from bread, cookie and its sticky
  }

  private idleTongs() {
    // Blondie, muffin, blondie... in plain sight, if you're watching.
    this.tweens.chain({
      targets: this.tongs, loop: -1, loopDelay: 2600,
      tweens: [
        { x: 705, y: 392, duration: 500, ease: 'Sine.easeInOut' },
        { y: 376, duration: 200, yoyo: true },
        { x: 598, y: 392, duration: 700, ease: 'Sine.easeInOut' },
        { y: 376, duration: 200, yoyo: true },
        { x: 650, y: 376, duration: 500, ease: 'Sine.easeInOut' },
      ],
    });
  }

  protected onCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    if (learned('cookie_label')) { this.props.cookie.setTexture('cookie_back'); this.stick('cookie'); }
    if (learned('clerk_bakery') || learned('tongs_watched')) this.stick('bakery');
    if (next.bathroomMinutes > prev.bathroomMinutes) {
      this.stick('dairy');
      if (!next.outcome) this.time.delayedCall(1500, () => this.say('npc', TODD_REACT.complaint));
    }
    if (next.minute >= LINE_GROWS_AT && !this.queue && !next.outcome) this.growQueue();
  }

  private growQueue() {
    this.queue = true;
    const g = this.W(this.add.graphics().setDepth(5));
    [[880, 0x8a7fb0], [815, 0xb07f8a], [750, 0x7fa0b0]].forEach(([x, c], i) => {
      g.fillStyle(c).lineStyle(4, INK);
      g.fillEllipse(x, 610 + i * 8, 60, 120).strokeEllipse(x, 610 + i * 8, 60, 120);
      g.fillCircle(x, 535 + i * 8, 26).strokeCircle(x, 535 + i * 8, 26);
    });
    if (!reduceMotion) { g.setX(200).setAlpha(0); this.tweens.add({ targets: g, x: 0, alpha: 1, duration: 600, ease: 'Cubic.easeOut' }); }
    this.time.delayedCall(3200, () => {
      this.say('pa', PA.line, 3000);
      this.time.delayedCall(1600, () => this.say('npc', TODD_REACT.line));
    });
  }

  // ---------- cookie close-up ----------

  private cookieCloseUp() {
    this.zoomIn(COOKIE.x, COOKIE.y, () => this.cookiePanel());
  }

  private cookiePanel() {
    const s = this.s;
    const read = s.known.includes('cookie_label');
    const btns: Btn[] = [];
    if (!read) btns.push({ label: 'Turn it over\n+3 min', fill: 0x4f9bd1, onClick: () => this.turnCookieOver() });
    btns.push({ label: `${isRisky(s, 'cookie') ? 'RISK IT' : 'Buy & eat'}\n$4 · +${checkoutMinutes(s)} min`, fill: 0xe0662f, enabled: canEat(s, 'cookie'), onClick: () => this.zoomOut(() => this.doEat('cookie')) });
    btns.push({ label: 'Put it back', fill: 0x7a8791, onClick: () => this.zoomOut(() => this.cookieBack()) });
    this.closeUpPanel(read ? 'THE BACK OF THE BOX' : 'THE FRONT OF THE BOX',
      read ? 'Nutrition Facts: "Joy 110%". And, in 3-point type:' : 'Six claims. Zero facts. One asterisk.', 'cookie', btns);
  }

  private turnCookieOver() {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const box = this.props.cookie;
    const cam = this.cameras.main;
    // Flip the box, then push into the tiny print until it is actually legible.
    this.tweens.chain({
      targets: box,
      tweens: [
        { scaleX: 0, duration: reduceMotion ? 0 : 160, onComplete: () => { box.setTexture('cookie_back'); } },
        { scaleX: 0.5, duration: reduceMotion ? 0 : 160 },
      ],
    });
    this.time.delayedCall(reduceMotion ? 0 : 450, () => {
      cam.pan(COOKIE.tinyX, COOKIE.tinyY, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
      cam.zoomTo(3.6, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
      this.say('player', '...still tiny.', 1300);
    });
    this.time.delayedCall(reduceMotion ? 0 : 1300, () => {
      cam.zoomTo(7.5, reduceMotion ? 0 : 400, 'Back.easeOut');
      this.setFace('sick');
    });
    this.beat(2700, () => {
      this.commit(inspect(this.s, 'cookie_label'));
      cam.pan(COOKIE.x, COOKIE.y, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      cam.zoomTo(2.3, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      this.setFace('suspicious');
      this.time.delayedCall(reduceMotion ? 0 : 420, () => this.cookiePanel());
    });
  }

  // Back in the wide shot: the reaction is physical, and the shelf shows what he learned.
  private cookieBack() {
    if (this.s.known.includes('cookie_label')) {
      this.setFace('suspicious');
      this.say('player', 'Nope. Not today, cookie.', 2400);
      this.npc.setAngle(-10); // leans out over the counter toward the shelf
      this.time.delayedCall(900, () => this.say('npc', TODD_REACT.label, 2600));
      this.time.delayedCall(3200, () => this.npc.setAngle(0));
    } else {
      this.setFace('neutral');
      this.say('player', 'Maybe later.\n(It was calling to me.)', 2200);
    }
  }

  // ---------- cards ----------

  private foodCard(id: string) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const btns: Btn[] = [];
    if (id === 'muffin' && !s.known.includes('clerk_bakery') && !s.known.includes('tongs_watched')) {
      btns.push({ label: 'Watch the tongs\n+1 min', fill: 0x4f9bd1, onClick: () => this.watchTongs() });
    }
    const cost = f.price ? `$${f.price} · +${checkoutMinutes(s)} min` : 'free';
    const verb = f.endsScene ? (risky ? 'RISK IT' : 'Buy & eat') : (risky ? 'RISK IT: drink' : 'Drink it');
    const eatBtn: Btn = { label: `${verb}\n${cost}`, fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id), onClick: () => this.doEat(id) };
    if (!f.endsScene && s.eaten.includes(id)) eatBtn.label = 'Sample lady\nis watching you';
    else if (!canEat(s, id)) eatBtn.label = `Can't afford\n$${f.price}`;
    btns.push(eatBtn);

    const clue = ['clerk_bakery', 'tongs_watched'].find((c) => s.known.includes(c) && FOODS[id].facts.some((l) => l.clues?.includes(c)));
    const pv = this.previewText(id);
    this.openCard(this.props[id].x, f.name, f.blurb, pv.lines, clue ? CLUES[clue].line : null, btns, pv.stats);
  }

  private watchTongs() {
    this.closeCard();
    this.setFace('suspicious');
    this.tweens.killTweensOf(this.tongs);
    if (!reduceMotion) {
      this.tweens.chain({
        targets: this.tongs,
        tweens: [
          { x: 705, y: 395, duration: 250 }, { angle: -20, duration: 120, yoyo: true },
          { x: 598, y: 395, duration: 300 }, { angle: 20, duration: 120, yoyo: true },
          { x: 705, y: 395, duration: 250 }, { x: 598, duration: 250 }, { x: 650, y: 376, duration: 250 },
        ],
      });
    }
    this.say('player', 'Blondie. Muffin.\nBlondie. Muffin.\nOh no.', 1800);
    this.beat(1800, () => {
      this.commit(inspect(this.s, 'tongs_watched'));
      if (!reduceMotion) this.idleTongs();
    });
  }

  // Todd walks behind the aisle, grabs the actual tongs, and demonstrates.
  private toddDemoTongs() {
    this.tweens.killTweensOf(this.tongs);
    this.npcWalk(800, 700);
    if (!reduceMotion) {
      this.tweens.chain({
        targets: this.tongs,
        tweens: [
          { x: 760, y: 300, angle: -25, duration: 350, delay: 700 },
          { angle: 25, duration: 150, yoyo: true, repeat: 1 },
          { x: 705, y: 392, angle: 0, duration: 300 }, // into the blondies
          { x: 598, y: 392, duration: 350 }, // straight into the muffins
          { x: 650, y: 376, duration: 300, delay: 300 },
        ],
      });
    }
    this.time.delayedCall(900, () => this.say('npc', CLUES.clerk_bakery.line, 3000));
    this.beat(2900, () => {
      this.commit(inspect(this.s, 'clerk_bakery'));
      this.npcWalk(1062, 700);
      if (!reduceMotion) this.time.delayedCall(700, () => this.idleTongs());
    });
  }

  private doEat(id: string) {
    this.closeCard();
    const prev = this.s;
    if (FOODS[id].endsScene) this.choiceFrom = prev;
    const next = eat(prev, id);
    this.setFace('happy');
    if (FOODS[id].endsScene) {
      this.say('npc', TODD_REACT[id as keyof typeof TODD_REACT], 2000);
      this.commit(next, 1900);
      return;
    }
    this.commit(next);
    if (next.bathroomMinutes === prev.bathroomMinutes) {
      this.say('player', next.lactase < prev.lactase ? 'Delicious. Lactase did its one job.' : 'Delicious. Suspiciously fine.');
      this.time.delayedCall(1500, () => this.setFace('neutral'));
    }
  }

  private toddCard() {
    const s = this.s;
    const chats = s.toddChats;
    const moods = ['Bored.', 'Bored, but talking.', 'Oversharing.', 'Having a crisis.', 'Staring at the rice cakes.'];
    const btns: Btn[] = [];
    if (!s.known.includes('clerk_cookie')) btns.push({
      label: 'Cookie safe?\n+2 min', fill: 0x4f9bd1,
      onClick: () => {
        this.closeCard();
        this.commit(inspect(this.s, 'clerk_cookie'));
        this.npc.setAngle(-12); // waves vaguely at the cookie shelf
        this.say('npc', CLUES.clerk_cookie.line);
        this.time.delayedCall(1400, () => this.npc.setAngle(0));
        this.time.delayedCall(2200, () => { this.setFace('suspicious'); this.say('player', "That's... not an ingredient list, Todd."); });
      },
    });
    if (!s.known.includes('clerk_bakery')) btns.push({
      label: 'Bakery tongs?\n+2 min', fill: 0x4f9bd1, onClick: () => { this.closeCard(); this.toddDemoTongs(); },
    });
    btns.push({
      label: chats < TODD_CHAT.length ? 'Small talk\n+1 min' : 'Todd is on break\n(emotionally)', fill: 0x8a6fc0, enabled: chats < TODD_CHAT.length,
      onClick: () => {
        this.closeCard();
        const line = TODD_CHAT[this.s.toddChats];
        if (line.reveals) {
          // He leans way out toward the cookie shelf, squints, and the box gets turned around.
          this.npc.setAngle(-18);
          this.time.delayedCall(2600, () => this.npc.setAngle(0).setTint(0xcfe3ff)); // visibly pale
        }
        this.commit(chatTodd(this.s));
        this.say('npc', line.line, 4200);
      },
    });
    this.openCard(this.npc.x, 'Todd', `Clerk. 19. Has been asked about peanuts before and chose not to learn. Mood: ${moods[chats]}`, [], null, btns);
  }

  private lactaseCard() {
    const s = this.s;
    this.openCard(955, 'Lact-Ease Tablets', `Helps your stomach with dairy (${LACTASE.uses} uses). Does NOT help with peanuts. We've been asked.`, [
      { topic: 'Dairy', mark: '✓', text: 'Used automatically on your next dairy.' },
      { topic: 'Peanut', mark: '!', text: 'Zero effect. An enzyme, not a force field.' },
    ], null, [{
      label: s.lactase ? 'Already in pocket' : `Buy it\n$${LACTASE.price} · +1 min`, fill: 0x3f9a5b, enabled: !s.lactase && s.money >= LACTASE.price,
      onClick: () => {
        this.closeCard();
        this.commit(buyLactase(this.s));
        this.say('npc', TODD_REACT.lactase, 2400);
        this.time.delayedCall(2300, () => { this.setFace('suspicious'); this.say('player', TODD_REACT.lactaseReply, 1800); });
      },
    }]);
  }

  private exitCard() {
    const s = this.s;
    this.openCard(1228, 'Leave with nothing?', 'Safe. Free. Deeply hungry. Future you will inherit this problem.', [
      { topic: 'Money', mark: '✓', text: `keep all $${s.money}` },
      { topic: 'Hunger', mark: '!', text: `${s.hunger} → ${Math.min(10, s.hunger + 3)} out of 10` },
    ], null, [{ label: 'Leave hungry', fill: 0xe0662f, onClick: () => { this.closeCard(); this.setFace('sick'); this.choiceFrom = this.s; this.commit(leave(this.s), 200); } }]);
  }

  protected endButtons(): Btn[] {
    const s = this.s;
    return [
      { label: 'PLAY AGAIN', fill: 0x7a8791, onClick: () => this.scene.restart({ seed: s.seed + 1 }) },
      { label: 'CONTINUE:\nTHE PHARMACY', fill: 0x3f9a5b, onClick: () => this.scene.start('pharmacy', { run: toPharmacy(s) }) },
    ];
  }
}
