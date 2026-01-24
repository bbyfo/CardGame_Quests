# Card Manager - Quick Start

## Access the Card Manager

1. Open your Quest System app (index.html)
2. Click the **🎴 Card Manager** button in the header
3. Or navigate directly to **cardManager.html**

## Quick Workflow

### 1️⃣ Create a Card
```
1. Select Deck Type (e.g., "Quest Giver")
2. Enter Card Name (e.g., "King")
3. Add Type Tags (e.g., "Royalty", "Authority")
4. Add Aspect Tags (e.g., "Leadership")
5. Click "Save Card"
```

### 2️⃣ Add Instructions (Optional)
```
1. Click "+ Add Instruction"
2. Select Target Deck (e.g., "Target")
3. Add Tags (e.g., "Arcane")
4. Click "Save Instruction"
```

### 3️⃣ Browse Your Cards
- View all cards on the right side
- Filter by deck type
- Search by name
- Edit or delete cards

### 4️⃣ Export to JSON
- Click "📥 Export Cards"
- Replace your cards.json file
- Refresh the Quest System page

## Key Features

✅ **Autocomplete** - Type to get suggestions from existing tags  
✅ **Tag Management** - Add/remove tags with ease  
✅ **Card Browser** - Filter, search, edit, delete  
✅ **Multi-Instruction** - Add multiple instructions per card  
✅ **Export/Import** - Save and load card data  
✅ **Validation** - Required fields checked before save  

## Deck Types
- Quest Giver
- Harmed Party
- Verb (includes Target Requirements)
- Target
- Location
- Twist
- Reward
- Failure

## File Details

| File | Purpose |
|------|---------|
| `cardManager.html` | Main GUI interface |
| `cardManager.css` | Styling and layout |
| `cardManager.js` | Logic and autocomplete |
| `CARD_MANAGER_GUIDE.md` | Detailed documentation |

## Common Tasks

**Edit a Card:**
- Find it in the browser
- Click "Edit"
- Modify fields
- Click "Save Card"

**Delete a Card:**
- Find it in the browser
- Click "Delete"
- Confirm

**Search Cards:**
- Type in the search box
- Results update instantly

**Filter by Deck:**
- Use dropdown menu
- Shows only that deck type

**Get Suggestions:**
- Type in any tag field
- Autocomplete shows matching tags
- Click suggestion or press Enter

## Tips

💡 **First card is hardest** - Subsequent cards get autocomplete  
💡 **Use consistent naming** - Helps with data consistency  
💡 **Complete your tags** - Improves quest generation quality  
💡 **Export regularly** - Backup your card data  

---
For more details, see **CARD_MANAGER_GUIDE.md**
