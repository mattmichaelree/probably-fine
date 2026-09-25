import type * as Phaser from 'phaser';
import { CLUES, FOODS, SAM, SERVERS } from '../content/index.ts';
import {
  askServer, canAskSamToCover, canEat, eat, explainSam, isRisky, leaveDate, samCovers, samKnows, tellSam, toBiscuit, venueChecked, type State,
} from '../systems/rules.ts';
import { BaseScene, type Btn, type Line } from './BaseScene.ts';

const pips = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n);

// Dinner with Sam, at either venue. Sam reacts to planning, honesty and delays, never to the
// allergy itself. Each venue supplies its layout and its own traps; this supplies the people.
export abstract class EveningScene extends BaseScene {
  protected entry!: State;
  protected serverTag?: Phaser.GameObjects.Container;
  protected abstract venue: { name: string; eat: Record<string, string>; greet: string; greetThought: string };
  protected samExtra(_s: State): Btn[] { return []; } // venue-specific ideas (the taco truck)
  protected venueCommit(_prev: State, _next: State) {}
  protected abstract foodX(id: string): number;

  protected get server() { return SERVERS[this.s.server ?? 'friendly']; }

  // Call at the end of create(), once Sam (npc) and the server (npc2) are placed.
  protected startEvening() {
    this.npcBase = 'sam';
    this.npc2?.setTexture(this.server.art);
    if (this.serverTag) this.setTagText(this.serverTag, `${this.server.name} (server)`);
    this.finishSetup();
    this.updateSamTag();
    // The day catches up on arrival: show what followed you here.
    const at = this.s.log.map((l) => l.startsWith('Went home')).lastIndexOf(true);
    const carried = this.s.log.slice(at + 1).join(' ');
    this.toast(`Goal: dinner, Sam's interest, no ambulance.${carried ? ` ${carried}` : ''}`);
    this.time.delayedCall(500, () => this.say('npc', this.venue.greet, 3400));
    this.time.delayedCall(3800, () => { this.setFace('suspicious'); this.say('player', this.venue.greetThought, 2600); });
    this.time.delayedCall(6800, () => { this.setFace('neutral'); this.say('npc2', this.server.lines.greet, 2600); });
  }

  protected updateSamTag() { this.setTagText(this.npcTag, `Sam · ${this.s.rel.sam}/10`); }

  protected onCommit(prev: State, next: State) {
    this.updateSamTag();
    if (next.outcome === 'reaction' || next.bathroomMinutes > prev.bathroomMinutes) this.mood('sam_worried', 3200);
    else if (next.eaten.length > prev.eaten.length && next.trust < prev.trust) this.mood('sam_worried', 2600);
    else if (next.rel.sam < prev.rel.sam || next.trust < prev.trust || next.patience < prev.patience) this.mood('sam_annoyed', 2400);
    else if (next.rel.sam > prev.rel.sam || next.trust > prev.trust) this.mood('sam_happy', 2400);
    if (next.bathroomMinutes > prev.bathroomMinutes && !next.outcome) this.time.delayedCall(1600, () => this.say('npc', "Take your time! I'll guard the table.", 2800));
    if (next.patience <= 4 && prev.patience > 4 && !next.outcome) this.time.delayedCall(1200, () => this.say('npc', 'So... is everything okay?', 2400));
    this.venueCommit(prev, next);
  }

  // ---------- food ----------

  protected foodCard(id: string, extra: Btn[] = []) {
    const f = FOODS[id];
    const s = this.s;
    this.setFace('suspicious');
    const risky = isRisky(s, id);
    const pv = this.previewText(id);
    const eaten = s.eaten.includes(id);
    const covered = s.known.includes('sam_covered');
    this.openCard(this.foodX(id), f.name, f.blurb, pv.lines, null, [{
      label: eaten ? 'Already ate it' : !covered && s.money < f.price ? `Can't afford\n$${f.price}` : `${risky ? 'RISK IT' : 'Order it'}\n${covered ? 'Sam pays' : `$${f.price}`}`,
      fill: risky ? 0xe0662f : 0x3f9a5b, enabled: canEat(s, id), onClick: () => this.doEat(id),
    }, ...extra], pv.stats);
  }

  protected doEat(id: string) {
    this.closeCard();
    const prev = this.s;
    this.choiceFrom = prev;
    const next = eat(prev, id);
    this.setFace('happy');
    this.say('npc', this.venue.eat[id] ?? 'Mm!', 2200);
    this.commit(next, 1800);
    if (!next.outcome && next.bathroomMinutes === prev.bathroomMinutes) this.time.delayedCall(1500, () => this.setFace('neutral'));
  }

  // ---------- Sam ----------

