// The two short stops: the morning allergy test and the lunch food truck.
import type { Clue, Food } from './grocery.ts';

export const TEST = {
  price: 15,
  results: [
    { mark: '!' as const, text: 'Peanut: POSITIVE (high). Severe allergy.' },
    { mark: '!' as const, text: 'Cedar pollen: POSITIVE (moderate). Seasonal.' },
    { mark: '?' as const, text: 'Dairy: not tested.' },
    { mark: '?' as const, text: 'Onion: not tested.' },
  ],
  doctor: {
    greet: "Good news: we know more than we did. Bad news: you'll want to sit down for the peanut part.",
    offer: "The extended panel covers dairy and a few others. $15, twenty minutes. Or you can find out the hard way.",
    paid: 'Dairy: yes, intolerant. Onion: borderline. Keep an eye on it.',
    skipped: 'Your call. Read labels. All of them.',
    pen: 'And you have your epinephrine. Every day, everywhere. It is not a food-safety plan.',
  },
};

export const TRUCK_ARRIVE = 12 * 60;

export const TRUCK_FOODS: Record<string, Food> = {
  fries: {
    id: 'fries', name: 'Loaded Fries', price: 5, hunger: -3, satisfaction: 2, minutes: 5,
    doses: {}, peanut: false, crossContact: 0.7, contactSource: 'the shared fryer with the peanut satay bites',
    endsScene: false, art: 'fries',
    blurb: 'Crispy, salty, and the fastest thing on the menu.',
    facts: [
      { topic: 'Peanut', clues: ['fryer_looked'], unknown: 'Cook: "Potato, salt, oil. That\'s it."', mark: '!', text: 'Same fryer as the peanut satay bites' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese on these' },
    ],
  },
  wrap: {
    id: 'wrap', name: 'Grilled Chicken Wrap', price: 8, hunger: -4, satisfaction: 1, minutes: 8,
    doses: { onion: 2 }, peanut: false, crossContact: 0, endsScene: false, art: 'wrap',
    blurb: 'Made on the flat-top, not in the fryer. Takes a little longer.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Flat-top grill, nowhere near the fryer' },
      { topic: 'Onion', mark: '!', text: 'Grilled onions (you can see them)' },
      { topic: 'Dairy', mark: '✓', text: 'No cheese' },
    ],
  },
};

export const TRUCK_CLUES: Record<string, Clue> = {
  cook_fries: { id: 'cook_fries', minutes: 1, speaker: 'npc', line: "Fries? Potato, salt, oil. That's it. Next!",
    recap: 'The cook said the fries are "potato, salt, oil." True. Incomplete.' },
  fryer_looked: { id: 'fryer_looked', minutes: 1, speaker: 'look',
    line: 'A tiny sign taped to the fryer: "SATAY BITES + FRIES. SAME OIL, SAME LOVE."',
    recap: 'A tiny sign on the fryer: the fries share oil with the peanut satay bites.' },
};

export const COOK = {
  greet: "Next! What'll it be? Line's long, friend.",
  eat: { fries: 'Enjoy!', wrap: 'Good choice. Flat-top takes a sec.' } as Record<string, string>,
};

export const TRUCK_ENDINGS = {
  reaction: { title: 'IT HAPPENED (AT LUNCH)', sub: 'The fries were great for about a minute. The afternoon is gone.' },
} as const;
