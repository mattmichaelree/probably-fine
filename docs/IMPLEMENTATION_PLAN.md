# Phased implementation plan

Each phase ends with something the user can play or inspect. The sequence prioritizes game feel before reusable infrastructure.

## Phase 0: prep (half day)

Read this handoff; confirm the user's original reference image if available. Bootstrap Phaser 4 + TypeScript + Vite with a static build and one responsive canvas. Lock dependencies. Gather a small temporary art set or draw only the minimum original stand-ins needed for the Grocery scene.

**Gate:** dev server opens a nonblank game canvas on desktop and phone; scene can be clicked.

## Phase 1: Grocery Store vertical slice (1-3 focused sessions)

Build one complete Grocery Store scene with readable props, short NPC interaction, label inspection, a hidden cross-contact fact, money/time/hunger/satisfaction feedback, one risk decision, and two distinct outcomes. Include a restart. Keep logic local until repeated needs are obvious.

**Gate:** new player can finish, understand their result, restart, and give feedback on whether it feels like a funny game. Pause expansion for tone/art/interaction feedback.

## Phase 2: rules and shared state (1-2 sessions)

Extract the condition resolver, knowledge, inventory, and resource transitions from the proven Grocery implementation. Add focused pure-function tests. Introduce relevant intolerance aids, explicit allergy limits, seeded uncertainty, and a compact shared status strip.

**Gate:** grocery behavior remains intact; tests prove allergy vs intolerance and cross-contact differences; same seed and actions give same results.

## Phase 3: middle Saturday (2-4 sessions)

Add Food Truck, Uncle Rick's BBQ, and The Date as authored interactive scenes. Carry money, time, hunger, satisfaction, condition load, inventory, and discoveries forward. Reuse systems where they save effort; let each scene keep its own visual jokes.

**Gate:** one full route through four scenes works; at least two meaningful routes differ in consequence and time/money.

## Phase 4: The Biscuit and replay (1-2 sessions)

Add final scene, explicit gamble, safe alternative, short endings, recap, restart, and local save/resume. Tune the default profile and budget against real playthroughs.

**Gate:** complete 15-20 minute Saturday with a coherent ending; a second run offers fresh knowledge or tactics.

## Phase 5: polish and package (1-2 sessions)

Replace temporary art/audio, fix mobile framing and text overflow, add mute and reduced motion, verify all clickable targets and outcomes, check license/source records, and ship static web build.

**Gate:** desktop and mobile manual playthroughs pass; build and relevant rule tests pass; no blank scene, broken asset, or trapped state.

Avoid turning the time estimates into commitments before the Phase 1 feedback. The first scene is the quality bar for the rest.
