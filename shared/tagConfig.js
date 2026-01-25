/**
 * tagConfig.js
 * Centralized tag configuration system for all apps
 * Manages colors, icons, and styling for Polarity, TypeTags, and AspectTags
 */

const TAG_CONFIG_STORAGE_KEY = 'cardGame_tagConfigurations_v1';

class TagConfigurationManager {
  constructor() {
    this.configs = {};
    this.defaultConfigs = this._generateDefaultConfigs();
    this.listeners = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the tag configuration manager
   */
  async init() {
    if (this.initialized) return this;
    
    console.log('Initializing Tag Configuration Manager...');
    
    // Load from localStorage first
    const localData = this._loadFromLocalStorage();
    
    // Try to sync with server if available
    try {
      const serverData = await this._loadFromServer();
      if (serverData) {
        this.configs = this._mergeConfigs(localData, serverData);
        this._saveToLocalStorage();
      } else {
        this.configs = localData || this.defaultConfigs;
      }
    } catch (error) {
      console.warn('Server unavailable for tag config, using local:', error.message);
      this.configs = localData || this.defaultConfigs;
    }
    
    // Load AspectTags from cards.json
    await this._loadAspectTagsFromCards();
    
    // Inject dynamic styles
    this._injectDynamicStyles();
    this.initialized = true;
    
    console.log('Tag Configuration Manager initialized with', Object.keys(this.configs).length, 'configs');
    return this;
  }

  /**
   * Load AspectTags from cards.json
   */
  async _loadAspectTagsFromCards() {
    try {
      if (!window.CONFIG) return;
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/cards`);
      if (!response.ok) return;
      
      const data = await response.json();
      const aspectTagsSet = new Set();
      
      // Extract all unique AspectTags from all cards
      Object.values(data).forEach(deck => {
        if (Array.isArray(deck)) {
          deck.forEach(card => {
            if (card.AspectTags && Array.isArray(card.AspectTags)) {
              card.AspectTags.forEach(tag => aspectTagsSet.add(tag));
            }
          });
        }
      });
      
      // Add AspectTags to configs if they don't exist
      aspectTagsSet.forEach(tagName => {
        if (!this.configs[tagName]) {
          this.configs[tagName] = {
            name: tagName,
            label: tagName,
            category: 'AspectTag',
            color: null,
            textColor: null,
            iconUrl: null,
            polarityAssociation: null,
            pairedWith: null
          };
        }
      });
      
      console.log('Loaded', aspectTagsSet.size, 'AspectTags from cards.json');
    } catch (error) {
      console.warn('Failed to load AspectTags from cards:', error);
    }
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Get configuration for a specific tag
   */
  getConfig(tagName) {
    if (!tagName) return this._getDefaultForTag('Unknown');
    return this.configs[tagName] || this._getDefaultForTag(tagName);
  }

  /**
   * Get display label for a tag
   */
  getLabel(tagName) {
    const config = this.getConfig(tagName);
    return config.label || tagName;
  }

  /**
   * Get all tag configurations
   */
  getAllConfigs() {
    return { ...this.configs };
  }

  /**
   * Get tags by category
   */
  getTagsByCategory(category) {
    return Object.values(this.configs)
      .filter(config => config.category === category);
  }

  /**
   * Get tags by polarity association
   */
  getTagsByPolarity(polarity) {
    return Object.values(this.configs)
      .filter(config => config.polarityAssociation === polarity)
      .map(config => config.name);
  }

  /**
   * Set or update configuration for a tag
   */
  setConfig(tagName, config) {
    this.configs[tagName] = {
      name: tagName,
      label: config.label || tagName,
      category: config.category || 'AspectTag',
      color: config.color || null,
      textColor: config.textColor || (config.color ? this._calculateTextColor(config.color) : null),
      iconUrl: config.iconUrl || null,
      polarityAssociation: config.polarityAssociation || null,
      pairedWith: config.pairedWith || null
    };
    
    this._saveToLocalStorage();
    this._saveToServer();
    this._injectDynamicStyles();
    this._notifyListeners();
  }

  /**
   * Delete a tag configuration
   */
  deleteConfig(tagName) {
    // Don't allow deletion of default tags
    if (this.defaultConfigs[tagName]) {
      console.warn('Cannot delete default tag:', tagName);
      return false;
    }
    
    delete this.configs[tagName];
    this._saveToLocalStorage();
    this._saveToServer();
    this._injectDynamicStyles();
    this._notifyListeners();
    return true;
  }

  /**
   * Reset all configurations to built-in defaults
   */
  resetToDefaults() {
    if (!confirm('Reset all tag configurations to built-in defaults? This cannot be undone.')) {
      return false;
    }
    
    this.configs = { ...this.defaultConfigs };
    this._saveToLocalStorage();
    this._saveToServer();
    this._injectDynamicStyles();
    this._notifyListeners();
    return true;
  }

  /**
   * Load configurations from the server file (tag-config.json)
   * Returns true if loaded successfully, false otherwise
   */
  async loadFromServerFile() {
    try {
      if (!window.CONFIG) {
        console.warn('No CONFIG available to load from server');
        return false;
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/tag-config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        console.warn('Server returned non-OK response when loading tag-config');
        return false;
      }
      const data = await response.json();
      if (data && data.tagConfigurations && Object.keys(data.tagConfigurations).length > 0) {
        this.configs = data.tagConfigurations;
        this._saveToLocalStorage();
        this._injectDynamicStyles();
        this._notifyListeners();
        console.log('Loaded tag configurations from server file');
        return true;
      } else {
        console.warn('Server tag-config.json is empty or contains no tag configurations');
        return false;
      }
    } catch (error) {
      console.warn('Failed to load tag config from server file:', error);
    }
    return false;
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Load from localStorage
   */
  _loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(TAG_CONFIG_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.tagConfigurations || null;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }

  /**
   * Save to localStorage
   */
  _saveToLocalStorage() {
    try {
      localStorage.setItem(TAG_CONFIG_STORAGE_KEY, JSON.stringify({
        tagConfigurations: this.configs,
        version: 1,
        lastModified: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load from server
   */
  async _loadFromServer() {
    try {
      if (!window.CONFIG) return null;
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/tag-config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.tagConfigurations || null;
      }
    } catch (error) {
      // Server not available, will use local storage
    }
    return null;
  }

  /**
   * Save to server
   */
  async _saveToServer() {
    try {
      if (!window.CONFIG) return;
      
      await fetch(`${CONFIG.API_BASE_URL}/api/tag-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagConfigurations: this.configs,
          version: 1,
          lastModified: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to save tag config to server:', error.message);
    }
  }

  // ============================================
  // DYNAMIC STYLING
  // ============================================

  /**
   * Inject dynamic CSS for all configured tags
   */
  _injectDynamicStyles() {
    // Remove existing dynamic styles
    const existingStyle = document.getElementById('dynamic-tag-styles');
    if (existingStyle) existingStyle.remove();

    // Generate CSS for all configured tags
    const css = Object.entries(this.configs)
      .filter(([_, config]) => config.color) // Only tags with custom colors
      .map(([tagName, config]) => `
        .tag-${this._sanitizeClassName(tagName)} {
          background-color: ${config.color} !important;
          color: ${config.textColor} !important;
          position: relative;
          ${config.iconGlyph ? 'padding-left: 2rem;' : ''}
        }
        .tag-${this._sanitizeClassName(tagName)}:hover {
          filter: brightness(0.9);
        }
        ${config.iconGlyph ? `
        .tag-${this._sanitizeClassName(tagName)}::before {
          content: '${config.iconGlyph}';
          font-family: 'CardGameFont' !important;
          position: absolute;
          left: 0.35rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.1rem;
          line-height: 1;
          speak: none;
          font-style: normal;
          font-weight: normal;
          font-variant: normal;
          text-transform: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ` : ''}
      `).join('\n');

    // Inject into DOM
    const style = document.createElement('style');
    style.id = 'dynamic-tag-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Calculate appropriate text color based on background luminance
   */
  _calculateTextColor(bgColor) {
    if (!bgColor) return '#FFFFFF';
    
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Sanitize tag name for use as CSS class name
   */
  _sanitizeClassName(tagName) {
    return tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Get default configuration for unconfigured tag
   */
  _getDefaultForTag(tagName) {
    return {
      name: tagName,
      category: 'AspectTag',
      color: null, // Will use CSS default styling
      textColor: null,
      iconUrl: null,
      polarityAssociation: null,
      pairedWith: null
    };
  }

  /**
   * Generate default configurations
   */
  _generateDefaultConfigs() {
    return {
      // Polarity tags
      'Light': {
        name: 'Light',
        label: 'Light',
        category: 'Polarity',
        color: '#FFFFFF',
        textColor: '#000000',
        iconUrl: null,
        polarityAssociation: 'Light',
        pairedWith: 'Shadow'
      },
      'Shadow': {
        name: 'Shadow',
        label: 'Shadow',
        category: 'Polarity',
        color: '#000000',
        textColor: '#FFFFFF',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Light'
      },
      
      // Light TypeTags
      'Justice': {
        name: 'Justice',
        label: 'Justice',
        category: 'TypeTag',
        color: '#3B82F6', // Bright Blue
        textColor: '#FFFFFF',
        iconUrl: null,
        iconGlyph: '\uf005',
        polarityAssociation: 'Light',
        pairedWith: 'Tyranny'
      },
      'Nature': {
        name: 'Nature',
        label: 'Nature',
        category: 'TypeTag',
        color: '#10B981', // Bright Green
        textColor: '#FFFFFF',
        iconUrl: null,
        iconGlyph: '\uf000',
        polarityAssociation: 'Light',
        pairedWith: 'Blight'
      },
      'Knowledge': {
        name: 'Knowledge',
        label: 'Knowledge',
        category: 'TypeTag',
        color: '#FDE047', // Bright Yellow
        textColor: '#422006',
        iconUrl: null,
        iconGlyph: '\uf004',
        polarityAssociation: 'Light',
        pairedWith: 'Deceit'
      },
      'Power': {
        name: 'Power',
        label: 'Power',
        category: 'TypeTag',
        color: '#E5E7EB', // Bright Silver
        textColor: '#1F2937',
        iconUrl: null,
        iconGlyph: '\uf001',
        polarityAssociation: 'Light',
        pairedWith: 'Savagery'
      },
      'Righteousness': {
        name: 'Righteousness',
        label: 'Righteousness',
        category: 'TypeTag',
        color: '#EF4444', // Bright Red
        textColor: '#FFFFFF',
        iconUrl: null,
        iconGlyph: '\uf002',
        polarityAssociation: 'Light',
        pairedWith: 'Zealotry'
      },
      'Wealth': {
        name: 'Wealth',
        label: 'Wealth',
        category: 'TypeTag',
        color: '#FBBF24', // Bright Gold
        textColor: '#78350F',
        iconUrl: null,
        iconGlyph: '\uf006',
        polarityAssociation: 'Light',
        pairedWith: 'Greed'
      },
      'Martial': {
        name: 'Martial',
        label: 'Martial',
        category: 'TypeTag',
        color: '#DC2626', // Red
        textColor: '#FFFFFF',
        iconUrl: null,
        iconGlyph: '\uf007',
        polarityAssociation: 'Light',
        pairedWith: null
      },
      
      // Shadow TypeTags
      'Tyranny': {
        name: 'Tyranny',
        label: 'Tyranny',
        category: 'TypeTag',
        color: '#1E3A8A', // Dark Blue/Midnight Indigo
        textColor: '#E0E7FF',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Justice'
      },
      'Blight': {
        name: 'Blight',
        label: 'Blight',
        category: 'TypeTag',
        color: '#14532D', // Dark Green/Rotting Moss
        textColor: '#D1FAE5',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Nature'
      },
      'Deceit': {
        name: 'Deceit',
        label: 'Deceit',
        category: 'TypeTag',
        color: '#CA8A04', // Dark Yellow/Tarnished Gold
        textColor: '#FEF9C3',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Knowledge'
      },
      'Savagery': {
        name: 'Savagery',
        label: 'Savagery',
        category: 'TypeTag',
        color: '#4B5563', // Dark Silver/Gunmetal
        textColor: '#F3F4F6',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Power'
      },
      'Zealotry': {
        name: 'Zealotry',
        label: 'Zealotry',
        category: 'TypeTag',
        color: '#7F1D1D', // Dark Red/Blood Rust
        textColor: '#FECACA',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Righteousness'
      },
      'Greed': {
        name: 'Greed',
        label: 'Greed',
        category: 'TypeTag',
        color: '#92400E', // Dark Gold/Burnished Bronze
        textColor: '#FEF3C7',
        iconUrl: null,
        polarityAssociation: 'Shadow',
        pairedWith: 'Wealth'
      }
    };
  }

  /**
   * Merge local and server configurations
   */
  _mergeConfigs(local, server) {
    // Server takes precedence for default tags, keep local for custom tags
    const merged = { ...this.defaultConfigs };
    
    if (local) {
      Object.entries(local).forEach(([key, value]) => {
        merged[key] = value;
      });
    }
    
    if (server) {
      Object.entries(server).forEach(([key, value]) => {
        merged[key] = value;
      });
    }
    
    return merged;
  }

  // ============================================
  // OBSERVER PATTERN
  // ============================================

  /**
   * Subscribe to configuration changes
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.configs);
      } catch (error) {
        console.error('Error in tag config listener:', error);
      }
    });
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  /**
   * Export configurations as JSON
   */
  exportToJSON() {
    return JSON.stringify({
      tagConfigurations: this.configs,
      version: 1,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import configurations from JSON
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.tagConfigurations) {
        this.configs = data.tagConfigurations;
        this._saveToLocalStorage();
        this._saveToServer();
        this._injectDynamicStyles();
        this._notifyListeners();
        return true;
      }
      throw new Error('Invalid JSON format');
    } catch (error) {
      console.error('Failed to import tag config:', error);
      return false;
    }
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  window.TAG_CONFIG_MANAGER = new TagConfigurationManager();
}
