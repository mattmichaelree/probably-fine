// Authored truth + copy for the Grocery Store. Truth fields (peanut, crossContact,
// lactose) never change; `facts` is what the player can see, gated by clues.

export type Mark = '✓' | '!' | '?';
export type Trigger = 'dairy' | 'onion';

// Key people. Relationships move with how things are handled, never for having an allergy.
export type Person = 'rick' | 'sam';
export const PEOPLE: Record<Person, { name: string; short: string; start: number }> = {
  rick: { name: 'Uncle Rick', short: 'Rick', start: 6 },
  sam: { name: 'Sam (your date)', short: 'Sam', start: 5 },
};

export interface FactLine {
  topic: string;
  clues?: string[]; // hidden until any of these clues is learned
  unknown?: string; // shown with '?' while the clue is unknown
  mark: Mark;
  text: string;
}

export interface Food {
  id: string;
  name: string;
  price: number;
  hunger: number;
  satisfaction: number;
  doses: Partial<Record<Trigger, number>>; // intolerance doses; thresholds live in rules
  minutes?: number; // time to eat when not at a checkout
  social?: Partial<Record<Person, number>>; // relationship change when you eat it
  requires?: string; // clue/flag that must be known before it can be eaten
  peanut: boolean; // actual ingredient
  crossContact: number; // chance this batch touched peanut, rolled once per run
  contactSource?: string;
  endsScene: boolean;
  art: string;
  blurb: string;
  facts: FactLine[];
}

export interface Clue {
  id: string;
  minutes: number;
  speaker: 'clerk' | 'npc' | 'label' | 'look' | 'flag';
  line: string;
  probablyFine?: boolean;
  recap: string; // line for the end-of-scene WHY list
}

export const START = { minute: 600, money: 40, hunger: 6, satisfaction: 3, conditionLoad: 0 };
export const LINE_GROWS_AT = 630; // 10:30, checkout line becomes a lifestyle
export const STOMACH_LIMIT = 4;
// Truth for the default profile. The player starts out not knowing either.
export const INTOLERANT: Trigger[] = ['dairy', 'onion'];
export const BATHROOM_MINUTES = 40;
export const REACTION_MINUTES = 240;
export const LACTASE = { price: 6, uses: 3 };

export const GROCERY_FOODS: Record<string, Food> = {
  cookie: {
    id: 'cookie', name: 'Absolutely Ordinary Cookie', price: 4, hunger: -3, satisfaction: 3,
    doses: { dairy: 3 }, peanut: false, crossContact: 0.5, contactSource: 'shared factory line',
    endsScene: true, art: 'cookie_box',
    blurb: 'NATURAL! WHOLESOME! MADE WITH LOVE! 100% COOKIE! TRUST US! NO WEIRD STUFF!*',
    facts: [
      { topic: 'Peanut', clues: ['cookie_label'], unknown: 'Front says "NO WEIRD STUFF!*". What is the asterisk?', mark: '!', text: '"May contain peanuts" (in 4-point font)' },
      { topic: 'Dairy', clues: ['cookie_label'], unknown: 'Cookies usually love butter.', mark: '!', text: 'Contains milk (a cookie-sized amount)' },
    ],
  },
  muffin: {
    id: 'muffin', name: 'Bakery Blueberry Muffin', price: 3, hunger: -3, satisfaction: 2,
    doses: { dairy: 3 }, peanut: false, crossContact: 0.75, contactSource: 'shared bakery tongs',
    endsScene: true, art: 'bakery_case',
    blurb: 'Fresh from the case. Right next to the Peanut Butter Blondies. No label.',
    facts: [
      { topic: 'Peanut', clues: ['clerk_bakery', 'tongs_watched'], unknown: 'No label. It sits next to peanut butter blondies.', mark: '!', text: 'Same tongs as the peanut butter blondies' },
      { topic: 'Dairy', mark: '?', text: 'Probably butter. It is a muffin.' },
    ],
  },
  bread: {
    id: 'bread', name: 'Fancy Allergy-Friendly Bread', price: 9, hunger: -4, satisfaction: 2,
    doses: {}, peanut: false, crossContact: 0,
    endsScene: true, art: 'fancy_bread',
    blurb: 'Made in a dedicated peanut-free, dairy-free facility. Priced like it knows.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Dedicated peanut-free facility (printed big, for once)' },
      { topic: 'Dairy', mark: '✓', text: 'Dairy-free' },
    ],
  },
  ricecakes: {
    id: 'ricecakes', name: 'Plain Rice Cakes', price: 3, hunger: -2, satisfaction: -1,
    doses: {}, peanut: false, crossContact: 0,
    endsScene: true, art: 'rice_cakes',
    blurb: 'Tastes like packing foam. Safe like packing foam.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Peanut-free facility' },
      { topic: 'Dairy', mark: '✓', text: 'Contains: rice, air, regret' },
    ],
  },
  sample: {
    id: 'sample', name: 'Free Milkshake Sample', price: 0, hunger: -1, satisfaction: 1,
    doses: { dairy: 4 }, peanut: false, crossContact: 0,
    endsScene: false, art: 'sample_table',
    blurb: 'FREE! A tiny cup of extremely thick milkshake.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Vanilla only. The sample lady checked. Twice.' },
      { topic: 'Dairy', mark: '!', text: 'It is literally a milkshake' },
    ],
  },
};

