# Codex: bounded engineering and review

Codex works on focused tickets after a playable scene exists. Read `GAME_DESIGN.md`, `CONTENT_SCHEMA.md`, `TECHNICAL_ARCHITECTURE.md`, and the relevant scene notes first.

## Review priorities

1. Can the player complete the intended scene through visible interactions?
2. Are condition rules correct and deterministic enough to test? In particular, do intolerance aids stay separate from true allergy safety?
3. Does partial information remain fair and understandable?
4. Do time, money, inventory, and condition effects update once per choice with no exploits?
5. Do touch sizing, scale, and text remain usable on desktop and mobile?
6. Is complexity proportional to a small five-scene MVP?

## Change boundaries

- Do not redesign the visual direction while reviewing engineering behavior.
- Keep each assignment to one ticket in `docs/CODEX_TICKETS.md` or an equivalently narrow request.
- Preserve working scene feel and jokes unless fixing a concrete defect.
- Report findings with severity and file/line references. For implementation tickets, make the fix and run focused verification.
- Prefer pure TypeScript for rules and Phaser for presentation, input, and scene transitions.

The sample first review prompt is `docs/prompts/CODEX_REVIEW_GROCERY_STORE.md`.
