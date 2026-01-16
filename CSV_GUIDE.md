# CSV Import/Export Guide

## Overview

You can now manage your card data in Google Sheets and import it into the Quest System Generator. This allows you to:

- **Design cards in Google Sheets** (easy collaboration)
- **Download as CSV** from Google Sheets
- **Import into Quest System** with automatic JSON conversion
- **Export quests back to CSV** for use elsewhere

## Quick Start

### 1. Get the CSV Template

1. Open the app (index.html)
2. Click **"Download CSV Template"** in the Data Management section
3. This downloads `quest_cards_template.csv`

### 2. Edit in Google Sheets

1. Open Google Sheets
2. Create a new sheet
3. In menu: **File → Import → Upload**
4. Select `quest_cards_template.csv`
5. Choose "Replace spreadsheet"
6. Now you can edit your cards in Google Sheets!

### 3. Download from Google Sheets

1. In Google Sheets: **File → Download → Comma Separated Values (.csv)**
2. This downloads your updated cards as CSV

### 4. Import into Quest System

1. Open the app (index.html)
2. Click **"Import from CSV"** in the Data Management section
3. Select your CSV file
4. The app validates and loads your cards
5. You're ready to generate quests!

### 5. Export Your Decks

1. After generating quests or testing
2. Click **"Export as CSV"** to save as `quest_cards.csv`
3. Use this to share your decks or back them up

## CSV Format

### Column Headers

```
Deck,CardName,TypeTags,AspectTags,InstructionType,InstructionSubType,InstructionTarget,InstructionTags,TargetRequirement
```

### Column Definitions

| Column | Type | Required | Example | Notes |
|--------|------|----------|---------|-------|
| **Deck** | Text | Yes | Verb, Target, Location, Twist, Reward, Failure | One of these 6 values |
| **CardName** | Text | Yes | Ironfang Raider | Unique within deck |
| **TypeTags** | Text | No | Evil Monster;Humanoid | Semicolon-separated (;) |
| **AspectTags** | Text | No | Military | Semicolon-separated (;) |
| **InstructionType** | Text | No | Modify | Currently only "Modify" supported |
| **InstructionSubType** | Text | No | Add | Currently only "Add" supported |
| **InstructionTarget** | Text | No | ThisCard, Target, Location, Twist, Reward, Failure | Where the tags go |
| **InstructionTags** | Text | No | Hostile;Powerful | Semicolon-separated (;) |
| **TargetRequirement** | Text | No* | Evil Monster | Semicolon-separated (;) *Required only for Verb deck |

### Example CSV

```
Deck,CardName,TypeTags,AspectTags,InstructionType,InstructionSubType,InstructionTarget,InstructionTags,TargetRequirement
Verb,Defend,Protective;Action,Military,Modify,Add,Target,,Evil Monster
Verb,Retrieve,Heroic;Action,Quest,,,,Magical
Target,Ironfang Raider,Evil Monster;Humanoid,Military,Modify,Add,ThisCard,Hostile,
Target,Forbidden Amulet,Magical;Artifact,Ancient,,,,
Location,Dark Forest,Wilderness;Dangerous,Nature,Modify,Add,Twist,Perilous,
Location,Ancient Ruins,Exploration;Ancient,Mystery,,,,
Twist,Betrayal,Danger;Social,Mystery,Modify,Add,Failure,Treacherous,
Twist,Time Pressure,Challenge;Urgency,Quest,,,,
Reward,Gold Coins,Treasure;Wealth,Commerce,,,,
Reward,Magical Sword,Weapon;Magical,Magic,Modify,Add,ThisCard,Enchanted,
Failure,Death,Permanent;Catastrophic,Doom,,,,
Failure,Curse,Magical;Permanent,Magic,Modify,Add,ThisCard,Afflicted,
```

## Tag Format

### Separators

- **Semicolons** (`;`) - Recommended: "Evil Monster;Humanoid"
- **Pipes** (`|`) - Alternative: "Evil Monster|Humanoid"
- **Commas** (`,`) - Alternative: "Evil Monster,Humanoid" (tricky in CSV!)

**Recommendation**: Use semicolons (`;`) for clarity in CSV files.

### Examples

```
Single tag:        "Military"
Multiple tags:     "Evil Monster;Humanoid;Undead"
Aspect tags:       "Military;Magic;Commerce"
Instruction tags:  "Hostile;Powerful;Cursed"
Target requirement:"Evil Monster;Magical;Character"
```

## Google Sheets Workflow

### Setting up in Google Sheets

1. **Download template** from Quest System app
2. **Upload to Google Sheets**:
   - File → Import → Upload
   - Choose `quest_cards_template.csv`
   - Select "Replace spreadsheet"
3. **Add rows** for your custom cards
4. **Freeze header row** (View → Freeze → 1 row)
5. **Use data validation**:
   - Select Deck column
   - Data → Data validation
   - Criteria: List of items
   - Enter: `Verb,Target,Location,Twist,Reward,Failure`
