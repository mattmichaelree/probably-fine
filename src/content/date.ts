// The Date. Sam has their own opinions and responds to honesty, not to the allergy itself.
import type { Clue, Food } from './grocery.ts';

export const DATE_ARRIVE = 19 * 60; // 7:00 PM

const checked = ['server_checked'];

export const DATE_FOODS: Record<string, Food> = {
  pasta: {
    id: 'pasta', name: 'Truffle Pasta', price: 18, hunger: -4, satisfaction: 3, social: { sam: 1 }, minutes: 15,
    doses: { dairy: 4 }, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: "Sam's recommendation. \"It's to die for!\" (Not the phrasing you wanted.)",
    facts: [
      { topic: 'Peanut', clues: checked, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts, separate pans' },
      { topic: 'Dairy', mark: '!', text: 'Mushroom cream sauce' },
    ],
  },
  bruschetta: {
    id: 'bruschetta', name: 'House Bruschetta', price: 12, hunger: -2, satisfaction: 2, minutes: 10,
    doses: { onion: 4 }, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: 'House-made topping, ingredients unknown. Italic font, very confident.',
    facts: [
      { topic: 'Peanut', clues: checked, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts' },
      { topic: 'Onion', clues: checked, unknown: '"House-made topping."', mark: '!', text: 'Raw onion and garlic, generously' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese' },
    ],
  },
  salmon: {
    id: 'salmon', name: 'Grilled Salmon', price: 24, hunger: -4, satisfaction: 2, minutes: 15,
    doses: {}, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: 'With "seasonal vegetables." The priciest thing on the board.',
    facts: [
      { topic: 'Peanut', clues: checked, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts' },
      { topic: 'Onion', clues: checked, unknown: '"Seasonal vegetables."', mark: '✓', text: 'Plain roasted carrots and zucchini' },
      { topic: 'Dairy', clues: checked, unknown: 'Might be finished with butter.', mark: '✓', text: 'Olive oil, no butter' },
    ],
  },
  torte: {
    id: 'torte', name: 'Chocolate Torte for Two', price: 14, hunger: -1, satisfaction: 3, social: { sam: 2 }, minutes: 10,
    doses: {}, peanut: true, crossContact: 0, endsScene: false, art: 'torte',
    blurb: "Sam's eyes lit up. Arranged like it's in a museum.",
    facts: [
      { topic: 'Peanut', clues: ['server_checked', 'torte_looked'], unknown: '"With a crunchy surprise."', mark: '!', text: 'The crunchy surprise is chopped peanuts, arranged in a heart' },
      { topic: 'Dairy', mark: '✓', text: 'Dark chocolate, no cream' },
    ],
  },
  tacos: {
    id: 'tacos', name: 'Taco Truck Tacos', price: 8, hunger: -4, satisfaction: 2, minutes: 10,
    doses: { onion: 2 }, peanut: false, crossContact: 0, endsScene: false, art: 'taco_truck', requires: 'moved_venue',
    blurb: 'Across the street. The menu board lists allergens. A miracle.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Allergen board: no peanuts on the truck' },
      { topic: 'Onion', mark: '!', text: 'Salsa: onion and cilantro (a small amount)' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese unless you ask' },
    ],
  },
};

export const DATE_CLUES: Record<string, Clue> = {
  told_sam: { id: 'told_sam', minutes: 2, speaker: 'flag',
    line: "Oh! Thanks for telling me. Is this place okay? I can totally find somewhere else.",
    recap: 'You told Sam about the allergy before ordering. Sam was great about it.' },
  server_guess: { id: 'server_guess', minutes: 2, speaker: 'npc', probablyFine: true,
    line: "Peanuts? In a pasta place? Nah. It's probably fine!",
    recap: 'The server guessed "probably fine" without checking.' },
  server_checked: { id: 'server_checked', minutes: 10, speaker: 'npc',
    line: 'Kitchen says: no peanuts in the mains. The torte has a peanut praline, though. Good thing you asked.',
    recap: 'The server checked with the kitchen: mains are peanut-free, the torte is not.' },
  torte_looked: { id: 'torte_looked', minutes: 1, speaker: 'look',
    line: 'Chopped peanuts, arranged in a heart. Chunky. You know chunky.',
    recap: 'You looked closely at the torte: the "crunchy surprise" is a heart of chopped peanuts.' },
  moved_venue: { id: 'moved_venue', minutes: 10, speaker: 'flag',
    line: 'Taco truck? I love a plot twist.',
    recap: 'You and Sam moved dinner to the taco truck across the street.' },
  passed_torte: { id: 'passed_torte', minutes: 1, speaker: 'flag',
    line: "More for me. Wait, is it... okay. I'll eat it over here.",
    recap: 'You passed on the torte.' },
};

export const SERVER_CARD_MINUTES = 3; // with the allergy card, the kitchen check is quick

export const SAM = {
  greet: "I found this place! They have amazing pasta. It's to die for!",
  greetThought: '"To die for" doesn\'t\ninspire confidence.',
  torte: "Okay, we HAVE to get the torte for two. Look at it.",
  eat: {
    pasta: "Right?! Told you.", bruschetta: "Ooh, bold. I respect it.", salmon: "Fancy.",
    torte: "Best dessert ever. Right?", tacos: "Honestly? Better than the pasta place.",
  } as Record<string, string>,
  movedUntold: "Wait, we're leaving? Did I do something?",
  bye: { good: "Same time next week?", meh: 'This was... nice. Text me?', bad: "So. Um. Get home safe." },
};

export const SERVER = {
  greet: 'Welcome in! Specials are on the board.',
  cardTaken: 'Ooh, a card. Give me two minutes with the kitchen.',
};

export const DATE_ENDINGS = {
  reaction: { title: 'IT HAPPENED', sub: 'Sam rode with you to urgent care and held your hand the whole way. Second date: pending.' },
  stomach: { title: 'THE LONG BATHROOM BREAK', sub: 'Sam finished both desserts and texted "u ok?" from twelve feet away.' },
  awkward: { title: 'PROBABLY NOT A SECOND DATE', sub: "You're safe. Sam is being very polite about it." },
  honest_win: { title: 'SURPRISINGLY GOOD DATE', sub: 'You were honest, you ate well, and Sam wants to do this again.' },
  hungry: { title: 'DINNER WAS MOSTLY CONVERSATION', sub: 'Good conversation, though. You are starving.' },
  fine: { title: 'A PERFECTLY OKAY DATE', sub: 'Nobody got hurt. Nobody fell in love. Solid Saturday.' },
} as const;
