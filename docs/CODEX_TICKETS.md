# Bounded Codex tickets

Use one ticket at a time, after the named prerequisite exists. Each ticket should end with a concise diff, verification, and remaining risks. Codex should not redesign the visual/game direction while doing these.

## 1. Grocery Store review

**Prerequisite:** Claude's first playable Grocery Store slice. **Task:** review playability, rule correctness, state transitions, responsive input, and excessive complexity. Read `docs/prompts/CODEX_REVIEW_GROCERY_STORE.md`. **Deliverable:** findings by severity with file/line references; no edits unless separately requested.

## 2. Condition resolver

**Prerequisite:** Grocery slice with at least two food choices. **Task:** extract a pure resolver for ingredient exposure, cross-contact, dose-based intolerance, and environmental load. Keep visible outcomes consistent with the scene. Add focused tests for true allergy vs intolerance and for aids that do not clear allergy risk. **Deliverable:** small implementation, tests, and a short rule table.

## 3. Resource and inventory integrity

**Prerequisite:** shared state exists. **Task:** inspect all actions for double-charging money/time, duplicate inventory grants, negative balances, and aid-use exploits. Fix concrete issues and test the affected transitions. **Deliverable:** verified resource changes for every Grocery/Food Truck action.

## 4. Knowledge and seeded risk

**Prerequisite:** inspect/ask/test actions exist. **Task:** ensure actual item facts are independent of player knowledge. Make uncertain authored outcomes reproducible from a seed. Preserve revealed clue certainty and show a fair warning before a committed gamble. **Deliverable:** pure tests and one reproducible scene walkthrough.

## 5. Save and resume

**Prerequisite:** four-scene route works. **Task:** add versioned local save/resume and a clean restart. Save only game data, not Phaser objects. Recover gracefully from an incompatible save. **Deliverable:** manual resume check at two scene boundaries plus focused serialization tests.

## 6. Mobile scaling pass

**Prerequisite:** all five scenes playable. **Task:** fix clipped text, overlapping UI, tiny click targets, and inconsistent canvas scaling at representative desktop and phone sizes. Do not restyle the game. **Deliverable:** before/after screenshots and a short list of tested viewports.

## 7. Final engineering review

**Prerequisite:** complete Saturday route. **Task:** run a code review focused on rule regressions, unreachable outcomes, soft locks, missing assets, save defects, and build/test gaps. **Deliverable:** severity-ordered findings and residual risk. No unrelated refactor.
