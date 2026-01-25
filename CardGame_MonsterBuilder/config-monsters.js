/**
 * config-monsters.js
 * Monster-specific configuration: icons, enums, CSS class mappings
 * All dynamic lists for data-driven UI
 */

const MONSTER_CONFIG = {
  // Cost Icon to TypeTag mapping (for dynamic colors from TAG_CONFIG_MANAGER)
  COST_TO_TAG_MAP: {
    red: 'Righteousness',      // Red = Righteousness (Red_Righteous icon \uf002)
    green: 'Nature',     // Green = Nature (Green_Nature icon \uf000)
    blue: 'Justice',   // Blue = Justice (Blue_Justice icon \uf005)
    yellow: 'Knowledge', // Yellow = Knowledge (Yellow_Wisdom icon \uf004)
    purple: 'Deceit',    // Purple = Shadow/Curse/Deceit (no icon yet)
    iron: 'Power',       // Iron = Power (Steel_Power icon \uf001)
    gold: 'Wealth',      // Gold = Wealth (placeholder icon \uf006)
    any: null            // Any = Wildcard (Star_Any icon \uf003)
  },

  // Cost Icon Types with CSS class mappings
  COST_TYPES: {
    red: {
      code: 'red',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.red;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Red (Physical)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.red;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#DC2626';
      },
      cssClass: 'icon-cost-red',
      symbol: '🗡️'
    },
    green: {
      code: 'green',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.green;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Green (Nature)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.green;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#10B981';
      },
      cssClass: 'icon-cost-green',
      symbol: '🌿'
    },
    blue: {
      code: 'blue',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.blue;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Blue (Magic)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.blue;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#3B82F6';
      },
      cssClass: 'icon-cost-blue',
      symbol: '💙'
    },
    yellow: {
      code: 'yellow',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.yellow;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Yellow (Light)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.yellow;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#FDE047';
      },
      cssClass: 'icon-cost-yellow',
      symbol: '☀️'
    },
    purple: {
      code: 'purple',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.purple;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Purple (Shadow)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.purple;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#8B5CF6';
      },
      cssClass: 'icon-cost-purple',
      symbol: '🔮'
    },
    iron: {
      code: 'iron',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.iron;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Iron (Equipment)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.iron;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#6B7280';
      },
      cssClass: 'icon-cost-iron',
      symbol: '⚙️'
    },
    gold: {
      code: 'gold',
      get label() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.gold;
        return tag && window.TAG_CONFIG_MANAGER?.initialized 
          ? window.TAG_CONFIG_MANAGER.getLabel(tag) 
          : 'Gold (Wealth)';
      },
      get color() {
        const tag = MONSTER_CONFIG.COST_TO_TAG_MAP.gold;
        return tag && window.TAG_CONFIG_MANAGER?.initialized
          ? window.TAG_CONFIG_MANAGER.getConfig(tag).color
          : '#FBBF24';
      },
      cssClass: 'icon-cost-gold',
      symbol: '💰'
    },
    any: {
      code: 'any',
      label: 'Any (Wildcard)',
      color: '#E5E7EB',
      cssClass: 'icon-cost-any',
      symbol: '⚪'
    }
  },

  // Harm Icon Types with CSS class mappings
  HARM_TYPES: {
    wound: {
      code: 'wound',
      label: 'Wound',
      cssClass: 'icon-harm-wound',
      symbol: '💔'
    },
    exhausted: {
      code: 'exhausted',
      label: 'Exhausted',
      cssClass: 'icon-harm-exhausted',
      symbol: '😓'
    },
    dazed: {
      code: 'dazed',
      label: 'Dazed',
      cssClass: 'icon-harm-dazed',
      symbol: '😵'
    },
    poisoned: {
      code: 'poisoned',
      label: 'Poisoned',
      cssClass: 'icon-harm-poisoned',
      symbol: '☠️'
    },
    cursed: {
      code: 'cursed',
      label: 'Cursed',
      cssClass: 'icon-harm-cursed',
      symbol: '👿'
    },
    stunned: {
      code: 'stunned',
      label: 'Stunned',
      cssClass: 'icon-harm-stunned',
      symbol: '⚡'
    },
    burned: {
      code: 'burned',
      label: 'Burned',
      cssClass: 'icon-harm-burned',
      symbol: '🔥'
    },
    frozen: {
      code: 'frozen',
      label: 'Frozen',
      cssClass: 'icon-harm-frozen',
      symbol: '❄️'
    },
    bleeding: {
      code: 'bleeding',
      label: 'Bleeding',
      cssClass: 'icon-harm-bleeding',
      symbol: '🩸'
    },
    scared: {
      code: 'scared',
      label: 'Scared',
      cssClass: 'icon-harm-scared',
      symbol: '😱'
    }
  },

  // Move Strategy Types with CSS class mappings
  MOVE_STRATEGIES: {
    stationary: {
      code: 'stationary',
      label: 'Stationary',
      cssClass: 'icon-strategy-stationary',
      symbol: '🚫',
      description: 'Does not move'
    },
    patrol: {
      code: 'patrol',
      label: 'Patrol',
      cssClass: 'icon-strategy-patrol',
      symbol: '🚶',
      description: 'Follows a fixed path'
    },
    chase: {
      code: 'chase',
      label: 'Chase',
      cssClass: 'icon-strategy-chase',
      symbol: '🏃',
      description: 'Pursues nearest target'
    },
    flee: {
      code: 'flee',
      label: 'Flee',
      cssClass: 'icon-strategy-flee',
      symbol: '🏃‍♂️',
      description: 'Runs away from threats'
    },
    teleport: {
      code: 'teleport',
      label: 'Teleport',
      cssClass: 'icon-strategy-teleport',
      symbol: '✨',
      description: 'Instant repositioning'
    },
    swarm: {
      code: 'swarm',
      label: 'Swarm',
      cssClass: 'icon-strategy-swarm',
      symbol: '👥',
      description: 'Groups with allies'
    },
    guard: {
      code: 'guard',
      label: 'Guard',
      cssClass: 'icon-strategy-guard',
      symbol: '🛡️',
      description: 'Defends a specific area'
    },
    random: {
      code: 'random',
      label: 'Random',
      cssClass: 'icon-strategy-random',
      symbol: '🎲',
      description: 'Unpredictable movement'
    }
  },

  // Habitat/Biome Types
  HABITATS: [
    'Forest',
    'Mountain',
    'Swamp',
    'Desert',
    'Cave',
    'Urban',
    'Aquatic',
    'Tundra',
    'Volcanic',
    'Plains',
    'Ruins',
    'Dungeon',
    'Any'
  ],

  // Frame Style Types
  FRAME_STYLES: {
    basic: { code: 'basic', label: 'Basic', cssClass: 'frame-basic' },
    elite: { code: 'elite', label: 'Elite', cssClass: 'frame-elite' },
    boss: { code: 'boss', label: 'Boss', cssClass: 'frame-boss' },
    minion: { code: 'minion', label: 'Minion', cssClass: 'frame-minion' },
    legendary: { code: 'legendary', label: 'Legendary', cssClass: 'frame-legendary' }
  },

  // Polarity Types (from QuestGenerator)
  POLARITY_TYPES: ['Light', 'Shadow'],

  // TypeTags (Polarity-restricted, from shared tag config)
  get LIGHT_TAGS() {
    if (window.TAG_CONFIG_MANAGER && window.TAG_CONFIG_MANAGER.initialized) {
      return window.TAG_CONFIG_MANAGER.getTagsByPolarity('Light');
    }
    // Fallback if tag config not loaded
    return ['Knowledge', 'Justice', 'Righteousness', 'Nature', 'Power', 'Wealth'];
  },
  
  get SHADOW_TAGS() {
    if (window.TAG_CONFIG_MANAGER && window.TAG_CONFIG_MANAGER.initialized) {
      return window.TAG_CONFIG_MANAGER.getTagsByPolarity('Shadow');
    }
    // Fallback if tag config not loaded
    return ['Deceit', 'Tyranny', 'Zealotry', 'Blight', 'Savagery', 'Greed'];
  },

  // AspectTags (Secondary flavor tags)
  ASPECT_TAGS: [
    'Humanoid',
    'Beast',
    'Aberration',
    'Demon',
    'Spirit',
    'Elemental',
    'Undead',
    'Dragon',
    'Construct',
    'Plant',
    'Ooze',
    'Giant',
    'Fey',
    'Celestial',
    'Fiend'
  ],

  // Helper methods
  getCostIcon(code) {
    return this.COST_TYPES[code] || null;
  },

  getHarmIcon(code) {
    return this.HARM_TYPES[code] || null;
  },

  getMoveStrategy(code) {
    return this.MOVE_STRATEGIES[code] || null;
  },

  getFrameStyle(code) {
    return this.FRAME_STYLES[code] || null;
  },

  // Get all cost codes as array - only include codes that have associated Light TypeTags
  getAllCostCodes() {
    // Get Light TypeTags from TAG_CONFIG_MANAGER
    const lightTypeTags = window.TAG_CONFIG_MANAGER?.initialized 
      ? window.TAG_CONFIG_MANAGER.getTagsByPolarity('Light')
      : this.LIGHT_TAGS;
    
    // Filter COST_TYPES to only include those with Light TypeTags
    return Object.keys(this.COST_TYPES).filter(code => {
      const tag = this.COST_TO_TAG_MAP[code];
      // Include wildcard (any) even if no tag, and include others only if tag is a Light TypeTag
      return code === 'any' || (tag && lightTypeTags.includes(tag));
    });
  },

  // Get all harm codes as array
  getAllHarmCodes() {
    return Object.keys(this.HARM_TYPES);
  },

  // Get all strategy codes as array
  getAllStrategyCodes() {
    return Object.keys(this.MOVE_STRATEGIES);
  },

  // Validate TypeTags match Polarity
  validateTypeTags(polarity, typeTags) {
    const validTags = polarity === 'Light' ? this.LIGHT_TAGS : this.SHADOW_TAGS;
    return typeTags.every(tag => validTags.includes(tag));
  }
};
