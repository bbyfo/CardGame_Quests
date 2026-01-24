/**
 * ui-schema.js
 * Maps monster fields to UI component types and rendering configuration
 */

const UI_SCHEMA = {
  // Field to component mappings
  fieldComponents: {
    CardName: {
      component: 'TextInput',
      displayMode: 'inline', // Editable directly on card
      location: 'card-header',
      placeholder: 'Enter monster name...'
    },

    Polarity: {
      component: 'EnumCycler',
      displayMode: 'inline',
      location: 'card-header',
      icon: true
    },

    CardImage: {
      component: 'ImagePicker',
      displayMode: 'sheet', // Opens bottom sheet
      location: 'card-body',
      trigger: 'card-image'
    },

    TypeTags: {
      component: 'TagSelector',
      displayMode: 'sheet',
      location: 'card-tags',
      trigger: 'tag-list',
      options: 'polarityRestricted', // LIGHT_TAGS or SHADOW_TAGS
      multiple: true
    },

    AspectTags: {
      component: 'TagSelector',
      displayMode: 'sheet',
      location: 'card-tags',
      trigger: 'tag-list',
      options: MONSTER_CONFIG.ASPECT_TAGS,
      multiple: true
    },

    BlockCost: {
      component: 'IconArrayField',
      displayMode: 'inline',
      location: 'card-stats',
      iconType: 'cost',
      draggable: true,
      label: 'Block Cost'
    },

    ToVanquish: {
      component: 'IconArrayField',
      displayMode: 'inline',
      location: 'card-stats',
      iconType: 'cost',
      draggable: true,
      label: 'To Vanquish'
    },

    OnHit: {
      component: 'IconArrayField',
      displayMode: 'inline',
      location: 'card-stats',
      iconType: 'harm',
      draggable: true,
      label: 'On Hit'
    },

    MoveDistance: {
      component: 'NumericField',
      displayMode: 'inline',
      location: 'card-stats',
      min: 0,
      max: 20,
      step: 1,
      label: 'Move'
    },

    AttackRange: {
      component: 'NumericField',
      displayMode: 'inline',
      location: 'card-stats',
      min: 0,
      max: 20,
      step: 1,
      label: 'Range'
    },

    MoveStrategy: {
      component: 'EnumCycler',
      displayMode: 'inline',
      location: 'card-stats',
      options: Object.keys(MONSTER_CONFIG.MOVE_STRATEGIES),
      icon: true,
      allowNull: true,
      label: 'Strategy'
    },

    Habitat: {
      component: 'MultiSelect',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'habitat-button',
      options: MONSTER_CONFIG.HABITATS,
      label: 'Habitat'
    },

    FrameStyle: {
      component: 'EnumCycler',
      displayMode: 'sheet',
      location: 'card-settings',
      options: Object.keys(MONSTER_CONFIG.FRAME_STYLES),
      allowNull: true,
      label: 'Frame Style'
    },

    Instructions: {
      component: 'InstructionEditor',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'instructions-button',
      label: 'Instructions'
    },

    OnDefeat: {
      component: 'TextArea',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'on-defeat-button',
      label: 'On Defeat'
    },

    OnReveal: {
      component: 'TextInput',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'on-reveal-button',
      label: 'On Reveal',
      multiline: true
    },

    FlavorText: {
      component: 'TextArea',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'flavor-button',
      label: 'Flavor Text'
    },

    SpecialAbilities: {
      component: 'TagInput',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'abilities-button',
      label: 'Special Abilities'
    },

    DesignerNotes: {
      component: 'TextArea',
      displayMode: 'sheet',
      location: 'card-footer',
      trigger: 'notes-button',
      label: 'Designer Notes'
    }
  },

  // Card layout configuration
  cardLayout: {
    header: ['CardName', 'Polarity'],
    image: ['CardImage'],
    tags: ['TypeTags', 'AspectTags'],
    iconArrays: ['BlockCost', 'ToVanquish', 'OnHit'],
    stats: ['MoveDistance', 'AttackRange', 'MoveStrategy'],
    footer: ['Habitat', 'Instructions', 'FlavorText', 'SpecialAbilities', 'OnDefeat', 'OnReveal', 'DesignerNotes', 'FrameStyle']
  },

  // Get component config for a field
  getComponentConfig(fieldName) {
    return this.fieldComponents[fieldName] || null;
  },

  // Get all inline-editable fields
  getInlineFields() {
    return Object.entries(this.fieldComponents)
      .filter(([_, config]) => config.displayMode === 'inline')
      .map(([name, config]) => ({ name, ...config }));
  },

  // Get all sheet-based fields
  getSheetFields() {
    return Object.entries(this.fieldComponents)
      .filter(([_, config]) => config.displayMode === 'sheet')
      .map(([name, config]) => ({ name, ...config }));
  },

  // Get fields by location
  getFieldsByLocation(location) {
    return Object.entries(this.fieldComponents)
      .filter(([_, config]) => config.location === location)
      .map(([name, config]) => ({ name, ...config }));
  }
};
