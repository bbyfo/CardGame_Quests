/**
 * dataLoader.js
 * Loads card data from JSON and initializes deck arrays
 */

class DataLoader {
  constructor() {
    this.decks = {
      questgivers: [],
      harmedparties: [],
      verbs: [],
      targets: [],
      locations: [],
      twists: [],
      rewards: [],
      failures: []
    };
    this.allCards = [];
  }

  /**
   * Load card data from JSON file
   */
  async loadData(dataPath = 'cards.json') {
    try {
      const response = await fetch(dataPath);
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
   * Populate decks from loaded data
   */
  populateDecks(data) {
    const deckNames = ['questgivers', 'harmedparties', 'verbs', 'targets', 'locations', 'twists', 'rewards', 'failures'];
    
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
    // Normalize Instructions to always be an array of {TargetDeck, Tags} objects
    let instructions = cardData.Instructions || [];
    if (!Array.isArray(instructions)) {
      instructions = [];
    }
    
    return {
      ...cardData,
      Instructions: instructions,
      mutableTags: cardData.mutableTags || [],
      id: `${cardData.Deck}-${cardData.CardName}-${Math.random()}`
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
