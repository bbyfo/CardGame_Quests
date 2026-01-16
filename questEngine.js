/**
 * questEngine.js
 * Core quest generation algorithm with detailed logging
 */

class QuestEngine {
  constructor(decks) {
    this.decks = decks;
    this.logs = [];
    this.quest = null;
    this.stepThroughMode = false;
    this.stepIndex = 0;
    this.stats = {
      drawAttempts: 0,
      fallbacksTriggered: 0,
      modifyEffectsApplied: 0
    };
  }

  /**
   * Reset engine state for new quest
   */
  reset() {
    this.logs = [];
    this.quest = {
      verb: null,
      target: null,
      location: null,
      twist: null,
      reward: null,
      failure: null,
      modifications: []
    };
    this.stats = {
      drawAttempts: 0,
      fallbacksTriggered: 0,
      modifyEffectsApplied: 0
    };
  }

  /**
   * Log a message to the logs array
   */
  log(message, data = null) {
    const logEntry = {
      timestamp: this.logs.length,
      message: message,
      data: data
    };
    this.logs.push(logEntry);
    console.log(`[${logEntry.timestamp}] ${message}`, data || '');
  }

  /**
   * Helper: Get current tags for a card
   */
  getCurrentTags(card) {
    const tags = [...card.TypeTags, ...card.AspectTags, ...card.mutableTags];
    return tags;
  }

  /**
   * Helper: Get intersection of two tag arrays
   */
  getTagIntersection(tags1, tags2) {
    return tags1.filter(tag => tags2.includes(tag));
  }

  /**
   * Helper: Count cards matching criteria
   */
  countMatchingCards(deck, requiredTags) {
    if (!requiredTags || requiredTags.length === 0) {
      return deck.length;
    }
    return deck.filter(card => {
      const cardTags = this.getCurrentTags(card);
      return requiredTags.some(req => cardTags.includes(req));
    }).length;
  }

  /**
   * Helper: Get cards matching criteria
   */
  getMatchingCards(deck, requiredTags) {
    if (!requiredTags || requiredTags.length === 0) {
      return deck;
    }
    return deck.filter(card => {
      const cardTags = this.getCurrentTags(card);
      return requiredTags.some(req => cardTags.includes(req));
    });
  }

  /**
   * Helper: Draw a random card from array
   */
  drawRandomCard(deck) {
    this.stats.drawAttempts++;
    if (deck.length === 0) return null;
    const index = Math.floor(Math.random() * deck.length);
    return deck[index];
  }

  /**
   * Helper: Draw with fallback rule (3 invalid → 4th auto-accept)
   */
  drawWithFallback(deck, requiredTags, deckName, targetName) {
    let attempts = 0;
    let selectedCard = null;

    while (attempts < 4 && !selectedCard) {
      attempts++;
      const card = this.drawRandomCard(deck);
      
      if (!card) {
        this.log(`${deckName}: No cards available in deck`);
        break;
      }

      const cardTags = this.getCurrentTags(card);
      const matches = this.getTagIntersection(cardTags, requiredTags);

      if (matches.length > 0) {
        selectedCard = card;
        this.log(
          `${deckName} Draw #${attempts}: ACCEPTED "${card.CardName}" (matched tags: ${matches.join(', ')})`,
          { card: card.CardName, matchedTags: matches }
        );
      } else {
        this.log(
          `${deckName} Draw #${attempts}: REJECTED "${card.CardName}" (no matching tags, needs: ${requiredTags.join(', ')})`,
          { card: card.CardName, requiredTags: requiredTags }
        );

        if (attempts === 3) {
          this.log(`${deckName}: Fallback triggered - auto-accepting next card`);
          this.stats.fallbacksTriggered++;
          selectedCard = this.drawRandomCard(deck);
          this.log(
            `${deckName} Draw #4 (FALLBACK): Auto-accepted "${selectedCard.CardName}"`,
            { card: selectedCard.CardName, isFallback: true }
          );
        }
      }
    }

    return selectedCard;
  }

