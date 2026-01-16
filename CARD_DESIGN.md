# Card Design Guide

This guide helps you create balanced, interesting card decks for the Quest System.

## Card Data Template

```json
{
  "Deck": "Target",
  "CardName": "Ironfang Raider",
  "TypeTags": ["Evil Monster", "Humanoid"],
  "AspectTags": ["Military"],
  "InstructionType": "Modify",
  "InstructionSubType": "Add",
  "InstructionTarget": "ThisCard",
  "InstructionTags": ["Hostile"]
}
```

## Deck Design Principles

### Verb Deck (5-8 cards)
**Purpose**: Define the quest objective

**Instructions**: Must include Target matching instructions!

**Design Tips**:
- Use 2-3 TypeTags that clearly identify what kind of target is needed
- Make requirements diverse (some restrictive, some loose)
- Modify effects should enhance the target or downstream roles

**Example Verbs**:
```
"Defend" → requires ["Evil Monster"]
"Retrieve" → requires ["Magical"]
"Destroy" → requires ["Structure"]
"Investigate" → requires ["Location"]
"Rescue" → requires ["Character"]
```

**Bottleneck Prevention**:
- If "Defend" needs "Evil Monster", ensure 40%+ of targets have "Evil Monster"
- If "Retrieve" needs "Magical", ensure 40%+ of targets have "Magical"
- Avoid requiring tags with <30% coverage

### Target Deck (6-12 cards)
**Purpose**: What the quest is about

**Design Tips**:
- Use diverse TypeTags (Evil Monster, Artifact, Location, Character, Structure)
- Use diverse AspectTags (Military, Magic, Commerce, Knowledge, Nature)
- Each card should have 3-5 tags total
- Include cards with every Verb's requirements

**Tag Distribution** (for 6 targets):
```
Type tags: "Evil Monster" (2), "Artifact" (1), "Location" (1), "Character" (1), "Structure" (1)
Aspect tags: "Military" (2), "Magic" (2), "Commerce" (1), "Knowledge" (1)
Total unique tags: ~8-10
```

**Modify Effects**:
- Most targets should have a Modify effect (4-5 out of 6)
- Common targets to modify: Location, Twist, Failure
- Creates cascading constraints

**Example Targets**:
```
1. "Ironfang Raider" - TypeTags: ["Evil Monster", "Humanoid"], AspectTags: ["Military"], Adds ["Hostile"] to ThisCard
2. "Forbidden Amulet" - TypeTags: ["Magical", "Artifact"], AspectTags: ["Ancient"], No Modify
3. "Castle Gate" - TypeTags: ["Structure", "Defense"], AspectTags: ["Military"], Adds ["Fortified"] to Location
4. "Lost Library" - TypeTags: ["Location", "Building"], AspectTags: ["Knowledge"], No Modify
5. "Captured Knight" - TypeTags: ["Character", "Humanoid"], AspectTags: ["Military"], Adds ["Honor"] to Reward
6. "Draconic Drake" - TypeTags: ["Evil Monster", "Creature"], AspectTags: ["Magic"], Adds ["Powerful"] to ThisCard
```

### Location Deck (5-10 cards)
**Purpose**: Where the quest happens

**Constraint**: Must have tags matching the Target!

**Design Tips**:
- Must include tags from diverse targets
- Use AspectTags like: Nature, Military, Magic, Knowledge, Commerce
- Balance restrictive (rare) and permissive (common) tags

**Matching Strategy**:
```
If Target can have [Military, Magic, Knowledge, Commerce]:
  Location deck should have:
    - 2-3 cards with "Military" → match military targets
    - 2-3 cards with "Magic" → match magical targets
    - 1-2 cards with "Knowledge" → match scholarly targets
    - 1-2 cards with "Commerce" → match economic targets
```

**Modify Effects**:
- 50% of locations should have Modify effects
- Common targets: Twist, Failure
- Adds atmospheric or dangerous tags

**Example Locations**:
```
1. "Dark Forest" - TypeTags: ["Wilderness", "Dangerous"], AspectTags: ["Nature"], Adds ["Perilous"] to Twist
2. "Ancient Ruins" - TypeTags: ["Exploration", "Ancient"], AspectTags: ["Mystery"], No Modify
3. "Underground Cavern" - TypeTags: ["Wilderness", "Dangerous"], AspectTags: ["Nature"], Adds ["Hidden"] to ThisCard
4. "Royal Palace" - TypeTags: ["Building", "Safe"], AspectTags: ["Military"], No Modify
5. "Haunted Tower" - TypeTags: ["Building", "Dangerous"], AspectTags: ["Magic"], Adds ["Cursed"] to Failure
```

### Twist Deck (4-8 cards)
**Purpose**: Complication during quest

**Constraint**: Must have tags matching the Location!

**Design Tips**:
- Similar tag distribution to Locations
- Tags should create variety (some positive, some negative)
- Can modify Reward or Failure to swing quest outcomes

**Modify Effects**:
- 75% of twists should have Modify effects
- Can add to Failure (bad twist), Reward (good twist), or Twist (chain complications)

