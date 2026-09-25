import { CLUES, SAM_PIZZA } from '../content/index.ts';
import { freshCutter, lookCutter, lookPesto, newRun, passDessert, toBbq, toPizza, type State } from '../systems/rules.ts';
import { reduceMotion, type Btn } from './BaseScene.ts';
import { EveningScene } from './EveningScene.ts';

const CUTTER = { x: 560, y: 470 }; // cutter on the counter, for the close-up

// Slice Society: cheap, cheerful, and a quietly hard place to eat with a peanut allergy.
// House pesto is made with peanuts, one cutter does every pie, and "no pesto on it" is not safe.
export class PizzaScene extends EveningScene {
  protected venue = { name: 'Slice Society', eat: SAM_PIZZA.eat, greet: SAM_PIZZA.greet, greetThought: SAM_PIZZA.greetThought };
  protected stickies = {
    cutter: { x: 560, y: 405, text: 'ONE CUTTER.\nEVERY PIE.', angle: -5 },
    tub: { x: 740, y: 430, text: 'PEANUT PESTO', angle: 6 },
  };

  constructor() { super('pizza'); }

  init(data: { run?: State }) {
    this.entry = data.run ?? toPizza(toBbq(newRun(Math.floor(Math.random() * 1e6))));
    this.reset(this.entry);
  }

  create() {
    this.setupStage('pizza_bg');
    // Menu board: one picture, four lines.
    const menu = this.W(this.add.image(640, 390, 'pizza_menu').setOrigin(0.5, 1).setScale(0.5));
    this.props.margherita = this.props.pesto = this.props.sausage = this.props.knots = menu;
    const rows: [string, string, number][] = [['margherita', 'Margherita $4', 204], ['pesto', 'House Pesto $5', 254], ['sausage', 'Sausage & Onion $5', 304], ['knots', 'Garlic Knots $4', 354]];
    for (const [id, label, y] of rows) this.hotspot(640, y, 310, 48, label, () => this.pizzaCard(id), -100);

    this.prop('tray', 'pizza_slices', 300, 500, 'Slices, out of the oven', () => this.pizzaCard('margherita'), 18).setDepth(2);
    this.prop('cutter', 'pizza_cutter', CUTTER.x, 505, 'The cutter', () => this.cutterCloseUp(), 18).setDepth(2);
    this.prop('tub', 'pesto_tub', 740, 500, 'Pesto tub', () => this.tubCard(), 18).setDepth(2);

    this.npc2 = this.prop('server', 'server', 1170, 600, 'Server', () => this.serverCard(), -380);
    this.serverTag = this.lastTag;
    this.npc = this.prop('sam', 'sam', 960, 700, '', () => this.samCard(), -470).setDepth(3);
    this.npcTag = this.lastTag;
    this.W(this.add.image(960, 724, 'date_table').setOrigin(0.5, 1).setScale(0.5).setDepth(5));
    this.hotspot(1160, 655, 220, 90, 'Walk Sam home →', () => this.exitCard(), 655);

    this.addPlayer(() => `Sam: ${this.s.rel.sam}/10.\nMoney: $${this.s.money}.\nPesto: suspicious.`);
    this.startEvening();
    if (this.s.known.includes('fresh_cutter')) this.addPie();
    this.time.delayedCall(14000, () => {
      if (!this.s.outcome && !this.s.eaten.includes('pesto') && !this.s.known.includes('passed_pesto') && !this.card && !this.zoomed) this.say('npc', SAM_PIZZA.pesto, 3200);
    });
  }

  protected foodX(id: string) { return id === 'custom_pie' ? 880 : 640; }

  protected badgeAt(id: string): [number, number] {
    const y = ({ margherita: 192, pesto: 242, sausage: 292, knots: 342 } as Record<string, number>)[id];
    return y ? [478, y] : super.badgeAt(id);
  }

