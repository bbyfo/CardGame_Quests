# Quest System Generator - Complete Package

Welcome! This is a comprehensive quest generation system built with pure HTML/JS/CSS.

## 📚 Documentation Index

### Getting Started
1. **[QUICKSTART.md](QUICKSTART.md)** - Start here! 5-minute quick start guide
2. **[README.md](README.md)** - Complete feature overview and usage guide
3. **[UI_GUIDE.md](UI_GUIDE.md)** - Visual guide to the interface

### For Designers
4. **[CARD_DESIGN.md](CARD_DESIGN.md)** - Design custom card decks
   - Tag strategy
   - Deck balancing techniques
   - Design patterns and examples

### For Developers
5. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
   - Module descriptions
   - Algorithm deep dive
   - Data structures
   - Extensibility points

6. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project completion summary
   - Deliverables checklist
   - Statistics and metrics
   - File manifest

## 📁 File Guide

### Application Files
- **index.html** - Main application page (open this in browser!)
- **app.js** - Application entry point and initialization
- **styles.css** - Complete styling and responsive design
- **cards.json** - Sample card data (24 cards, 6 decks)

### Module Files
- **dataLoader.js** - Load and manage card data
- **questEngine.js** - Core 5-step quest generation algorithm
- **validator.js** - Analytics and validation engine
- **ui.js** - User interface controller and event handlers

### Documentation Files
- **README.md** - User guide and feature reference
- **QUICKSTART.md** - Quick start examples and tips
- **ARCHITECTURE.md** - Technical details and internals
- **CARD_DESIGN.md** - Card design theory and examples
- **UI_GUIDE.md** - Interface layout and flows
- **PROJECT_SUMMARY.md** - Project overview and completion status

## 🚀 Quick Start (2 Minutes)

### 1. Open the App
```
1. Open index.html in your web browser
2. You should see the Quest System interface
```

### 2. Generate a Quest
```
1. Click the blue "Generate Quest" button
2. Watch the log window fill with generation steps
3. View the quest output showing Verb, Target, Location, Twist, Reward, Failure
4. Click "Generate Quest" again for a different quest
```

### 3. Understand the Algorithm
```
1. Click "Step-Through Mode"
2. Click "Next Step" repeatedly
3. Read the log to understand each step
4. Observe how tags flow through the generation
```

## 🎲 Core Concept

The quest generation algorithm works in 5 steps:

```
Step 1: Draw Verb (random)
        ↓
Step 2: Draw Target (matching Verb's requirements)
        ↓
Step 3: Draw Location (matching Target's tags)
        ↓
Step 4: Draw Twist (matching Location's tags)
        ↓
Step 5: Draw Reward + Failure (any cards)
        ↓
Complete Quest
```

Each step logs what it's looking for, how many cards match, and which cards are accepted/rejected.

## 🔧 Features

✅ **Quest Generation** - Full 5-step algorithm with logging
✅ **Step-Through Debugging** - Click-by-click execution
✅ **Validation Mode** - Run 1-10,000 iterations and analyze
✅ **Analytics** - Card utilization, tag frequency, bottlenecks
✅ **Modify Effects** - Cards can add tags to other cards
✅ **Fallback System** - 3 rejections → 4th auto-accepted
✅ **Responsive UI** - Works on desktop, tablet, mobile
✅ **Zero Dependencies** - Pure HTML/JS/CSS

## 📊 Sample Data

The app comes with 24 sample cards across 6 decks:
- **5 Verbs** - Quest objectives (Defend, Retrieve, Destroy, etc.)
- **6 Targets** - Quest subjects (monsters, artifacts, NPCs)
- **5 Locations** - Quest settings (forests, ruins, palaces)
- **4 Twists** - Quest complications (betrayal, time pressure)
- **4 Rewards** - Success outcomes (gold, weapons, honor)
- **4 Failures** - Failure outcomes (death, curses, loss)

Use these to learn the system, then create your own!

## 🎯 User Paths

### Path 1: Learn to Generate Quests (10 minutes)
```
1. Read QUICKSTART.md
2. Open index.html
3. Click "Generate Quest" several times
4. Try "Step-Through Mode" once
5. Run "Validation" with 100 iterations
```