**Example Twists**:
```
1. "Betrayal" - TypeTags: ["Danger", "Social"], AspectTags: ["Mystery"], Adds ["Treacherous"] to Failure
2. "Time Pressure" - TypeTags: ["Challenge", "Urgency"], AspectTags: ["Quest"], No Modify
3. "Hidden Ally" - TypeTags: ["Opportunity", "Social"], AspectTags: ["Compassion"], Adds ["Fortunate"] to Reward
4. "Environmental Hazard" - TypeTags: ["Danger", "Nature"], AspectTags: ["Nature"], Adds ["Deadly"] to ThisCard
```

### Reward Deck (3-6 cards)
**Purpose**: Success outcome

**No Constraints**: Any card can be drawn

**Design Tips**:
- No matching required - can draw any card
- Use TypeTags: "Treasure", "Status", "Information", "Relationship"
- Use AspectTags to create flavor: "Wealth", "Military", "Magic", "Knowledge"

**Modify Effects**:
- 30-50% should have effects
- Usually add positive tags ("Enchanted", "Prestigious")

**Example Rewards**:
```
1. "Gold Coins" - TypeTags: ["Treasure", "Wealth"], AspectTags: ["Commerce"], No Modify
2. "Magical Sword" - TypeTags: ["Weapon", "Magical"], AspectTags: ["Magic"], Adds ["Enchanted"] to ThisCard
3. "Knight's Honor" - TypeTags: ["Status", "Prestige"], AspectTags: ["Military"], No Modify
4. "Secret Knowledge" - TypeTags: ["Information", "Secrets"], AspectTags: ["Knowledge"], No Modify
```

### Failure Deck (3-6 cards)
**Purpose**: Failure outcome

**No Constraints**: Any card can be drawn

**Design Tips**:
- Worst possible outcomes
- Use TypeTags: "Permanent", "Catastrophic", "Temporary", "Confinement"
- Use AspectTags to create fear: "Doom", "Loss", "Suffering"

**Modify Effects**:
- 50-75% should have effects
- Usually add negative tags ("Cursed", "Afflicted", "Imprisoned")

**Example Failures**:
```
1. "Death" - TypeTags: ["Permanent", "Catastrophic"], AspectTags: ["Doom"], No Modify
2. "Imprisonment" - TypeTags: ["Confinement", "Temporary"], AspectTags: ["Doom"], No Modify
3. "Curse" - TypeTags: ["Magical", "Permanent"], AspectTags: ["Magic"], Adds ["Afflicted"] to ThisCard
4. "Loss of Treasure" - TypeTags: ["Economic", "Temporary"], AspectTags: ["Commerce"], No Modify
```

## Tag Strategy

### Tag Naming
- Use PascalCase for multi-word tags: "Evil Monster", "Humanoid", "Military"
- Be consistent: Don't use both "Evil" and "Demonic"
- Avoid abbreviations: Use "Unknown", not "????"
- Keep 20-30 total unique tags across all decks

### Tag Hierarchy
```
ASPECT TAGS (How the card is perceived)
├── Military (soldiers, weapons, fortifications)
├── Magic (spells, enchantments, wizardry)
├── Commerce (money, trade, goods)
├── Knowledge (learning, secrets, mysteries)
├── Nature (wilderness, animals, weather)
├── Compassion (helping, saving, caring)
└── Doom (death, curses, evil)

TYPE TAGS (What the card IS)
├── Evil Monster / Good Character
├── Artifact / Treasure
├── Location / Building
├── Weapon / Item
├── Structure / Defense
└── Challenge / Opportunity

MUTABLE TAGS (Gained during quest)
├── Hostile (from target modifications)
├── Enchanted (from reward modifications)
├── Cursed (from failure modifications)
├── Dangerous (from environmental effects)
└── [Custom effects]
```

## Balancing Techniques

### Technique 1: Tag Distribution
Ensure every Verb's requirement exists in 40-60% of targets:
```
"Defend" requires ["Evil Monster"]
→ Count targets with "Evil Monster": 2/6 = 33% ❌ TOO LOW
→ Solution: Add "Evil Monster" to one more target or add more Evil Monsters
```

### Technique 2: Cascading Tags
Use Modify effects to create interesting constraints:
```
Target "Fortress" adds ["Military"] to Location
→ Location must now match fortress's military nature
→ Only 30% of locations have "Military"
→ Creates bottleneck!
→ Solution: Add "Military" to more locations, or target fewer "Fortress"
```

### Technique 3: Fallback Tolerance
Monitor fallback rate in validation:
```
Fallback rate > 20% → Requirements too strict
→ Solution: Increase tag coverage or reduce requirement specificity
```

### Technique 4: Card Utilization
Ensure all cards are used in validation:
```
"Death" failure appears in 0/100 quests (dead card)
→ Solution: Add tags to make it match twists, or increase frequency
```

## Advanced Design Patterns

