import { ITEMS, LACTASE, PHARMACIST, type ItemId } from '../content/index.ts';
import { buyItem, canBuy, newRun, toPharmacy, toTruck, type State } from '../systems/rules.ts';
import { BaseScene, clock, INK, type Btn, type Line } from './BaseScene.ts';

// A short prep stop. Each item does one job and says what it doesn't do.
export class PharmacyScene extends BaseScene {
  protected stickies = {};

  constructor() { super('pharmacy'); }

  init(data: { run?: State }) {
    this.reset(data.run ?? toPharmacy(newRun(Math.floor(Math.random() * 1e6))));
  }

  create() {
    this.setupStage('pharmacy_bg');
    // Display table in front of the shelves.
    this.W(this.add.graphics().fillStyle(0xf7fbff).lineStyle(6, INK).fillRoundedRect(300, 520, 440, 40, 8).strokeRoundedRect(300, 520, 440, 40, 8)
      .lineBetween(330, 560, 330, 640).lineBetween(710, 560, 710, 640).setDepth(-1));
    this.prop('pills', 'pills_clear', 370, 526, 'Clear-Day $12', () => this.itemCard('pills'));
    this.prop('drowsy', 'pills_snooze', 490, 526, 'Snooz-Ease $4', () => this.itemCard('drowsy'));
    this.prop('antacid', 'antacid', 600, 526, 'Antacid $5', () => this.itemCard('antacid'));
    this.prop('lactase', 'lactase', 690, 526, 'Lactase $6', () => this.itemCard('lactase'), 50);
    this.prop('card', 'allergy_card', 810, 462, 'Allergy card (free)', () => this.itemCard('card'), 18);
    this.npc = this.prop('priya', 'pharmacist', 1160, 470, 'Priya (pharmacist)', () => this.say('npc', PHARMACIST.pen, 4200), 22).setDepth(-3);
    this.npcTag = this.lastTag;
    this.hotspot(1150, 650, 220, 90, 'Head out →', () => this.exitCard(), 650);
    this.addPlayer(() => `Budget: $${this.s.money}.\nThe date is tonight.\nMaybe don't spend it all here.`);
    this.finishSetup();
    this.time.delayedCall(500, () => this.say('npc', PHARMACIST.greet, 4200));
  }

  private itemCard(id: ItemId | 'lactase') {
    const s = this.s;
    const it = id === 'lactase'
      ? { name: 'Lact-Ease Tablets', price: LACTASE.price, helps: 'Absorbs a dairy dose, 3 uses.', not: 'Does nothing for peanuts, onions, or pollen.' }
      : ITEMS[id];
    const next = buyItem(s, id);
    const lines: Line[] = [{ topic: 'Helps', mark: '✓', text: it.helps }, { topic: 'Heads up', mark: '!', text: it.not }];
    const already = id === 'lactase' ? s.lactase > 0 : id === 'antacid' ? s.antacid > 0 : id === 'card' ? s.known.includes('allergy_card') : s.minute < s.pillsUntil;
    const label = already ? (id === 'pills' || id === 'drowsy' ? `Already taken\n(until ${clock(s.pillsUntil)})` : 'Already have it')
      : s.money < it.price ? `Can't afford\n$${it.price}` : id === 'card' ? 'Write it' : id === 'pills' || id === 'drowsy' ? `Buy & take now\n$${it.price}` : `Buy it\n$${it.price}`;
    const btn: Btn = {
      label, fill: 0x3f9a5b, enabled: canBuy(s, id),
      onClick: () => {
        this.closeCard();
        this.commit(buyItem(this.s, id));
        this.say('npc', PHARMACIST[id], 3200);
        this.setFace(id === 'drowsy' ? 'sick' : 'happy');
        this.time.delayedCall(1500, () => this.setFace('neutral'));
      },
    };
    this.openCard(this.props[id].x, it.name, id === 'card' ? 'Free. Takes 10 minutes to write neatly.' : `$${it.price}`, lines, null, [btn],
      next !== s ? this.actionChips(next) : undefined);
  }

  private exitCard() {
    const s = this.s;
    this.openCard(1150, 'Head out?', "Next up: a food truck for lunch, then Uncle Rick's BBQ at 2:00.", [
      { topic: 'Money left', mark: s.money >= 15 ? '✓' : '!', text: `$${s.money}${s.money < 15 ? ' (dinner tonight is not free)' : ''}` },
      { topic: 'Pills', mark: s.minute < s.pillsUntil ? '✓' : '?', text: s.minute < s.pillsUntil ? `active until ${clock(s.pillsUntil)}` : 'none: the cedar tree will get you' },
    ], null, [{
      label: 'Head out', fill: 0x3f9a5b,
      onClick: () => { this.say('npc', PHARMACIST.bye, 1500); this.time.delayedCall(700, () => this.scene.start('truck', { run: toTruck(this.s) })); },
    }]);
  }

  protected endButtons(): Btn[] { return []; }
}
