import { CLUES, COOK, FOODS } from '../content/index.ts';
import { askCook, canEat, eat, isRisky, lookFryer, newRun, toBbq, toPharmacy, toTruck, type State } from '../systems/rules.ts';
import { BaseScene, INK, type Btn } from './BaseScene.ts';

// Noon: one quick decision. The menu shouts "FRESH!"; the fryer quietly tells the truth.
export class TruckScene extends BaseScene {
  protected stickies = { fryer: { x: 940, y: 250, text: 'SAME OIL AS\nPEANUT SATAY', angle: 5 } };

  constructor() { super('truck'); }

  init(data: { run?: State }) {
    this.reset(data.run ?? toTruck(toPharmacy(newRun(Math.floor(Math.random() * 1e6)))));
  }

  create() {
    this.setupStage('truck_bg');
    this.npc = this.prop('cook', 'cook', 740, 372, 'Cook', () => this.cookCard(), 18).setDepth(-3);
    this.npcTag = this.lastTag;
    this.prop('fryer', 'fryer', 940, 370, 'Fryer', () => this.fryerCard(), 18).setDepth(-2);
    this.W(this.add.graphics().fillStyle(0xf7fbff).lineStyle(6, INK).fillRoundedRect(740, 560, 300, 30, 8).strokeRoundedRect(740, 560, 300, 30, 8).setDepth(-1));
    this.prop('fries', 'fries', 820, 566, 'Fries $5', () => this.foodCard('fries'), 18);
    this.prop('wrap', 'wrap', 960, 566, 'Wrap $8', () => this.foodCard('wrap'), 18);
    this.hotspot(1160, 655, 220, 90, 'Keep driving →', () => this.exitCard(), 655);
    this.addPlayer(() => `Hunger ${this.s.hunger}/10.\nRick's at 2:00.`);
    this.finishSetup();
    this.time.delayedCall(500, () => this.say('npc', COOK.greet, 3000));
  }

  protected onCommit(prev: State, next: State) {
    if (next.known.includes('fryer_looked') && !prev.known.includes('fryer_looked')) this.stick('fryer');
    for (const id of next.eaten) if (!prev.eaten.includes(id)) this.props[id]?.setAlpha(0.4);
  }

  private foodCard(id: string) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const pv = this.previewText(id);
    this.openCard(this.props[id].x, f.name, f.blurb, pv.lines, null, [{
      label: s.eaten.includes(id) ? 'Already ate it' : s.money < f.price ? `Can't afford\n$${f.price}` : `${risky ? 'RISK IT' : 'Order it'}\n$${f.price}`,
      fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id),
      onClick: () => { this.closeCard(); this.choiceFrom = this.s; this.say('npc', COOK.eat[id], 1800); this.commit(eat(this.s, id), 1800); this.setFace('happy'); },
    }], pv.stats);
  }

  private fryerCard() {
    const looked = this.s.known.includes('fryer_looked');
    this.openCard(940, 'The Fryer', 'Bubbling. Busy. There is a tiny sign taped to the side.', looked ? [{ mark: '!', text: CLUES.fryer_looked.line }] : [], null,
      looked ? [] : [{ label: 'Read the tiny sign\n+1 min', fill: 0x4f9bd1, onClick: () => { this.closeCard(); this.commit(lookFryer(this.s)); this.setFace('sick'); this.say('player', 'Same oil.\nAs the peanut satay.', 2400); } }]);
  }

  private cookCard() {
    const asked = this.s.known.includes('cook_fries');
    this.openCard(740, 'The Cook', 'Fast, friendly, and answering exactly what you asked.', [], null,
      asked ? [] : [{ label: "What's in the fries?\n+1 min", fill: 0x4f9bd1, onClick: () => { this.closeCard(); this.commit(askCook(this.s)); this.say('npc', CLUES.cook_fries.line, 3000); } }]);
  }

  private exitCard() {
    const ate = this.s.eaten.length > 0;
    this.openCard(1160, "Drive to Rick's?", ate ? 'Lunch handled.' : 'Skipping lunch means arriving at the BBQ hungrier.', [
      { topic: 'Hunger', mark: ate ? '✓' : '!', text: ate ? `${this.s.hunger}/10` : `${this.s.hunger} → ${Math.min(10, this.s.hunger + 2)} by 2:00` },
    ], null, [{ label: "Drive to Rick's", fill: 0x3f9a5b, onClick: () => this.scene.start('bbq', { run: toBbq(this.s) }) }]);
  }

  protected endButtons(): Btn[] {
    return [{ label: "CONTINUE:\nRICK'S (LATE)", fill: 0x3f9a5b, onClick: () => this.scene.start('bbq', { run: toBbq(this.s) }) }];
  }
}