### Pattern 1: Heroic Quests
```
Verbs: "Rescue", "Protect", "Retrieve"
Targets: "Maidens", "Children", "Sacred Items"
Locations: "Towers", "Dungeons", "Temples"
Twists: "Betrayal", "Time Pressure", "Secret Ally"
Rewards: "Love", "Fame", "Blessing"
Failures: "Capture", "Death", "Damnation"
```

### Pattern 2: Dark Questline
```
Verbs: "Destroy", "Corrupt", "Betray"
Targets: "Good NPCs", "Holy Sites", "Innocent"
Locations: "Cemeteries", "Tombs", "Cursed Lands"
Twists: "Temptation", "Possession", "Sacrifice"
Rewards: "Power", "Immortality", "Knowledge"
Failures: "Redemption", "Purification", "Banishment"
```

### Pattern 3: Mystery Questline
```
Verbs: "Investigate", "Discover", "Uncover"
Targets: "Clues", "Suspects", "Artifacts"
Locations: "Crime Scenes", "Libraries", "Hidden Chambers"
Twists: "Red Herring", "Revelation", "Unexpected Truth"
Rewards: "Truth", "Justice", "Understanding"
Failures: "Misdirection", "Darkness", "Madness"
```

## Testing Your Deck

### Quick Test: Run Validation
```javascript
// After editing cards.json
1. Refresh page
2. Set iterations to 100
3. Click "Run Validation"
4. Check results for:
   - Dead cards (fix by adding tags)
   - Overactive cards (fix by removing redundant tags)
   - Fallback rate <20%
   - No major bottlenecks
```

### Manual Test: Generate 10 Quests
```
1. Click "Generate Quest" 10 times
2. Note which cards appear most/least
3. Check for interesting variety
4. Look for logical quest narratives
```

### Debug Test: Step-Through
```
1. Click "Step-Through Mode"
2. Click "Next Step" repeatedly
3. Observe log window for:
   - What we're looking for
   - Match pools at each step
   - Modification effects
   - Whether fallback triggers
```

## Design Worksheet

### Planning Your Deck

```
VERBS (What are the objectives?)
1. _________________ → requires [_______________]
2. _________________ → requires [_______________]
3. _________________ → requires [_______________]

TARGETS (What can be quested?)
1. _________________ → TypeTags: [____________], AspectTags: [____________]
2. _________________ → TypeTags: [____________], AspectTags: [____________]
...

LOCATIONS (Where do quests happen?)
1. _________________ → AspectTags: [____________]
2. _________________ → AspectTags: [____________]
...

Coverage Check:
Verb "____________" needs ["____________"]
→ Targets with this tag: _____ out of _____ = ____% ✓/✗

Verb "____________" needs ["____________"]
→ Targets with this tag: _____ out of _____ = ____% ✓/✗
```

## Example: Complete Themed Deck

### "Conquest" Theme

**Verbs**:
- "Conquer" requires ["Structure"] - take a fortification
- "Siege" requires ["Castle", "Evil"] - besiege evil stronghold
- "Liberate" requires ["Prisoner", "Oppressed"] - free the enslaved

**Targets**:
- "Castle Stronghold" (Structure, Evil, Military) - Adds "Fortified" to Location
- "Dragon's Hoard" (Treasure, Evil, Magic) - Adds "Guarded" to Location
- "Enchanted Prison" (Building, Evil, Magic) - Adds "Perilous" to Twist

**Locations**:
- "Barren Wastes" (Dangerous, Military) - Adds "Desolate" to Twist
- "Cursed Mountains" (Dangerous, Magic) - Adds "Ominous" to Twist
- "Devastated Kingdom" (War, Military) - No modification

**Twists**:
- "Enemy Reinforcements" (Combat, Military) - Adds "Desperate" to Failure
- "Betrayal by Allies" (Social, Military) - Adds "Treacherous" to Failure
- "Civilian Casualties" (Moral, Military) - Adds "Tragic" to Failure

**Rewards**:
- "Territory Claimed" (Status, Military) - Adds "Glorious" to ThisCard
- "Peace Restored" (Status, Military) - Adds "Blessed" to ThisCard

**Failures**:
- "Total Defeat" (Catastrophic, Military) - Adds "Devastating" to ThisCard
- "Occupation Begins" (Control, Military) - Adds "Enslaved" to ThisCard

This creates a cohesive "conquest" narrative where all cards reinforce military, conflict-driven themes!

## Common Mistakes to Avoid

❌ **Don't**: Create verbs with impossible requirements
- "Slay [Unicorn]" when no targets have "Unicorn"

❌ **Don't**: Create all cards with identical tags
- All targets are "[Good, Hero]" → no variety

❌ **Don't**: Make Modify effects that create dead ends
- Location adds "Exotic" but Location matching doesn't use "Exotic"

❌ **Don't**: Ignore tag coverage
- 10 verbs all requiring different tags, only 1-2 targets per requirement

✓ **Do**: Create diverse, interconnected decks

✓ **Do**: Test with validation to verify balance

✓ **Do**: Use Modify effects strategically

✓ **Do**: Iterate and refine based on analytics

Happy designing! 🎨⚔️