6. **Share with team** for collaboration

### Formatting Tips

- **Bold header row** for clarity
- **Alternating row colors** for readability
- **Freeze first row** so it stays visible while scrolling
- **Set column widths**:
  - Deck: 100px
  - CardName: 200px
  - Tags: 250px each
  - Instructions: 150px each

### Before Exporting

1. **Remove any test rows** you created
2. **Check for blank rows** between sections
3. **Verify all card names** are unique within their deck
4. **Verify all tags** are spelled correctly (case-sensitive!)
5. **Check all required fields** are filled

## Validation Rules

When you import CSV, the app checks:

✓ **Required fields present**: Deck, CardName  
✓ **Valid deck names**: One of the 6 deck types  
✓ **Deck size minimums**:
  - Verbs: 3+ cards
  - Targets: 4+ cards
  - Locations: 3+ cards
  - Twists: 3+ cards
  - Rewards: 2+ cards
  - Failures: 2+ cards

✓ **Unique card names** within each deck  
✓ **Verb TargetRequirement**: All verbs must have requirements

⚠️ **Warnings** (non-blocking):
- Decks below recommended sizes
- Missing tags that might cause matching issues
- Cards with no tags

## Error Handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing required columns" | Headers incorrect | Use template from app |
| "Invalid deck: XYZ" | Deck name misspelled | Use exact names: Verb, Target, Location, Twist, Reward, Failure |
| "Duplicate card name" | Same name in one deck | Rename one of the cards |
| "Missing TargetRequirement" | Verb without targets | Add requirement for each verb |
| "CSV must have headers" | No header row | First row must be headers |

### Error Messages in Log

When import fails, check the log window for:
- Which row has the problem
- What the problem is
- How to fix it

Example:
```
Row 5: Missing TargetRequirement
```

Means row 5 is a Verb without a TargetRequirement.

## Tips & Tricks

### Tip 1: Bulk Tag Entry

In Google Sheets, create a separate "Tags" sheet with common tags, then reference them:
```
=ARRAYFORMULA(FILTER(Tags!A:A, Tags!B:B="Military"))
```

This helps with consistency and reduces typos.

### Tip 2: Card Combinations

Use formulas to track which cards go well together:
```
=COUNTIF(Targets!C:C, D2)
```

This counts how many targets have a specific aspect tag.

### Tip 3: Template Versioning

Keep versioned copies:
- `quest_cards_v1.csv`
- `quest_cards_v2.csv`
- `quest_cards_v3.csv`

This lets you track changes over time.

### Tip 4: Collaborative Editing

Share the Google Sheet with your team:
1. Click "Share" in Google Sheets
2. Add team members' emails
3. They can edit in real-time
4. Comments help discuss card design

### Tip 5: Backup Exports

Regularly export your decks:
1. Click "Export as CSV"
2. Save as `quest_cards_YYYY-MM-DD.csv`
3. Keep backups in case of accidents

## Advanced Usage

### Custom Instruction Formats

Future versions might support:
- Remove tags: `InstructionSubType = "Remove"`
- Replace tags: `InstructionSubType = "Replace"`
- Conditional effects: `InstructionCondition = "IfTarget=Evil"`

For now, only `Add` is supported.

### Multi-Language Support

To add translations:
1. Add extra columns: `CardName_FR`, `CardName_DE`, etc.
2. App will ignore unknown columns
3. Export maintains all columns
4. In future versions, language selection would use these

### Custom Aspects

You can invent your own tags:
- TypeTags: "Bard", "Barbarian", "Cleric"
- AspectTags: "Water", "Fire", "Air"
- Create themed decks!

## FAQ

**Q: Can I edit cards directly in the app?**
A: Currently, you must edit in CSV/Google Sheets. Direct editing in-app may come in future versions.

**Q: What if my CSV file is huge?**
A: The app can handle 100+ cards with no problem. Performance stays good up to ~500 cards.

**Q: Can I have special characters in card names?**
A: Yes! Colons, parentheses, apostrophes all work fine.

**Q: What if I mess up the CSV format?**
A: The app shows detailed error messages. Check the log window for specifics.

**Q: Can I import the exported CSV back into Google Sheets?**
A: Yes! File → Import → Upload and it loads perfectly.

**Q: Do I need to download template every time?**
A: No, once you have it, you can reuse it or create your own following the format.

## Workflow Diagram

```
Your Google Sheets
        ↓
   Download CSV
        ↓
Quest System App
        ↓
    Import CSV
        ↓
   Validate & Load
        ↓
Generate Quests / Run Validation
        ↓
    (Optional) Export CSV
        ↓
  Share or Archive
```

## Conclusion

CSV import/export gives you the flexibility to design cards where you want (Google Sheets) while running analysis where you want (Quest System app).

Happy designing! 🎲📊
