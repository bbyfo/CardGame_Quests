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
    // Pending instructions from cards that target future decks
    this.pendingInstructions = [];
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
   * Helper: Get matching requirement tags for a given deck
   * Checks pending instructions and normal matching rules
   */
  getMatchingRequirement(deckName, defaultTags) {
    // Check if any pending instruction targets this deck
    for (const instruction of this.pendingInstructions) {
      if (instruction.target.toLowerCase() === deckName.toLowerCase()) {
        this.log(`Using instruction tags from "${instruction.source}" for ${deckName} matching`, {
          instruction: instruction.target,
          tags: instruction.tags
        });
        return instruction.tags;
      }
    }
    // Otherwise use default requirement
    return defaultTags;
  }

  /**
   * Helper: Store pending instruction from a drawn card
   */
  storePendingInstruction(card) {
    if (card.InstructionType && card.InstructionDeck) {
      // Don't store if target is "ThisCard" (applied immediately)
      if (card.InstructionDeck.toLowerCase() === 'thiscard') {
        return;
      }
      
      this.pendingInstructions.push({
        source: card.CardName,
        type: card.InstructionType,
        subType: card.InstructionSubType,
        target: card.InstructionDeck,
        tags: card.InstructionTags
      });
      this.log(`Instruction stored: "${card.CardName}" will add [${card.InstructionTags.join(', ')}] to ${card.InstructionDeck}`, {
        source: card.CardName,
        instruction: card.InstructionDeck
      });
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

      // Empty requiredTags means no constraint - accept any card
      const isMatch = requiredTags.length === 0 || matches.length > 0;

      if (isMatch) {
        selectedCard = card;
        if (requiredTags.length === 0) {
          this.log(
            `${deckName} Draw #${attempts}: ACCEPTED "${card.CardName}" (no tag constraints)`,
            { card: card.CardName, noConstraints: true }
          );
        } else {
          this.log(
            `${deckName} Draw #${attempts}: ACCEPTED "${card.CardName}" (matched tags: ${matches.join(', ')})`,
            { card: card.CardName, matchedTags: matches }
          );
        }
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
      target: card.InstructionDeck,
      tags: card.InstructionTags
    };

    if (card.InstructionSubType === 'Add') {
      if (card.InstructionDeck === 'ThisCard') {
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
          `Modify Effect: Tags [${card.InstructionTags.join(', ')}] marked for ${card.InstructionDeck}`,
          { appliedTo: card.InstructionDeck, tags: card.InstructionTags, source: card.CardName }
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
  stepDrawVerb(specificVerb) {
    this.log('=== STEP 1: Draw Verb ===');
    
    // Use specific verb if provided, otherwise draw random
    let verb = specificVerb;
    if (!verb) {
      verb = this.drawRandomCard(this.decks.verbs);
    }
    
    if (!verb) {
      this.log('ERROR: No verbs available');
      return null;
    }

    this.quest.verb = verb;
    this.log(`Verb drawn: "${verb.CardName}"`);
    const deckInfo = verb.InstructionDeck ? `${verb.InstructionDeck} with ` : '';
    this.log(`Verb target requirement: ${deckInfo}[${verb.TargetRequirement.join(', ')}]`, { requirement: verb.TargetRequirement });

    // Store verb's instruction if it targets a future deck
    if (verb.InstructionDeck) {
      this.pendingInstructions.push({
        source: verb.CardName,
        type: verb.InstructionType,
        subType: verb.InstructionSubType,
        target: verb.InstructionDeck,
        tags: verb.TargetRequirement
      });
      this.log(`Verb instruction stored: "${verb.CardName}" will match [${verb.TargetRequirement.join(', ')}] in ${verb.InstructionDeck}`, {
        source: verb.CardName,
        instruction: verb.InstructionDeck
      });
    }

    return verb;
  }

  /**
   * STEP 2: Draw Target
   */
  stepDrawTarget(verb) {
    this.log('=== STEP 2: Draw Target ===');
    
    // Check if verb has instruction targeting Target
    const requiredTags = this.getMatchingRequirement('Target', verb.TargetRequirement);
    
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
    
    // Store target's instruction if it targets a future deck
    this.storePendingInstruction(target);

    return target;
  }

  /**
   * STEP 3: Draw Location
   */
  stepDrawLocation(target) {
    this.log('=== STEP 3: Draw Location ===');
    
    // Check if any pending instruction targets Location
    // Use empty array as default - only explicit instructions apply, not inherited tags
    const requiredTags = this.getMatchingRequirement('Location', []);
    
    const matchCount = this.countMatchingCards(this.decks.locations, requiredTags);
    const totalCount = this.decks.locations.length;
    const percentage = ((matchCount / totalCount) * 100).toFixed(1);

    this.log(
      `Looking for location matching tags: [${requiredTags.join(', ')}]`,
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
    
    // Store location's instruction if it targets a future deck
    this.storePendingInstruction(location);

    return location;
  }

  /**
   * STEP 4: Draw Twist
   */
  stepDrawTwist(location) {
    this.log('=== STEP 4: Draw Twist ===');
    
    // Check if any pending instruction targets Twist
    // Use empty array as default - only explicit instructions apply, not inherited tags
    const requiredTags = this.getMatchingRequirement('Twist', []);
    
    const matchCount = this.countMatchingCards(this.decks.twists, requiredTags);
    const totalCount = this.decks.twists.length;
    const percentage = ((matchCount / totalCount) * 100).toFixed(1);

    this.log(
      `Looking for twist matching tags: [${requiredTags.join(', ')}]`,
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
    
    // Store twist's instruction if it targets a future deck
    this.storePendingInstruction(twist);

    return twist;
  }

  /**
   * STEP 5: Draw Reward and Failure
   */
  stepDrawRewardAndFailure(twist) {
    this.log('=== STEP 5: Draw Reward and Failure ===');

    // Check for pending instructions targeting Reward
    // Use empty array as default - only explicit instructions apply, not inherited tags
    const rewardTags = this.getMatchingRequirement('Reward', []);
    const rewardMatchCount = this.countMatchingCards(this.decks.rewards, rewardTags);
    const rewardTotalCount = this.decks.rewards.length;
    const rewardPercentage = ((rewardMatchCount / rewardTotalCount) * 100).toFixed(1);

    this.log(
      `Looking for reward matching tags: [${rewardTags.join(', ')}]`,
      { requiredTags: rewardTags }
    );
    this.log(`Reward match pool: ${rewardMatchCount}/${rewardTotalCount} (${rewardPercentage}%)`);

    const reward = this.drawWithFallback(this.decks.rewards, rewardTags, 'Reward', 'Reward');
    
    if (reward) {
      this.quest.reward = reward;
      this.log(`Reward selected: "${reward.CardName}"`);
      this.log(`Reward current tags: [${this.getCurrentTags(reward).join(', ')}]`);
      this.applyModifyEffects(reward, null);
      this.storePendingInstruction(reward);
    }

    // Check for pending instructions targeting Failure
    // Use empty array as default - only explicit instructions apply, not inherited tags
    const failureTags = this.getMatchingRequirement('Failure', []);
    const failureMatchCount = this.countMatchingCards(this.decks.failures, failureTags);
    const failureTotalCount = this.decks.failures.length;
    const failurePercentage = ((failureMatchCount / failureTotalCount) * 100).toFixed(1);

    this.log(
      `Looking for failure matching tags: [${failureTags.join(', ')}]`,
      { requiredTags: failureTags }
    );
    this.log(`Failure match pool: ${failureMatchCount}/${failureTotalCount} (${failurePercentage}%)`);

    const failure = this.drawWithFallback(this.decks.failures, failureTags, 'Failure', 'Failure');
    
    if (failure) {
      this.quest.failure = failure;
      this.log(`Failure selected: "${failure.CardName}"`);
      this.log(`Failure current tags: [${this.getCurrentTags(failure).join(', ')}]`);
      this.applyModifyEffects(failure, null);
      this.storePendingInstruction(failure);
    }

    return { reward, failure };
  }

  /**
   * Generate a complete quest
   */
  generateQuest(specificVerb) {
    this.reset();
    
    this.log('=== QUEST GENERATION STARTED ===');

    // Step 1: Draw Verb
    const verb = this.stepDrawVerb(specificVerb);
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
    this.stepDrawRewardAndFailure(twist);

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