  protected samCard() {
    const s = this.s;
    const btns: Btn[] = [];
    if (!s.known.includes('told_sam')) btns.push({
      label: `Tell Sam about\nyour allergy\n${this.actionStats(tellSam(s))}`, fill: 0x3f9a5b,
      onClick: () => { this.closeCard(); this.commit(tellSam(this.s)); this.say('npc', CLUES.told_sam.line, 3600); this.setFace('happy'); },
    });
    else if (samKnows(s) < 2) btns.push({
      label: `Explain how\nserious it is\n${this.actionStats(explainSam(s))}`, fill: 0x3f9a5b,
      onClick: () => { this.closeCard(); this.commit(explainSam(this.s)); this.say('npc', CLUES.sam_understands.line, 3600); },
    });
    if (canAskSamToCover(s)) btns.push({
      label: `Admit you're\nout of money\n${this.actionStats(samCovers(s))}`, fill: 0xe0662f,
      onClick: () => { this.closeCard(); this.commit(samCovers(this.s)); this.say('npc', CLUES.sam_covered.line, 3600); this.setFace('sick'); },
    });
    btns.push(...this.samExtra(s));
    const knows = ['Knows nothing about your allergy yet.', 'Knows about the allergy.', 'Knows how serious it is, and is watching out for you.'][samKnows(s)];
    this.openCard(660, 'Sam', `Loves food. Has opinions. ${knows}`, [
      { topic: 'Interest', mark: s.rel.sam >= 6 ? '✓' : s.rel.sam <= 3 ? '!' : '?', text: `${s.rel.sam}/10` },
      { topic: 'Trust in your judgment', mark: s.trust >= 6 ? '✓' : s.trust <= 3 ? '!' : '?', text: `${s.trust}/10` },
      { topic: 'Patience tonight', mark: s.patience >= 6 ? '✓' : s.patience <= 3 ? '!' : '?', text: `${s.patience}/10${s.patience <= 3 ? ' (running out)' : ''}` },
    ], null, btns);
  }

  // ---------- server ----------

  protected serverExtra(_s: State): Btn[] { return []; }

  protected serverCard() {
    const s = this.s;
    const sv = this.server;
    const card = s.known.includes('allergy_card');
    const checked = venueChecked(s);
    const partial = s.known.includes('server_partial') || s.known.includes('pizza_partial');
    const guessed = s.known.includes('server_guess') || s.known.includes('pizza_guess');
    const label = card && !partial ? 'Hand over your\nallergy card' : partial ? 'Ask about\nEVERYTHING' : guessed ? 'Ask them to\nreally check' : 'Ask about\npeanuts';
    const lines: Line[] = [
      { topic: 'Patience', mark: sv.traits.patience >= 2 ? '✓' : '!', text: pips(sv.traits.patience) },
      { topic: 'Confidence', mark: '✓', text: pips(sv.traits.confidence) },
      { topic: 'Allergen know-how', mark: checked || partial ? (sv.traits.knowledge >= 2 ? '✓' : '!') : '?', text: checked || partial ? pips(sv.traits.knowledge) : 'Find out by asking.' },
    ];
    const btns: Btn[] = checked ? [] : [{
      label: `${label}\n${this.actionStats(askServer(s))}`, fill: 0x4f9bd1,
      onClick: () => {
        this.closeCard();
        const before = this.s;
        const n = askServer(before);
        if (card) this.say('npc2', sv.lines.card, 1800);
        this.beat(card ? 1700 : 400, () => {
          this.commit(n);
          const learned = n.known.find((k) => !before.known.includes(k) && CLUES[k]);
          if (learned) this.say('npc2', learned.endsWith('_guess') && sv.lines.guess ? sv.lines.guess : CLUES[learned].line, 4200);
          if (n.rel.sam < before.rel.sam || n.patience < before.patience) this.time.delayedCall(4300, () => this.say('npc', '...', 1500));
        });
      },
    }];
    this.openCard(960, `${sv.name} (server)`, sv.blurb, lines, null, [...btns, ...this.serverExtra(s)]);
  }

  // ---------- leaving ----------

  protected exitCard() {
    const s = this.s;
    const ate = s.eaten.length > 0;
    this.openCard(1160, 'Walk Sam home?', 'Then home. Past Biscuit Barn.', [
      { topic: 'Hunger', mark: s.hunger >= 7 ? '!' : '✓', text: `${s.hunger}/10${ate ? '' : ' (you have not eaten here)'}` },
      { topic: 'Sam', mark: s.rel.sam <= 3 ? '!' : '✓', text: `interest ${s.rel.sam}/10 · trust ${s.trust}/10 · patience ${s.patience}/10` },
    ], null, [{
      label: 'Say goodnight', fill: 0x3f9a5b,
      onClick: () => {
        this.closeCard();
        const n = leaveDate(this.s);
        const good = n.outcome === 'honest_win' || n.outcome === 'cheap_charming';
        this.say('npc', good ? SAM.bye.good : this.s.rel.sam <= 3 || this.s.patience <= 2 ? SAM.bye.bad : SAM.bye.meh, 2400);
        this.npc.setTexture(good ? 'sam_happy' : ['awkward', 'impatient', 'unprepared'].includes(n.outcome!) ? 'sam_annoyed' : 'sam');
        this.choiceFrom = this.entry;
        this.choiceLabel = 'THIS DATE';
        this.commit(n, 2000);
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