  /**
   * Apply Modify effects from a card
   */
  applyModifyEffects(card, targetCard, deckName) {
    if (!card.InstructionType || card.InstructionType !== 'Modify') {
      return false;
    }

    const instruction = {
      source: card.CardName,
      type: card.InstructionType,
      subType: card.InstructionSubType,
      target: card.InstructionTarget,
      tags: card.InstructionTags
    };

    if (card.InstructionSubType === 'Add') {
      if (card.InstructionTarget === 'ThisCard') {
        card.mutableTags.push(...card.InstructionTags);
        this.log(
          `Modify Effect: "${card.CardName}" gained tags [${card.InstructionTags.join(', ')}]`,
          { appliedTo: 'ThisCard', tags: card.InstructionTags }
        );
      } else if (targetCard) {
        targetCard.mutableTags.push(...card.InstructionTags);
        this.log(
          `Modify Effect: "${targetCard.CardName}" gained tags [${card.InstructionTags.join(', ')}] from "${card.CardName}"`,
          { appliedTo: targetCard.CardName, tags: card.InstructionTags, source: card.CardName }
        );
      } else {
        // Target is another role (Location, Twist, Reward, Failure)
        this.log(
          `Modify Effect: Tags [${card.InstructionTags.join(', ')}] marked for ${card.InstructionTarget}`,
          { appliedTo: card.InstructionTarget, tags: card.InstructionTags, source: card.CardName }
        );
        return instruction;
      }
    }

    this.stats.modifyEffectsApplied++;
    return instruction;
  }

  /**
   * STEP 1: Draw Verb
   */
  stepDrawVerb() {
    this.log('=== STEP 1: Draw Verb ===');
    const verb = this.drawRandomCard(this.decks.verbs);
    
    if (!verb) {
      this.log('ERROR: No verbs available');
      return null;
    }

    this.quest.verb = verb;
    this.log(`Verb drawn: "${verb.CardName}"`);
    this.log(`Verb target requirement: [${verb.TargetRequirement.join(', ')}]`, { requirement: verb.TargetRequirement });

    return verb;
  }

  /**
   * STEP 2: Draw Target
   */
  stepDrawTarget(verb) {
    this.log('=== STEP 2: Draw Target ===');
    const requiredTags = verb.TargetRequirement;
    const matchCount = this.countMatchingCards(this.decks.targets, requiredTags);
    const totalCount = this.decks.targets.length;
    const percentage = ((matchCount / totalCount) * 100).toFixed(1);

    this.log(
      `Looking for target with tags: [${requiredTags.join(', ')}]`,
      { requiredTags: requiredTags }
    );
    this.log(`Match pool: ${matchCount}/${totalCount} (${percentage}%)`);

    const target = this.drawWithFallback(this.decks.targets, requiredTags, 'Target', 'Target');
    
    if (!target) {
      this.log('ERROR: Failed to draw target');
      return null;
    }

    this.quest.target = target;
    this.log(`Target selected: "${target.CardName}"`);
    this.log(`Target current tags: [${this.getCurrentTags(target).join(', ')}]`);

    // Apply target's Modify effects
    this.applyModifyEffects(target, null);

    return target;
  }

  /**
   * STEP 3: Draw Location
   */
  stepDrawLocation(target) {
    this.log('=== STEP 3: Draw Location ===');
    const requiredTags = this.getCurrentTags(target);
    const matchCount = this.countMatchingCards(this.decks.locations, requiredTags);
    const totalCount = this.decks.locations.length;
    const percentage = ((matchCount / totalCount) * 100).toFixed(1);

    this.log(
      `Looking for location matching target tags: [${requiredTags.join(', ')}]`,
      { requiredTags: requiredTags }
    );
    this.log(`Match pool: ${matchCount}/${totalCount} (${percentage}%)`);

    const location = this.drawWithFallback(this.decks.locations, requiredTags, 'Location', 'Location');
    
    if (!location) {
      this.log('ERROR: Failed to draw location');
      return null;
    }

    this.quest.location = location;
    this.log(`Location selected: "${location.CardName}"`);
    this.log(`Location current tags: [${this.getCurrentTags(location).join(', ')}]`);

    // Apply location's Modify effects
    this.applyModifyEffects(location, null);

    return location;
  }

