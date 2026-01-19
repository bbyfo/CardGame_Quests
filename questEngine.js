/**
 * questEngine.js
 * Core quest generation algorithm with instruction-driven architecture
 */

class QuestEngine {
  constructor(decks) {
    this.decks = decks;
    this.logs = [];
    this.quest = null;
    this.stepThroughMode = false;
    this.stepIndex = 0;
    this.debugMode = false; // Default to non-verbose logging
    this.validator = null; // Reference to validator for tracking card draws
    this.maxRedraws = 3; // Number of invalid draws before fallback (0-99, or -1 for infinite)
    this.rejectedCards = new Set(); // Cards rejected during this quest (temporary)
    this.stats = {
      drawAttempts: 0,
      fallbacksTriggered: 0,
      modifyEffectsApplied: 0,
      poorMatchPools: 0
    };
  }

  /**
   * Shuffle all decks using Fisher-Yates algorithm
   */
  shuffleDecks() {
    const deckNames = ['npcs', 'questtemplates', 'locations', 'twists', 'loot', 'monsters'];
    deckNames.forEach(deckName => {
      if (this.decks[deckName] && Array.isArray(this.decks[deckName])) {
        const deck = this.decks[deckName];
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
      }
    });
  }

  /**
   * Reset engine state for new quest
   */
  reset() {
    this.logs = [];
    this.rejectedCards = new Set(); // Clear rejected cards for new quest
    this.quest = {
      template: null,
      components: {}, // Flexible storage by label (QuestGiver, Target, etc.)
      instructions: {}, // Store instruction metadata (prefix, suffix) by label
      rewardText: null,
      consequenceText: null,
      modifications: []
    };
    this.stats = {
      drawAttempts: 0,
      fallbacksTriggered: 0,
      modifyEffectsApplied: 0,
      poorMatchPools: 0
    };
    // Pending instructions from cards that target future decks
    this.pendingInstructions = [];
  }

