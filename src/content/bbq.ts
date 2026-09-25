// Uncle Rick's BBQ. Rick is a clue source with unreliable confidence, never the ground truth.
import type { Clue, Food } from './grocery.ts';

export const BBQ_ARRIVE = 14 * 60; // 2:00 PM

export const BBQ_FOODS: Record<string, Food> = {
  ribs: {
    id: 'ribs', name: "Rick's Championship Ribs", price: 0, hunger: -4, satisfaction: 3, social: { rick: 2 }, minutes: 10,
    doses: { onion: 1 }, peanut: true, crossContact: 0, endsScene: false, art: 'grill',
    blurb: 'Glossy, sticky, and the centerpiece of a championship Rick made up.',
    facts: [
      { topic: 'Peanut', clues: ['rick_sauce_3', 'sauce_label'], unknown: 'Rick says the sauce is "ketchup and love."', mark: '!', text: 'The sauce has peanut butter in it. (Rick: "not a nut.")' },
      { topic: 'Onion', clues: ['rick_rub'], unknown: 'Rub: "my secret."', mark: '!', text: 'A little onion powder in the rub ("basically air")' },
      { topic: 'Dairy', mark: '✓', text: 'No dairy' },
    ],
  },
  brisket: {
    id: 'brisket', name: 'Twelve-Hour Brisket', price: 0, hunger: -4, satisfaction: 2, social: { rick: 2 }, minutes: 10,
    doses: { onion: 3 }, peanut: false, crossContact: 0.8, contactSource: 'the same basting brush as the ribs',
    endsScene: false, art: 'grill',
    blurb: 'Dry rub, no sauce. Supposedly.',
    facts: [
      { topic: 'Peanut', clues: ['brush_watched'], unknown: 'Dry rub. Looks unsauced.', mark: '!', text: "Basted with the ribs' sauce brush. Whatever's in the sauce is on this too." },
      { topic: 'Onion', clues: ['rick_rub'], unknown: 'Rub: "my secret."', mark: '!', text: 'A lot of onion powder in the rub ("basically air")' },
      { topic: 'Dairy', mark: '✓', text: 'No dairy' },
    ],
  },
  burger: {
    id: 'burger', name: 'Plain Burger on Foil', price: 0, hunger: -4, satisfaction: 1, social: { rick: 1 }, minutes: 5,
    doses: {}, peanut: false, crossContact: 0, endsScene: false, art: 'burger', requires: 'burger_ordered',
    blurb: 'Fresh foil, clean spatula. Rick narrated the entire process.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Clean spatula, fresh foil, no sauce' },
      { topic: 'Onion', mark: '✓', text: 'Salt only. Rick is in visible pain about it.' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese. Rick offered four times.' },
    ],
  },
  salad: {
    id: 'salad', name: "Aunt Deb's Potato Salad", price: 0, hunger: -2, satisfaction: 1, minutes: 5,
    doses: { dairy: 3, onion: 2 }, peanut: false, crossContact: 0, endsScene: false, art: 'potato_salad',
    blurb: 'Deb dropped it off and left. She does not do crowds.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'No nuts. Deb is strict about nuts.' },
      { topic: 'Dairy', mark: '?', text: 'Creamy. Sour cream? Mayo? Both?' },
      { topic: 'Onion', mark: '!', text: 'Chives and onion, visibly' },
    ],
  },
  casserole: {
    id: 'casserole', name: 'Mystery Casserole', price: 0, hunger: -3, satisfaction: 2, social: { rick: 1 }, minutes: 5,
    doses: { dairy: 4, onion: 4 }, peanut: false, crossContact: 0, endsScene: false, art: 'casserole',
    blurb: "Rick's mom's recipe. The dish has a label.",
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Recipe card taped to the lid: no nuts' },
      { topic: 'Dairy', mark: '!', text: 'A cheese crust you could stand on' },
      { topic: 'Onion', mark: '!', text: 'The label says GUARANTEED ONIONS' },
    ],
  },
  corn: {
    id: 'corn', name: 'Corn on the Cob', price: 0, hunger: -2, satisfaction: 0, minutes: 5,
    doses: {}, peanut: false, crossContact: 0, endsScene: false, art: 'corn',
    blurb: 'Corn. It is corn.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Just corn' },
      { topic: 'Dairy', mark: '✓', text: "Butter's on the side" },
    ],
  },
};

export const RICK_SAUCE = ['rick_sauce_1', 'rick_sauce_2', 'rick_sauce_3'];

