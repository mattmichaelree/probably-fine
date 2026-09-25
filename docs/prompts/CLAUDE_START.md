# Initial Claude Code prompt

Paste the following into Claude Code from the repository root:

```text
You are the primary builder for PROBABLY FINE. Read README.md, CLAUDE.md, GAME_DESIGN.md, ART_BIBLE.md, CONTENT_SCHEMA.md, TECHNICAL_ARCHITECTURE.md, docs/MVP.md, docs/SCENES.md, docs/DECISIONS.md, and docs/IMPLEMENTATION_PLAN.md first.

Build Phase 0 and Phase 1 only: a playable Grocery Store vertical slice for Probably Fine: Saturday. Bootstrap Phaser 4 + TypeScript + Vite. Use the included concept image for tone; make the first screen the actual game scene. The player should click/tap shelves, labels, the sample tray, and a clerk; inspect at least one hidden cross-contact clue; buy a safe option, knowingly gamble on a tempting option, or leave hungry. Track money, time, hunger, satisfaction, condition load, and inventory as needed for this scene. Give at least two distinct results and an immediate restart.

Use large cartoon characters/props, short dialogue, quick reactions, readable risk information, and touch-friendly controls. Keep true food allergy separate from intolerance; lactase-like aids never make allergy exposure safe. Do not build a dashboard, life sim, backend, map, content editor, or the other four scenes yet. Keep rules testable outside Phaser, but extract shared systems only when this scene needs them.

Run the game and verify a complete path and an alternate path in a real browser at desktop and phone size. Report the local URL, what the player can do, how each path resolves, what you tested, and the specific feel/tone questions you need answered before Phase 2. Stop expansion after the slice for user feedback.
```
