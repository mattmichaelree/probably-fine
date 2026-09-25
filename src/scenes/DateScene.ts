import { CLUES, FOODS, SAM, SERVER } from '../content/index.ts';
import {
  askServer, canEat, eat, isRisky, leaveDate, lookTorte, moveVenue, newRun, passTorte, tellSam, toBbq, toBiscuit, toDate, type State,
} from '../systems/rules.ts';
import { BaseScene, reduceMotion, type Btn } from './BaseScene.ts';

const TORTE = { x: 760, y: 540 }; // plate center for the close-up

// The Date. Sam has their own opinions and responds to honesty, not to the allergy itself.
export class DateScene extends BaseScene {
  private entry!: State;
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
    this.prop('tacos', 'taco_truck', 1170, 405, 'Taco truck', () => this.tacoCard(), 18);
    this.hotspot(1160, 655, 220, 90, 'Walk Sam home →', () => this.exitCard(), 655);

    this.addPlayer(() => `Sam: ${this.s.rel.sam}/10.\nMoney: $${this.s.money}.\nPeanuts: still no.`);
    this.finishSetup();
    this.updateSamTag();
    this.time.delayedCall(500, () => this.say('npc', SAM.greet, 3400));
    this.time.delayedCall(3800, () => { this.setFace('suspicious'); this.say('player', SAM.greetThought, 2600); });
    this.time.delayedCall(6800, () => { this.setFace('neutral'); this.say('npc2', SERVER.greet, 2600); });
    this.time.delayedCall(14000, () => {
      if (!this.s.outcome && !this.s.eaten.includes('torte') && !this.s.known.includes('passed_torte') && !this.card && !this.zoomed) this.say('npc', SAM.torte, 3200);
    });
  }

  protected badgeAt(id: string): [number, number] {
    const y = ({ pasta: 150, bruschetta: 212, salmon: 274 } as Record<string, number>)[id];
    return y ? [578, y] : super.badgeAt(id);
  }

  private updateSamTag() { this.setTagText(this.npcTag, `Sam · ${this.s.rel.sam}/10`); }

  protected onCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    this.updateSamTag();
    for (const id of next.eaten) if (!prev.eaten.includes(id) && ['torte', 'tacos'].includes(id)) this.props[id]?.setAlpha(0.4);
    if (learned('server_checked')) { this.stick('board'); this.stick('torte'); }
    if (learned('torte_looked')) this.stick('torte');
    if (next.bathroomMinutes > prev.bathroomMinutes && !next.outcome) this.time.delayedCall(1600, () => this.say('npc', "Take your time! I'll guard the bread.", 2800));
  }

  // ---------- cards ----------

  private foodCard(id: string) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const pv = this.previewText(id);
    const eaten = s.eaten.includes(id);
    this.openCard(id === 'tacos' ? 1170 : 430, f.name, f.blurb, pv.lines, s.known.includes('server_checked') ? CLUES.server_checked.line : null, [{
      label: eaten ? 'Already ate it' : s.money < f.price ? `Can't afford\n$${f.price}` : `${risky ? 'RISK IT' : 'Order it'}\n$${f.price}`,
      fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id), onClick: () => this.doEat(id),
    }], pv.stats);
  }

  private doEat(id: string) {
    this.closeCard();
    const prev = this.s;
    this.choiceFrom = prev;
    const next = eat(prev, id);
    this.setFace('happy');
    this.say('npc', SAM.eat[id] ?? 'Mm!', 2200);
    this.commit(next, 1800);
    if (!next.outcome && next.bathroomMinutes === prev.bathroomMinutes) this.time.delayedCall(1500, () => this.setFace('neutral'));
  }

  private samCard() {
    const s = this.s;
    const btns: Btn[] = [];
    if (!s.known.includes('told_sam')) btns.push({
      label: `Tell Sam about\nyour allergy\n${this.actionStats(tellSam(s))}`, fill: 0x3f9a5b,
      onClick: () => { this.closeCard(); this.commit(tellSam(this.s)); this.say('npc', CLUES.told_sam.line, 3600); this.setFace('happy'); },
    });
    if (!s.known.includes('moved_venue')) btns.push({
      label: `Suggest the\ntaco truck\n${this.actionStats(moveVenue(s))}`, fill: 0x4f9bd1, onClick: () => this.move(),
    });
    this.openCard(660, 'Sam', `Picked the restaurant. Loves food. Has their own opinions. Relationship: ${s.rel.sam}/10.`, [], null, btns);
  }

  private move() {
    this.closeCard();
    const told = this.s.known.includes('told_sam');
    this.commit(moveVenue(this.s));
    this.say('npc', told ? CLUES.moved_venue.line : SAM.movedUntold, 3000);
  }

  private serverCard() {
    const s = this.s;
    const card = s.known.includes('allergy_card');
    const checked = s.known.includes('server_checked');
    const label = card ? 'Hand over your\nallergy card' : s.known.includes('server_guess') ? 'Ask them to\nreally check' : 'Ask about\npeanuts';
    const next = askServer(s);
    this.openCard(960, 'Server', card ? 'Busy, friendly, and about to be handed a card.' : 'Busy, friendly, and very confident.',
      checked ? [{ topic: 'Kitchen', mark: '✓', text: 'Checked: mains are peanut-free. The torte has a peanut praline.' }] : [], null,
      checked ? [] : [{
        label: `${label}\n${this.actionStats(next)}`, fill: 0x4f9bd1,
        onClick: () => {
          this.closeCard();
          const before = this.s;
          const n = askServer(before);
          if (card) this.say('npc2', SERVER.cardTaken, 2000);
          this.beat(card ? 1800 : 400, () => {
            this.commit(n);
            const learned = n.known.find((k) => !before.known.includes(k))!;
            this.say('npc2', CLUES[learned].line, 4200);
            if (n.rel.sam < before.rel.sam) this.time.delayedCall(4300, () => this.say('npc', '...', 1500));
          });
        },
      }]);
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
      label: `Pass\n${this.actionStats(passTorte(s))}`, fill: 0x7a8791,
      onClick: () => this.zoomOut(() => { this.commit(passTorte(this.s)); this.say('npc', CLUES.passed_torte.line, 3000); }),
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

  private exitCard() {
    const s = this.s;
    const ate = s.eaten.length > 0;
    this.openCard(1160, 'Walk Sam home?', 'Then home. Past Biscuit Barn.', [
      { topic: 'Hunger', mark: s.hunger >= 7 ? '!' : '✓', text: `${s.hunger}/10${ate ? '' : ' (you have not eaten here)'}` },
      { topic: 'Sam', mark: s.rel.sam <= 3 ? '!' : '✓', text: `${s.rel.sam}/10` },
    ], null, [{
      label: 'Say goodnight', fill: 0x3f9a5b,
      onClick: () => {
        this.closeCard();
        this.say('npc', this.s.rel.sam >= 7 ? SAM.bye.good : this.s.rel.sam <= 3 ? SAM.bye.bad : SAM.bye.meh, 2400);
        this.choiceFrom = this.entry;
        this.choiceLabel = 'THIS DATE';
        this.commit(leaveDate(this.s), 2000);
      },
    }]);
  }

  protected endButtons(): Btn[] {
    const s = this.s;
    return [
      { label: 'REPLAY THE DATE', fill: 0x7a8791, onClick: () => this.scene.restart({ run: this.entry }) },
      { label: 'CONTINUE:\nTHE BISCUIT', fill: 0x3f9a5b, onClick: () => this.scene.start('biscuit', { run: toBiscuit(s) }) },
    ];
  }
}
