# Art bible

## Visual target

A chunky, expressive 2D cartoon with the slightly unruly charm of browser/Flash-era games. Clear silhouettes, warm absurdity, physical props, and comedic reaction poses. The game should read at a glance on a small laptop or phone. Avoid glossy SaaS panels, photorealism, generic stock art, and overly cute medical iconography.

The included generated concept image is a tone board: ordinary locations packed with suspicious food and confidently unhelpful people. It is not a final key art, character sheet, or exact UI specification.

## Cast

- **Player:** expressive and adaptable; readable states for hungry, suspicious, delighted, uncomfortable, and triumphantly wrong.
- **Uncle Rick:** generous, enthusiastic, and dangerously certain about what is in his food. He is funny because his confidence has no supporting records, not because he is malicious.
- **Food truck cook:** fast-moving, busy, answers some questions well and others by pointing at the queue.
- **Date:** a person with their own personality and patience, not a penalty meter. They may be helpful, oblivious, or pleasantly surprised by honesty.
- **Grocery cashier / shopper:** concise opportunities for jokes and information.

## Environments

Each scene needs one clear visual focus and a handful of inspectable props. Grocery Store: shelves, labels, sample stand, checkout. Food Truck: menu, counter, condiment bottles, shared fryer clue. BBQ: crowded table, Uncle Rick, cooler, grill, cat/yard hazards. Date: table or street-side venue, menu, social cues. Biscuit: visually irresistible final object with a conspicuous unresolved question.

## UI in the world

Use physical or comic-game treatment for information: peel-back labels, magnified ingredient text, speech bubbles, receipts, hand-drawn warning marks, and expressive status icons. Keep a compact always-visible status strip for money, time, hunger, satisfaction, and condition load. Show inventory through a small tray/pocket interaction. Critical risk text must stay readable and never rely on color alone.

## Animation and audio

Favor a few strong poses and quick squash/stretch reactions over labor-intensive smooth animation. Choices should receive immediate visual and sound feedback. Audio should support jokes and tension without turning symptoms into a slapstick spectacle. Provide mute and reduced-motion options.

## Production notes

- Use original production assets or licensed sources, with source/license recorded in `docs/ASSET_NOTES.md`.
- Keep transparent sprites with consistent scale and pivot; export 2x resolution for crisp downscaling.
- Keep text in the game UI, not baked into art, except intentional signs/packaging that do not carry critical information.
- Save the user's original image as `public/assets/concept/original-reference.png` when it becomes available. Compare it with the generated concept art before finalizing character designs.
