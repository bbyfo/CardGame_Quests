/**
 * dataLoader.js
 * Data loading module for Monster Builder
 * Loads monster data from database/cards.json
 */

class DataLoader {
  constructor() {
    this.monsters = [];
    this.allCards = {};
    this.serverMode = false;
  }

  /**
   * Detect if server is available
   */
  async detectServer() {
    try {
      const response = await fetch(CONFIG.API_HEALTH, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.serverMode = response.ok;
      console.log(`Server mode: ${this.serverMode ? 'Online' : 'Offline'}`);
      return this.serverMode;
    } catch (error) {
      this.serverMode = false;
      console.log('Server mode: Offline (fallback to localStorage)');
      return false;
    }
  }

  /**
   * Load data from server API or fallback
   */
  async loadData() {
    await this.detectServer();

    try {
      if (this.serverMode) {
        await this.loadFromAPI();
      } else {
        await this.loadFromLocalStorage();
      }
      
      this.populateMonsters();
      console.log(`Loaded ${this.monsters.length} monsters`);
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      return false;
    }
  }

  /**
   * Load from server API
   */
  async loadFromAPI() {
    try {
      const response = await fetch(CONFIG.API_CARDS);
      if (!response.ok) throw new Error('Failed to fetch from API');
      
      this.allCards = await response.json();
      console.log('Loaded data from API');
    } catch (error) {
      console.error('API load failed:', error);
      throw error;
    }
  }

  /**
   * Load from localStorage (fallback)
   */
  async loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('monsterBuilderCards');
      if (stored) {
        this.allCards = JSON.parse(stored);
        console.log('Loaded data from localStorage');
      } else {
        // Initialize with empty structure
        this.allCards = {
          monsters: [],
          npcs: [],
          questtemplates: [],
          locations: [],
          twists: [],
          loot: []
        };
        console.log('Initialized empty card structure');
      }
    } catch (error) {
      console.error('localStorage load failed:', error);
      this.allCards = { monsters: [] };
    }
  }

  /**
   * Extract monsters from allCards and normalize them
   */
  populateMonsters() {
    const monstersData = this.allCards.monsters || this.allCards.Monster || [];
    this.monsters = monstersData.map(monster => this.normalizeMonster(monster));
  }

  /**
   * Normalize monster data using MONSTER_SCHEMA
   */
  normalizeMonster(monsterData) {
    return MONSTER_SCHEMA.normalize(monsterData);
  }

  /**
   * Get all monsters
   */
  getMonsters() {
    return this.monsters;
  }

  /**
   * Get monster by ID
   */
  getMonsterById(id) {
    return this.monsters.find(m => m.id === id);
  }

  /**
   * Get monster by name
   */
  getMonsterByName(name) {
    return this.monsters.find(m => m.CardName === name);
  }

  /**
   * Add a new monster
   */
  addMonster(monster) {
    const normalized = this.normalizeMonster(monster);
    this.monsters.push(normalized);
    return normalized;
  }

  /**
   * Update existing monster
   */
  updateMonster(id, updates) {
    const index = this.monsters.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error(`Monster with id ${id} not found`);
    }
    
    this.monsters[index] = this.normalizeMonster({
      ...this.monsters[index],
      ...updates
    });
    
    return this.monsters[index];
  }

  /**
   * Delete monster
   */
  deleteMonster(id) {
    const index = this.monsters.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error(`Monster with id ${id} not found`);
    }
    
    this.monsters.splice(index, 1);
    return true;
  }

  /**
   * Save all data
   */
  async saveData() {
    // Update monsters in allCards structure
    this.allCards.monsters = this.monsters;

    if (this.serverMode) {
      return await this.saveToAPI();
    } else {
      return await this.saveToLocalStorage();
    }
  }

  /**
   * Save to server API
   */
  async saveToAPI() {
    try {
      const response = await fetch(CONFIG.API_CARDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.allCards)
      });

      if (!response.ok) throw new Error('Failed to save to API');
      
      console.log('Saved data to API');
      return true;
    } catch (error) {
      console.error('API save failed:', error);
      throw error;
    }
  }

  /**
   * Save to localStorage (fallback)
   */
  async saveToLocalStorage() {
    try {
      localStorage.setItem('monsterBuilderCards', JSON.stringify(this.allCards));
      console.log('Saved data to localStorage');
      return true;
    } catch (error) {
      console.error('localStorage save failed:', error);
      throw error;
    }
  }

  /**
   * Export monsters as JSON
   */
  exportJSON() {
    return JSON.stringify(this.monsters, null, 2);
  }

  /**
   * Import monsters from JSON
   */
  importJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        this.monsters = imported.map(m => this.normalizeMonster(m));
        return true;
      }
      throw new Error('Invalid JSON format: expected array');
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  /**
   * Get monsters filtered by criteria
   */
  filterMonsters(criteria) {
    return this.monsters.filter(monster => {
      // Filter by polarity
      if (criteria.polarity && monster.Polarity !== criteria.polarity) {
        return false;
      }

      // Filter by TypeTags
      if (criteria.typeTags && criteria.typeTags.length > 0) {
        const hasTag = criteria.typeTags.some(tag => monster.TypeTags.includes(tag));
        if (!hasTag) return false;
      }

      // Filter by AspectTags
      if (criteria.aspectTags && criteria.aspectTags.length > 0) {
        const hasTag = criteria.aspectTags.some(tag => monster.AspectTags.includes(tag));
        if (!hasTag) return false;
      }

      // Filter by Habitat
      if (criteria.habitat && monster.Habitat) {
        if (!monster.Habitat.includes(criteria.habitat)) return false;
      }

      // Filter by name (search)
      if (criteria.search) {
        const searchLower = criteria.search.toLowerCase();
        if (!monster.CardName.toLowerCase().includes(searchLower)) return false;
      }

      return true;
    });
  }

  /**
   * Get monster statistics
   */
  getStatistics() {
    return {
      total: this.monsters.length,
      byPolarity: {
        Light: this.monsters.filter(m => m.Polarity === 'Light').length,
        Shadow: this.monsters.filter(m => m.Polarity === 'Shadow').length
      },
      byStrategy: this.monsters.reduce((acc, m) => {
        const strategy = m.MoveStrategy || 'none';
        acc[strategy] = (acc[strategy] || 0) + 1;
        return acc;
      }, {}),
      byHabitat: this.monsters.reduce((acc, m) => {
        if (m.Habitat && m.Habitat.length > 0) {
          m.Habitat.forEach(h => {
            acc[h] = (acc[h] || 0) + 1;
          });
        }
        return acc;
      }, {})
    };
  }
}
