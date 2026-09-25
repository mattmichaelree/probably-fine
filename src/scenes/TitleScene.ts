import { startDay, type State } from '../systems/rules.ts';
import { muted, setMuted } from '../sfx.ts';
import { CLUES } from '../content/index.ts';
import { BaseScene, clearSave, loadNotebook, loadSave, reduceMotion, setReduceMotion, TITLE, type Btn } from './BaseScene.ts';

// The cover: title, a glowing biscuit, and the menu.
export class TitleScene extends BaseScene {
  protected stickies = {};
  private save: State | null = null;

  constructor() { super('title'); }

  init() {
    this.reset(startDay(1), false);
    this.save = loadSave();
  }

  create() {
    this.setupStage('biscuit_bg');
    this.W(this.add.rectangle(0, 0, 640, 720, 0x0e151e, 0.55).setOrigin(0).setDepth(-5));
    const glow = this.W(this.add.ellipse(1000, 600, 380, 300, 0xffe36b, 0.3).setDepth(-1));
    if (!reduceMotion) this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.45, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' });
    this.W(this.add.image(1000, 700, 'hero_biscuit').setOrigin(0.5, 1).setScale(0.75));
    this.addPlayer(() => 'Would I risk it\nfor the biscuit?\n...Probably.');

    const title = this.U(this.txt(420, 60, 'PROBABLY\nFINE', 104, { fontFamily: TITLE, color: '#ffd23f', stroke: '#2a1b12', strokeThickness: 14, align: 'center', lineSpacing: -18 }).setOrigin(0.5, 0));
    if (!reduceMotion) this.tweens.add({ targets: title, angle: 2, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
    this.U(this.txt(420, 286, 'SATURDAY', 30, { fontFamily: TITLE, color: '#fff', letterSpacing: 8 }).setOrigin(0.5, 0));
    this.U(this.txt(420, 326, 'Would you risk it for the biscuit?', 20, { color: '#ffe36b', fontStyle: 'italic' }).setOrigin(0.5, 0));

    const btns: Btn[] = [
      { label: 'NEW GAME', fill: 0x3f9a5b, onClick: () => { clearSave(); this.scene.start('test', { seed: Math.floor(Math.random() * 1e6) }); } },
      { label: 'CONTINUE', fill: 0x4f9bd1, enabled: !!this.save, onClick: () => this.save && this.scene.start(this.save.scene, { run: this.save }) },
      { label: 'HOW TO PLAY', fill: 0x8a6fc0, onClick: () => this.howTo() },
      { label: 'NOTEBOOK', fill: 0xc9892f, onClick: () => this.notebook() },
      { label: 'SETTINGS', fill: 0x7a8791, onClick: () => this.settings() },
    ];
    // Three full-width rows, then Notebook and Settings side by side: every button stays phone-tappable.
    btns.slice(0, 3).forEach((b, i) => this.U(this.button(430, 410 + i * 80, 300, 72, b)));
    btns.slice(3).forEach((b, i) => this.U(this.button(355 + i * 150, 650, 146, 72, b)));
    this.U(this.txt(1268, 712, 'Stand-in art · Phaser 4 · made with Claude Code', 13, { color: '#c7ccd1' }).setOrigin(1, 1));
  }

  private howTo() {
    this.openCard(1000, 'How to play', 'One Saturday. Six stops. A peanut allergy, and a couple of things you have not figured out yet.', [
      { mark: '✓', text: 'Tap people and things. Labels, tongs, fryers and nervous uncles all tell you something.' },
      { mark: '?', text: 'Badges show what you KNOW: ✓ safe, ! risky, ? unknown. Every choice previews what it could cost.' },
      { mark: '!', text: '"RISK IT" means exactly that. No pill makes a peanut safe.' },
      { mark: '✓', text: 'Telling people early helps. They take it better than you think.' },
      { mark: '!', text: 'Money, condition and goodwill carry forward. Past the white line on Condition, the day follows you to dinner.' },
    ], null, []);
  }

  // Discoveries survive between Saturdays; the Saturday itself starts fresh.
  private notebook() {
    const seen = loadNotebook();
    const clues = seen.filter((k) => CLUES[k]);
    const statuses = seen.filter((k) => k.startsWith('status_')).map((k) => `${k.slice(7)[0].toUpperCase()}${k.slice(8)} intolerance (confirmed)`);
    const recent = clues.slice(-6).reverse().map((k) => ({ mark: '✓' as const, text: CLUES[k].recap }));
    this.openCard(1000, 'Notebook', `${clues.length} of ${Object.keys(CLUES).length} discoveries so far.${statuses.length ? ` ${statuses.join('. ')}.` : ''} Each Saturday starts fresh; your notes don't.`,
      recent.length ? recent : [{ mark: '?', text: 'Nothing yet. Read a label. Watch a brush. Ask a server.' }], null, []);
  }

  private settings() {
    const btns: Btn[] = [
      { label: `Sound: ${muted ? 'OFF' : 'ON'}`, fill: 0x3f9a5b, onClick: () => { setMuted(!muted); this.settings(); } },
      { label: `Reduced motion: ${reduceMotion ? 'ON' : 'OFF'}`, fill: 0x4f9bd1, onClick: () => { setReduceMotion(!reduceMotion); this.settings(); } },
      { label: 'Erase saved game', fill: 0xe0662f, enabled: !!this.save, onClick: () => { clearSave(); this.scene.restart(); } },
    ];
    this.openCard(1000, 'Settings', 'Sound, motion and saves.', [
      { mark: '✓', text: 'The game saves at the start of every stop. Continue picks up there.' },
    ], null, btns);
  }

  protected endButtons(): Btn[] { return []; }
}
