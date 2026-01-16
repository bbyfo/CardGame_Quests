# Quest System Generator

A comprehensive HTML/JS/CSS application for generating, debugging, and analyzing procedural quests following the Quest System rules.

## Features

### 🎲 Quest Generation
- **Full 5-Step Algorithm**: Draw Verb → Target → Location → Twist → Reward/Failure
- **Detailed Logging**: Every draw attempt, match pool calculation, and decision is logged
- **Modify Effects**: Cards can add tags to themselves, targets, or other quest components
- **Fallback Mechanism**: After 3 rejections, the 4th draw is auto-accepted

### 🔍 Step-Through Debugging Mode
- Click-by-click quest generation
- See exactly what the engine is looking for at each step
- View match pool sizes and percentages before each draw
- Debug Modify effects and tag mutations in real-time

### 📊 Validation & Analytics
Run 100-10,000 iterations and get detailed analytics:
- **Card Utilization**: Draw counts, selection counts, dead cards
- **Overactive Cards**: Which cards appear too frequently
- **Tag Utilization**: Most used tags and their frequency
- **Fallback Frequency**: How often the fallback mechanism triggers
- **Verb Tightness**: Average match pool sizes
- **Routing Bottlenecks**: Steps with restrictive requirements

## Getting Started

### 1. Open the App
Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari).

### 2. Load Card Data
The app automatically loads `cards.json`. The included sample includes:
- 5 Verbs (Defend, Retrieve, Destroy, Investigate, Rescue)
- 6 Targets (monsters, artifacts, locations, NPCs)
- 5 Locations (forests, ruins, caverns, palaces, towers)
- 4 Twists (betrayal, time pressure, allies, hazards)
- 4 Rewards (gold, weapons, honor, knowledge)
- 4 Failures (death, imprisonment, curses, loss)

### 3. Generate Quests
Click **Generate Quest** to create a random quest following the algorithm.

### 4. Step-Through Mode
Click **Step-Through Mode**, then **Next Step** to advance one atomic action at a time. Useful for learning the algorithm.

### 5. Run Validation
Set the iteration count and click **Run Validation**. Results include usage statistics and bottleneck analysis.

## Project Structure

```
app/
├── index.html          # Main HTML layout
├── styles.css          # Styling and responsive design
├── cards.json          # Card data (JSON)
├── dataLoader.js       # Card data loading module
├── questEngine.js      # Core quest generation algorithm
├── validator.js        # Validation and analytics engine
├── ui.js              # UI controller and event handlers
├── app.js             # Application entry point
└── README.md          # This file
```

## Card Data Format

Each card object has the following structure:

```json
{
  "Deck": "Target",
  "CardName": "Ironfang Raider",
  "TypeTags": ["Evil Monster", "Humanoid"],
  "AspectTags": ["Military"],
  "mutableTags": [],
  "InstructionType": "Modify",
  "InstructionSubType": "Add",
  "InstructionTarget": "ThisCard",
  "InstructionTags": ["Hostile"]
}
```

- **Deck**: One of: verbs, targets, locations, twists, rewards, failures
- **CardName**: Unique identifier for the card
- **TypeTags**: Primary card categories
- **AspectTags**: Secondary card categories
- **mutableTags**: Runtime-modified tags (populated during quest generation)
- **InstructionType**: "Modify" or null
- **InstructionSubType**: "Add" or null
- **InstructionTarget**: "ThisCard", "Target", "Location", "Twist", "Reward", "Failure", or null
- **InstructionTags**: Tags to add when instruction executes

## Algorithm Overview

### Step 1: Draw Verb
- Select a random Verb card
- Extract the Verb's TargetRequirement (array of tag requirements)

### Step 2: Draw Target
- Compute match pool: count cards with at least one tag from TargetRequirement
- Draw randomly until:
  - A card matches (accepted)
  - 3 cards don't match (fallback: auto-accept the 4th)
- Apply the Target's Modify effects

### Step 3: Draw Location
- Compute match pool: count cards with at least one tag from Target's current tags
- Same draw logic as Step 2
- Apply Location's Modify effects

### Step 4: Draw Twist
- Compute match pool: count cards with at least one tag from Location's current tags
- Same draw logic as Step 2
- Apply Twist's Modify effects

### Step 5: Draw Reward & Failure
- Draw normally (no matching required)
- Apply their Modify effects

## Logging System

The log window shows:
- `[timestamp]` - Sequence number
- Message - What happened
- Data - JSON data for draw attempts, tag changes, etc.

Common log entries:
- Draws: Which card was drawn and whether it was accepted/rejected
- Match Pools: How many cards qualified for this step (count/total %)
- Modify Effects: Tags added to cards
- Fallback Triggers: When auto-accept was invoked

## UI Sections

### Controls Panel (Left)
- **Generate Quest**: Full quest generation in one click
- **Step-Through Mode**: Enable step-by-step debugging
- **Next Step**: Perform one atomic action
- **Run Validation**: Run N iterations
- **Settings**: Seed input and debug toggle
- **Clear Logs**: Clear the log window

### Quest Output (Top Right)
- Displays the generated quest with all selected cards
- Shows computed tags for each card (Type, Aspect, Mutable)
- Updates in real-time during step-through mode

### Log Window (Bottom)
- Real-time log of all generation steps
- Shows match pools, draw attempts, rejections, and Modify effects
- Scrollable and auto-scrolling to latest entries
- Color-coded for readability

## Validator Report Metrics

### Summary
- Total iterations run
- Total draws performed
- Average draws per quest
- Fallback rate (percentage of quests using fallback)
- Average Modify effects per quest

### Card Utilization
- Total cards in system
- Cards that were selected at least once
- Dead cards (never selected)
- Overactive cards (selected >1.5x expected frequency)

### Tag Utilization
- Unique tags across all cards
- Top 20 most-used tags
- Usage frequency for each tag

### Verb Tightness
- Average match pool percentage (lower = more restrictive)
- Helps identify bottlenecks in the verb requirements

### Routing Bottlenecks
- Steps with match pools < 50%
- Frequency of bottleneck occurrence
- Identifies design issues (e.g., too-restrictive target requirements)

## Customizing Card Data

Edit `cards.json` to add your own cards:

1. Add cards to the appropriate deck array
2. Use consistent tag naming (tags are case-sensitive)
3. Add Modify effects to make cards more impactful
4. Run validation to identify dead or overactive cards

### Design Tips
- Use 8-12 cards per deck for good variety
- Ensure TargetRequirement tags match some cards in the Target deck
- Use Modify effects to create cascading effects
- Test with validation mode to find bottlenecks

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses ES6 features)

## Performance Notes

- Quest generation: ~1-5ms per quest
- Validation 100 iterations: ~100-500ms
- Validation 1000 iterations: ~1-5 seconds
- Validation 10000 iterations: ~15-60 seconds

For large validation runs, browser may briefly unrespond. This is normal.

## Future Enhancements

Possible additions:
- Seed-based PRNG for reproducible quests
- CSV import/export for card data
- Visual card browser
- Custom deck creation UI
- More detailed bottleneck analysis
- Quest export to text/JSON
- Constraint satisfaction solver

## License

MIT License - Free to use and modify

## Credits

Quest System Generator v1.0
Built with Pure HTML/JS/CSS (no frameworks)
