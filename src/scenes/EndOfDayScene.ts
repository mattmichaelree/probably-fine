import { PEOPLE } from '../content/index.ts';
import { daySummary, newRun, toBbq, toBiscuit, toDate, type State } from '../systems/rules.ts';
import { BaseScene, BTN_H, clearSave, dur, INK, TITLE, reduceMotion, type Btn } from './BaseScene.ts';

// The storyboard's last panel: the whole Saturday on one card.
export class EndOfDayScene extends BaseScene {
  protected stickies = {};

  constructor() { super('end'); }

  init(data: { run?: State }) {
    this.reset(data.run ?? toBiscuit(toDate(toBbq(newRun(Math.floor(Math.random() * 1e6))))), false);
    clearSave(); // the day is over; Continue should not reopen it
  }

  create() {
    this.setupStage('night_bg');
    const d = daySummary(this.s);
    this.addPlayer(() => '"It was worth it."\n— Me, probably.');
    this.setFace(d.reactions ? 'sick' : d.score >= 70 ? 'happy' : 'neutral');

    const W = 780, H = 640, x0 = 1280 - W - 30;
    const card = this.U(this.add.container(x0, 40).setDepth(60));
    card.add(this.add.graphics().fillStyle(0xfff8e6).lineStyle(6, INK).fillRoundedRect(0, 0, W, H, 26).strokeRoundedRect(0, 0, W, H, 26));
    const title = d.reactions >= 2 ? 'YOU SURVIVED (BARELY)' : d.reactions === 1 ? 'YOU SURVIVED (MOSTLY)' : d.score >= 70 ? 'YOU SURVIVED (WITH STYLE)' : 'YOU SURVIVED';
    card.add(this.txt(W / 2, 22, title, 44, { fontFamily: TITLE, color: d.reactions ? '#d9412f' : '#3f9a5b' }).setOrigin(0.5, 0));
    card.add(this.txt(W / 2, 80, 'Saturday, in review', 18, { fontStyle: 'italic' }).setOrigin(0.5, 0));

    const people = d.people.map((p) => `${PEOPLE[p.who].short} ${p.rel}/10`).join(' · ') || 'Nobody. Peaceful.';
    const rows: [string, string][] = [
      ['Questionable foods eaten', `${d.gambles}`],
      ['Allergy reactions', `${d.reactions}`],
      ['Bathroom time', d.bathroom ? dur(d.bathroom).replace('+', '') : '0 min'],
      ['Money remaining', `$${d.money}`],
      ['Times someone said "probably fine"', `${d.probablyFine}`],
      ['Discovered today', d.discovered.join(', ') || 'Nothing new'],
      ['People', people],
    ];
    let y = 122;
    for (const [k, v] of rows) {
      card.add(this.txt(40, y, k, 20));
      const t = this.txt(440, y, v, 20, { fontStyle: 'bold', color: '#9a3b1e', wordWrap: { width: W - 470 } });
      card.add(t);
      y += Math.max(34, t.height + 10);
    }
    card.add(this.txt(40, y + 10, 'Overall score', 26, { fontFamily: TITLE }));
    const grade = this.txt(440, y - 4, d.grade, 64, { fontFamily: TITLE, color: d.grade.startsWith('A') || d.grade.startsWith('B') ? '#3f9a5b' : '#d9412f' });
    card.add(grade);
    if (!reduceMotion) { grade.setScale(3).setAlpha(0); this.tweens.add({ targets: grade, scale: 1, alpha: 1, duration: 400, delay: 500, ease: 'Back.easeOut' }); }

    const note = this.txt(W - 40, H - 150, 'Same decisions\ntomorrow?\n☑ Yes\n☑ Also yes', 18,
      { backgroundColor: '#fff27a', padding: { x: 12, y: 10 }, fontStyle: 'bold', color: '#2a1b12' }).setOrigin(1, 0).setAngle(4);
    card.add(note);
    const again: Btn = { label: 'PLAY AGAIN', fill: 0x3f9a5b, onClick: () => this.scene.start('title') };
    card.add(this.button(200, H - 24 - BTN_H / 2, 320, BTN_H, again));
    card.add(this.txt(W - 24, H - 12, `Saturday #${this.s.seed}`, 13, { color: '#8a7a6a' }).setOrigin(1, 1));
  }

  protected endButtons(): Btn[] { return []; }
}