  /**
   * STEP 4: Draw Twist
   */
  stepDrawTwist(location) {
    this.log('=== STEP 4: Draw Twist ===');
    const requiredTags = this.getCurrentTags(location);
    const matchCount = this.countMatchingCards(this.decks.twists, requiredTags);
    const totalCount = this.decks.twists.length;
    const percentage = ((matchCount / totalCount) * 100).toFixed(1);

    this.log(
      `Looking for twist matching location tags: [${requiredTags.join(', ')}]`,
      { requiredTags: requiredTags }
    );
    this.log(`Match pool: ${matchCount}/${totalCount} (${percentage}%)`);

    const twist = this.drawWithFallback(this.decks.twists, requiredTags, 'Twist', 'Twist');
    
    if (!twist) {
      this.log('ERROR: Failed to draw twist');
      return null;
    }

    this.quest.twist = twist;
    this.log(`Twist selected: "${twist.CardName}"`);
    this.log(`Twist current tags: [${this.getCurrentTags(twist).join(', ')}]`);

    // Apply twist's Modify effects
    this.applyModifyEffects(twist, null);

    return twist;
  }

  /**
   * STEP 5: Draw Reward and Failure
   */
  stepDrawRewardAndFailure() {
    this.log('=== STEP 5: Draw Reward and Failure ===');

    // Draw Reward
    const reward = this.drawRandomCard(this.decks.rewards);
    if (reward) {
      this.quest.reward = reward;
      this.log(`Reward selected: "${reward.CardName}"`);
      this.applyModifyEffects(reward, null);
    }

    // Draw Failure
    const failure = this.drawRandomCard(this.decks.failures);
    if (failure) {
      this.quest.failure = failure;
      this.log(`Failure selected: "${failure.CardName}"`);
      this.applyModifyEffects(failure, null);
    }

    return { reward, failure };
  }

  /**
   * Generate a complete quest
   */
  generateQuest() {
    this.reset();
    
    this.log('=== QUEST GENERATION STARTED ===');

    // Step 1: Draw Verb
    const verb = this.stepDrawVerb();
    if (!verb) return null;

    // Step 2: Draw Target
    const target = this.stepDrawTarget(verb);
    if (!target) return null;

    // Step 3: Draw Location
    const location = this.stepDrawLocation(target);
    if (!location) return null;

    // Step 4: Draw Twist
    const twist = this.stepDrawTwist(location);
    if (!twist) return null;

    // Step 5: Draw Reward and Failure
    this.stepDrawRewardAndFailure();

    this.log('=== QUEST GENERATION COMPLETE ===');
    this.log(`Total draw attempts: ${this.stats.drawAttempts}`);
    this.log(`Fallbacks triggered: ${this.stats.fallbacksTriggered}`);
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
    if (!this.quest.verb) return null;

    return {
      verb: this.quest.verb.CardName,
      target: this.quest.target ? this.quest.target.CardName : 'N/A',
      targetTags: this.quest.target ? this.getCurrentTags(this.quest.target) : [],
      location: this.quest.location ? this.quest.location.CardName : 'N/A',
      locationTags: this.quest.location ? this.getCurrentTags(this.quest.location) : [],
      twist: this.quest.twist ? this.quest.twist.CardName : 'N/A',
      twistTags: this.quest.twist ? this.getCurrentTags(this.quest.twist) : [],
      reward: this.quest.reward ? this.quest.reward.CardName : 'N/A',
      failure: this.quest.failure ? this.quest.failure.CardName : 'N/A',
      stats: this.stats
    };
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestEngine;
}
