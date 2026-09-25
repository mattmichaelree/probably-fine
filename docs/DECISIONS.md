# Decisions and open calls

## Agreed

- Name: PROBABLY FINE. MVP subtitle: Probably Fine: Saturday.
- Genre: funny cartoon allergy survival/scenario puzzle game, not a generic life sim.
- Stack: Phaser 4, TypeScript, Vite; web first.
- MVP route: Grocery Store, Food Truck, Uncle Rick's BBQ, The Date, The Biscuit.
- Conditions are core mechanics; information can be incomplete and discovered.
- Money, hunger, satisfaction/boredom, time, inventory, and accumulated consequences connect scenes.
- Relevant enzymes can help intolerance cases but do not prevent allergy reactions.
- "Risk It for the Biscuit" is a deliberate, readable gamble.
- Claude Code is the primary creative builder; Codex gets bounded implementation and review tickets.
- Build a playable Grocery Store before broad architecture or all-scene production.

## Provisional tuning choices

- First-run length: about 15-20 minutes.
- Starting Saturday cash: $40 for initial tuning; not fixed canon.
- One authored default condition profile in MVP; exact triggers and sensitivity to be playtested.
- Local save/resume after major actions; no account.
- Knowledge may persist between runs, but only if it improves replay without making the first run feel unfair.

## User taste calls after Grocery slice

- Does it feel sufficiently like a game and sufficiently funny?
- Is Uncle Rick the right level of lovable/infuriating?
- Should the player character be fixed or lightly customizable?
- How much consequence is funny versus frustrating?
- Should discoveries persist between runs, or is each Saturday self-contained?

## Image status

Both images are in hand. `public/assets/concept/original-reference.png` is the user's original storyboard; `probably-fine-funnier-second-concept.png` is the second concept. Player for MVP: the bearded character from the storyboard (decided 2026-09-25). Stand-in art is hand-written SVG until production art is chosen.

## Open after Phase 1

- Route: docs say Grocery → Food Truck → BBQ → Date → Biscuit; storyboard has Allergy test → Grocery → BBQ → Date → It Happened → Pharmacy → End of Day. Pick one before Phase 3.
