import { TEST } from '../content/index.ts';
import { extendedPanel, startDay, toGrocery, type State } from '../systems/rules.ts';
import { BaseScene, type Btn } from './BaseScene.ts';

// 9:30 AM, storyboard panel 1: the allergy test. One choice, then off to the grocery store.
export class TestScene extends BaseScene {
  protected stickies = {};

  constructor() { super('test'); }

  init(data: { run?: State; seed?: number }) {
    this.reset(data.run ?? startDay(data.seed ?? Math.floor(Math.random() * 1e6)));
  }

  create() {
    this.setupStage('office_bg');
    this.npc = this.prop('doctor', 'doctor', 820, 440, 'Dr. Okafor', () => this.say('npc', TEST.doctor.pen, 4000), 18).setDepth(-3);
    this.npcTag = this.lastTag;
    this.prop('results', 'results', 560, 440, 'Your results', () => this.resultsCard(), 18);
    this.hotspot(1160, 655, 220, 90, 'Head to the store →', () => this.leave(), 655);
    this.addPlayer(() => 'Peanuts. Knew that one.\nThe rest is news.');
    this.finishSetup();
    this.time.delayedCall(500, () => this.say('npc', TEST.doctor.greet, 3800));
    this.time.delayedCall(4600, () => this.resultsCard());
  }

  private resultsCard() {
    const s = this.s;
    const paid = s.known.includes('extended_panel');
    const lines = paid
      ? [TEST.results[0], TEST.results[1], { mark: '!' as const, text: 'Dairy: POSITIVE. Intolerant.' }, { mark: '?' as const, text: 'Onion: borderline. Suspected.' }]
      : TEST.results;
    const btns: Btn[] = paid ? [] : [
      { label: `Extended panel\n−$${TEST.price}`, fill: 0x4f9bd1, onClick: () => { this.closeCard(); this.commit(extendedPanel(this.s)); this.say('npc', TEST.doctor.paid, 3600); } },
      { label: 'Skip it\n(find out the hard way)', fill: 0x7a8791, onClick: () => { this.closeCard(); this.say('npc', TEST.doctor.skipped, 3000); } },
    ];
    this.openCard(560, 'Initial Results', paid ? 'Now with the extended panel.' : TEST.doctor.offer, lines, null, btns);
  }

  private leave() { this.scene.start('grocery', { run: toGrocery(this.s) }); }

  protected endButtons(): Btn[] { return []; }
}
