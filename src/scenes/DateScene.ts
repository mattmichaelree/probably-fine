import { CLUES, FOODS, SAM } from '../content/index.ts';
import { canEat, isRisky, lookTorte, moveVenue, newRun, passDessert, toBbq, toDate, type State } from '../systems/rules.ts';
import { reduceMotion, type Btn } from './BaseScene.ts';
import { EveningScene } from './EveningScene.ts';

const TORTE = { x: 760, y: 540 }; // plate center for the close-up

// The Trattoria: pricey pasta, a peanut torte "with a crunchy surprise", and a taco truck across the street.
export class DateScene extends EveningScene {
  protected venue = { name: 'the Trattoria', eat: SAM.eat, greet: SAM.greet, greetThought: SAM.greetThought };
  protected stickies = {
    board: { x: 430, y: 372, text: 'KITCHEN: NO PEANUTS\nIN THE MAINS', angle: -4 },
    torte: { x: 760, y: 470, text: 'PEANUT HEART', angle: 6 },
  };

  constructor() { super('date'); }

  init(data: { run?: State }) {
    this.entry = data.run ?? toDate(toBbq(newRun(Math.floor(Math.random() * 1e6))));
    this.reset(this.entry);
  }

  create() {
    this.setupStage('restaurant_bg');
    // Specials board: one picture, three dishes.
    const board = this.W(this.add.image(430, 340, 'specials_board').setOrigin(0.5, 1).setScale(0.5));
    this.props.pasta = this.props.bruschetta = this.props.salmon = board;
    this.hotspot(430, 172, 280, 58, 'Truffle Pasta', () => this.foodCard('pasta'), -100);
    this.hotspot(430, 234, 280, 58, 'Bruschetta', () => this.foodCard('bruschetta'), -100);
    this.hotspot(430, 296, 280, 58, 'Grilled Salmon', () => this.foodCard('salmon'), -100);
    this.tag(430, 356, 'Specials board');

    this.npc = this.prop('sam', 'sam', 660, 610, '', () => this.samCard(), -430);
    this.npcTag = this.lastTag;
    this.W(this.add.image(660, 720, 'date_table').setOrigin(0.5, 1).setScale(0.5).setDepth(5));
    const candle = this.W(this.add.image(560, 548, 'candle').setOrigin(0.5, 1).setScale(0.5).setDepth(6));
    if (!reduceMotion) this.tweens.add({ targets: candle, scaleX: 0.47, yoyo: true, repeat: -1, duration: 300 });
    this.prop('torte', 'torte', TORTE.x, 575, 'Torte for two', () => this.torteCloseUp()).setDepth(6);
    this.npc2 = this.prop('server', 'server', 960, 600, 'Server', () => this.serverCard(), -400);
    this.serverTag = this.lastTag;
    this.prop('tacos', 'taco_truck', 1170, 405, 'Taco truck', () => this.tacoCard(), 18);
    this.hotspot(1160, 655, 220, 90, 'Walk Sam home →', () => this.exitCard(), 655);

    this.addPlayer(() => `Sam: ${this.s.rel.sam}/10.\nMoney: $${this.s.money}.\nPeanuts: still no.`);
    this.startEvening();
    this.time.delayedCall(14000, () => {
      if (!this.s.outcome && !this.s.eaten.includes('torte') && !this.s.known.includes('passed_torte') && !this.card && !this.zoomed) this.say('npc', SAM.torte, 3200);
    });
  }

  protected foodX(id: string) { return id === 'tacos' ? 1170 : id === 'torte' ? TORTE.x : 430; }

  protected badgeAt(id: string): [number, number] {
    const y = ({ pasta: 150, bruschetta: 212, salmon: 274 } as Record<string, number>)[id];
    return y ? [578, y] : super.badgeAt(id);
  }

  protected venueCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    for (const id of next.eaten) if (!prev.eaten.includes(id) && ['torte', 'tacos'].includes(id)) this.props[id]?.setAlpha(0.4);
    if (learned('server_checked') || learned('server_partial')) this.stick('board');
    if (learned('server_checked') || learned('torte_looked')) this.stick('torte');
  }

  protected samExtra(s: State): Btn[] {
    return s.known.includes('moved_venue') ? [] : [{ label: `Suggest the\ntaco truck\n${this.actionStats(moveVenue(s))}`, fill: 0x4f9bd1, onClick: () => this.move() }];
  }

  private move() {
    this.closeCard();
    const told = this.s.known.includes('told_sam');
    this.commit(moveVenue(this.s));
    this.say('npc', told ? CLUES.moved_venue.line : SAM.movedUntold, 3000);
  }

  private tacoCard() {
    if (!this.s.known.includes('moved_venue')) {
      const s = this.s;
      const pv = this.previewText('tacos');
      this.openCard(1170, 'Taco Truck (across the street)', FOODS.tacos.blurb, pv.lines, null, [{
        label: `Move dinner there\n${this.actionStats(moveVenue(s))}`, fill: 0x4f9bd1, onClick: () => this.move(),
      }], pv.stats);
      return;
    }
    this.foodCard('tacos');
  }

  // ---------- torte close-up ----------

  private torteCloseUp() { this.zoomIn(TORTE.x, TORTE.y, () => this.tortePanel(), 3); }

  private tortePanel() {
    const s = this.s;
    const known = s.known.includes('torte_looked') || s.known.includes('server_checked');
    const risky = isRisky(s, 'torte');
    const btns: Btn[] = [];
    if (!known) btns.push({ label: 'Look closely\n+1 min', fill: 0x4f9bd1, onClick: () => this.lookClosely() });
    btns.push({ label: `${risky ? 'RISK IT' : 'Share it'}\n$${FOODS.torte.price}`, fill: 0xe0662f, enabled: canEat(s, 'torte'), onClick: () => this.zoomOut(() => this.doEat('torte')) });
    if (!s.known.includes('passed_torte')) btns.push({
      label: `Pass\n${this.actionStats(passDessert(s))}`, fill: 0x7a8791,
      onClick: () => this.zoomOut(() => { this.commit(passDessert(this.s)); this.say('npc', CLUES.passed_torte.line, 3000); }),
    });
    else btns.push({ label: 'Put the fork down', fill: 0x7a8791, onClick: () => this.zoomOut(() => this.setFace('neutral')) });
    this.closeUpPanel(known ? 'THE CRUNCHY SURPRISE' : 'CHOCOLATE TORTE FOR TWO',
      known ? 'Arranged like a museum piece. Built like a trap.' : 'Glossy. Symmetrical. "With a crunchy surprise."', 'torte', btns);
  }

  private lookClosely() {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const cam = this.cameras.main;
    cam.zoomTo(6, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    cam.pan(TORTE.x, 520, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    this.time.delayedCall(reduceMotion ? 0 : 700, () => { this.setFace('sick'); this.say('player', 'Chopped peanuts.\nIn a heart.\nChunky. You know chunky.', 2200); });
    this.beat(2600, () => {
      this.commit(lookTorte(this.s));
      cam.zoomTo(3, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      cam.pan(TORTE.x, TORTE.y, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      this.setFace('suspicious');
      this.time.delayedCall(reduceMotion ? 0 : 420, () => this.tortePanel());
    });
  }
}
