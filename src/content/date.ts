// The Date. Sam has their own opinions and responds to honesty, not to the allergy itself.
import type { Clue, Food } from './grocery.ts';

export const DATE_ARRIVE = 19 * 60; // 7:00 PM

const checked = ['server_checked'];
const mains = ['server_checked', 'server_partial']; // a rushed check still covers the mains

export const DATE_FOODS: Record<string, Food> = {
  pasta: {
    id: 'pasta', name: 'Truffle Pasta', price: 18, hunger: -4, satisfaction: 3, social: { sam: 1 }, minutes: 15,
    doses: { dairy: 4 }, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: "Sam's recommendation. \"It's to die for!\" (Not the phrasing you wanted.)",
    facts: [
      { topic: 'Peanut', clues: mains, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts, separate pans' },
      { topic: 'Dairy', mark: '!', text: 'Mushroom cream sauce' },
    ],
  },
  bruschetta: {
    id: 'bruschetta', name: 'House Bruschetta', price: 12, hunger: -2, satisfaction: 2, minutes: 10,
    doses: { onion: 4 }, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: 'House-made topping, ingredients unknown. Italic font, very confident.',
    facts: [
      { topic: 'Peanut', clues: mains, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts' },
      { topic: 'Onion', clues: checked, unknown: '"House-made topping."', mark: '!', text: 'Raw onion and garlic, generously' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese' },
    ],
  },
  salmon: {
    id: 'salmon', name: 'Grilled Salmon', price: 24, hunger: -4, satisfaction: 2, minutes: 15,
    doses: {}, peanut: false, crossContact: 0, endsScene: false, art: 'specials',
    blurb: 'With "seasonal vegetables." The priciest thing on the board.',
    facts: [
      { topic: 'Peanut', clues: mains, unknown: 'Kitchen unknown.', mark: '✓', text: 'Kitchen confirmed: no peanuts' },
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
  server_partial: { id: 'server_partial', minutes: 2, speaker: 'npc',
    line: 'Told the kitchen: no peanuts in your main. (Nobody mentioned dessert.)',
    recap: 'A rushed check: the mains are peanut-free. Dessert never came up.' },
  server_checked: { id: 'server_checked', minutes: 10, speaker: 'npc',
    line: 'Kitchen says: no peanuts in the mains. The torte has a peanut praline, though. Good thing you asked.',
    recap: 'The server checked with the kitchen: mains are peanut-free, the torte is not.' },
  torte_looked: { id: 'torte_looked', minutes: 1, speaker: 'look',
    line: 'Chopped peanuts, arranged in a heart. Chunky. You know chunky.',
    recap: 'You looked closely at the torte: the "crunchy surprise" is a heart of chopped peanuts.' },
  moved_venue: { id: 'moved_venue', minutes: 10, speaker: 'flag',
    line: 'Taco truck? I love a plot twist.',
    recap: 'You and Sam moved dinner to the taco truck across the street.' },
  sam_understands: { id: 'sam_understands', minutes: 2, speaker: 'flag',
    line: "Wait, like EpiPen serious? Okay. Tell me what to watch for. I'm on it.",
    recap: 'You explained how serious the allergy is. Sam asked good questions.' },
  sam_covered: { id: 'sam_covered', minutes: 1, speaker: 'flag',
    line: "Oh! No, it's fine, I've got it. Really. (It is a little bit not fine.)",
    recap: 'You were out of money. Sam covered dinner.' },
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

// Servers: each run gets one per venue. Their habits change the risk, not the menu.
export type ServerId = 'careful' | 'friendly' | 'busy' | 'dismissive';
export interface ServerProfile {
  name: string;
  art: string;
  blurb: string;
  traits: { patience: number; confidence: number; knowledge: number }; // 1-3 pips; know-how shows once they've checked
  guesses: boolean; // answers from the hip before a real check
  forgets: boolean; // "got it!" covers the mains, not the details
  checkMinutes: number; // a real check without your card
  cardMinutes: number; // with your card
  askPatience: number; // Sam's patience each time you ask
  pressure: boolean; // asking again costs you fun
  lines: { greet: string; guess: string; card: string; checked: string };
}
export const SERVERS: Record<ServerId, ServerProfile> = {
  careful: {
    name: 'Marguerite', art: 'server_careful', blurb: 'Glasses. Notepad. Writes down everything, slowly.',
    traits: { patience: 3, confidence: 2, knowledge: 3 }, guesses: false, forgets: false, checkMinutes: 12, cardMinutes: 4, askPatience: 1, pressure: false,
    lines: { greet: 'Good evening. Any allergies I should write down?', guess: '', card: "A card. Thank you. I'll read it to the chef word for word.", checked: 'I asked the chef myself.' },
  },
  friendly: {
    name: 'Tyler', art: 'server_friendly', blurb: 'Enormous smile. Enormous confidence. Unclear on ingredients.',
    traits: { patience: 3, confidence: 3, knowledge: 1 }, guesses: true, forgets: false, checkMinutes: 10, cardMinutes: 3, askPatience: 1, pressure: false,
    lines: { greet: "Heyyy, welcome in! Everything's amazing!", guess: '', card: 'Ooh, a card. Give me two minutes with the kitchen.', checked: 'Okay, I actually asked this time.' },
  },
  busy: {
    name: 'Dee', art: 'server_busy', blurb: 'Three plates, two tables, one pencil behind the ear.',
    traits: { patience: 1, confidence: 2, knowledge: 2 }, guesses: false, forgets: true, checkMinutes: 5, cardMinutes: 2, askPatience: 1, pressure: false,
    lines: { greet: "Be right with you! Okay. I'm here. What do you need?", guess: '', card: 'Card! Great! Got it!', checked: 'Okay. I asked about EVERYTHING this time.' },
  },
  dismissive: {
    name: 'Chad', art: 'server_dismissive', blurb: 'Half-lidded. Arms crossed. Has a podcast.',
    traits: { patience: 1, confidence: 3, knowledge: 2 }, guesses: true, forgets: false, checkMinutes: 10, cardMinutes: 5, askPatience: 2, pressure: true,
    lines: { greet: 'Yeah.', guess: "It's a restaurant, not a lab. It's fine.", card: '...A card. Okay. I will show them.', checked: 'Fine. I asked.' },
  },
};

// Evening endings react to planning, honesty and patience, never to having an allergy.
export const EVENING_ENDINGS = {
  reaction_untold: { title: 'IT HAPPENED (SAM HAD NO IDEA)', sub: 'Sam found out about the allergy from a paramedic. Sam would have liked to hear it from you.' },
  walked_out: { title: 'SAM CALLED IT A NIGHT', sub: 'Too many delays, not enough explanation. Sam got a ride home early.' },
  impatient: { title: 'SAM CHECKED THEIR WATCH', sub: 'You made it to the end of dinner. Sam made it there first.' },
  awkward: { title: 'PROBABLY NOT A SECOND DATE', sub: "You're safe. Sam is being very polite about it." },
  hungry: { title: 'DINNER WAS MOSTLY CONVERSATION', sub: 'Good conversation, though. You are starving.' },
  unprepared: { title: 'SAM PAID. SAM WILL REMEMBER.', sub: 'Sam was nice about covering dinner. Sam also noticed.' },
  cheap_charming: { title: 'CHEAP BUT CHARMING', sub: 'You were broke and honest about it. Sam thought that was kind of great.' },
  honest_win: { title: 'SURPRISINGLY GOOD DATE', sub: 'You were honest, you ate well, and Sam wants to do this again.' },
  charmed_unsure: { title: 'FUN, BUT...', sub: 'Sam had a great time. Sam is not sure you take care of yourself.' },
  fine: { title: 'A PERFECTLY OKAY DATE', sub: 'Nobody got hurt. Nobody fell in love. Solid Saturday.' },
};

export const DATE_ENDINGS = {
  ...EVENING_ENDINGS,
  reaction: { title: 'IT HAPPENED', sub: 'Sam rode with you to urgent care and held your hand the whole way. Second date: pending.' },
  stomach: { title: 'THE LONG BATHROOM BREAK', sub: 'Sam finished both desserts and texted "u ok?" from twelve feet away.' },
};