### Path 2: Balance Card Decks (30 minutes)
```
1. Read CARD_DESIGN.md (design theory)
2. Edit cards.json (add/modify cards)
3. Open index.html
4. Test with "Generate Quest" 5 times
5. Run "Validation" with 100 iterations
6. Check report for dead/overactive cards
7. Iterate until balanced
```

### Path 3: Extend the System (1+ hours)
```
1. Read ARCHITECTURE.md thoroughly
2. Study questEngine.js algorithm
3. Understand validator.js analytics
4. Modify code to add features
5. Test extensively
6. Document changes
```

## 💡 Common Tasks

### Generate a quest
```
Click "Generate Quest" button
```

### Learn step-by-step
```
1. Click "Step-Through Mode"
2. Click "Next Step" repeatedly
3. Read log window
```

### Check card balance
```
1. Set iterations to 100
2. Click "Run Validation"
3. Review report for problems
```

### Add a new card
```
1. Edit cards.json
2. Add card to appropriate deck
3. Refresh browser
4. Click "Generate Quest" to test
```

### Create themed deck
```
1. Plan which cards form a theme
2. Edit cards.json with themed cards
3. Run validation to verify balance
4. Share cards.json with others
```

## 🎓 Learning Resources

### Understand the Algorithm
→ Read: ARCHITECTURE.md → Algorithm Deep Dive section
→ Watch: Step-through mode, observing each log message
→ Study: questEngine.js → generateQuest() method

### Design Balanced Cards
→ Read: CARD_DESIGN.md → Balancing Techniques section
→ Learn: Tag strategy and coverage rules
→ Practice: Edit cards.json and run validation

### Extend with Features
→ Read: ARCHITECTURE.md → Extensibility Points
→ Code: dataLoader.js, questEngine.js, validator.js
→ Test: Verify new features work correctly

## 🔍 Troubleshooting

### App won't load
**Solution**: Check browser console (F12 → Console tab)
- Verify index.html is in same directory as other files
- Ensure cards.json exists and is valid JSON
- Try refreshing page (Ctrl+F5)

### Cards not appearing
**Solution**: Run validation to diagnose
- Check if card is "dead" (never selected)
- Verify card has tags matching other decks
- Add more overlapping tags to increase coverage

### Too many fallbacks
**Solution**: Verb requirements too strict
- Reduce specificity of Verb Instructions
- Add matching tags to more target cards
- Check validation report for bottlenecks

### Validation too slow
**Solution**: Reduce workload
- Use fewer iterations (start with 50)
- Close other browser tabs
- Try a faster browser

## 📞 Support

### Check the Documentation
| Problem | Read This |
|---------|-----------|
| How do I use the app? | README.md or QUICKSTART.md |
| How does it work? | ARCHITECTURE.md |
| How do I design cards? | CARD_DESIGN.md |
| How do I use the UI? | UI_GUIDE.md |
| What was made? | PROJECT_SUMMARY.md |

### Check the Code
- questEngine.js - Algorithm implementation
- validator.js - Analytics implementation
- ui.js - Interface implementation
- dataLoader.js - Data loading implementation

### Experiment
- Try different cards in cards.json
- Run validation with different iteration counts
- Use step-through mode to understand flows
- Check browser console for errors (F12)

## 📦 What's Included

```
14 Files (88 KB total):
├── Application (5 files)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── cards.json
│   └── (modules - see below)
├── Modules (4 files)
│   ├── dataLoader.js
│   ├── questEngine.js
│   ├── validator.js
│   └── ui.js
└── Documentation (5 files)
    ├── README.md
    ├── QUICKSTART.md
    ├── ARCHITECTURE.md
    ├── CARD_DESIGN.md
    ├── UI_GUIDE.md
    └── PROJECT_SUMMARY.md
```

## 🎯 Next Steps

1. **Open index.html** in your web browser
2. **Click "Generate Quest"** to see it in action
3. **Read QUICKSTART.md** for your next steps
4. **Modify cards.json** to add custom cards
5. **Run Validation** to analyze balance

## 🚀 Ready to Generate Quests?

Open **index.html** in your browser and start exploring! 🎲⚔️

---

**Quest System Generator v1.0**
- Zero dependencies (pure HTML/JS/CSS)
- Comprehensive documentation
- Sample card data included
- MIT License - Free to use and modify

Have fun creating adventures!
