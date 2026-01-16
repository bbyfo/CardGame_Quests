# 🎴 Card Manager GUI

A comprehensive web-based GUI for managing quest system cards with autocomplete, form validation, and a card browser.

## Features

### Card Creation & Editing
- **Form-based card entry** - Intuitive form for creating new cards
- **Auto-save to JSON** - Cards are saved and can be exported as JSON
- **Edit existing cards** - Click any card in the browser to edit it
- **Delete cards** - Remove cards with confirmation

### Smart Autocomplete
- **Type Tags autocomplete** - Suggestions based on existing tags in your deck
- **Aspect Tags autocomplete** - Real-time suggestions to maintain consistency
- **Target Requirement autocomplete** - For Verb cards, suggests matching targets
- **Instruction Tags autocomplete** - For instruction tags

### Card Organization
- **All 8 deck types supported**:
  - Quest Giver
  - Harmed Party
  - Verb
  - Target
  - Location
  - Twist
  - Reward
  - Failure

- **Deck-specific fields**: Verb cards show Target Requirement field; other decks don't

### Card Browsing & Filtering
- **Filter by deck type** - Show only cards from selected deck
- **Search by name** - Real-time search across all cards
- **View card details** - See all tags and instructions at a glance
- **Export cards** - Download cards as JSON file

### Tag Management
- **Add tags with Enter** - Press Enter to add a new tag
- **Remove tags with ×** - Click the × button to remove a tag
- **Auto-complete suggestions** - Type to see matching tags
- **Prevent duplicates** - Can't add the same tag twice to one card

### Instructions System
- **Multi-step instructions** - Cards can have multiple instructions
- **Target deck selection** - Each instruction targets a specific deck
- **Instruction tags** - Add tags that modify behavior
- **Easy management** - Add, view, and delete instructions from the modal

## How to Use

### Creating a New Card

1. **Open Card Manager**
   - Click the "🎴 Card Manager" button on the main Quest System page
   - Or navigate directly to `cardManager.html`

2. **Select Deck Type**
   - Choose which deck this card belongs to (Quest Giver, Verb, etc.)
   - For Verb cards, a "Target Requirement" field will appear

3. **Enter Card Name**
   - Type the card's name (e.g., "King", "Retrieve", "Dragon's Hoard")

4. **Add Type Tags**
   - Click in the Type Tags field
   - Start typing to see suggestions from existing cards
   - Press Enter to add a tag
   - Repeat for multiple tags
   - Click the × on any tag to remove it

5. **Add Aspect Tags**
   - Same process as Type Tags
   - These describe the card's qualities or themes

6. **Add Mutable Tags** (Optional)
   - Tags that can change or be modified during gameplay
   - Follow the same process as other tag fields

7. **Add Instructions** (Optional)
   - Click "+ Add Instruction" button
   - Select which deck this instruction targets
   - Add tags that describe the instruction
   - Click "Save Instruction"
   - Add more instructions as needed
   - Click the ✕ to remove an instruction

8. **Save the Card**
   - Click "Save Card" to add the card to your deck
   - The form will clear and show a success message
   - The new card appears immediately in the card browser

### Editing a Card

1. **Find the card** in the card browser on the right
2. **Click "Edit"** on the card item
3. **Modify any fields** - The form will populate with the card's current data
4. **Click "Save Card"** to update
5. **Or click "Cancel Edit"** to discard changes

### Deleting a Card

1. **Find the card** in the card browser
2. **Click "Delete"** on the card item
3. **Confirm deletion** in the popup dialog
4. **The card is immediately removed** from your deck

### Filtering & Searching

**Filter by Deck:**
- Use the "Filter by Deck" dropdown to show only cards from a specific deck
- Choose "All Decks" to see everything

**Search by Name:**
- Type in the "Search" field to find cards by name
- Search is case-insensitive and real-time

### Exporting Your Cards

1. Click "📥 Export Cards" button
2. Your browser will download a `cards.json` file with all your cards
3. **To apply the exported cards:**
   - Open your app folder
   - Replace the existing `cards.json` file with the exported one
   - Refresh the page to see the changes

## Tips for Consistency

### Using Autocomplete Effectively
- **First card in a deck** - You'll need to type tags manually
- **Subsequent cards** - Autocomplete will suggest previously used tags
- **Building a taxonomy** - Early cards establish the tag vocabulary for your deck
- **Review existing cards** - Click Edit on existing cards to see standard tags

### Tag Naming Conventions
- **Type Tags** - Describe the card's category or kind (Royalty, Wizard, Evil, etc.)
- **Aspect Tags** - Describe themes or qualities (Leadership, Magic, Darkness, etc.)
- **Mutable Tags** - State that changes (Cursed, Blessed, etc.)
- **Target Requirements** (Verbs only) - Describe what the verb needs (Evil Monster, Structure, etc.)

### Card Organization Best Practices
- **Consistent naming** - Use the same capitalization and spelling
- **Complete information** - Fill in all relevant tags for better quest generation
- **Test thoroughly** - Verify cards generate quests as expected before shipping

## Interface Layout

**Left Side: Card Form**
- Create and edit cards
- All input fields and instructions management

**Right Side: Card Browser**
- Filter and search cards
- View all cards in your system
- Quick edit/delete access
- Export functionality

## Keyboard Shortcuts

- **Enter (in tag fields)** - Add the tag
- **Delete Modal × button** - Close the instruction modal
- **Tab** - Navigate between form fields

## Troubleshooting

**Cards not saving?**
- Check browser console (F12) for errors
- Ensure you've filled in required fields (Deck, Card Name)
- Remember to click "Save Card" button

**Autocomplete not showing suggestions?**
- You need at least one card in that tag category
- Make sure you've typed something in the field
- The dropdown appears above the input field

**Can't find my card?**
- Check the deck filter - make sure it's set to the right deck or "All Decks"
- Use the search field to find cards by name
- Check the original cards.json file to verify the card was created

**Changes not appearing in Quest System?**
- Export cards from Card Manager
- Replace cards.json in your app folder
- Refresh the Quest System page
- Or restart your local server if using one

## Technology

- **Pure HTML/CSS/JavaScript** - No frameworks required
- **Client-side processing** - All logic runs in your browser
- **LocalStorage compatible** - Can add persistence with minimal changes
- **Responsive design** - Works on desktop and tablet
