/**
 * monster-schema.js
 * Defines the complete monster card schema with field definitions and default values
 */

const MONSTER_SCHEMA = {
  // Schema metadata
  version: '1.0.0',
  deck: 'Monster',

  // Field definitions
  fields: {
    // === CORE IDENTITY FIELDS (from base card schema) ===
    id: {
      type: 'string',
      required: true,
      editable: false,
      default: () => `Monster-NewMonster-${Math.random().toString(36).substr(2, 9)}`,
      description: 'Unique card identifier'
    },

    Deck: {
      type: 'string',
      required: true,
      editable: false,
      default: 'Monster',
      description: 'Card deck type'
    },

    CardName: {
      type: 'string',
      required: true,
      editable: true,
      default: '',
      description: 'Display name of the monster'
    },

    Polarity: {
      type: 'enum',
      required: true,
      editable: true,
      default: 'Light',
      options: ['Light', 'Shadow'],
      description: 'Light or Shadow alignment'
    },

    TypeTags: {
      type: 'array',
      required: true,
      editable: true,
      default: [],
      description: 'Core identity tags (polarity-restricted)',
      validation: {
        polarityRestricted: true,
        minLength: 0,
        maxLength: 10
      }
    },

    AspectTags: {
      type: 'array',
      required: true,
      editable: true,
      default: [],
      description: 'Secondary flavor tags (creature types)',
      validation: {
        minLength: 0,
        maxLength: 10
      }
    },

    mutableTags: {
      type: 'array',
      required: true,
      editable: false,
      default: [],
      description: 'Runtime tags (modified during gameplay)'
    },

    Instructions: {
      type: 'array',
      required: true,
      editable: true,
      default: [],
      description: 'Card effect instructions',
      itemSchema: {
        TargetDeck: 'string',
        Tags: 'array'
      }
    },

    DesignerNotes: {
      type: 'string',
      required: false,
      editable: true,
      default: '',
      description: 'Internal notes for designers'
    },

    // === NEW MONSTER BUILDER FIELDS ===

    BlockCost: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Cost icons to block/encounter this monster',
      itemType: 'costIcon'
    },

    ToVanquish: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Cost icons required to vanquish/defeat this monster',
      itemType: 'costIcon'
    },

    OnHit: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Harm effects when monster hits player',
      itemType: 'harmIcon'
    },

    MoveDistance: {
      type: 'number',
      required: false,
      editable: true,
      default: null,
      description: 'Number of tiles monster can move',
      validation: {
        min: 0,
        max: 20
      }
    },

    AttackRange: {
      type: 'number',
      required: false,
      editable: true,
      default: null,
      description: 'Attack range in tiles',
      validation: {
        min: 0,
        max: 20
      }
    },

    MoveStrategy: {
      type: 'enum',
      required: false,
      editable: true,
      default: null,
      options: ['stationary', 'patrol', 'chase', 'flee', 'teleport', 'swarm', 'guard', 'random'],
      description: 'Movement behavior pattern'
    },

    Habitat: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Biomes/locations where monster appears',
      itemType: 'string'
    },

    CardImage: {
      type: 'url',
      required: false,
      editable: true,
      default: null,
      description: 'External URL to monster image'
    },

    FrameStyle: {
      type: 'enum',
      required: false,
      editable: true,
      default: null,
      options: ['basic', 'elite', 'boss', 'minion', 'legendary'],
      description: 'Card frame visual style'
    },

    OnDefeat: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Effects triggered when monster is defeated',
      itemSchema: {
        type: 'string',
        value: 'any'
      }
    },

    OnReveal: {
      type: 'string',
      required: false,
      editable: true,
      default: null,
      description: 'Effect when monster is revealed'
    },

    FlavorText: {
      type: 'string',
      required: false,
      editable: true,
      default: null,
      description: 'Narrative flavor text'
    },

    SpecialAbilities: {
      type: 'array',
      required: false,
      editable: true,
      default: [],
      description: 'Special monster abilities',
      itemType: 'string'
    }
  },

  /**
   * Create a new monster with default values
   */
  createNew() {
    const monster = {};
    for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
      if (typeof fieldDef.default === 'function') {
        monster[fieldName] = fieldDef.default();
      } else {
        monster[fieldName] = fieldDef.default;
      }
    }
    return monster;
  },

  /**
   * Normalize monster data (ensure all fields have correct types/defaults)
   */
  normalize(monster) {
    const normalized = { ...monster };
    
    for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
      // If field is missing, apply default
      if (normalized[fieldName] === undefined) {
        if (typeof fieldDef.default === 'function') {
          normalized[fieldName] = fieldDef.default();
        } else {
          normalized[fieldName] = fieldDef.default;
        }
      }
      
      // Normalize arrays
      if (fieldDef.type === 'array' && !Array.isArray(normalized[fieldName])) {
        normalized[fieldName] = [];
      }
      
      // Normalize nulls vs empty strings
      if (fieldDef.type === 'string' && normalized[fieldName] === undefined) {
        normalized[fieldName] = fieldDef.default;
      }
      
      // Normalize numbers
      if (fieldDef.type === 'number' && normalized[fieldName] === undefined) {
        normalized[fieldName] = fieldDef.default;
      }
    }
    
    return normalized;
  },

  /**
   * Validate monster data
   */
  validate(monster) {
    const errors = [];

    // Check required fields
    for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
      if (fieldDef.required) {
        if (fieldDef.type === 'array' && (!monster[fieldName] || !Array.isArray(monster[fieldName]))) {
          errors.push(`${fieldName} is required and must be an array`);
        } else if (fieldDef.type === 'string' && !monster[fieldName]) {
          errors.push(`${fieldName} is required`);
        }
      }
    }

    // Validate Polarity-TypeTag alignment
    if (monster.Polarity && monster.TypeTags) {
      const validTags = monster.Polarity === 'Light' ? MONSTER_CONFIG.LIGHT_TAGS : MONSTER_CONFIG.SHADOW_TAGS;
      const invalidTags = monster.TypeTags.filter(tag => !validTags.includes(tag));
      if (invalidTags.length > 0) {
        errors.push(`TypeTags ${invalidTags.join(', ')} do not match Polarity ${monster.Polarity}`);
      }
    }

    // Validate numeric ranges
    if (monster.MoveDistance !== null && monster.MoveDistance !== undefined) {
      if (monster.MoveDistance < 0 || monster.MoveDistance > 20) {
        errors.push('MoveDistance must be between 0 and 20');
      }
    }

    if (monster.AttackRange !== null && monster.AttackRange !== undefined) {
      if (monster.AttackRange < 0 || monster.AttackRange > 20) {
        errors.push('AttackRange must be between 0 and 20');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Get field definition
   */
  getField(fieldName) {
    return this.fields[fieldName] || null;
  },

  /**
   * Get all editable fields
   */
  getEditableFields() {
    return Object.entries(this.fields)
      .filter(([_, def]) => def.editable)
      .map(([name, def]) => ({ name, ...def }));
  }
};