export const BBQ_CLUES: Record<string, Clue> = {
  rick_sauce_1: { id: 'rick_sauce_1', minutes: 2, speaker: 'npc', line: 'The sauce? Ketchup and love. Mostly love.',
    recap: 'Rick said the sauce is "ketchup and love."' },
  rick_sauce_2: { id: 'rick_sauce_2', minutes: 2, speaker: 'npc', line: 'Okay: ketchup, brown sugar, love, and my secret. Which is a secret.',
    recap: 'Rick added brown sugar and "a secret" to the recipe.' },
  rick_sauce_3: { id: 'rick_sauce_3', minutes: 2, speaker: 'npc',
    line: "FINE. A big spoon of peanut butter. But peanut butter isn't a nut. It's a butter. It's in the name.",
    recap: 'Third version of the recipe: the secret is peanut butter, which Rick does not consider a nut.' },
  sauce_label: { id: 'sauce_label', minutes: 2, speaker: 'label',
    line: "Masking tape on the back: RICK'S SAUCE #3 — ketchup, br. sugar, PB (chunky!!), love",
    recap: 'The masking tape on the "ketchup" bottle says PB (chunky!!).' },
  brush_watched: { id: 'brush_watched', minutes: 1, speaker: 'look', line: 'Sauce pot, ribs, brisket. Same brush. Every time.',
    recap: 'You watched Rick baste the "dry rub" brisket with the sauce brush.' },
  rick_rub: { id: 'rick_rub', minutes: 2, speaker: 'npc', line: 'Salt, pepper, and a little onion powder. Basically air.',
    recap: 'Rick: the rub is salt, pepper, and onion powder, which he calls "basically air."' },
  told_rick: { id: 'told_rick', minutes: 3, speaker: 'flag', probablyFine: true,
    line: "Peanuts? Why didn't you SAY so! There's no nuts in anything. You'll be fine!",
    recap: 'You told Rick about the peanut allergy. He took it seriously and was still wrong about the sauce.' },
  burger_ordered: { id: 'burger_ordered', minutes: 10, speaker: 'flag',
    line: 'One plain burger, on FOIL, with a CLEAN spatula. Watch me. I am a professional.',
    recap: 'Rick made you a plain burger on foil with a clean spatula and narrated every second.' },
  cat_try: { id: 'cat_try', minutes: 2, speaker: 'flag', line: 'Mr. Whiskers does not negotiate.',
    recap: 'You asked the cat to move. The cat declined.' },
  cat_moved: { id: 'cat_moved', minutes: 5, speaker: 'flag', line: 'The cat considers you. The cat leaves.',
    recap: 'You negotiated the cat out of the only shady chair away from the cedar tree.' },
  declined_ribs: { id: 'declined_ribs', minutes: 1, speaker: 'flag', line: 'More for me. (He is hurt. Slightly. Visibly.)',
    recap: 'You politely declined the ribs.' },
};

export const RICK = {
  greet: 'There they are! Grab a plate! The ribs are CHAMPIONSHIP. Well, a championship I made up.',
  push: "You gotta try the ribs. I'm not asking. I'm a little bit asking.",
  toldAfterSauce: 'Peanuts... and the sauce has... oh. OH. Okay. Nobody touch the ribs.',
  interrogated: 'Why is everybody interrogating my sauce?',
  brush: 'Same brush for everything! Keeps the flavor consistent.',
  cedar: "Best seat in the house! That tree's been here since my dad.",
  cat: "He likes you! He's never moved for anyone.",
  catNo: 'Mr. Whiskers does not negotiate.',
  complaint: "Bathroom's inside, second door. First door's a closet. Don't open the closet.",
  eat: {
    ribs: "THAT'S what I'm talking about!", brisket: 'Twelve hours! Twelve!', burger: 'Foil burger! A classic! I just invented it!',
    casserole: 'My mom would be so proud. Guaranteed onions!', salad: "Deb's salad. Don't tell her I said it's good.", corn: 'Corn. Sure. Corn.',
  } as Record<string, string>,
  bye: { happy: 'Take a plate for the road!', hurt: "Oh. Heading out already? Okay. Okay. I'll wrap you a plate." },
};

export const SEATS = {
  cedar: { fun: 2, condition: 2, minutes: 1, line: 'Sat under the cedar tree. The shade was great. The pollen was also there.' },
  cat: { fun: 1, condition: 0, minutes: 1, line: 'Sat in the cat chair: shade, no cedar, faint smell of cat.' },
} as const;
export type Seat = keyof typeof SEATS;

export const BBQ_ENDINGS = {
  reaction: { title: 'IT HAPPENED', sub: 'Rick drove you to urgent care himself. He has never driven that carefully in his life.' },
  stomach: { title: 'FAMILY BATHROOM', sub: "Rick's bathroom has a magazine rack from 1998. You now know a lot about 1998." },
  rick_hurt: { title: 'SAFE, BUT RICK IS HURT', sub: "You're fine. Rick is wrapping you a plate you won't eat, very slowly." },
  hungry: { title: 'AWKWARD BUT HEALTHY EXIT', sub: 'You left on an empty stomach. Rick waves the whole way down the block.' },
  social_win: { title: 'SAFE SOCIAL WIN', sub: "You ate, you're fine, and Rick is already planning the next one." },
} as const;
