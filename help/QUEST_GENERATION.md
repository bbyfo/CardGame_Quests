# Quest Generation System

## Overview

The Quest Generation system creates dynamic quests by drawing cards from multiple themed decks. Each card contains tags and instructions that influence which cards are drawn next, creating interconnected and thematically consistent quests.

## Deck Types

The system uses seven distinct deck types:

1. **QuestGiver** - Who is giving the quest
2. **HarmedParty** - Who or what has been harmed (optional)
3. **Verb** - The action to be taken
4. **Target** - The objective or subject of the quest
5. **Location** - Where the quest takes place
6. **Twist** - Complications or special conditions
7. **Reward** - What the player receives for success
8. **Failure** - Consequences of quest failure

## Draw Order

Cards are drawn in the following sequence:

1. **QuestGiver** (always first)
2. **HarmedParty** (optional - may be skipped)
3. **Verb** (the core action)
4. **Target** (what the verb acts upon)
5. **Location** (where it happens)
6. **Twist** (complications - may be skipped)
7. **Reward** (success outcome)
8. **Failure** (failure consequence)

## Tag System

### Valid TypeTags and Instruction Tags

All cards use tags from this restricted set:

- `Good` - Heroic, righteous, benevolent
- `Evil` - Malevolent, corrupt, harmful
- `Order` - Structured, lawful, organized
- `Chaos` - Unpredictable, wild, disruptive
- `Arcane` - Magical, mystical, supernatural
- `Nature` - Natural, primal, wild
- `Holy` - Divine, sacred, blessed
- `Martial` - Military, combat, warfare
- `Wealth` - Money, treasure, commerce

### Card Properties

Each card contains:

- **Deck** - Which deck the card belongs to
- **CardName** - The name of the card
- **TypeTags** - Array of tags defining the card's nature
- **AspectTags** - Descriptive flavor tags (not used for matching)
- **mutableTags** - Tags that can be modified during play (currently unused)
- **Instructions** - Array of instructions for influencing subsequent draws

### Instructions

Instructions guide the selection of future cards:

```json
{
  "TargetDeck": "Target",
  "Tags": ["Evil", "Arcane"]
}
```

- **TargetDeck** - Which deck to influence (or "ThisCard" for self-modification)
- **Tags** - Tags that should be present on the drawn card

## Card Selection Process

When drawing a card:

1. Look at instructions from previously drawn cards
2. Filter the target deck to cards matching the instruction tags
3. If no matches exist, draw from the full deck
4. Selected card's instructions then influence subsequent draws

## Example Quest Flow

**Draw 1: QuestGiver - "Archmagus"**
- TypeTags: ["Arcane", "Order"]
- Instructions: Draw Target with ["Arcane"] tag

**Draw 2: Verb - "Investigate"**
- TypeTags: ["Order", "Arcane"]
- Instructions: Draw Target with ["Arcane", "Nature"] tags

**Draw 3: Target - "Lost Library"**
- TypeTags: ["Arcane", "Order"]
- Matches both previous instructions

**Draw 4: Location - "Ancient Ruins"**
- TypeTags: ["Arcane", "Chaos"]

**Draw 5: Twist - "Time Pressure"**
- TypeTags: ["Chaos", "Order"]

**Draw 6: Reward - "Secret Knowledge"**
- TypeTags: ["Arcane", "Order"]

**Draw 7: Failure - "Curse"**
- TypeTags: ["Arcane", "Evil"]

**Result Quest**: "The Archmagus asks you to investigate the Lost Library in the Ancient Ruins, but time pressure complicates matters. Success yields Secret Knowledge, failure results in a Curse."

## Design Principles

1. **Emergent Narrative** - Tag matching creates thematically coherent quests
2. **Variety** - Random selection with constraints ensures no two quests are identical
3. **Flexibility** - Empty instruction tags allow any card to be drawn
4. **Consistency** - Tag restrictions maintain game balance and theme
