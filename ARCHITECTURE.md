# Technical Architecture

## System Overview

The Quest System Generator is a modular, single-page application built with vanilla HTML/JS/CSS. It implements a procedural quest generation algorithm with comprehensive logging and analytics.

```
┌─────────────────────────────────────────┐
│         app.js (Orchestrator)           │
│  - Initializes all modules              │
│  - Manages app state                    │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼──────────┬─────────────────┐
    │         │          │                 │
    ▼         ▼          ▼                 ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│  dataLoader    │  │ questEngine  │  │  validator   │
│  - Load JSON   │  │  - Algorithm │  │  - Analytics │
│  - Init decks  │  │  - Logging   │  │  - Reports   │
└────────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                           ▼
                      ┌─────────────┐
                      │   ui.js     │
                      │  - Controls │
                      │  - Display  │
                      │  - Events   │
                      └─────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │  index.html    │
                    │  styles.css    │
                    └────────────────┘
```

## Module Details

### dataLoader.js
**Purpose**: Load card data and initialize the game state

**Key Classes**:
- `DataLoader`

**Key Methods**:
- `loadData(path)` - Async load JSON file
- `populateDecks(data)` - Parse card data
- `initializeCard(card)` - Add runtime fields
- `getDecks()` - Return fresh deck copies
- `getAllCards()` - Get all cards across decks

**Data Flow**:
```
JSON File → loadData() → populateDecks() → initializeCard()
→ decks object with 6 arrays
```

**Runtime State**:
- Each card gets unique `id` field
- Each card has `mutableTags` array (initialized empty)

### questEngine.js
**Purpose**: Implement the 5-step quest generation algorithm

**Key Classes**:
- `QuestEngine`

**Key Methods**:
- `generateQuest()` - Execute full 5-step algorithm
- `stepDrawVerb()` - Step 1
- `stepDrawTarget(verb)` - Step 2
- `stepDrawLocation(target)` - Step 3
- `stepDrawTwist(location)` - Step 4
- `stepDrawRewardAndFailure()` - Step 5

**Helper Methods**:
- `log(message, data)` - Add entry to logs
- `getCurrentTags(card)` - Get card's computed tags
- `getTagIntersection(tags1, tags2)` - Array intersection
- `countMatchingCards(deck, tags)` - Match pool size
- `getMatchingCards(deck, tags)` - Get matching card array
- `drawRandomCard(deck)` - Uniform random selection
- `drawWithFallback(deck, tags, deckName, targetName)` - Core draw logic
- `applyModifyEffects(card, targetCard)` - Modify handling
- `getQuestSummary()` - Formatted quest output

**Algorithm Flow**:
```
1. Draw Verb (random)
   → Extract verb.Instructions for Target deck

2. Draw Target
   → Match pool = cards with tags from verb's Instructions
   → Draw with fallback (3 fails → auto-accept 4th)
   → Apply target's Modify effects

3. Draw Location
   → Match pool = cards with tags from target's currentTags
   → Draw with fallback
   → Apply location's Modify effects

4. Draw Twist
   → Match pool = cards with tags from location's currentTags
   → Draw with fallback
   → Apply twist's Modify effects

5. Draw Reward & Failure
   → No matching required
   → Apply their Modify effects
```

**Logging System**:
- Every log entry has: timestamp (sequence), message, optional data
- Logs include:
  - What we're looking for
  - Match pool size and percentage
  - Each draw attempt result
  - Why cards were accepted/rejected
  - Modify effects applied

**Statistics Tracked**:
- `drawAttempts` - Total cards drawn
- `fallbacksTriggered` - Times auto-accept triggered
- `modifyEffectsApplied` - Number of Modify instructions executed

### validator.js
**Purpose**: Run multiple iterations and collect analytics

**Key Classes**:
- `QuestValidator`

**Key Methods**:
- `validateAll(iterations, progressCallback)` - Main function
- `generateQuestSilent()` - Generate without logging
- `analyzeQuestRun()` - Extract data from one quest
- `calculateAggregateStats()` - Compute final metrics
- `generateReport()` - Create report object
- `formatReportAsText(report)` - Pretty-print report

**Analytics Tracked**:
- Card utilization:
  - Draw count (attempts to get card)
  - Selected count (times card was used)
  - Dead cards (never selected)
  - Overactive cards (selected >1.5x expected)
- Tag utilization: Frequency of each tag
- Fallback frequency: % of quests using fallback
- Verb tightness: Average match pool percentage
- Routing bottlenecks: Steps with match pool <50%

**Report Structure**:
```json
{
  "summary": { ... },
  "cardUtilization": { ... },
  "tagUtilization": { ... },
  "verbTightness": { ... },
  "routingBottlenecks": { ... }
}
```

