# Technical architecture

## Stack and target

- Phaser 4 for 2D scenes, sprites, input, camera, tweens, and audio.
- TypeScript for game state, content, and rules.
- Vite for web development and static build.
- Web first, desktop/laptop and phone browsers. A desktop wrapper is a later packaging choice.
- No backend or login for the Saturday MVP. Local storage is enough for a resumable run.

Bootstrap in Phase 1 with current compatible package versions; the Phaser npm package was confirmed at 4.2.1 and Vite at 8.3.1 while preparing this handoff. Lock actual installed versions in a package lockfile.

## Suggested source layout

```text
src/
  main.ts                 # Phaser config and responsive mount
  game/                   # RunState, scene IDs, transitions, RNG
  scenes/                 # Grocery, FoodTruck, BBQ, Date, Biscuit
  systems/                # Pure rules: condition, resources, knowledge, inventory
  content/                # Authored items, clues, actions, dialogue, outcome IDs
  ui/                     # Status strip, inventory tray, choice/reaction widgets
tests/                    # Focused rule and save tests when systems exist
public/assets/           # Art, audio, and concept references
```

## Key separation

- **Authored truth:** ingredient and cross-contact tags, environmental hazards, costs, consequences.
- **Player knowledge:** clues encountered and their certainty/reliability.
- **Rules:** pure functions that resolve action effects against truth and current state.
- **Presentation:** Phaser scenes that show props, dialogue, animation, and decisions.

The separation keeps suspense honest: a label changes knowledge, not the cookie. Keep the resolution API small enough to test without launching Phaser.

## Flow

Use one run state moving through five scene IDs. Each scene owns its visual objects and scene-specific beats. A shared status strip and inventory tray can be introduced after the Grocery scene proves their needs. Scene completion writes a small summary to state, saves, and loads the next scene. A fresh run resets transient state while the decision on persistent discoveries remains open.

## Randomness and fairness

Use a seeded RNG only for authored uncertainty, such as whether an unreliable NPC offers a misleading answer or a risky unknown item contains a specific contact hazard. A given seed must replay consistently. Do not randomly reverse a clearly known safe/unsafe fact or produce unavoidable severe outcomes without visible warning.

## Input and sizing

Build for pointer/touch from day one. Use a stable logical game size, responsive scale mode, and hit areas at least comfortable for touch. Keep dialogue and critical risk facts as accessible text where feasible, with high contrast and a non-color cue. Respect mute and reduced-motion preferences. Make the interface usable without hover.

## Verification milestones

- Phase 1: one full Grocery interaction path and one alternate path can be played in browser at desktop and phone sizes.
- Phase 2: pure rule tests cover food allergy vs intolerance, cross-contact, aid use, and single application of resource costs.
- Phase 3: run can traverse five scenes, resume from saved state, and show a coherent ending.
- Each phase: check visual framing, click targets, text overflow, and nonblank art in an actual browser.

No speculative event bus, backend service, plugin framework, or content management layer is needed for MVP.