export const GROCERY_CLUES: Record<string, Clue> = {
  cookie_label: {
    id: 'cookie_label', minutes: 3, speaker: 'label',
    line: 'INGREDIENTS: wheat flour, sugar, butter (milk), vanilla. MAY CONTAIN PEANUTS.',
    recap: 'You read the cookie label: milk, and "may contain peanuts" in the smallest type legally possible.',
  },
  clerk_bakery: {
    id: 'clerk_bakery', minutes: 2, speaker: 'clerk',
    line: 'Bakery? Oh, same tongs for everything. Saves tongs.',
    recap: 'Todd confirmed the bakery uses one set of tongs for everything, peanut blondies included.',
  },
  tongs_watched: {
    id: 'tongs_watched', minutes: 1, speaker: 'look',
    line: 'Blondie. Muffin. Blondie. Muffin. Nobody wipes the tongs.',
    recap: 'You watched the bakery tongs go from peanut butter blondies straight into the muffins.',
  },
  clerk_cookie: {
    id: 'clerk_cookie', minutes: 2, speaker: 'clerk', probablyFine: true,
    line: "The cookie? It's probably fine!",
    recap: 'Todd said the cookie is "probably fine." That is a vibe, not an ingredient list.',
  },
};

// Todd escalates each time you make small talk. The third line makes him read the label for you.
export const TODD_CHAT: { line: string; reveals?: string; recap?: string }[] = [
  { line: "I'm not trained in food. I'm trained in the register. Barely." },
  { line: "My manager says the tongs are 'basically clean.' He also says 'basically' about my salary." },
  {
    line: "Ugh, FINE. I'll read the cookie box. 'May contain... peanuts.' Wait. I've said 'probably fine' about this cookie for three years.",
    reveals: 'cookie_label',
    recap: 'Todd read the cookie box out loud: "may contain peanuts." He is going through something.',
  },
  { line: "I need a minute. I'm rethinking every recommendation I've ever made." },
];

export const TODD_REACT = {
  label: 'Nobody reads those. Are you... okay?',
  lactase: 'The dairy pills? Cool. Do they work on peanuts?',
  lactaseReply: 'No, Todd.',
  complaint: "Restroom key is on the giant spoon. Don't ask why.",
  line: '...I am Register 2.',
  bread: 'Nine dollars. For bread. Respect.',
  ricecakes: 'Rice cakes. Bold choice. By which I mean the opposite.',
  cookie: 'Great choice! Probably fi—',
  muffin: 'One muffin. Tongs included. Kidding. Mostly.',
} as const;

// Store PA is about the store, never about the player's precautions or symptoms.
export const PA = {
  line: 'ATTENTION SHOPPERS: now opening Register 2!',
} as const;

export const GROCERY_ENDINGS = {
  // `detour` replaces `sub` when the run already included a bathroom detour. {bath} = minutes lost.
  safe_smug: { title: 'SAFE & SMUG', sub: 'Expensive bread. Zero drama. You feel like a responsible adult.',
    detour: "Safe bread, eventually. The milkshake already spent today's drama budget ({bath} min of it)." },
  safe_bored: { title: 'SAFE & BORED', sub: 'You survived. Your taste buds filed for unemployment.',
    detour: 'A bathroom detour, then rice cakes. A beige, quiet recovery.' },
  got_away: { title: 'GOT AWAY WITH IT', sub: 'Nothing happened. That was luck, not a strategy.',
    detour: 'The cookie was fine. The milkshake was not. One out of two.' },
  reaction: { title: 'IT HAPPENED', sub: 'Your afternoon now belongs to urgent care.' },
  stomach: { title: 'FORMAL COMPLAINT', sub: 'Your stomach has filed a formal complaint. Still probably fine though.' },
  hungry: { title: 'LEFT HUNGRY', sub: 'Safe. Starving. Food Truck you is going to be desperate.',
    detour: 'You drank a free milkshake, lost {bath} minutes, and left with nothing. Efficient.' },
} as const;
