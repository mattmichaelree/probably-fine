# Content schema

This is a proposed TypeScript contract, not a mandate for a large content engine. Start with plain objects and pure resolution functions. Add fields only when a playable scene needs them.

## IDs and tags

Use stable string IDs for scenes, items, NPCs, clues, and outcomes. Start with a small authored tag set:

```ts
type FoodTag =
  | 'peanut' | 'tree_nut' | 'milk' | 'wheat' | 'egg' | 'soy'
  | 'sesame' | 'shellfish' | 'legume' | 'high_lactose'
  | 'fermentable_beans';

type EnvironmentalTag = 'cat_dander' | 'cedar_pollen' | 'bee';
type Certainty = 'unknown' | 'suspected' | 'confirmed' | 'cleared';
type ConditionKind = 'food_allergy' | 'intolerance' | 'environmental_allergy';
```

Tags are game mechanics, not a complete medical taxonomy. Keep visible copy human, e.g. "contains milk" and "same fryer as shrimp."

## Run and content records

```ts
interface Condition {
  id: string;
  kind: ConditionKind;
  triggerTags: readonly (FoodTag | EnvironmentalTag)[];
  sensitivity: number; // Tuning value owned by rules, not UI copy.
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  hungerChange: number;
  satisfactionChange: number;
  ingredientTags: readonly FoodTag[];
  crossContactTags: readonly FoodTag[];
  doseTags?: Partial<Record<FoodTag, number>>;
  clueIds: readonly string[];
}

interface Clue {
  id: string;
  source: 'label' | 'npc' | 'inspect' | 'test' | 'memory';
  text: string;
  reveals: readonly { tag: FoodTag | EnvironmentalTag; certainty: Certainty }[];
  timeCost: number;
  moneyCost: number;
  reliability: 'reliable' | 'unreliable' | 'partial';
}

interface Aid {
  id: string;
  name: string;
  appliesTo: readonly FoodTag[];
  uses: number;
  timeCost: number;
  effect: 'reduce_intolerance_dose' | 'reduce_environmental_load' | 'emergency_response';
}

interface RunState {
  seed: number;
  sceneId: string;
  minute: number;
  money: number;
  hunger: number;
  satisfaction: number;
  conditionLoad: number;
  conditions: readonly Condition[];
  inventoryIds: readonly string[];
  knownClueIds: readonly string[];
  completedSceneIds: readonly string[];
}
```

Treat the numeric ranges as tuning choices. Store a small event log or outcome IDs if useful for the ending; do not log every animation or UI hover.

## Scene contracts

```ts
interface SceneDefinition {
  id: string;
  title: string;
  goal: string;
  propIds: readonly string[];
  npcIds: readonly string[];
  entryMinute: number;
  exitIds: readonly string[];
}

interface ActionDefinition {
  id: string;
  label: string;
  targetId: string;
  timeCost: number;
  moneyCost: number;
  requiredClueIds?: readonly string[];
  effectId: string;
}
```

Represent scene-specific jokes and visual beats as authored content associated with effect/outcome IDs. Do not force all five scenes into one generic dialogue graph.

## Example: one grocery decision

```ts
const suspiciousSnack: FoodItem = {
  id: 'grocery_mystery_cookie',
  name: 'Absolutely Ordinary Cookie',
  price: 4,
  hungerChange: -2,
  satisfactionChange: 2,
  ingredientTags: ['milk', 'wheat'],
  crossContactTags: ['peanut'],
  clueIds: ['cookie_front_label', 'cookie_back_label', 'cookie_bakery_question'],
};
```

The front label can be reassuring but incomplete; the back label and bakery question reveal different facts. The actual tags never change because a player has not looked yet. A lactase-like aid can modify the lactose-related consequence only; it never clears peanut cross-contact.

## Resolution boundary

`resolveAction(state, action, content, rng)` returns a new state plus outcome IDs and explanation facts. It should be pure and deterministic for the same inputs and seed. It applies time/cost once, evaluates actual tags against conditions, consumes an aid only when applicable, and never lets a UI clue alter actual item contents. The renderer turns outcome IDs into animations, sound, and short dialogue.

## Save format

For MVP, save versioned JSON in local storage after each scene transition or major action. Include `schemaVersion`, seed, state, and learned facts. Reject or reset incompatible saves with a clear user-facing message; do not attempt speculative migrations before a release exists.
