# PROBABLY FINE

A handoff kit for a funny, cartoon scenario-puzzle game about surviving an ordinary Saturday with food allergies, intolerances, environmental triggers, limited cash, incomplete information, and terrible social pressure.

## Start here

1. Read `GAME_DESIGN.md` and `docs/MVP.md` for the game and its first release.
2. Read `ART_BIBLE.md` and view `public/assets/concept/probably-fine-funnier-second-concept.png` for the visual and comic direction.
3. Give `docs/prompts/CLAUDE_START.md` to Claude Code in this folder. It asks for the first playable Grocery Store slice.
4. After that slice works, use a ticket from `docs/CODEX_TICKETS.md` for a bounded Codex pass.

This is a design and implementation handoff, not a finished playable game. The first implementation task includes bootstrapping Phaser 4, TypeScript, and Vite.

## Folder map

- `CLAUDE.md`, `AGENTS.md`: instructions for the two coding agents.
- `GAME_DESIGN.md`, `ART_BIBLE.md`: creative rules and experience.
- `CONTENT_SCHEMA.md`, `TECHNICAL_ARCHITECTURE.md`: proposed content contracts and implementation boundaries.
- `docs/MVP.md`, `docs/SCENES.md`, `docs/IMPLEMENTATION_PLAN.md`: scope and build order.
- `docs/DECISIONS.md`: settled choices and questions still open.
- `docs/CODEX_TICKETS.md`, `docs/prompts/`: ready-to-use assignments.
- `public/assets/concept/`: generated concept image and a slot for the user's original reference.

## Art provenance

`probably-fine-funnier-second-concept.png` is a newly generated visual interpretation of the funnier second direction. The original image the user mentioned was not available in this handoff session. Put it at `public/assets/concept/original-reference.png` when supplied, then review the two images together before locking character designs. The generated image is a mood and composition reference, not final production art.

## The first playable milestone

Build a complete Grocery Store scene with one clear objective, a small set of clickable products and characters, a readable status strip, a discovery action, a real risk decision, and an end state. A new player should understand the joke and want another run within five minutes.
