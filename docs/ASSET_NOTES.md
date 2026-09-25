# Asset notes

## Included

- `public/assets/concept/probably-fine-funnier-second-concept.png`: newly generated concept image for this handoff. Use as tone and composition reference, not as final scene art. Text and tiny labels in generated imagery must be redrawn as real UI if critical.

## Original reference

`public/assets/concept/original-reference.png` is the user's first ChatGPT storyboard (7 panels: allergy test, grocery, BBQ, date, "it happened", pharmacy, end of day), added 2026-09-25. Its bearded player character is the chosen MVP player.

## Production asset ledger

For each new art/audio asset, record: filename, creator/source, license or permission, date acquired, and where it is used. Avoid using copyrighted game reference art as production assets. Reserve subfolders under `public/assets/` for characters, locations, food, items, UI, and audio.

| File | Creator / source | License | Date | Used in |
|---|---|---|---|---|
| `characters/`: player_body, face_happy, face_neutral, face_sick, face_suspicious | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Player, every scene |
| `characters/`: doctor, clerk, pharmacist, cook, rick, cat_chair, cat_chair_empty, sam, server, jo | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Test, Grocery, Pharmacy, Truck, BBQ, Date, Biscuit |
| `food/`: cookie_box, cookie_back, bakery_case, sample_table, fancy_bread, rice_cakes | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Grocery |
| `food/`: fries, wrap | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Food Truck |
| `food/`: burger, casserole, corn, potato_salad, sauce_bottle, sauce_back | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | BBQ |
| `food/`: torte | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Date |
| `food/`: hero_biscuit, plain_biscuits | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Biscuit, Title |
| `items/`: results | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Allergy test |
| `items/`: tongs, lactase, tp_roll | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Grocery (tp_roll on any stomach ending) |
| `items/`: pills_clear, pills_snooze, antacid, allergy_card | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Pharmacy |
| `items/`: fryer | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Food Truck |
| `items/`: grill, brush, lawn_chair | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | BBQ |
| `items/`: date_table, candle, specials_board, taco_truck | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Date |
| `items/`: pastry_board | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | Biscuit |
| `locations/`: office_bg, store_bg, checkout, pharmacy_bg, truck_bg, backyard_bg, cedar_tree, restaurant_bg, biscuit_bg, night_bg | Claude Code, hand-written SVG | Original, project-owned | 2026-09-25 | One per scene; biscuit_bg also Title, night_bg End of Day |
| `characters/`: rick_proud, rick_hurt, rick_panicked, rick_sheepish, sam_happy, sam_annoyed, sam_worried (mood swaps of rick/sam) | Claude Code subagent, hand-written SVG | Original, project-owned | 2026-09-25 | BBQ, Date, Pizza (NPC reactions) |
| `characters/`: server_careful, server_friendly, server_busy, server_dismissive | Claude Code subagent, hand-written SVG | Original, project-owned | 2026-09-25 | Date and Pizza (one server per venue per run) |
| `locations/`: pizza_bg | Claude Code subagent, hand-written SVG | Original, project-owned | 2026-09-25 | Pizza (Slice Society) |
| `items/`: pizza_menu, pizza_cutter, pesto_tub · `food/`: pizza_slices, garlic_knots, custom_pie | Claude Code subagent, hand-written SVG | Original, project-owned | 2026-09-25 | Pizza |
| Sound effects (`src/sfx.ts`) | Synthesized at runtime with WebAudio oscillators | Original, no audio files | 2026-09-25 | Taps, stomach/reaction, endings |
| Fonts: Luckiest Guy, Fredoka | Google Fonts | SIL OFL 1.1 | 2026-09-25 | All UI text |

All art is temporary stand-in art; the SVG generator scripts were one-off and are not kept in the repo.
