# User Interface Guide

## Main Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚔️ Quest System Generator - Generate, debug, analyze quests   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┬───────────────────────┬───────────────────────┐
│                  │                       │                       │
│  CONTROLS PANEL  │   QUEST OUTPUT        │     QUEST OUTPUT      │
│                  │   (Top Right)         │     (Top Right)       │
│  - Generate      ├───────────────────────┤                       │
│  - Step-Through  │ Generated Quest:      │ [Quest details shown  │
│  - Validate      │                       │  in this area]        │
│  - Settings      │ Verb: Defend          │                       │
│  - Clear Logs    │ Target: Ironfang...   │                       │
│                  │ Location: Dark...     │                       │
│                  │ Twist: Betrayal...    │                       │
│                  │ Reward: Gold Coins... │                       │
│                  │ Failure: Death...     │                       │
├──────────────────┼───────────────────────┴───────────────────────┤
│                  │                                               │
│                  │           LOG WINDOW (Full Width)             │
│                  │                                               │
│                  │ [0] === STEP 1: Draw Verb ===               │
│                  │ [1] Verb drawn: "Defend"                     │
│                  │ [2] Verb target requirement: ["Evil Monster"]│
│                  │ [3] === STEP 2: Draw Target ===             │
│                  │ [4] Looking for target with tags...          │
│                  │ [5] Match pool: 2/6 (33.3%)                  │
│                  │ [6] Target Draw #1: REJECTED                 │
│                  │ [7] Target Draw #2: ACCEPTED                 │
│                  │ ... (scrollable, auto-scroll to bottom)      │
│                  │                                               │
└──────────────────┴───────────────────────────────────────────────┘
```

## Controls Panel Details

### Generation Modes
```
┌─────────────────────────┐
│  Generation Modes       │
├─────────────────────────┤
│ [Generate Quest] ◄──── Generate a full quest immediately
│ [Step-Through Mode]    Enter step-by-step debugging mode
│ [Next Step]            Execute one atomic action
│                         (Only enabled in step-through mode)
└─────────────────────────┘
```

### Validation Section
```
┌─────────────────────────┐
│  Validation             │
├─────────────────────────┤
│ Iterations: [100    ] ◄ Set number of iterations (1-10000)
│ [Run Validation]       Run analysis on N iterations
│                        Shows analytics and reports
└─────────────────────────┘
```

### Settings Section
```
┌─────────────────────────┐
│  Settings               │
├─────────────────────────┤
│ Seed: [____________]   Reproducible generation (future)
│ ☐ Debug Mode           Verbose console output
└─────────────────────────┘
```

### Utility Buttons
```
┌─────────────────────────┐
│ [Clear Logs]           Clear log window
└─────────────────────────┘
```

## Quest Output Display

### Standard Quest Display
```
Generated Quest

┌─────────────────────────────────────────────┐
│ Verb: Defend                                │
├─────────────────────────────────────────────┤
│ Target: Ironfang Raider                     │
│ Type Tags: Evil Monster, Humanoid           │
│ Aspect Tags: Military                       │
│ Mutable Tags: Hostile                       │
├─────────────────────────────────────────────┤
│ Location: Dark Forest                       │
│ Type Tags: Wilderness, Dangerous            │
│ Aspect Tags: Nature                         │
│ Mutable Tags: Perilous                      │
├─────────────────────────────────────────────┤
│ Twist: Betrayal                             │
│ Type Tags: Danger, Social                   │
│ Aspect Tags: Mystery                        │
│ Mutable Tags: Treacherous                   │
├─────────────────────────────────────────────┤
│ Reward: Gold Coins                          │
│ Failure: Death                              │
└─────────────────────────────────────────────┘
```

### Validation Report Display
```
Validation Report

┌─────────────────────────────────────────────┐
│ Summary                                     │
├─────────────────────────────────────────────┤
│ Total Iterations: 100                       │
│ Avg Draws/Quest: 1.25                       │
│ Fallback Rate: 8%                           │
├─────────────────────────────────────────────┤
│ Card Utilization                            │
├─────────────────────────────────────────────┤
│ Total Cards: 28                             │
│ Cards Used: 27                              │
│ Dead Cards: 1                               │
│ Overactive Cards: 2                         │
├─────────────────────────────────────────────┤
│ Top Tags                                    │
│ 1. Military: 87 uses                        │
│ 2. Magic: 65 uses                           │
│ 3. Evil Monster: 42 uses                    │
│ ...                                         │
└─────────────────────────────────────────────┘
```

## Log Window Format

### Log Entry Components
```
[0] === STEP 1: Draw Verb ===
└─┬─┘
  └─── Timestamp (sequence number)

[1] Verb drawn: "Defend"
    └────┬────────────────── Message

[5] Match pool: 2/6 (33.3%)  {"matchCount":2,"total":6,"percent":33.3}
    └────┬─────────────────┘ └────────┬────────────────────────┘
         └─ Message                   └─ Optional JSON data
