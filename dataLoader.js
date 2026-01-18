/**
 * dataLoader.js
 * Loads card data from JSON and initializes deck arrays
 */

class DataLoader {
  constructor() {
    this.decks = {
      npcs: [],
      questtemplates: [],
      locations: [],
      twists: []
    };
    this.allCards = [];
  }

  /**
   * Load card data from JSON file
   */
  async loadData(dataPath = 'cards.json') {
    try {
      // Add timestamp to prevent browser caching
      const cacheBuster = `?_=${Date.now()}`;
      const response = await fetch(dataPath + cacheBuster);
      if (!response.ok) {
        throw new Error(`Failed to load ${dataPath}: ${response.statusText}`);
      }
      const data = await response.json();
      this.populateDecks(data);
      return this.decks;
    } catch (error) {
      console.error('DataLoader error:', error);
      throw error;
    }
  }

  /**
   * Load card data from API endpoint (for database mode)
   */
  async loadFromAPI(apiPath = '/api/cards') {
    try {
      // Add timestamp to prevent browser caching
      const cacheBuster = `?_=${Date.now()}`;
      const response = await fetch(apiPath + cacheBuster);
      if (!response.ok) {
        throw new Error(`Failed to load from API: ${response.statusText}`);
      }
      const data = await response.json();
      this.populateDecks(data);
      return this.decks;
    } catch (error) {
      console.error('DataLoader API error:', error);
      throw error;
    }
  }

  /**
   * Populate decks from loaded data
   */
  populateDecks(data) {
    const deckNames = ['npcs', 'questtemplates', 'locations', 'twists'];
    
    // Clear allCards when repopulating (for reload scenarios)
    this.allCards = [];
    
    deckNames.forEach(deckName => {
      if (data[deckName] && Array.isArray(data[deckName])) {
        this.decks[deckName] = data[deckName].map(card => this.initializeCard(card));
        this.allCards.push(...this.decks[deckName]);
      }
    });
  }

  /**
   * Initialize a card with runtime fields
   */
  initializeCard(cardData) {
    // For QuestTemplate cards, normalize DrawInstructions
    if (cardData.Deck === 'QuestTemplate') {
      const drawInstructions = cardData.DrawInstructions || [];
      return {
        ...cardData,
        DrawInstructions: Array.isArray(drawInstructions) ? drawInstructions : [],
        RewardText: cardData.RewardText || '',
        ConsequenceText: cardData.ConsequenceText || '',
        mutableTags: cardData.mutableTags || [],
        id: cardData.id || `${cardData.Deck}-${cardData.CardName}-${Math.random()}`
      };
    }
    
    // For other cards, normalize Instructions (for backward compatibility with card instructions)
    let instructions = cardData.Instructions || [];
    if (!Array.isArray(instructions)) {
      instructions = [];
    }
    
    return {
      ...cardData,
      Instructions: instructions,
      mutableTags: cardData.mutableTags || [],
      id: cardData.id || `${cardData.Deck}-${cardData.CardName}-${Math.random()}`
    };
  }

  /**
   * Get a copy of decks for quest generation
   */
  getDecks() {
    return JSON.parse(JSON.stringify(this.decks));
  }

  /**
   * Get all cards across all decks
   */
  getAllCards() {
    return this.allCards;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
