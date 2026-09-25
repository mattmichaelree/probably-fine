# Proposal: Saturday route, pharmacy/prep, condition discovery

Status: **route accepted as a sketch** (2026-09-25). Nothing here is built.
- Keep the allergy test, pharmacy, It Happened, and End of Day brief until the next location has been played.

**Tone rule (agreed):**
- People can be funny and confidently wrong. Todd's "Nobody reads those" is the model.
- The player's precautions are treated as sensible and are never the punchline.
- There are no store-wide spectacles about the player's caution or symptoms.

## 1. Route

The four storyboard beats (allergy test, pharmacy/prep, It Happened, End of Day) are wrapped around the five playable locations. Only the locations are full interactive scenes. The storyboard beats are short and mostly consequence or setup.

```text
 9:30  [0] ALLERGY TEST            intro, ~1 min, one choice
          │   sets the knowns/unknowns for the run
10:00  [1] GROCERY STORE           playable (built)
          │   breakfast; can buy something to pack
10:45  [2] PHARMACY / PREP         short: one shelf, one bag, 3 slots
          │
12:00  [3] FOOD TRUCK              optional, brief (1 decision)
          │   auto-skipped if you arrive after 1:30 or chose "keep driving"
 2:00  [4] UNCLE RICK'S BBQ        playable, the big middle scene
          │   cedar pollen + cat + onion "basically air"
 7:00  [5] THE DATE                playable
          │
 9:30  [6] THE BISCUIT             payoff: the most tempting food of the day
          │
       [7] END OF DAY              recap card (storyboard panel 7), score, restart

  "IT HAPPENED" is an interstitial, not a place. It fires after any scene
  that ended in a reaction or an intolerance hit. It shows the bathroom or
  urgent-care cutaway, turns the damage into time/energy/dignity, and pushes
  the clock: e.g. a BBQ reaction eats the afternoon, so you are late to the Date.
```

- **Allergy test (0):** use storyboard panel 1 with this game's profile.
  - Results: Peanut positive (high), which is confirmed. Tree nuts "possible", which is suspected. Cedar pollen positive, confirmed. Dairy and onion "not tested", unknown.
  - One choice: pay $15 now for the extra panel (dairy becomes known) or keep the money and find out the hard way.
- **Food Truck (3):** one screen and one decision, about 60 seconds. It exists for time and money pressure and to make the pharmacy prep pay off early, not as a full scene.
- **Biscuit (6):** stays the payoff. Its unknowns should be ones the player could have learned about earlier in the day, so knowledge from the run matters.

## 2. Pharmacy / prep options

**Rules**
- The bag holds **3 slots**, as in the storyboard ("only 3 can fit in your bag").
- Money is whatever is left after the Grocery, typically $25–35.
- Every option has a clear purpose, and a clear line saying what it does NOT do.

| Option | Cost | Uses / slot | Helps with | Does NOT help with | Trade-off |
|---|---|---|---|---|---|
| **Lactase** | $6 | 3 uses, 1 slot | Dairy intolerance: absorbs a dairy dose automatically | Any allergy; beans; pollen | Wasted if dairy isn't your problem (you may not know yet) |
| **Bean enzyme** | $8 | 2 uses, 1 slot | Bean/lentil intolerance (Food Truck chili, BBQ baked beans) | Dairy; any allergy | Only matters if you have or suspect that intolerance, so it's a speculative buy |
| **Seasonal allergy pills, non-drowsy** | $12 | Take it now (no slot); lasts ~6 game hours | Seasonal symptoms: sneezing and itchy eyes from cedar pollen and the cat | **Not peanut safety.** It doesn't prevent or treat a food allergy reaction. | Expensive; timing: take it too early and it wears off before the Date |
| **Seasonal allergy pills, drowsy** | $4 | Take it now (no slot); lasts ~6 hours | Same seasonal-symptom help | **Not peanut safety.** | Fun −2 and a +20 min nap at the next scene; you are dull at the Date |
| **Antacid** | $5 | 2 uses, 1 slot | After an intolerance hit: halves bathroom time | Prevention; allergies; pollen | Cheap cleanup versus lactase's prevention |
| **Packed safe snack** | carried from the Grocery | 1 use, 1 slot | A guaranteed-safe meal anywhere | Social scenes: "you brought your own food to my BBQ?" | Costs Fun or relationship at the BBQ and Date, and takes a slot |
| **Allergy card** | $0, 10 min to write | Wallet, no slot | Food Truck and Date: questions are faster and answers become reliable | Uncle Rick. He does not read cards. | Costs time up front |
**Epinephrine (decided 2026-09-25):**
- The pen is always carried.
- It takes no bag slot and is never a prep choice.
- It is emergency response only. It never makes food safe, and a reaction still costs the afternoon.
- It is not in the prep table on purpose: prep choices are only for items with different, limited purposes.

## 3. Condition discovery: unknown → suspected → confirmed

| State | Chip | How you get there |
|---|---|---|
| **Unknown** | `? DAIRY: ???` | No data yet. Foods with that ingredient show "?" lines. |
| **Suspected** | `?! DAIRY: suspicious` | **One ambiguous signal**: a small symptom under the threshold ("stomach gurgle"); a reaction after a meal with *several* unknown ingredients; a doctor's "possible"; or a reliable observer ("you went pale after the onion rings"). |
| **Confirmed** | `! DAIRY: intolerant` | **One unambiguous signal**: a reaction when only one unknown ingredient was present (the milkshake is pure dairy, so it confirms directly); two independent suspected signals pointing at the same ingredient; or paying for a test. |
| **Cleared** (intolerances only) | `✓ ONION: fine` | Eating a known dose with no symptoms. |

- **Ambiguity is the puzzle.** Rick's casserole has onion *and* dairy. A stomach hit makes **both** suspected. The player narrows it down later by eating single-ingredient food, or by taking lactase and seeing whether it still happens.
- **Safety rule:** true food allergies are never "discovered by eating" as a clever strategy.
  - Allergy knowledge comes from the test, labels, and people.
  - An allergy exposure is always an It Happened consequence, never a discovery bonus.
  - Only intolerances and environmental triggers become known through exposure.
- **Code impact is small.** Add per-ingredient evidence to the state. The rules already know which ingredients were in each exposure.

## 4. Relationships (built for Rick, 2026-09-25)

Key people each have a 0-10 meter that carries through the day (`state.rel`). Every change is logged with a plain-language reason, and the ending card shows the latest one.

- **Having or mentioning an allergy never lowers a relationship.** There is a test for this.
- **Telling people early helps:** telling Rick gives +1, and his sauce questions then cost nothing.
- **Letting them help helps:** accepting the foil burger gives +1. Enjoying their food helps too (ribs +2).
- **Unexplained friction costs:**
  - Declining without saying why: −1.
  - Grilling someone about their recipe with no context: −1 per extra question.
- **A gamble that goes wrong at their event, when they were never told, costs −2** ("He wishes you had said something").
- **Previews show social stakes** the same way they show hunger and condition, e.g. "Rick 6 → 5" and "if contact happened: … Rick only 6".
- **People may be annoyed** (Rick hates having his sauce "interrogated"), but the joke is on their confidence, not the player's caution.
- **Next:** The Date adds `date` to `PEOPLE`. End of Day lists everyone met.
