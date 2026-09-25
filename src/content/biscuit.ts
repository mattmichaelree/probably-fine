// The Biscuit: the payoff. The most tempting food of the day, framed like a hero,
// with its one real question in plain sight if you look.
import type { Clue, Food } from './grocery.ts';

export const BISCUIT_ARRIVE = 21 * 60 + 30; // 9:30 PM

export const BISCUIT_FOODS: Record<string, Food> = {
  biscuit: {
    id: 'biscuit', name: 'THE Biscuit', price: 6, hunger: -3, satisfaction: 5, minutes: 5,
    doses: { dairy: 4 }, peanut: false, crossContact: 0.4, contactSource: 'the pastry board it shares with the peanut butter cookies',
    endsScene: true, art: 'biscuit_reveal',
    blurb: 'Golden. Flaky. Backlit by what can only be divine intervention.',
    facts: [
      { topic: 'Peanut', clues: ['jo_board', 'board_looked'], unknown: 'Jo says it\'s "love and lard."', mark: '!', text: 'Rolled on the same board as the peanut butter cookies' },
      { topic: 'Dairy', mark: '!', text: 'Buttermilk dough, honey butter on top' },
    ],
  },
  plain_biscuit: {
    id: 'plain_biscuit', name: 'Early Plain Biscuit', price: 3, hunger: -2, satisfaction: 2, minutes: 5,
    doses: { dairy: 2 }, peanut: false, crossContact: 0, endsScene: true, art: 'plain_biscuits',
    blurb: 'From the first batch of the day. Less glowing. Still a biscuit.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Sticker: "baked 5 AM, before the cookies." Clean board.' },
      { topic: 'Dairy', mark: '!', text: 'A little buttermilk, no honey butter' },
    ],
  },
};

export const BISCUIT_CLUES: Record<string, Clue> = {
  jo_love: { id: 'jo_love', minutes: 2, speaker: 'npc', probablyFine: true,
    line: "Nothing in my biscuits but love and lard, hon. You'll be fine.",
    recap: 'Grandma Jo said the biscuit is "love and lard. You\'ll be fine."' },
  jo_board: { id: 'jo_board', minutes: 2, speaker: 'npc',
    line: "...Well. Same board as my peanut butter cookies. I brush it off real good, though!",
    recap: 'Jo admitted the biscuits share a pastry board with the peanut butter cookies.' },
  board_looked: { id: 'board_looked', minutes: 1, speaker: 'look',
    line: 'Flour, butter, and a few pale crumbs that are definitely peanut.',
    recap: 'You looked at the pastry board through the window: peanut crumbs.' },
};

export const JO = {
  greet: "Evening, hon! Last batch of the night. Look at that one. It's practically singing.",
  card: "Oh! A card. Well then let me be straight with you.",
  rough: 'Rough day, hon? You look like you had a day.',
  eat: { biscuit: "Told you it was singing.", plain_biscuit: 'The early birds are underrated.' } as Record<string, string>,
  bye: 'Come back next Saturday. It will be here.',
};

export const BISCUIT_ENDINGS = {
  got_away: { title: 'RISKED IT FOR THE BISCUIT', sub: '"It was worth it." (This time. You were lucky, not safe.)' },
  reaction: { title: 'IT HAPPENED (AT 10 PM)', sub: 'The biscuit was incredible for about four minutes.' },
  stomach: { title: 'THE BUTTERMILK REMEMBERS', sub: 'Worth it? Your stomach has filed a dissenting opinion.' },
  safe_smug: { title: 'THE SAFE BISCUIT', sub: 'Baked before the cookies. Honestly? Still great.' },
  safe_bored: { title: 'THE SAFE BISCUIT', sub: 'Baked before the cookies. Honestly? Still great.' },
  hungry: { title: 'WENT HOME BISCUIT-LESS', sub: 'The biscuit will be there next Saturday. So will you.' },
} as const;