```

### Common Log Messages

#### Step Markers
```
[0] === STEP 1: Draw Verb ===
[8] === STEP 2: Draw Target ===
[15] === STEP 3: Draw Location ===
[22] === STEP 4: Draw Twist ===
[29] === STEP 5: Draw Reward and Failure ===
[36] === QUEST GENERATION COMPLETE ===
```

#### Draw Results
```
[1] Verb drawn: "Defend"
[4] Looking for target with tags: ["Evil Monster"]
[5] Match pool: 2/6 (33.3%)
[6] Target Draw #1: REJECTED "Forgotten Amulet" (no matching tags)
[7] Target Draw #2: ACCEPTED "Ironfang Raider" (matched tags: Evil Monster)
```

#### Fallback Trigger
```
[8] Target Draw #3: REJECTED "Draconic Drake"
[9] Fallback triggered - auto-accepting next card
[10] Target Draw #4 (FALLBACK): Auto-accepted "Castle Gate"
```

#### Modify Effects
```
[11] Modify Effect: "Ironfang Raider" gained tags [Hostile]
[12] Modify Effect: "Dark Forest" gained tags [Perilous] from "Location"
```

#### Statistics
```
[37] Total draw attempts: 6
[38] Fallbacks triggered: 1
[39] Modify effects applied: 3
```

## Color Scheme

### UI Colors
```
Primary (Blue):      #3498db   - Buttons, highlights, links
Secondary (Gray):    #bdc3c7   - Borders, secondary buttons
Accent (Orange):     #f39c12   - Validation button
Danger (Red):        #c0392b   - Clear/reset buttons
Dark (Dark Gray):    #2c3e50   - Text, headers
Light (Light Gray):  #ecf0f1   - Backgrounds
```

### Log Colors
```
Background:   #1a1a1a (Black)
Text:         #0f0     (Green)
Timestamp:    #f39c12  (Orange)
Data JSON:    #aaa     (Gray)
Errors:       #ff6b6b  (Red)
```

## Responsive Behavior

### Desktop (>1400px)
```
┌─────────────────────────────────────────────────┐
│ HEADER (Full width)                             │
├──────────┬──────────────────┬──────────────────┤
│CONTROLS  │   QUEST OUTPUT   │   QUEST OUTPUT   │
│(250px)   │   (Top Right)    │   (Top Right)    │
│          ├──────────────────┴──────────────────┤
│          │   LOG WINDOW (Full width bottom)   │
├──────────┴──────────────────────────────────────┤
│ FOOTER (Full width)                             │
└─────────────────────────────────────────────────┘
```

### Tablet (768px-1400px)
```
┌─────────────────────────────────────┐
│ HEADER (Full width)                 │
├────────┬──────────────────────────┤
│CONTROLS│   QUEST OUTPUT           │
│(220px) ├──────────────────────────┤
│        │   LOG WINDOW             │
├────────┴──────────────────────────┤
│ FOOTER (Full width)                 │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────┐
│ HEADER (Full width)     │
├─────────────────────────┤
│ CONTROLS (Full width)   │
├─────────────────────────┤
│ QUEST OUTPUT (Full)     │
├─────────────────────────┤
│ LOG WINDOW (Full)       │
├─────────────────────────┤
│ FOOTER (Full width)     │
└─────────────────────────┘
```

## Interaction Flows

### Generate Quest Flow
```
User clicks [Generate Quest]
         ↓
     handleGenerate()
         ↓
 questEngine.generateQuest()
         ↓
   [5-step algorithm executes]
         ↓
  displayQuest(quest)
  displayLogs(logs)
         ↓
 UI updates with quest & logs
```

### Step-Through Flow
```
User clicks [Step-Through Mode]
         ↓
 Mode = "step-through"
 stepState initialized
         ↓
 User clicks [Next Step]
         ↓
  Check stepState.step
  Execute stepDrawX()
  Add logs
  Increment step
         ↓
 UI updates with progress
         ↓
 (Repeat until quest complete)
```

### Validation Flow
```
User sets Iterations & clicks [Run Validation]
         ↓
 validator.validateAll(N)
         ↓
 for each iteration:
   - Clone decks
   - generateQuestSilent()
   - analyzeQuestRun()
   - Track metrics
         ↓
 calculateAggregateStats()
 generateReport()
         ↓
 displayValidationReport(report)
 displayLogs(report text)
         ↓
 UI shows analytics
```

## Keyboard & Accessibility

### Keyboard Navigation
- `Tab` - Navigate between buttons
- `Enter` - Activate focused button
- `Escape` - Clear focus (context-dependent)

### Button States
```
Normal:     Blue background, clickable
Hover:      Darker blue, raised effect (2px lift)
Active:     Pressed effect (0px lift)
Disabled:   Grayed out, 50% opacity, not clickable
```

### Focus Indicators
```
Focused buttons:  Blue outline, high contrast
Focused input:    Blue border, glow effect
```

## Best Practices

### For Users
✓ Use **Step-Through Mode** to learn the algorithm
✓ Run **Validation** to test card balance
✓ Check **Log Window** when quests seem repetitive
✓ Use **Clear Logs** to start fresh between tests

### For Card Designers
✓ After editing cards.json, refresh browser
✓ Run validation with 100+ iterations
✓ Check for **Dead Cards** (need more tags)
✓ Check for **Overactive Cards** (need fewer tags)
✓ Monitor **Fallback Rate** (should be <20%)

### For Developers
✓ Open **Browser Console** (F12) for debugging
✓ Check **Network Tab** to verify cards.json loads
✓ Use **Debugger** to step through code
✓ Monitor **Performance** for large validations

## Troubleshooting UI Issues

### Log Window Not Updating
- Check browser console for errors
- Refresh page (Ctrl+F5)
- Verify cards.json loads correctly

### Buttons Not Responding
- Ensure JavaScript is enabled
- Try different browser
- Check for script errors in console

### Slow Validation
- Use fewer iterations (start with 50)
- Close other browser tabs
- Check if browser processes are running

### Quest Display Broken
- Verify cards.json format is valid
- Check that all roles are present
- Refresh page if styles failed to load

---

This visual guide should help users navigate the application effectively! 🎨⚔️
