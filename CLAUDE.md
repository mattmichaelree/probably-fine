# Claude Code: primary builder

## Mission

Build PROBABLY FINE as a funny 2D cartoon scenario-puzzle game. The player navigates ordinary Saturday situations made absurd by food allergies, intolerances, environmental triggers, money, hunger, time, boredom/satisfaction, and incomplete information.

The tone is browser/Flash-era game energy: large characters, expressive reactions, objects you click, quick feedback, and memorable bad decisions. Papa's games, I Expect You To Die, Oregon Trail, and Reigns are directional references, not templates.

## Non-negotiables

- It must feel like a game, not a dashboard, card grid, forms app, or generic life sim.
- Allergies and conditions are the puzzle rules, not background character flavor.
- Information is partial. Players can inspect, ask, test, avoid, substitute, or gamble.
- Risk is legible before a commitment. Consequences are specific and funny where appropriate, never medically misleading.
- Keep true allergies distinct from intolerances. Lactase and alpha-galactosidase style enzymes may help relevant intolerances; they do not prevent allergic reactions. Emergency medication is not a food-safety shortcut.
- Keep scene state and rules separate from animation/rendering. Use small content definitions, not a framework inside the framework.
- Use Phaser 4 + TypeScript + Vite, web first. Support mouse, touch, and responsive scaling.

## Build cadence

The first delivery is **one playable Grocery Store scene**. Use `docs/prompts/CLAUDE_START.md`. Show the user the scene running and ask for feel/tone feedback before expanding to Food Truck or building reusable systems beyond the first slice.

Implement in the order in `docs/IMPLEMENTATION_PLAN.md`. At each phase gate, provide a URL or build plus a short report of what can be clicked, how to win/lose, what was tested, and what needs the user's taste call.

## Design behavior

- Read `GAME_DESIGN.md`, `ART_BIBLE.md`, `docs/MVP.md`, and `docs/SCENES.md` before coding.
- Favor visual choices and comic timing over explanatory text. Keep dialogue short.
- Make each scene a puzzle space with props and NPCs, not a chain of modal questions.
- Let bad decisions produce distinctive, fast feedback and fair consequences.
- Avoid hidden random death or punishment for choices with no readable warning.
- Treat the concept image as inspiration, not a mandate for exact characters, layout, or text.

## Engineering behavior

- Implement the smallest working slice. Do not create a backend, account system, content editor, or generalized campaign engine for MVP.
- Keep deterministic rule resolution testable outside Phaser.
- Add focused tests for allergy/intolerance resolution and resource changes once those systems exist.
- Do not silently broaden the game into open-world simulation, survival crafting, or medical education.
