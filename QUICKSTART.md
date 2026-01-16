# Quick Start Guide

## 1. Launch the App
- Open `index.html` in any modern web browser
- You should see the Quest System interface with three sections

## 2. Generate Your First Quest
1. Click the **Generate Quest** button (blue button in Controls Panel)
2. Watch the Log Window fill with detailed generation steps
3. The Quest Output section will show your generated quest with:
   - Verb (the action)
   - Target (what to act upon)
   - Location (where it happens)
   - Twist (a complication)
   - Reward (success outcome)
   - Failure (bad outcome)

## 3. Understand the Log
Each log entry shows:
- `[0]` = Sequence number
- The action (e.g., "Draw Verb", "Draw Target")
- Optional data in JSON (match pools, tags, etc.)

Key things to look for:
- **Match pool**: "Match pool: 3/6 (50%)" means 3 of 6 cards qualified
- **Draw attempts**: Shows how many tries before success
- **Fallback triggers**: When system auto-accepted due to 3 rejections
- **Modify effects**: Tags added to cards

## 4. Step-Through Debugging
For learning or debugging:
1. Click **Step-Through Mode**
2. Click **Next Step** repeatedly
3. After each step, observe:
   - What the engine is looking for
   - Match pool size and percentage
   - Why cards were accepted/rejected
   - Tags gained via Modify effects

## 5. Run Validation
To analyze card balance:
1. Set **Iterations** to 100 (or higher)
2. Click **Run Validation (N iterations)**
3. The report shows:
   - Dead cards (never selected)
   - Overactive cards (selected too often)
   - Tag usage frequency
   - Bottleneck steps

## 6. Interpret Validation Results

### ✓ Healthy Results
- Most cards selected at least once
- No cards selected >2x expected frequency
- Fallback rate < 10%
- No major bottlenecks

### ⚠️ Warning Signs
- Dead cards: May need to lower their tag requirements
- Overactive cards: May need to increase their tag requirements
- High fallback rate (>20%): Verb requirements too strict
- Bottlenecks: Too-restrictive requirements on key roles

## Example Flow

**Scenario**: You want to see a quest for "protecting a location from an evil monster"

```
LOGS WILL SHOW:
[0] === STEP 1: Draw Verb ===
[1] Verb drawn: "Defend"
[2] Verb target requirement: ["Evil Monster"]
[3] === STEP 2: Draw Target ===
[4] Looking for target with tags: ["Evil Monster"]
[5] Match pool: 2/6 (33.3%)
[6] Target Draw #1: REJECTED "Forgotten Amulet" (no matching tags)
[7] Target Draw #2: ACCEPTED "Ironfang Raider" (matched tag: Evil Monster)
[8] Modify Effect: "Ironfang Raider" gained tags ["Hostile"]
...and so on
```

## Customizing Cards

### Adding a New Card
1. Open `cards.json` in a text editor
2. Add to the appropriate deck array:
   ```json
   {
     "Deck": "Target",
     "CardName": "Shadow Assassin",
     "TypeTags": ["Evil Monster", "Humanoid"],
     "AspectTags": ["Stealth"],
     "mutableTags": [],
     "InstructionType": "Modify",
     "InstructionSubType": "Add",
     "InstructionTarget": "Failure",
     "InstructionTags": ["Deadly"]
   }
   ```
3. Refresh the browser
4. Click **Generate Quest** - new card will appear

### Understanding Tags
- **TypeTags**: Core identity (e.g., "Evil Monster", "Weapon", "Building")
- **AspectTags**: Secondary aspects (e.g., "Military", "Magic", "Commerce")
- **mutableTags**: Gained during quest (starts empty, filled by Modify effects)

### Modify Effects
When a Modify instruction fires:
- **InstructionTarget = "ThisCard"**: Card gains its own tags (e.g., "Powerful")
- **InstructionTarget = "Target"**: Next card gains tags
- **InstructionTarget = "Location"**: Location card gains tags
- **InstructionTarget = "Reward"**: Reward gains tags

This creates cascading effects through the quest!

## Common Patterns

### Pattern 1: Restrictive Verbs
```
Verb "Destroy" requires ["Structure"]
→ Only 2 of 6 targets have "Structure" tag
→ Match pool = 33%
→ May trigger fallback
```
**Fix**: Add "Structure" tag to more target cards

### Pattern 2: Cascading Requirements
```
Verb requires ["Military"]
→ Target "Knight" selected (has "Military")
→ Location must match "Knight's" tags
→ But Location deck has mostly "Nature" tags
→ Bottleneck at Location step!
```
**Fix**: Add more cards to Location deck with "Military" aspect

### Pattern 3: Balanced System
```
Verb requires: 3+ types in each deck match
→ All steps have 50-70% match pools
→ Fallback rate ~5%
→ No dead cards
```
**This is ideal!**

## Tips & Tricks

1. **Export quests**: Open browser console (F12), type:
   ```javascript
   JSON.stringify(questEngine.getQuest(), null, 2)
   ```
   Copy the output for use elsewhere

2. **Test specific scenarios**: Modify `cards.json`, refresh, test

3. **Find bottlenecks**: Run validation, look for steps with low percentages

4. **Balance cards**: If a card never appears, increase its tag overlap with other decks

5. **Create themes**: All cards with "Magic" aspect → magic-themed quests

## Troubleshooting

### App won't load
- Check browser console (F12 → Console tab)
- Ensure `cards.json` is in same directory as `index.html`
- Try a different browser

### Cards not appearing
- Check JSON syntax in `cards.json`
- Ensure "Deck" field matches deck name exactly (case-sensitive)
- Refresh browser after editing `cards.json`

### Validation too slow
- Try fewer iterations (start with 100)
- Close other browser tabs
- Disable debug mode

### Same quests repeating
- This is normal! Quest System generates from random draws
- Run validation to see how often each card appears
- Check if some cards are overactive

## Next Steps

1. ✓ Generate a few quests to understand the flow
2. ✓ Step-through one quest to see the algorithm
3. ✓ Run validation on sample data
4. ✓ Edit a card's tags and retest
5. ✓ Add your own custom cards
6. ✓ Create themed card decks
7. ✓ Share your card data!

Happy quest generating! 🎲⚔️
