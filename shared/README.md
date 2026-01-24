# Tag Configuration System

## Overview
The Tag Configuration System provides centralized management of colors, icons, and styling for all tag types across both QuestGenerator and MonsterBuilder apps.

## Features
- **Centralized Management**: Single source of truth for all tag configurations
- **Dynamic Styling**: Colors and icons inject CSS automatically
- **Persistent Storage**: Saves to localStorage and syncs with server
- **GUI Editor**: User-friendly interface to customize tags
- **Fallback Support**: Unconfigured tags use default styling
- **Export/Import**: Share configurations via JSON files

## Tag Categories

### 1. Polarity Tags
- **Light** (White #FFFFFF)
- **Shadow** (Black #000000)

Used to define card polarity, affects which TypeTags are allowed.

### 2. TypeTags (Polarity-Restricted)
Light TypeTags:
- Justice (Bright Blue #3B82F6)
- Nature (Bright Green #10B981)
- Knowledge (Bright Yellow #FDE047)
- Power (Bright Silver #E5E7EB)
- Righteousness (Bright Red #EF4444)
- Wealth (Bright Gold #FBBF24)
- Martial (Red #DC2626)

Shadow TypeTags:
- Tyranny (Midnight Indigo #1E3A8A)
- Blight (Rotting Moss #14532D)
- Deceit (Tarnished Gold #CA8A04)
- Savagery (Gunmetal #4B5563)
- Zealotry (Blood Rust #7F1D1D)
- Greed (Burnished Bronze #92400E)

### 3. AspectTags
Secondary flavor tags that describe creature types, elements, or other attributes. These use default styling unless customized.

## Usage

### Access the Settings Page
Navigate to **🎨 Tag Settings** from any app's navigation menu.

### Customize a Tag
1. Find the tag in the appropriate section
2. Enable custom color by checking the checkbox
3. Choose a color using the color picker or enter hex code
4. (Optional) Add an icon URL
5. Changes save automatically

### Add New Tags
- **TypeTag Pair**: Click "Add New Type Pair" and enter Light/Shadow names and colors
- **AspectTag**: Click "Add New Aspect Tag" and enter name and optional color

### Export/Import Configurations
- **Export**: Click "Export JSON" to download current configuration
- **Import**: Click "Import JSON" to load a configuration file
- **Reset**: Click "Reset to Defaults" to restore original settings

## Technical Details

### Files
- `/shared/tagConfig.js` - Core TagConfigurationManager class
- `/shared/tagConfigGUI.html` - Settings page UI
- `/shared/tagConfigGUI.css` - Settings page styles
- `/shared/tagConfigGUI.js` - Settings page logic

### Integration
Both apps automatically load and initialize the tag configuration system via script tags in HTML files.

### API Endpoints
- `GET /api/tag-config` - Load tag configurations
- `POST /api/tag-config` - Save tag configurations

### Storage
- **Primary**: localStorage (key: `cardGame_tagConfigurations_v1`)
- **Backup**: Server file storage (`tag-config.json`)
- **Format**: JSON with `tagConfigurations`, `version`, and `lastModified` fields

## CSS Classes
Tags automatically receive CSS classes based on their name:
```css
.tag-justice {
  background-color: #3B82F6 !important;
  color: #FFFFFF !important;
}
```

Class names are sanitized (lowercase, non-alphanumeric replaced with hyphens).

## Icon Display
When an icon URL is provided, it displays inline before the tag text using CSS `::before` pseudo-element.

## Backward Compatibility
The system provides fallback values for unconfigured tags, ensuring existing functionality continues to work even if tag configuration is unavailable.

## Future Enhancements
- Icon library integration
- Theme presets
- Advanced color contrast validation
- Tag categories beyond Light/Shadow
- Collaboration features

## Support
For issues or questions, check the Help documentation or review the console for initialization messages.
