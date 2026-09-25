# Initial Codex review prompt

Paste this after Claude has delivered the playable Grocery Store scene:

```text
Review the Grocery Store vertical slice of PROBABLY FINE. Read AGENTS.md, GAME_DESIGN.md, CONTENT_SCHEMA.md, TECHNICAL_ARCHITECTURE.md, docs/MVP.md, and docs/SCENES.md. Do not redesign the game or edit files in this review.

Play through at least one safe and one risky path, including label/clerk discovery, on desktop and phone. Then inspect the code for: incorrect allergy vs intolerance behavior; cross-contact facts changing when knowledge changes; inconsistent money/time/inventory effects; hidden unfair outcomes; scene soft locks; touch/text/layout failures; and architecture that is too complex for a five-scene MVP.

Return findings first, ordered by severity, each with file/line references and a concrete player impact. Include missing focused tests and any verification you could not complete. Keep the review bounded to this scene and the systems it directly uses.
```
