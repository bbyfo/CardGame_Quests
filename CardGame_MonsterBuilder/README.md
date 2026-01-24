# Monster Builder

A mobile-friendly, data-driven web app for creating and managing monster cards for board games.

## Features

- **Visual Card Mockup**: Live-updating card preview with inline editing
- **Drag-and-Drop Icons**: Cost and harm icons can be dragged onto card fields
- **Mobile-First Design**: Bottom sheet overlays optimized for mobile and desktop
- **Auto-Save**: Changes automatically save after 1 second
- **Data-Driven**: All enums, icons, and lists configurable via external config
- **Schema-Based**: Easy to add/remove fields without touching UI code
- **Server Integration**: Works with shared database or localStorage fallback

## Monster Card Schema

### Core Fields (from QuestGenerator)
- **CardName**: Display name
- **Polarity**: Light or Shadow
- **TypeTags**: Core identity (polarity-restricted)
- **AspectTags**: Secondary flavor tags
- **Instructions**: Card effect instructions

### New Monster Fields
- **BlockCost**: Cost icons to encounter monster
- **ToVanquish**: Cost icons to defeat monster
- **OnHit**: Harm effects when monster attacks
- **MoveDistance**: Movement range in tiles
- **AttackRange**: Attack range in tiles
- **MoveStrategy**: Movement behavior pattern
- **Habitat**: Biomes where monster appears
- **CardImage**: External image URL
- **FrameStyle**: Visual card frame style
- **OnDefeat**: Effects when defeated
- **OnReveal**: Effect when revealed
- **FlavorText**: Narrative description
- **SpecialAbilities**: Special monster abilities

## Usage

### Creating a New Monster
1. Click "New Monster" on the list page
2. Edit the monster name by clicking it
3. Drag cost/harm icons onto the card fields
4. Use +/− buttons for numeric values
5. Click polarity to cycle Light/Shadow
6. Click tags, habitat, etc. to open editors
7. Changes auto-save

### Editing Existing Monsters
1. Click a monster card from the list
2. Make changes (auto-saves)
3. Click "Back to List" when done

### Import/Export
- **Export**: Downloads all monsters as JSON
- **Import**: Uploads JSON file to replace monsters

## Architecture

### Data Flow
```
cards.json → db.js → DataLoader → MonsterManager → UI Components
```

### Component Structure
- **CardMockup**: Live card preview with inline editing
- **IconPalette**: Draggable icon source
- **BottomSheet**: Base overlay component
- **Specialized Sheets**: TagSelector, ImagePicker, HabitatSelector, etc.

### Configuration
- **config-monsters.js**: Icon types, strategies, habitats, frame styles
- **monster-schema.js**: Field definitions and validation
- **ui-schema.js**: Field-to-component mappings

## Tech Stack

- **Vanilla JavaScript (ES6)**: No frameworks
- **HTML5 Drag & Drop API**: Icon dragging
- **CSS Grid & Flexbox**: Responsive layouts
- **Native ES Modules**: Modular architecture

## Files

### Core
- `index.html`: Monster list view
- `monsterBuilder.html`: Card editor
- `monsterManager.js`: CRUD operations
- `cardMockup.js`: Card preview component

### Configuration
- `config.js`: API endpoints
- `config-monsters.js`: Monster-specific enums
- `monster-schema.js`: Data schema
- `ui-schema.js`: UI mappings

### Components
- `components/IconPalette.js`: Icon drag source
- `components/BottomSheet.js`: Base overlay
- `components/sheets.js`: Specialized overlays

### Data Layer
- `dataLoader.js`: Load/save from db.js/cards.json

### Styles
- `base.css`: Common styles
- `nav.css`: Navigation styles
- `styles.css`: Monster Builder specific styles

## Compatibility with Quest Generator

Monster Builder extends the base card schema used by Quest Generator. New fields are safely ignored by Quest Generator since it only accesses known fields explicitly.

## Future Enhancements

- Image upload to cloud storage
- Advanced filtering and search
- Bulk operations
- Card templates
- Preview different frame styles
- Printable card sheets
- Monster statistics analysis

## License

Part of the Card Game Apps suite.
