// Slice Society: the other date venue. Cheap, cheerful, and quietly one of the hardest
// places to eat with a peanut allergy: a house pesto made with peanuts, one cutter for
// every pie, and "we can leave it off" meaning the topping, not the cutter.
import { EVENING_ENDINGS } from './date.ts';
import type { Clue, Food } from './grocery.ts';

const cutter = ['pizza_checked', 'cutter_looked'];
const mains = ['pizza_checked', 'pizza_partial'];
const CUTTER = 'the counter cutter, which just sliced the pesto pie';

export const PIZZA_FOODS: Record<string, Food> = {
  margherita: {
    id: 'margherita', name: 'Margherita Slice', price: 4, hunger: -2, satisfaction: 2, minutes: 5,
    doses: { dairy: 3 }, peanut: false, crossContact: 0.5, contactSource: CUTTER, endsScene: false, art: 'pizza_slices',
    blurb: 'Red sauce, mozzarella, one heroic basil leaf. "No pesto on this one!"',
    facts: [
      { topic: 'Peanut', clues: cutter, unknown: 'Sliced at the counter with... something.', mark: '!', text: 'Cut with the same cutter as the peanut pesto pie' },
      { topic: 'Dairy', mark: '!', text: 'Mozzarella. It is a pizza' },
    ],
  },
  pesto: {
    id: 'pesto', name: 'House Pesto Slice', price: 5, hunger: -2, satisfaction: 3, social: { sam: 2 }, minutes: 5,
    doses: { dairy: 2 }, peanut: true, crossContact: 0, endsScene: false, art: 'pizza_slices',
    blurb: 'The famous one. Sam has been talking about it since the parking lot.',
    facts: [
      { topic: 'Peanut', clues: ['pizza_checked', 'pizza_partial', 'pesto_looked'], unknown: '"House pesto." Nuts not specified.', mark: '!', text: 'House pesto is made with peanuts (cheaper than pine nuts)' },
      { topic: 'Dairy', mark: '!', text: 'Parmesan in the pesto' },
    ],
  },
  sausage: {
    id: 'sausage', name: 'Sausage & Onion Slice', price: 5, hunger: -3, satisfaction: 3, minutes: 5,
    doses: { onion: 4, dairy: 2 }, peanut: false, crossContact: 0.5, contactSource: CUTTER, endsScene: false, art: 'pizza_slices',
    blurb: 'Greasy in the correct way.',
    facts: [
      { topic: 'Peanut', clues: cutter, unknown: 'Sliced at the counter with... something.', mark: '!', text: 'Cut with the same cutter as the peanut pesto pie' },
      { topic: 'Onion', mark: '!', text: 'It is in the name. Plus garlic' },
      { topic: 'Dairy', mark: '!', text: 'Mozzarella' },
    ],
  },
  knots: {
    id: 'knots', name: 'Garlic Knots', price: 4, hunger: -2, satisfaction: 2, minutes: 5,
    doses: { dairy: 2 }, peanut: false, crossContact: 0, endsScene: false, art: 'garlic_knots',
    blurb: 'Shiny. Suspiciously shiny.',
    facts: [
      { topic: 'Peanut', clues: mains, unknown: 'Kitchen unknown.', mark: '✓', text: 'Baked in their own basket, never cut' },
      { topic: 'Dairy', clues: mains, unknown: 'The shine is... oil? Butter?', mark: '!', text: 'Garlic butter, generously' },
    ],
  },
  custom_pie: {
    id: 'custom_pie', name: 'Plain Pie, Clean Cutter', price: 14, hunger: -4, satisfaction: 2, social: { sam: 1 }, minutes: 20,
    doses: { dairy: 3 }, peanut: false, crossContact: 0, endsScene: false, art: 'custom_pie', requires: 'fresh_cutter',
    blurb: 'A whole cheese pie, cut in the back with a cutter nobody has used tonight.',
    facts: [
      { topic: 'Peanut', mark: '✓', text: 'Fresh cutter, cut in the back, no pesto anywhere near it' },
      { topic: 'Dairy', mark: '!', text: 'Still mozzarella. It is still a pizza' },
    ],
  },
};

export const PIZZA_CLUES: Record<string, Clue> = {
  pizza_guess: { id: 'pizza_guess', minutes: 2, speaker: 'npc', probablyFine: true,
    line: "Peanuts? It's a pizza place! Just get the margherita, no pesto on it. Probably fine!",
    recap: 'The server said the margherita was "probably fine" because it has no pesto on it.' },
  pizza_partial: { id: 'pizza_partial', minutes: 2, speaker: 'npc',
    line: 'Told the kitchen! The pesto has peanuts, so skip that one. (Nobody mentioned the cutter.)',
    recap: 'A rushed check: the pesto has peanuts. The cutter never came up.' },
  pizza_checked: { id: 'pizza_checked', minutes: 10, speaker: 'npc',
    line: 'Pesto has peanuts. And, um, we use one cutter for every pie. We can do a clean one in the back.',
    recap: 'A real check: the pesto has peanuts, and every slice is cut with the same cutter.' },
  cutter_looked: { id: 'cutter_looked', minutes: 1, speaker: 'look',
    line: 'The cutter wheel is green. Pesto green. It is headed for the margherita.',
    recap: 'You watched the pesto-green cutter slice the margherita.' },
  pesto_looked: { id: 'pesto_looked', minutes: 1, speaker: 'label',
    line: 'Tape on the tub: PESTO (house). Underneath, smaller: "nuts: yes (peanut, it\'s cheaper)."',
    recap: 'The pesto tub label admits it: peanuts, because they are cheaper.' },
  fresh_cutter: { id: 'fresh_cutter', minutes: 3, speaker: 'flag',
    line: 'One plain pie, clean cutter, cut in the back. Give us twenty minutes.',
    recap: 'You asked for a whole plain pie cut with a clean cutter in the back.' },
  passed_pesto: { id: 'passed_pesto', minutes: 1, speaker: 'flag',
    line: "More for me. Wait, is it the... okay. I'll eat it over here.",
    recap: 'You passed on the famous pesto.' },
};

export const PIZZA_ARRIVE = 19 * 60;

export const SAM_PIZZA = {
  greet: "Pizza! Low-key perfect. Their house pesto is FAMOUS.",
  greetThought: 'Famous for what,\nis the question.',
  pesto: "Okay, we HAVE to split a pesto slice. I've been thinking about it all day.",
  eat: {
    margherita: 'Classic. Respect.', pesto: 'RIGHT?! Famous for a reason.', sausage: 'A person of culture.',
    knots: 'Knots are a love language.', custom_pie: 'A whole pie? Now THAT is commitment.',
  } as Record<string, string>,
};

export const PIZZA_ENDINGS = {
  ...EVENING_ENDINGS,
  reaction: { title: 'IT HAPPENED (AT A PIZZA PLACE)', sub: 'The pesto was famous. Now so are you, at urgent care.' },
  stomach: { title: 'THE CHEESE HAD OPINIONS', sub: 'Sam ate the rest of the pie and texted "u ok?" from the booth.' },
};
