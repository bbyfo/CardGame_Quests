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
    this.debugMode = false; // Default to non-verbose logging
    this.validator = null; // Reference to validator for tracking card draws
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
      questGiver: null,
      harmedParty: null,
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
   * @param {string} message - The message to log
   * @param {*} data - Optional data to include
   * @param {boolean} verboseOnly - If true, only log when debug mode is enabled
   */
  log(message, data = null, verboseOnly = false) {
    // Skip verbose logs if debug mode is off
    if (verboseOnly && !this.debugMode) {
      return;
    }

    const logEntry = {
      timestamp: this.logs.length,
      message: message,
      data: data
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
   * Helper: Count cards matching criteria
   */
  countMatchingCards(deck, requiredTags) {
    if (!requiredTags || requiredTags.length === 0) {
      return deck.length;
    }
    return deck.filter(card => {
      const cardTags = this.getDrawTags(card);
      return requiredTags.some(req => cardTags.includes(req));
    }).length;
  }

  /**
   * Helper: Get matching requirement tags for a given deck
   * Checks pending instructions and normal matching rules
   * Prioritizes the most recent (last added) instruction for a deck
   */
  getMatchingRequirement(deckName, defaultTags) {
    // Check if any pending instruction targets this deck
    // Search in reverse to get the most recent instruction (last added)
    for (let i = this.pendingInstructions.length - 1; i >= 0; i--) {
      const instruction = this.pendingInstructions[i];
      if (instruction.targetDeck && instruction.targetDeck.toLowerCase() === deckName.toLowerCase()) {
        this.log(`→ Applying instruction from "${instruction.source}" to ${deckName}: [${instruction.tags.join(', ')}]`);
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
          
          this.log(`Instruction stored: "${card.CardName}" will add [${tags.join(', ')}] to [${targetDeck}]`, {
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
   * Helper: Draw a random card from array
   */
  drawRandomCard(deck) {
    this.stats.drawAttempts++;
    if (deck.length === 0) return null;
    const index = Math.floor(Math.random() * deck.length);
    const card = deck[index];
    
    // Track card draw for validation statistics
    if (this.validator && card) {
      this.validator.trackCardDraw(card);
    }
    
    return card;
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

      const cardTags = this.getDrawTags(card);
      const matches = this.getTagIntersection(cardTags, requiredTags);

      // Empty requiredTags means no constraint - accept any card
      const isMatch = requiredTags.length === 0 || matches.length > 0;

      if (isMatch) {
        selectedCard = card;
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
        this.log(
          `${deckName} Draw #${attempts}: REJECTED "${card.CardName}" (no matching tags, needs: ${requiredTags.join(', ')})`,
          { card: card.CardName, requiredTags: requiredTags },
          true // Verbose only
        );

        if (attempts === 3) {
          this.log(`${deckName}: Fallback triggered - auto-accepting next card`);
          this.stats.fallbacksTriggered++;
          selectedCard = this.drawRandomCard(deck);
          this.log(
            `${deckName} Draw #4 (FALLBACK): Auto-accepted "${selectedCard.CardName}"`,
            { card: selectedCard.CardName, isFallback: true },
            true // Verbose only
          );
        }
      }
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
          `Modify Effect: "${card.CardName}" gained tags [${tags.join(', ')}]`,
          { appliedTo: 'ThisCard', tags: tags },
          true // Verbose only
        );
        this.stats.modifyEffectsApplied++;
      } else {
        // Will be applied to future deck via pending instructions
        this.log(
          `Modify Effect: Tags [${tags.join(', ')}] marked for [${targetDeck}]`,
          { source: card.CardName, targetDeck: targetDeck, tags: tags },
          true // Verbose only
        );
      }
    }
  }

  /**
   * STEP 1: Draw Quest Giver
   */
  stepDrawQuestGiver() {
    this.log('=== STEP 1: Draw Quest Giver ===');
    
    const questGiver = this.drawRandomCard(this.decks.questgivers);
    
    if (!questGiver) {
      this.log('ERROR: No quest givers available');
      return null;
    }

    this.quest.questGiver = questGiver;
    this.log(`Quest Giver drawn: "${questGiver.CardName}"`);

    // Store quest giver's instructions if it targets future decks
    if (questGiver.Instructions && Array.isArray(questGiver.Instructions) && questGiver.Instructions.length > 0) {
      for (const instruction of questGiver.Instructions) {
        this.pendingInstructions.push({
          source: questGiver.CardName,
          targetDeck: instruction.TargetDeck,
          tags: instruction.Tags || []
        });
      }
      const deckTargets = questGiver.Instructions.map(i => `${i.TargetDeck} [${i.Tags.join(', ')}]`).join(', ');
      this.log(`→ Instruction stored: "${questGiver.CardName}" will require ${deckTargets}`);
    }

    return questGiver;
  }

  /**
   * STEP 2: Draw Harmed Party
   */
  stepDrawHarmedParty() {
    this.log('=== STEP 2: Draw Harmed Party ===');
    
    const harmedParty = this.drawRandomCard(this.decks.harmedparties);
    
    if (!harmedParty) {
      this.log('ERROR: No harmed parties available');
      return null;
    }

    this.quest.harmedParty = harmedParty;
    this.log(`Harmed Party drawn: "${harmedParty.CardName}"`);

    // Store harmed party's instructions if it targets future decks
    if (harmedParty.Instructions && Array.isArray(harmedParty.Instructions) && harmedParty.Instructions.length > 0) {
      for (const instruction of harmedParty.Instructions) {
        this.pendingInstructions.push({
          source: harmedParty.CardName,
          targetDeck: instruction.TargetDeck,
          tags: instruction.Tags || []
        });
      }
      const deckTargets = harmedParty.Instructions.map(i => `${i.TargetDeck} [${i.Tags.join(', ')}]`).join(', ');
      this.log(`→ Instruction stored: "${harmedParty.CardName}" will require ${deckTargets}`);
    }

    return harmedParty;
  }

  /**
   * STEP 3: Draw Verb
   */
  stepDrawVerb(specificVerb) {
    this.log('=== STEP 3: Draw Verb ===');
    
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

    // Store verb's instructions if it targets future decks
    if (verb.Instructions && Array.isArray(verb.Instructions) && verb.Instructions.length > 0) {
      for (const instruction of verb.Instructions) {
        this.pendingInstructions.push({
          source: verb.CardName,
          targetDeck: instruction.TargetDeck,
          tags: instruction.Tags || []
        });
      }
      const deckTargets = verb.Instructions.map(i => `${i.TargetDeck} [${i.Tags.join(', ')}]`).join(', ');
      this.log(`→ Instruction stored: "${verb.CardName}" will require ${deckTargets}`);
    }

    return verb;
  }

  /**
   * STEP 4: Draw Target
   */
  stepDrawTarget(verb) {
    this.log('=== STEP 4: Draw Target ===');
    
    // Check if verb has instruction targeting Target deck
    const requiredTags = this.getMatchingRequirement('Target', []);
    
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
   * STEP 5: Draw Location
   */
  stepDrawLocation(target) {
    this.log('=== STEP 5: Draw Location ===');
    
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
    this.log('=== STEP 6: Draw Twist ===');
    
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
   * STEP 7: Draw Reward and Failure
   */
  stepDrawRewardAndFailure(twist) {
    this.log('=== STEP 7: Draw Reward and Failure ===');

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

    // Step 1: Draw Quest Giver
    const questGiver = this.stepDrawQuestGiver();
    if (!questGiver) return null;

    // Step 2: Draw Harmed Party
    const harmedParty = this.stepDrawHarmedParty();
    if (!harmedParty) return null;

    // Step 3: Draw Verb
    const verb = this.stepDrawVerb(specificVerb);
    if (!verb) return null;

    // Step 4: Draw Target
    const target = this.stepDrawTarget(verb);
    if (!target) return null;

    // Step 5: Draw Location
    const location = this.stepDrawLocation(target);
    if (!location) return null;

    // Step 6: Draw Twist
    const twist = this.stepDrawTwist(location);
    if (!twist) return null;

    // Step 7: Draw Reward and Failure
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
