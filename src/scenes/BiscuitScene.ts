import { CLUES, FOODS, JO } from '../content/index.ts';
import { askJo, canEat, eat, isRisky, leaveBiscuit, lookBoard, newRun, toBbq, toBiscuit, toDate, type State } from '../systems/rules.ts';
import { BaseScene, reduceMotion, type Btn } from './BaseScene.ts';

const HERO = { x: 470, y: 590 }; // the biscuit itself, under the cover
const BOARD = { x: 1080, y: 400, crumbX: 1112, crumbY: 398 };

// The payoff: the most tempting food of the day, framed like a hero, with its one
// real question sitting on a pastry board in plain sight.
export class BiscuitScene extends BaseScene {
  private entry!: State;
  private hero!: ReturnType<BiscuitScene['coverBiscuit']>;
  protected stickies = { board: { x: 1080, y: 330, text: 'PEANUT CRUMBS', angle: -5 } };

  constructor() { super('biscuit'); }

  init(data: { run?: State }) {
    this.entry = data.run ?? toBiscuit(toDate(toBbq(newRun(Math.floor(Math.random() * 1e6)))));
    this.reset(this.entry);
  }

  create() {
    this.setupStage('biscuit_bg');
    this.npc = this.prop('jo', 'jo', 790, 470, 'Grandma Jo', () => this.joCard(), 18).setDepth(-3);
    this.npcTag = this.lastTag;
    this.prop('board', 'pastry_board', BOARD.x, 432, 'Pastry board', () => this.boardCloseUp(), 18).setDepth(-2);
    this.prop('plain_biscuit', 'plain_biscuits', 960, 470, 'Early biscuits $3', () => this.foodCard('plain_biscuit'), 18);

    // Heroic framing: a warm glow and a few sparkles. The label stays mundane.
    const glow = this.W(this.add.ellipse(HERO.x, 540, 360, 300, 0xffe36b, 0.28).setDepth(-1));
    if (!reduceMotion) {
      this.tweens.add({ targets: glow, scale: 1.08, alpha: 0.4, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
      for (let i = 0; i < 6; i++) {
        const sp = this.W(this.add.star(HERO.x - 140 + i * 56, 440 + (i % 2) * 60, 4, 4, 11, 0xfff4b0).setDepth(2).setAlpha(0));
        this.tweens.add({ targets: sp, alpha: 1, angle: 90, yoyo: true, repeat: -1, duration: 700, delay: i * 230 });
      }
    }
    this.prop('biscuit', 'biscuit_platter', HERO.x, 640, 'THE Biscuit  $6', () => this.hero.lift(() => this.biscuitCloseUp()), 18);
    this.hero = this.coverBiscuit(this.props.biscuit);
    this.hotspot(1160, 655, 220, 90, 'Go home →', () => this.exitCard(), 655);

    this.addPlayer(() => (this.s.reactions ? "Today has been a lot.\nBut that biscuit..." : 'That biscuit is\nlooking at me.'));
    this.finishSetup();
    this.time.delayedCall(500, () => this.say('npc', JO.greet, 3600));
    if (this.s.reactions) this.time.delayedCall(4300, () => this.say('npc', JO.rough, 2800));
  }

  protected badgeAt(id: string): [number, number] {
    const b = this.props[id].getBounds();
    return id === 'plain_biscuit' ? [b.left + 12, b.top + 10] : super.badgeAt(id); // keep it off the pastry board
  }

  protected onCommit(prev: State, next: State) {
    const learned = (id: string) => next.known.includes(id) && !prev.known.includes(id);
    if (learned('board_looked') || learned('jo_board')) this.stick('board');
    if (next.eaten.includes('biscuit') && !prev.eaten.includes('biscuit')) this.hero.biscuit.setVisible(false); // eaten
  }

  // ---------- the biscuit close-up ----------

  private biscuitCloseUp() { this.zoomIn(HERO.x, HERO.y, () => this.biscuitPanel(), 2.4); }

  private biscuitPanel() {
    const s = this.s;
    const risky = isRisky(s, 'biscuit');
    const btns: Btn[] = [
      { label: `${risky ? 'RISK IT FOR\nTHE BISCUIT' : 'Eat the biscuit'}\n$${FOODS.biscuit.price}`, fill: 0xe0662f, enabled: canEat(s, 'biscuit'), onClick: () => this.zoomOut(() => this.doEat('biscuit')) },
      { label: 'Walk away\n(for now)', fill: 0x7a8791, onClick: () => this.zoomOut(() => { this.setFace('neutral'); this.say('player', 'It is still looking at me.', 2000); }) },
    ];
    this.closeUpPanel('THE BISCUIT', 'Golden. Flaky. Backlit by what can only be divine intervention. The label is less heroic:', 'biscuit', btns);
  }

  // ---------- the pastry board close-up ----------

  private boardCloseUp() { this.zoomIn(BOARD.x, BOARD.y, () => this.boardPanel(), 3); }

  private boardPanel() {
    const looked = this.s.known.includes('board_looked');
    const btns: Btn[] = [];
    if (!looked) btns.push({ label: 'Look closely\n+1 min', fill: 0x4f9bd1, onClick: () => this.lookClosely() });
    btns.push({ label: 'Step back', fill: 0x7a8791, onClick: () => this.zoomOut(() => this.setFace('neutral')) });
    this.closeUpPanel('THE PASTRY BOARD', 'Through the window. Well lit, unfortunately. The Biscuit gets rolled out here:', 'biscuit', btns);
  }

  private lookClosely() {
    this.closeUp?.destroy();
    this.closeUp = undefined;
    const cam = this.cameras.main;
    const seenBefore = ['tongs_watched', 'clerk_bakery', 'brush_watched'].some((k) => this.s.known.includes(k));
    cam.zoomTo(7, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    cam.pan(BOARD.crumbX, BOARD.crumbY, reduceMotion ? 0 : 450, 'Cubic.easeInOut');
    this.time.delayedCall(reduceMotion ? 0 : 700, () => {
      this.setFace('sick');
      this.say('player', seenBefore ? 'A shared board.\nI have seen this movie.\nTwice today.' : 'Those are\npeanut crumbs.', 2200);
    });
    this.beat(2600, () => {
      this.commit(lookBoard(this.s));
      cam.zoomTo(3, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      cam.pan(BOARD.x, BOARD.y, reduceMotion ? 0 : 400, 'Cubic.easeInOut');
      this.setFace('suspicious');
      this.time.delayedCall(reduceMotion ? 0 : 420, () => this.boardPanel());
    });
  }

  // ---------- cards ----------

  private foodCard(id: string) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const pv = this.previewText(id);
    this.openCard(this.props[id].x, f.name, f.blurb, pv.lines, null, [{
      label: s.money < f.price ? `Can't afford\n$${f.price}` : `${risky ? 'RISK IT' : 'Buy & eat'}\n$${f.price}`,
      fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id), onClick: () => this.doEat(id),
    }], pv.stats);
  }

  private doEat(id: string) {
    this.closeCard();
    this.choiceFrom = this.s;
    const next = eat(this.s, id);
    this.setFace('happy');
    this.say('npc', JO.eat[id], 2000);
    this.commit(next, 1900);
  }

  private joCard() {
    const s = this.s;
    const card = s.known.includes('allergy_card');
    const label = card ? 'Show Jo your\nallergy card' : s.known.includes('jo_love') ? 'Ask about\nthe board' : "Ask what's\nin it";
    const next = askJo(s);
    this.openCard(790, 'Grandma Jo', 'Bakes everything. Remembers everyone. Measures nothing.', [], null,
      s.known.includes('jo_board') ? [] : [{
        label: `${label}\n${this.actionStats(next)}`, fill: 0x4f9bd1,
        onClick: () => {
          this.closeCard();
          const before = this.s;
          const n = askJo(before);
          if (card) this.say('npc', JO.card, 1800);
          this.beat(card ? 1700 : 300, () => {
            this.commit(n);
            this.say('npc', CLUES[n.known.find((k) => !before.known.includes(k))!].line, 3800);
          });
        },
      }]);
  }

  private exitCard() {
    this.openCard(1160, 'Go home biscuit-less?', 'The biscuit will be there next Saturday.', [
      { topic: 'Hunger', mark: this.s.hunger >= 7 ? '!' : '✓', text: `${this.s.hunger}/10` },
    ], null, [{
      label: 'Go home', fill: 0x7a8791,
      onClick: () => { this.closeCard(); this.say('npc', JO.bye, 2000); this.choiceFrom = this.s; this.commit(leaveBiscuit(this.s), 1800); },
    }]);
  }

  protected endButtons(): Btn[] {
    return [
      { label: 'REPLAY THE BISCUIT', fill: 0x7a8791, onClick: () => this.scene.restart({ run: this.entry }) },
      { label: 'END OF DAY →', fill: 0x3f9a5b, onClick: () => this.scene.start('end', { run: this.s }) },
    ];
  }
}
