import * as Phaser from 'phaser';
import { CLUES, FOODS, RICK, RICK_SAUCE } from '../content/index.ts';
import {
  askRub, askSauce, canEat, declineRibs, eat, inspect, isRisky, leaveBbq, negotiateCat, newRun, orderBurger, pillsActive, sit, tellRick, toBbq, toDate, toPizza,
  type State,
} from '../systems/rules.ts';
import { BaseScene, clock, dur, reduceMotion, type Btn } from './BaseScene.ts';

const SAUCE = { x: 925, y: 405, tapeX: 925, tapeY: 423 }; // bottle center and its masking tape

export class BbqScene extends BaseScene {
  private entry!: State; // state on arrival, for "replay Rick's"
  protected endPrompt = 'Sam texted: "Pasta place or pizza? You pick!"';
  private brush!: Phaser.GameObjects.Image;
  protected stickies = {
    ribs: { x: 400, y: 300, text: 'PB IN THE SAUCE\n(Rick: "not a nut")', angle: -6 },
    brush: { x: 585, y: 300, text: 'SAME BRUSH', angle: 5 },
  };

  constructor() { super('bbq'); }

  init(data: { run?: State }) {
    this.entry = data.run ?? toBbq(newRun(Math.floor(Math.random() * 1e6)));
    this.reset(this.entry);
  }