### ui.js
**Purpose**: Handle all UI interactions and display

**Key Classes**:
- `UIManager`

**Key Methods**:
- `initialize()` - Bind all event handlers
- `handleGenerate()` - Generate quest button
- `handleStepThrough()` - Enter step-through mode
- `handleNextStep()` - Execute one atomic step
- `handleValidate()` - Run validator
- `displayQuest(quest)` - Render quest in output
- `displayLogs(logs)` - Render log entries
- `displayValidationReport(report)` - Render analytics
- `addLog(message)` - Append single log entry
- `clearLogs()` - Clear log window

**Mode Management**:
- `mode` - "normal" or "step-through"
- `stepState` - Tracks progress in step-through

**UI Elements Connected**:
```
Controls:
  #btn-generate         Generate Quest
  #btn-step-through     Step-Through Mode
  #btn-next-step        Next Step
  #btn-validate         Run Validation
  #btn-clear-logs       Clear Logs
  
Settings:
  #seed-input           Seed value
  #debug-toggle         Debug mode
  #iterations-input     Validation iterations

Display:
  #quest-output         Quest display
  #log-window           Log entries
```

### app.js
**Purpose**: Application entry point and initialization

**Key Functions**:
- `initializeApp()` - Async initialization
- Event: `DOMContentLoaded` - Wait for DOM

**Initialization Order**:
1. Create DataLoader
2. Load cards.json
3. Create QuestEngine with loaded decks
4. Create QuestValidator
5. Create UIManager
6. Bind UI events
7. Display ready message

**Global Variables**:
```javascript
let dataLoader;    // DataLoader instance
let questEngine;   // QuestEngine instance
let validator;     // QuestValidator instance
let uiManager;     // UIManager instance
```

## Data Model

### Card Structure
```javascript
{
  "Deck": "Target|Location|Twist|Reward|Failure|Verb",
  "CardName": "string",
  "TypeTags": ["tag1", "tag2", ...],
  "AspectTags": ["tag1", "tag2", ...],
  "mutableTags": [],  // Runtime field
  "InstructionType": "Modify|null",
  "InstructionSubType": "Add|null",
  "InstructionTarget": "ThisCard|Target|Location|Twist|Reward|Failure|null",
  "InstructionTags": ["tag1", "tag2", ...]
}
```

### Deck Structure
```javascript
{
  "verbs": [Card, Card, ...],        // 5+ cards
  "targets": [Card, Card, ...],      // 6+ cards
  "locations": [Card, Card, ...],    // 5+ cards
  "twists": [Card, Card, ...],       // 4+ cards
  "rewards": [Card, Card, ...],      // 4+ cards
  "failures": [Card, Card, ...]      // 4+ cards
}
```

### Quest Structure
```javascript
{
  "verb": Card,
  "target": Card,
  "location": Card,
  "twist": Card,
  "reward": Card,
  "failure": Card,
  "modifications": [Instruction, ...]  // Future use
}
```

### Log Entry Structure
```javascript
{
  "timestamp": number,      // Sequence number
  "message": string,        // Log message
  "data": object|null       // Optional JSON data
}
```

## Tag System

### Tag Types
- **TypeTags**: Core identity (noun)
  - Examples: "Evil Monster", "Artifact", "Building"
  - Set at card creation
- **AspectTags**: Secondary aspect (adjective)
  - Examples: "Military", "Magic", "Commerce"
  - Set at card creation
- **mutableTags**: Runtime-gained tags
  - Added via Modify effects
  - Example: "Hostile", "Enchanted", "Cursed"

### Tag Matching
When drawing a card with tag requirements:
```javascript
card.currentTags = [...TypeTags, ...AspectTags, ...mutableTags]
isValid = currentTags.some(tag => requiredTags.includes(tag))
```

One match is sufficient (OR logic, not AND).

### Tag Inheritance
Modify effects can target different roles:
```
SourceCard.InstructionTarget = "Target"
→ targetCard.mutableTags += SourceCard.InstructionTags
→ Used in Location matching via target.currentTags
```

This creates cascading constraints.

## Algorithm Deep Dive

### Match Pool Calculation
For each draw step:
```javascript
matchingCards = deck.filter(card => {
  cardTags = [...card.TypeTags, ...card.AspectTags, ...card.mutableTags]
  return requiredTags.some(req => cardTags.includes(req))
})
percentage = (matchingCards.length / deck.length) * 100
```

Result: "[3/6 (50%)]" shows 3 matching cards out of 6 total.

### Draw with Fallback Logic
```javascript
for (let attempt = 1; attempt <= 4; attempt++) {
  card = randomCard(deck)
  if (cardMatches(card)) {
    return card  // Success
  }
  if (attempt === 3) {
    log("Fallback triggered")
    stats.fallbacksTriggered++
    return randomCard(deck)  // Auto-accept 4th
  }
}
```