  /**
   * Log a message to the logs array
   * @param {string} message - The message to log
   * @param {*} data - Optional data to include
   * @param {boolean} verboseOnly - If true, only log when debug mode is enabled
   * @param {string} type - Log type: 'normal', 'error', 'warning'
   */
  log(message, data = null, verboseOnly = false, type = 'normal') {
    // Skip verbose logs if debug mode is off
    if (verboseOnly && !this.debugMode) {
      return;
    }

    const logEntry = {
      timestamp: this.logs.length,
      message: message,
      data: data,
      type: type
    };
    this.logs.push(logEntry);
    
    // Only console.log in debug mode or for important messages
    if (this.debugMode || !verboseOnly) {
      console.log(`[${logEntry.timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Helper: Get current tags for a card
   * This includes ALL tags (TypeTags, AspectTags, and mutableTags)
   * Used for display purposes only
   */
  getCurrentTags(card) {
    const tags = [...card.TypeTags, ...card.AspectTags, ...card.mutableTags];
    return tags;
  }

  /**
   * Helper: Get tags used for draw logic
   * Only includes TypeTags and mutableTags (AspectTags are excluded)
   */
  getDrawTags(card) {
    const tags = [...card.TypeTags, ...card.mutableTags];
    return tags;
  }

  /**
   * Helper: Get intersection of two tag arrays
   */
  getTagIntersection(tags1, tags2) {
    return tags1.filter(tag => tags2.includes(tag));
  }

  /**
   * Helper: Get deck by name
   */
  getDeckByName(deckName) {
    const normalizedName = deckName.toLowerCase();
    const deckMap = {
      'npc': this.decks.npcs,
      'npcs': this.decks.npcs,
      'location': this.decks.locations,
      'locations': this.decks.locations,
      'twist': this.decks.twists,
      'twists': this.decks.twists,
      'questtemplate': this.decks.questtemplates,
      'questtemplates': this.decks.questtemplates,
      'magicitem': this.decks.loot,
      'magicitems': this.decks.loot,
      'loot': this.decks.loot,
      'monster': this.decks.monsters,
      'monsters': this.decks.monsters
    };
    return deckMap[normalizedName] || null;
  }

  /**
   * Helper: Get matching requirement tags for a given deck
   * Checks pending instructions (most recent instruction wins)
   */
  getMatchingRequirement(deckName) {
    // Search in reverse to get the most recent instruction (last added)
    for (let i = this.pendingInstructions.length - 1; i >= 0; i--) {
      const instruction = this.pendingInstructions[i];
      if (instruction.targetDeck && instruction.targetDeck.toLowerCase() === deckName.toLowerCase()) {
        return instruction.tags;
      }
    }
    return [];
  }

  /**
   * Helper: Store pending instruction from a drawn card
   */
  storePendingInstruction(card) {
    if (card.Instructions && Array.isArray(card.Instructions) && card.Instructions.length > 0) {
      for (const instruction of card.Instructions) {
        const targetDeck = instruction.TargetDeck;
        const tags = instruction.Tags || [];
        
        // Don't store if target is "ThisCard" (applied immediately)
        if (targetDeck && targetDeck.toLowerCase() === 'thiscard') {
          continue;
        }
        
        if (targetDeck && tags.length > 0) {
          this.pendingInstructions.push({
            source: card.CardName,
            targetDeck: targetDeck,
            tags: tags
          });
          
          this.log(`→ Instruction: Add [${tags.join(', ')}] to ${targetDeck}`, {
            source: card.CardName,
            targetDeck: targetDeck,
            tags: tags
          }, true); // Verbose only
        }
      }
    }
  }

  /**
   * Helper: Get cards matching criteria
   */
  getMatchingCards(deck, requiredTags) {
    if (!requiredTags || requiredTags.length === 0) {
      return deck;
    }
    return deck.filter(card => {
      const cardTags = this.getDrawTags(card);
      return requiredTags.some(req => cardTags.includes(req));
    });
  }

  /**
   * Helper: Draw a random card from array, skipping rejected cards
   * Returns {card, deckIndex} where deckIndex is the position in the original deck
   */
  drawRandomCard(deck) {
    this.stats.drawAttempts++;
    
    if (deck.length === 0) return { card: null, deckIndex: -1 };
    
    // Draw from the first card in the deck (top of deck)
    const card = deck[0];
    const deckIndex = 0;
    
    // Track card draw for validation statistics
    if (this.validator && card) {
      this.validator.trackCardDraw(card);
    }
    
    return { card, deckIndex };
  }

  /**
   * Helper: Draw with fallback rule (configurable redraws before auto-accept)
   */
  drawWithFallback(deck, requiredTags, deckName, targetName) {
    let attempts = 0;
    let selectedCard = null;
    let selectedIndex = -1;
    const maxAttempts = this.maxRedraws + 1; // maxRedraws is number of redraws, add 1 for first draw
    const isInfinite = this.maxRedraws === -1;

    while ((isInfinite || attempts < maxAttempts) && !selectedCard) {
      attempts++;
      const { card, deckIndex } = this.drawRandomCard(deck);
      
      if (!card) {
        this.log(`${deckName}: No cards available in deck`);
        break;
      }

      const cardTags = this.getDrawTags(card);
      const matches = this.getTagIntersection(cardTags, requiredTags);

      // Empty requiredTags means no constraint - accept any card
      const isMatch = requiredTags.length === 0 || matches.length > 0;

      if (isMatch) {
        selectedCard = card;
        selectedIndex = deckIndex;
        if (requiredTags.length === 0) {
          this.log(
            `${deckName} Draw #${attempts}: ACCEPTED "${card.CardName}" (no tag constraints)`,
            { card: card.CardName, noConstraints: true },
            true // Verbose only
          );
        } else {
          this.log(
            `${deckName} Draw #${attempts}: ACCEPTED "${card.CardName}" (matched tags: ${matches.join(', ')})`,
            { card: card.CardName, matchedTags: matches },
            true // Verbose only
          );
        }
      } else {
        // Card was rejected - move it to bottom of deck
        deck.splice(deckIndex, 1);
        deck.push(card);
        this.log(
          `${deckName} Draw #${attempts}: REJECTED "${card.CardName}" (no matching tags, needs: ${requiredTags.join(', ')}) - moved to bottom`,
          { card: card.CardName, requiredTags: requiredTags },
          true // Verbose only
        );

        // Check if we should trigger fallback (only if not infinite mode)
        if (!isInfinite && attempts === this.maxRedraws) {
          this.log(`${deckName}: Fallback triggered - auto-accepting next card`);
          this.stats.fallbacksTriggered++;
          const fallbackResult = this.drawRandomCard(deck);
          if (fallbackResult.card) {
            selectedCard = fallbackResult.card;
            selectedIndex = fallbackResult.deckIndex;
            this.log(
              `${deckName} Draw #${attempts + 1} (FALLBACK): Auto-accepted "${selectedCard.CardName}"`,
              { card: selectedCard.CardName, isFallback: true },
              true // Verbose only
            );
          }
        }
      }
    }

    // Remove the card from the deck if one was successfully drawn
    if (selectedCard && selectedIndex >= 0) {
      deck.splice(selectedIndex, 1);
      this.log(
        `Card removed from ${deckName} deck (${deck.length} cards remaining)`,
        { cardsRemaining: deck.length },
        true // Verbose only
      );
    }

    return selectedCard;
  }

  /**
   * Apply Modify effects from a card
   */
  applyModifyEffects(card) {
    if (!card.Instructions || !Array.isArray(card.Instructions)) {
      return;
    }

    for (const instruction of card.Instructions) {
      const targetDeck = instruction.TargetDeck;
      const tags = instruction.Tags || [];
      
      if (!targetDeck || tags.length === 0) {
        continue;
      }

      // Handle ThisCard instruction (applied immediately to this card)
      if (targetDeck.toLowerCase() === 'thiscard') {
        card.mutableTags.push(...tags);
        this.log(
          `→ Instruction: Add [${tags.join(', ')}] to THISCARD`,
          { appliedTo: 'ThisCard', tags: tags },
          true // Verbose only
        );
        this.stats.modifyEffectsApplied++;
      } else {
        // Will be applied to future deck via pending instructions
        // (logging handled in storePendingInstruction)
      }
    }
  }

  /**
   * Helper: Count cards matching criteria
   */
  countMatchingCards(deck, requiredTags) {
    if (!deck || !Array.isArray(deck)) {
      return 0;
    }
    if (!requiredTags || requiredTags.length === 0) {
      return deck.length;
    }
    return deck.filter(card => {
      const cardTags = this.getDrawTags(card);
      return requiredTags.some(req => cardTags.includes(req));
    }).length;
  }

  /**
   * Process a single draw instruction
   * Supports drawing multiple cards if count > 1
   */
  processDrawInstruction(instruction) {
    const { action, deck: deckName, count, tags, label } = instruction;

    if (action === 'addToken') {
      // Add pending instruction for future deck
      this.pendingInstructions.push({
        source: 'DrawInstruction',
        targetDeck: deckName,
        tags: tags || []
      });
      this.log(
        `→ AddToken Instruction: Add [${(tags || []).join(', ')}] to ${deckName}`,
        { targetDeck: deckName, tags: tags },
        true
      );
      return null;
    }

    if (action === 'draw') {
      const deck = this.getDeckByName(deckName);
      if (!deck || !Array.isArray(deck)) {
        this.log(`ERROR: Deck "${deckName}" not found or invalid`, null, false, 'error');
        return null;
      }

      // Merge instruction tags with any pending tags for this deck
      const pendingTags = this.getMatchingRequirement(deckName);
      const allTags = [...new Set([...(tags || []), ...pendingTags])];

      this.log(`=== Drawing from ${deckName} (label: ${label || 'unlabeled'}) ===`);
      
      const matchCount = this.countMatchingCards(deck, allTags);
      const totalCount = deck.length;
      const percentage = totalCount > 0 ? ((matchCount / totalCount) * 100).toFixed(1) : '0.0';

      if (allTags.length > 0) {
        this.log(
          `Looking for ${deckName} with tags: [${allTags.join(', ')}]`,
          { requiredTags: allTags }
        );
      } else {
        this.log(`Drawing from ${deckName} (no tag constraints)`);
      }
      
      this.log(`Match pool: ${matchCount}/${totalCount} (${percentage}%)`);
      
      // Track poor match pools
      if (parseFloat(percentage) < 40 && matchCount > 0) {
        this.stats.poorMatchPools++;
      }

      // Check for zero match pool
      if (allTags.length > 0 && matchCount === 0) {
        this.log(
          `❌ FATAL ERROR: Zero match pool for ${deckName}! No cards have the required tags [${allTags.join(', ')}].`,
          { step: deckName, requiredTags: allTags, deckSize: totalCount },
          false,
          'error'
        );
        return null;
      }

      // Draw the specified number of cards
      const drawnCards = [];
      const drawCount = count || 1;
      
      for (let i = 0; i < drawCount; i++) {
        const card = this.drawWithFallback(deck, allTags, deckName, label || deckName);
        
        if (!card) {
          this.log(`ERROR: Failed to draw card ${i + 1}/${drawCount} from ${deckName}`);
          return null;
        }

        drawnCards.push(card);
        this.log(`Card ${i + 1}/${drawCount} selected: "${card.CardName}"`);
        this.log(`Current tags: [${this.getCurrentTags(card).join(', ')}]`);

        // Apply card's modify effects
        this.applyModifyEffects(card);
        
        // Store card's instructions
        this.storePendingInstruction(card);
      }

      return drawnCards.length === 1 ? drawnCards[0] : drawnCards;
    }

    this.log(`ERROR: Unknown instruction action "${action}"`, null, false, 'error');
    return null;
  }

  /**
   * Generate a complete quest using instruction-driven approach
   */
  generateQuest(specificTemplate) {
    this.reset();
    
    this.log('=== QUEST GENERATION STARTED ===');
    
    // Log generation settings
    this.log('Generation Settings:');
    this.log(`  • Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    this.log(`  • Max Redraws: ${this.maxRedraws === -1 ? '∞ (Draw until match)' : this.maxRedraws}`);
    this.log(`  • Step-Through Mode: ${this.stepThroughMode ? 'ON' : 'OFF'}`);
    if (specificTemplate) {
      this.log(`  • Template: "${specificTemplate.CardName}" (User-selected)`);
    } else {
      this.log(`  • Template: Random`);
    }
    this.log('');

    // Step 1: Draw or select QuestTemplate
    let template = specificTemplate;
    if (!template) {
      const templateDeck = this.getDeckByName('QuestTemplate');
      if (!templateDeck || templateDeck.length === 0) {
        this.log('ERROR: No quest templates available');
        return null;
      }
      const { card, deckIndex } = this.drawRandomCard(templateDeck);
      template = card;
      // Remove template from deck
      if (template && deckIndex >= 0) {
        templateDeck.splice(deckIndex, 1);
      }
    }
    
    if (!template) {
      this.log('ERROR: Failed to select quest template');
      return null;
    }

    this.quest.template = template;
    this.quest.rewardText = template.RewardText || 'No reward specified';
    this.quest.consequenceText = template.ConsequenceText || 'No consequence specified';
    
    this.log(`=== Quest Template: "${template.CardName}" ===`);
    this.log(`Reward: ${this.quest.rewardText}`);
    this.log(`Consequence: ${this.quest.consequenceText}`);

    // Step 2: Process DrawInstructions in order
    if (!template.DrawInstructions || !Array.isArray(template.DrawInstructions)) {
      this.log('ERROR: Template has no DrawInstructions array');
      return null;
    }

    for (let i = 0; i < template.DrawInstructions.length; i++) {
      const instruction = template.DrawInstructions[i];
      this.log(''); // Empty line for readability
      this.log(`--- Processing Instruction ${i + 1}/${template.DrawInstructions.length} ---`);
      
      const result = this.processDrawInstruction(instruction);
      
      // Only store if it's a draw action (addToken actions return null)
      if (instruction.action === 'draw') {
        if (!result) {
          this.log('ERROR: Instruction processing failed, aborting quest generation');
          return null;
        }
        
        const label = instruction.label || `component_${i}`;
        
        // Store instruction metadata (prefix, suffix, deck, count, tags)
        this.quest.instructions[label] = {
          prefix: instruction.prefix || '',
          suffix: instruction.suffix || '',
          deck: instruction.deck || '',
          count: instruction.count || 1,
          tags: instruction.tags || [],
          label: label
        };
        
        // If multiple cards drawn, store as array
        if (Array.isArray(result)) {
          this.quest.components[label] = result;
        } else {
          this.quest.components[label] = result;
        }
      }
    }

    this.log('\n=== QUEST GENERATION COMPLETE ===');
    this.log(`Total draw attempts: ${this.stats.drawAttempts}`);
    this.log(`Fallbacks triggered: ${this.stats.fallbacksTriggered}`);
    this.log(`Poor match pools (<40%): ${this.stats.poorMatchPools}`);
    this.log(`Modify effects applied: ${this.stats.modifyEffectsApplied}`);

    return this.quest;
  }

  /**
   * Get the current quest
   */
  getQuest() {
    return this.quest;
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Get formatted quest summary
   */
  getQuestSummary() {
    if (!this.quest.template) return null;

    const summary = {
      template: this.quest.template.CardName,
      components: {},
      rewardText: this.quest.rewardText,
      consequenceText: this.quest.consequenceText,
      stats: this.stats
    };

    // Add all components with their tags
    for (const [label, card] of Object.entries(this.quest.components)) {
      if (Array.isArray(card)) {
        // Multiple cards for this label
        summary.components[label] = card.map(c => ({
          name: c.CardName,
          tags: this.getCurrentTags(c)
        }));
      } else {
        // Single card
        summary.components[label] = {
          name: card.CardName,
          tags: this.getCurrentTags(card)
        };
      }
    }

    return summary;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestEngine;
}