  create() {
    this.setupStage('backyard_bg');
    this.W(this.add.image(130, 545, 'cedar_tree').setOrigin(0.5, 1).setScale(0.5).setDepth(-6));
    if (!reduceMotion) this.pollen();
    this.prop('chair_cedar', 'lawn_chair', 330, 700, 'Shady chair (cedar)', () => this.cedarCard(), -150);

    // Grill: one picture, two tap areas.
    const grill = this.W(this.add.image(470, 610, 'grill').setOrigin(0.5, 1).setScale(0.5));
    this.props.ribs = this.props.brisket = grill;
    this.hotspot(420, 440, 130, 110, 'Ribs', () => this.foodCard('ribs'), 352);
    this.hotspot(530, 440, 130, 110, 'Brisket', () => this.foodCard('brisket'), 352);
    this.brush = this.W(this.add.image(340, 468, 'brush').setOrigin(0.5, 1).setScale(0.5).setDepth(1));

    this.npc = this.prop('rick', 'rick', 730, 612, '', () => this.rickCard()).setDepth(-2);
    this.npcTag = this.lastTag;
    this.prop('sauce', 'sauce_bottle', 925, 478, 'Sauce bottle', () => this.sauceCloseUp(), 50);
    this.prop('salad', 'potato_salad', 1010, 484, 'Potato salad', () => this.foodCard('salad'));
    this.prop('casserole', 'casserole', 1125, 484, 'Casserole', () => this.foodCard('casserole'));
    this.prop('corn', 'corn', 1228, 484, 'Corn', () => this.foodCard('corn'));
    this.prop('cat', 'cat_chair', 1110, 715, "Mr. Whiskers' chair", () => this.catCard(), -20);
    if (this.s.known.includes('cat_moved')) this.props.cat.setTexture('cat_chair_empty');
    this.hotspot(1210, 215, 140, 70, 'Head home →', () => this.gateCard(), 268);

    this.addPlayer(() => {
      const st = this.s.status;
      return `Peanuts: absolutely not.\nDairy: ${st.dairy === 'confirmed' ? 'no' : st.dairy === 'suspected' ? 'probably no' : '...unclear'}.\nOnion: ${st.onion === 'confirmed' ? 'no' : st.onion === 'suspected' ? 'suspicious' : '...unclear'}.`;
    });
    if (!reduceMotion) {
      this.idleBrush();
      this.tweens.add({ targets: this.npc, angle: 2.5, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
    }
    this.npcBase = 'rick';
    this.finishSetup();
    this.updateRickTag();
    this.toast("Goal: eat something, keep Rick happy, and get out in one piece. Dinner with Sam is at 7:00.");
    this.time.delayedCall(500, () => { this.say('npc', RICK.greet, 3800); this.mood('rick_proud', 2400); });
    this.time.delayedCall(9000, () => {
      if (!this.s.outcome && !this.s.eaten.includes('ribs') && !this.s.known.includes('declined_ribs') && !this.card && !this.zoomed) this.say('npc', RICK.push, 3200);
    });
  }

  protected badgeAt(id: string): [number, number] {
    if (id === 'ribs') return [380, 400];
    if (id === 'brisket') return [575, 400];
    return super.badgeAt(id);
  }

  private updateRickTag() { this.setTagText(this.npcTag, `Uncle Rick · ${this.s.rel.rick}/10`); }

  private pollen() {
    for (let i = 0; i < 9; i++) {
      const d = this.W(this.add.circle(40 + ((i * 47) % 200), 120 + ((i * 83) % 250), 4, 0xffd23f).setDepth(-5));
      this.tweens.add({ targets: d, y: d.y + 140, x: d.x + 30, alpha: 0, duration: 3200, delay: i * 350, repeat: -1 });
    }
  }

  private idleBrush() {
    // Sauce pot, ribs, brisket. The "dry rub" brisket gets sauced too, if you're watching.
    this.tweens.chain({
      targets: this.brush, loop: -1, loopDelay: 2200,
      tweens: [
        { y: 440, duration: 250 }, { y: 468, duration: 200 }, // dip in the pot
        { x: 420, y: 470, duration: 500, ease: 'Sine.easeInOut' }, { angle: -20, duration: 150, yoyo: true, repeat: 1 },
        { x: 530, y: 470, duration: 500, ease: 'Sine.easeInOut' }, { angle: 20, duration: 150, yoyo: true, repeat: 1 },
        { x: 340, y: 468, duration: 600, ease: 'Sine.easeInOut' },
      ],
    });
  }

  protected onCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    this.updateRickTag();
    // Rick wears his feelings on his face: panicked, sheepish, hurt, proud.
    if (next.outcome === 'reaction') this.mood('rick_panicked', 9000);
    else if (learned('brush_watched') || learned('sauce_label') || learned('rick_sauce_3')) this.mood('rick_sheepish', 3000);
    else if (next.rel.rick < prev.rel.rick) this.mood('rick_hurt', 3000);
    else if (next.rel.rick > prev.rel.rick || next.eaten.length > prev.eaten.length) this.mood('rick_proud', 2600);
    // Eaten dishes fade (the grill stays; it's shared by ribs and brisket).
    for (const id of next.eaten) if (!prev.eaten.includes(id) && id !== 'ribs' && id !== 'brisket') this.props[id]?.setAlpha(0.4);
    if (learned('rick_sauce_3') || learned('sauce_label')) this.stick('ribs');
    if (learned('brush_watched')) this.stick('brush');
    if (learned('burger_ordered')) {
      const b = this.prop('burger', 'burger', 560, 712, 'Plain burger', () => this.foodCard('burger'), -80);
      this.drawBadges();
      if (!reduceMotion) { b.setScale(0); this.tweens.add({ targets: b, scale: 0.5, duration: 300, ease: 'Back.easeOut' }); }
    }
    if (next.bathroomMinutes > prev.bathroomMinutes && !next.outcome) {
      this.time.delayedCall(1600, () => this.say('npc', RICK.complaint, 3200));
      if ((['dairy', 'onion'] as const).some((t) => next.status[t] === 'suspected' && prev.status[t] !== 'suspected')) {
        this.time.delayedCall(4000, () => this.say('player', 'Was it the dairy?\nThe onion? Both?', 2800));
      }
    }
  }

  // ---------- sauce bottle close-up ----------

  private sauceCloseUp() { this.zoomIn(SAUCE.x, SAUCE.y, () => this.saucePanel(), 2.8); }

  private saucePanel() {
    const read = this.s.known.includes('sauce_label');
    const btns: Btn[] = [];
    if (!read) btns.push({ label: 'Turn it over\n+2 min', fill: 0x4f9bd1, onClick: () => this.turnSauceOver() });
    btns.push({ label: 'Put it down', fill: 0x7a8791, onClick: () => this.zoomOut(() => this.sauceDown()) });
    this.closeUpPanel(read ? 'THE BACK OF THE "KETCHUP"' : 'A KETCHUP BOTTLE',
      read ? 'Masking tape, marker, and a confession. This is what goes on the ribs:' : 'It says KETCHUP. It is not ketchup-colored. This is what goes on the ribs:', 'ribs', btns);
  }

  private turnSauceOver() {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const bottle = this.props.sauce;
    const cam = this.cameras.main;
    this.tweens.chain({
      targets: bottle,
      tweens: [
        { scaleX: 0, duration: reduceMotion ? 0 : 150, onComplete: () => { bottle.setTexture('sauce_back'); } },
        { scaleX: 0.5, duration: reduceMotion ? 0 : 150 },
      ],
    });
    this.time.delayedCall(reduceMotion ? 0 : 400, () => {
      cam.pan(SAUCE.tapeX, SAUCE.tapeY, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
      cam.zoomTo(6, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    });
    this.time.delayedCall(reduceMotion ? 0 : 1100, () => { this.setFace('sick'); this.say('player', 'P... B.', 1200); });
    this.beat(2500, () => {
      this.commit(inspect(this.s, 'sauce_label'));
      cam.pan(SAUCE.x, SAUCE.y, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      cam.zoomTo(2.8, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      this.setFace('suspicious');
      this.time.delayedCall(reduceMotion ? 0 : 420, () => this.saucePanel());
    });
  }

  private sauceDown() {
    if (this.s.known.includes('sauce_label')) {
      this.setFace('suspicious');
      this.say('player', 'Peanut butter.\nIn a ketchup bottle.', 2400);
      this.time.delayedCall(1200, () => this.say('npc', "Hey, that's my sauce! And peanut BUTTER isn't a nut. It's in the name.", 3400));
    } else {
      this.setFace('neutral');
    }
  }

  // ---------- cards ----------

  private foodCard(id: string) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const btns: Btn[] = [];
    if ((id === 'ribs' || id === 'brisket') && !s.known.includes('brush_watched')) {
      btns.push({ label: 'Watch the brush\n+1 min', fill: 0x4f9bd1, onClick: () => this.watchBrush() });
    }
    const eaten = s.eaten.includes(id);
    btns.push({
      label: eaten ? 'Already ate it' : `${risky ? 'RISK IT' : 'Eat it'}\n${dur(f.minutes ?? 1)}`,
      fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id), onClick: () => this.doEat(id),
    });
    if (id === 'ribs' && !eaten && !s.known.includes('declined_ribs')) {
      btns.push({ label: `Politely decline\n${this.actionStats(declineRibs(s))}`, fill: 0x7a8791, onClick: () => this.decline() });
    }
    const clues = f.facts.flatMap((l) => l.clues ?? []).filter((c) => s.known.includes(c));
    const pv = this.previewText(id);
    this.openCard(id === 'ribs' || id === 'brisket' ? 470 : this.props[id].x, f.name, f.blurb, pv.lines,
      clues.length ? CLUES[clues[clues.length - 1]].line : null, btns, pv.stats);
  }

  private watchBrush() {
    this.closeCard();
    this.setFace('suspicious');
    this.tweens.killTweensOf(this.brush);
    if (!reduceMotion) {
      this.tweens.chain({
        targets: this.brush,
        tweens: [
          { y: 440, duration: 180 }, { y: 468, duration: 150 },
          { x: 420, y: 470, duration: 300 }, { angle: -25, duration: 110, yoyo: true, repeat: 1 },
          { x: 530, y: 470, duration: 300 }, { angle: 25, duration: 110, yoyo: true, repeat: 1 },
          { x: 340, y: 468, duration: 350 },
        ],
      });
    }
    this.say('player', 'Sauce. Ribs. Brisket.\nThe "dry rub" brisket.', 2000);
    this.time.delayedCall(1600, () => this.say('npc', RICK.brush, 2600));
    this.beat(2000, () => {
      this.commit(inspect(this.s, 'brush_watched'));
      if (!reduceMotion) this.time.delayedCall(600, () => this.idleBrush());
    });
  }

  private decline() {
    this.closeCard();
    const told = this.s.known.includes('told_rick');
    this.commit(declineRibs(this.s));
    this.say('npc', told ? RICK.declinedTold : CLUES.declined_ribs.line, 3000);
    if (!told) this.time.delayedCall(3200, () => { this.setFace('suspicious'); this.say('player', 'He looks crushed.\nI could tell him why.', 2600); });
  }

  private doEat(id: string) {
    this.closeCard();
    const prev = this.s;
    this.choiceFrom = prev;
    const next = eat(prev, id);
    this.setFace('happy');
    this.say('npc', RICK.eat[id] ?? 'Enjoy!', 2200);
    this.commit(next, 1800);
    if (!next.outcome && next.bathroomMinutes === prev.bathroomMinutes) this.time.delayedCall(1500, () => this.setFace('neutral'));
  }

  private rickCard() {
    const s = this.s;
    const btns: Btn[] = [];
    const told = s.known.includes('told_rick');
    if (!told) btns.push({
      label: `Tell him about\nyour allergy\n${this.actionStats(tellRick(s))}`, fill: 0x3f9a5b,
      onClick: () => {
        this.closeCard();
        const sauceKnown = this.s.known.includes('rick_sauce_3') || this.s.known.includes('sauce_label');
        this.commit(tellRick(this.s));
        this.say('npc', CLUES.told_rick.line, 3600);
        if (sauceKnown) this.time.delayedCall(3700, () => { this.say('npc', RICK.toldAfterSauce, 3600); this.mood('rick_sheepish', 3600); });
        else if (this.s.known.includes('declined_ribs')) this.time.delayedCall(3700, () => this.say('npc', RICK.explained, 3200));
      },
    });
    const nextSauce = RICK_SAUCE.find((c) => !s.known.includes(c));
    if (nextSauce) btns.push({
      label: `What's in\nthe sauce?\n${this.actionStats(askSauce(s))}`, fill: 0x4f9bd1,
      onClick: () => {
        this.closeCard();
        const before = this.s;
        const next = askSauce(before);
        this.commit(next);
        this.setFace('suspicious');
        this.say('npc', CLUES[nextSauce].line, 4000);
        if (next.rel.rick < before.rel.rick) this.time.delayedCall(4100, () => this.say('npc', RICK.interrogated, 2400));
      },
    });
    if (!s.known.includes('rick_rub')) btns.push({
      label: `What's in\nthe rub?\n${this.actionStats(askRub(s))}`, fill: 0x4f9bd1,
      onClick: () => { this.closeCard(); this.commit(askRub(this.s)); this.say('npc', CLUES.rick_rub.line, 3200); },
    });
    if (told && !s.known.includes('burger_ordered')) btns.push({
      label: `Plain burger\non foil?\n${this.actionStats(orderBurger(s))}`, fill: 0x3f9a5b,
      onClick: () => {
        this.closeCard();
        this.npcWalk(620, 500);
        this.say('npc', CLUES.burger_ordered.line, 3000);
        this.beat(2400, () => { this.commit(orderBurger(this.s)); this.npcWalk(730, 500); this.setFace('happy'); });
      },
    });
    this.openCard(730, 'Uncle Rick', `Generous. Sincere. Has never read a label, including his own. Relationship: ${s.rel.rick}/10.`, [], null, btns);
  }

  private cedarCard() {
    const s = this.s;
    const next = sit(s, 'cedar');
    const covered = pillsActive(s);
    this.openCard(330, 'Shady Chair', "Under the cedar tree. Rick's favorite seat.", [
      covered
        ? { topic: 'Cedar pollen', mark: '✓', text: `Your allergy pills have it covered (until ${clock(s.pillsUntil)}).` }
        : { topic: 'Cedar pollen', mark: '!', text: 'Seasonal allergy: sneezing, itchy eyes.' },
      { topic: 'Shade', mark: '✓', text: 'Genuinely great shade.' },
    ], null, [{
      label: s.seat === 'cedar' ? 'Already sitting here' : 'Sit here', fill: covered ? 0x3f9a5b : 0xe0662f, enabled: next !== s,
      onClick: () => {
        this.closeCard();
        this.commit(sit(this.s, 'cedar'));
        this.setFace(covered ? 'happy' : 'sick');
        this.say('player', covered ? 'Shade. No sneezing.\nThe pills are working.' : 'ACHOO.', 1400);
        this.time.delayedCall(1300, () => { this.setFace('neutral'); this.say('npc', RICK.cedar, 2600); });
      },
    }], next !== s ? this.actionChips(next) : undefined);
  }

  private catCard() {
    const s = this.s;
    const moved = s.known.includes('cat_moved');
    const next = moved ? sit(s, 'cat') : negotiateCat(s);
    this.openCard(1110, "Mr. Whiskers' Chair",
      moved ? 'Shade, away from the cedar tree. Available at last.' : 'The only shady seat away from the cedar tree. Occupied.', [
        { topic: 'Cedar pollen', mark: '✓', text: 'Nowhere near the tree.' },
        { topic: 'Cat', mark: moved ? '✓' : '?', text: moved ? 'Gone. Left some fur as a deposit.' : 'Has no plans to move.' },
      ], null, [{
        label: moved ? (s.seat === 'cat' ? 'Already sitting here' : 'Sit here') : 'Ask the cat to move',
        fill: 0x3f9a5b, enabled: next !== s,
        onClick: () => {
          this.closeCard();
          if (moved) { this.commit(sit(this.s, 'cat')); this.setFace('happy'); return; }
          const n = negotiateCat(this.s);
          this.commit(n);
          if (n.known.includes('cat_moved')) {
            this.props.cat.setTexture('cat_chair_empty');
            this.say('npc', RICK.cat, 2600);
          } else {
            if (!reduceMotion) this.tweens.add({ targets: this.props.cat, angle: 3, yoyo: true, duration: 120, repeat: 2 });
            this.say('npc', RICK.catNo, 2400);
          }
        },
      }], next !== s ? this.actionChips(next) : undefined);
  }

  private gateCard() {
    const s = this.s;
    const bathroom = s.bathroomMinutes > s.bathroomAtStart;
    this.openCard(1210, 'Head home?', 'Next up: The Date at 7:00.', [
      { topic: 'Hunger', mark: s.hunger >= 7 ? '!' : '✓', text: `${s.hunger}/10` },
      { topic: 'Rick', mark: s.rel.rick <= 3 ? '!' : '✓', text: `${s.rel.rick}/10${s.relLog.length ? ` (last: ${s.relLog[s.relLog.length - 1].why})` : ''}` },
      ...(bathroom ? [{ topic: 'Bathroom', mark: '!' as const, text: 'You got to know it well.' }] : []),
    ], null, [{
      label: 'Say goodbye', fill: 0x3f9a5b,
      onClick: () => {
        this.closeCard();
        this.say('npc', this.s.rel.rick <= 3 ? RICK.bye.hurt : RICK.bye.happy, 2400);
        this.choiceFrom = this.entry;
        this.choiceLabel = 'THIS VISIT';
        this.commit(leaveBbq(this.s), 2000);
      },
    }]);
  }

  protected endButtons(): Btn[] {
    const s = this.s;
    return [
      { label: "REPLAY RICK'S", fill: 0x7a8791, onClick: () => this.scene.restart({ run: this.entry }) },
      // Sam texted: pasta place or pizza? The Trattoria is pricier; Slice Society is cheap, and trickier.
      { label: 'DATE AT THE\nTRATTORIA ($12+)', fill: 0x3f9a5b, onClick: () => this.scene.start('date', { run: toDate(s) }) },
      { label: 'DATE AT\nSLICE SOCIETY ($4+)', fill: 0xd9412f, onClick: () => this.scene.start('pizza', { run: toPizza(s) }) },
    ];
  }
}