  protected venueCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    if (learned('pizza_checked') || learned('cutter_looked')) this.stick('cutter');
    if (learned('pizza_checked') || learned('pizza_partial') || learned('pesto_looked')) this.stick('tub');
    if (learned('fresh_cutter')) this.addPie();
    if (next.eaten.includes('custom_pie') && !prev.eaten.includes('custom_pie')) this.props.custom_pie?.setAlpha(0.4);
  }

  private addPie() {
    const p = this.prop('custom_pie', 'custom_pie', 880, 590, 'Plain pie, clean cutter', () => this.foodCard('custom_pie'), 18).setDepth(6);
    this.drawBadges();
    if (!reduceMotion) { p.setScale(0); this.tweens.add({ targets: p, scale: 0.5, duration: 300, ease: 'Back.easeOut' }); }
  }

  // The pesto slice is Sam's "we HAVE to share this" moment: passing is its own choice.
  private pizzaCard(id: string) {
    const s = this.s;
    const extra: Btn[] = id === 'pesto' && !s.eaten.includes('pesto') && !s.known.includes('passed_pesto')
      ? [{ label: `Pass on it\n${this.actionStats(passDessert(s))}`, fill: 0x7a8791, onClick: () => { this.closeCard(); this.commit(passDessert(this.s)); this.say('npc', CLUES.passed_pesto.line, 3000); } }]
      : [];
    this.foodCard(id, extra);
  }

  // Once the kitchen admits the cutter, the server can offer the clean way.
  protected serverExtra(s: State): Btn[] {
    const next = freshCutter(s);
    return next === s ? [] : [{
      label: `Whole plain pie,\nclean cutter\n${this.actionStats(next)}`, fill: 0x3f9a5b,
      onClick: () => { this.closeCard(); this.say('npc2', CLUES.fresh_cutter.line, 3200); this.commit(freshCutter(this.s)); },
    }];
  }

  private tubCard() {
    const s = this.s;
    const read = s.known.includes('pesto_looked');
    this.openCard(740, 'The Pesto Tub', read ? CLUES.pesto_looked.line : 'Deli tub. Green. Tape label, hand-written.', [
      { topic: 'Label', mark: read ? '!' : '?', text: read ? 'Peanuts. Because they are cheaper.' : 'Small handwriting under the big handwriting.' },
    ], null, read ? [] : [{
      label: `Read the tape\n${this.actionStats(lookPesto(s))}`, fill: 0x4f9bd1,
      onClick: () => { this.closeCard(); this.setFace('sick'); this.say('player', "Nuts: yes.\n(Peanut. It's cheaper.)", 2600); this.commit(lookPesto(this.s)); },
    }]);
  }

  // ---------- cutter close-up ----------

  private cutterCloseUp() { this.zoomIn(CUTTER.x, CUTTER.y, () => this.cutterPanel(), 3); }

  private cutterPanel() {
    const watched = this.s.known.includes('cutter_looked');
    const btns: Btn[] = [];
    if (!watched) btns.push({ label: 'Watch it work\n+1 min', fill: 0x4f9bd1, onClick: () => this.watchCutter() });
    btns.push({ label: 'Step back', fill: 0x7a8791, onClick: () => this.zoomOut(() => this.setFace('neutral')) });
    this.closeUpPanel(watched ? 'ONE CUTTER, EVERY PIE' : 'THE PIZZA CUTTER',
      watched ? 'Pesto pie, then margherita, then sausage. No rinse. This is what the margherita gets:' : 'Wheel, handle, a little green on the wheel. This is what cuts the margherita:', 'margherita', btns);
  }

  private watchCutter() {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const cam = this.cameras.main;
    const cutter = this.props.cutter;
    cam.zoomTo(5, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    if (!reduceMotion) this.tweens.add({ targets: cutter, x: CUTTER.x - 40, yoyo: true, repeat: 2, duration: 220, ease: 'Sine.easeInOut' });
    this.time.delayedCall(reduceMotion ? 0 : 700, () => { this.setFace('sick'); this.say('player', 'Pesto pie.\nThen the margherita.\nSame wheel.', 2200); });
    this.beat(2600, () => {
      this.commit(lookCutter(this.s));
      cam.zoomTo(3, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      this.setFace('suspicious');
      this.time.delayedCall(reduceMotion ? 0 : 420, () => this.cutterPanel());
    });
  }
}
