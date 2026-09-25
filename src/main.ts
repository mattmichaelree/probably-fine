import * as Phaser from 'phaser';
import { BbqScene } from './scenes/BbqScene.ts';
import { BiscuitScene } from './scenes/BiscuitScene.ts';
import { DateScene } from './scenes/DateScene.ts';
import { EndOfDayScene } from './scenes/EndOfDayScene.ts';
import { GroceryScene } from './scenes/GroceryScene.ts';
import { PharmacyScene } from './scenes/PharmacyScene.ts';
import { TestScene } from './scenes/TestScene.ts';
import { TitleScene } from './scenes/TitleScene.ts';
import { TruckScene } from './scenes/TruckScene.ts';

// ?test, ?grocery, ?pharmacy, ?truck, ?bbq, ?date, ?biscuit or ?end jumps straight there with a fresh run. Otherwise: the title.
const all = {
  title: TitleScene, test: TestScene, grocery: GroceryScene, pharmacy: PharmacyScene, truck: TruckScene,
  bbq: BbqScene, date: DateScene, biscuit: BiscuitScene, end: EndOfDayScene,
};
const jump = (Object.keys(all) as (keyof typeof all)[]).find((k) => location.search.includes(k));
const scenes = jump ? [all[jump], ...Object.values(all).filter((S) => S !== all[jump])] : Object.values(all);

const start = () => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#1d2a3a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: scenes,
  });
  // Dev-only handle for automated playthroughs (tests press buttons by label). Stripped from production builds.
  if (import.meta.env.DEV) (window as unknown as { pf: Phaser.Game }).pf = game;
};

// Canvas text needs web fonts loaded first; fall back to system fonts if offline.
Promise.all([document.fonts.load('32px "Luckiest Guy"'), document.fonts.load('700 20px Fredoka')])
  .catch(() => {})
  .finally(start);
