// Pharmacy / prep: a short stop. Every item has one job and says what it does NOT do.
export const PHARMACY_ARRIVE = 10 * 60 + 45; // 10:45 AM
export const PILLS_HOURS = 6;

export const ITEMS = {
  pills: {
    name: 'Clear-Day Allergy Pills', price: 12, art: 'pills_clear',
    helps: 'Seasonal symptoms (cedar pollen): sneezing, itchy eyes. Lasts about 6 hours.',
    not: 'Not peanut safety. Does not prevent or treat a food allergy reaction.',
  },
  drowsy: {
    name: 'Snooz-Ease Allergy Pills', price: 4, art: 'pills_snooze',
    helps: 'Same seasonal-symptom help, at a third of the price.',
    not: 'Not peanut safety. Also: you will nap. Fun −2, +20 min.',
  },
  antacid: {
    name: 'Tummy-Calm Antacid', price: 5, art: 'antacid', uses: 2,
    helps: 'After a stomach complaint: halves the bathroom time. 2 uses.',
    not: 'Does not prevent anything. Does nothing for allergies or pollen.',
  },
  card: {
    name: 'Allergy Card (DIY)', price: 0, art: 'allergy_card', minutes: 10,
    helps: 'A written card for servers. Restaurant answers get faster and actually reliable.',
    not: 'Uncle Rick does not read cards.',
  },
} as const;
export type ItemId = keyof typeof ITEMS;

export const PHARMACIST = {
  greet: "Morning. Before you ask: nothing on this shelf makes peanuts safe. I get asked hourly.",
  pen: "You've got your epinephrine? Good. That's the only thing here for a reaction, and it's for emergencies, not for testing snacks.",
  pills: 'Good for the sneezing. Not for peanuts. I will say that as many times as you need.',
  drowsy: "Cheaper because you'll take a nap in a parking lot. Plan accordingly.",
  antacid: 'Cleanup, not prevention. Like a mop.',
  card: 'Smart. Servers read cards faster than they listen to explanations. Most servers.',
  lactase: 'Dairy help. You clearly already know that one.',
  bye: 'Good luck out there. Read everything.',
};