Ensures quests always complete.

### Modify Effect Application
```javascript
if (card.InstructionType === "Modify" && card.InstructionSubType === "Add") {
  if (card.InstructionTarget === "ThisCard") {
    card.mutableTags.push(...card.InstructionTags)
  } else if (targetCard) {
    targetCard.mutableTags.push(...card.InstructionTags)
  }
  log("Modify effect applied: ...", data)
  stats.modifyEffectsApplied++
}
```

Happens immediately after card selection.

### Step-Through Execution
In step-through mode, each click:
1. Checks current stepState
2. Executes exactly one step's logic
3. Logs detailed state changes
4. Updates UI
5. Increments stepState.step
6. Waits for next click

Allows debugging of specific draws.

## Analytics Pipeline

### Validation Flow
```
for i = 1 to iterations:
  1. Clone decks (fresh state)
  2. generateQuestSilent()  // Suppress logs
  3. analyzeQuestRun()      // Extract metrics
  4. Update stats

calculateAggregateStats()
generateReport()
formatReportAsText() or displayValidationReport()
```

### Card Utilization Tracking
```javascript
cardUtilization[cardId] = {
  deck: "Target",
  name: "Ironfang Raider",
  drawCount: 47,     // Attempted to draw
  selectedCount: 8,  // Actually used
  rejectionCount: 39 // Draw but rejected
}
```

Dead card detection:
```javascript
if (selectedCount === 0) {
  deadCards.add(cardId)
}
```

Overactive detection:
```javascript
if (selectedCount / expectedCount > 1.5) {
  overactiveCards.add(cardId)
}
```

### Bottleneck Detection
```javascript
if (matchPoolPercentage < 50) {
  routingBottlenecks[stepName].occurrences++
}
```

Identifies steps causing delays or failures.

## Performance Considerations

### Quest Generation: ~1-5ms
- Most time in random draws and tag comparisons
- Fallback loop rarely exceeds 4 iterations
- Logging adds ~20% overhead

### Validation Scaling
- 100 iterations: ~100-500ms
- 1000 iterations: ~1-5 seconds
- 10000 iterations: ~15-60 seconds

### Optimization Opportunities
- Seed-based PRNG for faster randomization
- Pre-computed tag indices for faster matching
- Web Workers for parallel validation
- IndexedDB for large card databases

## Extensibility Points

### Adding New Instruction Types
1. Add `InstructionType` to card data
2. Implement handling in `applyModifyEffects()`
3. Update validator to track new type
4. Document in card data spec

### Custom Analytics
1. Extend `QuestValidator` class
2. Add new tracking in `analyzeQuestRun()`
3. Add new report sections in `generateReport()`
4. Format in `formatReportAsText()`

### Seeded Random Generation
1. Implement PRNG (e.g., Seeded Math.random)
2. Replace `Math.random()` in `drawRandomCard()`
3. Seed from UI input
4. Store seed with quest results

### CSV/Excel Export
1. Add parser to `dataLoader.js`
2. Map CSV rows to card objects
3. Validate schema
4. Populate decks

## Testing Strategy

### Unit Tests (Manual)
```javascript
// Test tag intersection
let result = engine.getTagIntersection(
  ["A", "B", "C"], 
  ["B", "D"]
)
// Expected: ["B"]

// Test match pool
let count = engine.countMatchingCards(
  targetDeck,
  ["Military"]
)
// Expected: 3 (if 3 cards have Military tag)
```

### Integration Tests
1. Generate 100 quests
2. Verify all have all 6 roles filled
3. Check logs are comprehensive
4. Verify statistics are accurate

### Validation Tests
1. Run 1000 iterations
2. Verify all cards used at least once (or track as dead)
3. Check fallback rate is reasonable (<20%)
4. Verify no bottlenecks exceed 80%

## Browser APIs Used

- `fetch()` - Load JSON
- `Math.random()` - Random selection
- DOM manipulation - `getElementById`, `innerHTML`, etc.
- Event listeners - `addEventListener`, `addEventListener`
- Array methods - `filter`, `map`, `reduce`, etc.
- JSON - `stringify`, `parse`

No external libraries or frameworks required!

## File Size Summary

- index.html: ~2 KB
- styles.css: ~8 KB
- dataLoader.js: ~2 KB
- questEngine.js: ~12 KB
- validator.js: ~10 KB
- ui.js: ~8 KB
- app.js: ~2 KB
- cards.json: ~10 KB
- Total: ~54 KB (uncompressed)

## Deployment

The entire app can be deployed as a static site:
- No server-side processing required
- No database needed
- No API calls (except loading cards.json)
- Works offline after initial load
- Zero external dependencies

Simply copy all files to a web server directory.
