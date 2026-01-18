/**
 * validator.js
 * Validator mode for running multiple iterations and collecting analytics
 */

class QuestValidator {
  constructor(questEngine, dataLoader) {
    this.engine = questEngine;
    this.dataLoader = dataLoader;
    this.stats = {
      totalIterations: 0,
      cardUtilization: {},
      tagUtilization: {},
      fallbackFrequency: 0,
      drawAttempts: 0,
      modifyEffectsApplied: 0,
      deadCards: new Set(),
      overactiveCards: {},
      verbTightness: [],
      routingBottlenecks: {}
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalIterations: 0,
      cardUtilization: {},
      tagUtilization: {},
      fallbackFrequency: 0,
      drawAttempts: 0,
      modifyEffectsApplied: 0,
      deadCards: new Set(),
      overactiveCards: {},
      verbTightness: [],
      routingBottlenecks: {}
    };
  }

  /**
   * Initialize card tracking for all cards
   */
  initializeCardTracking() {
    const allCards = this.dataLoader.getAllCards();
    allCards.forEach(card => {
      const cardId = `${card.Deck}:${card.CardName}`;
      this.stats.cardUtilization[cardId] = {
        deck: card.Deck,
        name: card.CardName,
        drawCount: 0,
        selectedCount: 0,
        rejectionCount: 0
      };
      this.stats.deadCards.add(cardId);
    });
  }

  /**
   * Track a card being drawn
   */
  trackCardDraw(card) {
    if (!card) return;
    const cardId = `${card.Deck}:${card.CardName}`;
    if (this.stats.cardUtilization[cardId]) {
      this.stats.cardUtilization[cardId].drawCount++;
      this.stats.deadCards.delete(cardId);
    }
  }

  /**
   * Track a card being selected
   */
  trackCardSelected(card) {
    if (!card) return;
    const cardId = `${card.Deck}:${card.CardName}`;
    if (this.stats.cardUtilization[cardId]) {
      this.stats.cardUtilization[cardId].selectedCount++;
    }
  }

  /**
   * Track tag usage
   */
  trackTagUsage(tags) {
    if (!tags) return;
    tags.forEach(tag => {
      if (!this.stats.tagUtilization[tag]) {
        this.stats.tagUtilization[tag] = {
          tag: tag,
          usageCount: 0,
          inQuestCount: 0
        };
      }
      this.stats.tagUtilization[tag].usageCount++;
    });
  }

  /**
   * Track verb tightness (match pool size)
   */
  trackVerbTightness(matchPoolSize, totalCards) {
    const percentage = (matchPoolSize / totalCards) * 100;
    this.stats.verbTightness.push({
      size: matchPoolSize,
      total: totalCards,
      percentage: percentage
    });
  }

  /**
   * Track routing bottlenecks (steps with small match pools)
   */
  trackBottleneck(stepName, matchPoolSize, totalCards) {
    const percentage = (matchPoolSize / totalCards) * 100;
    if (percentage < 50) {
      if (!this.stats.routingBottlenecks[stepName]) {
        this.stats.routingBottlenecks[stepName] = {
          occurrences: 0,
          avgPoolSize: 0,
          avgPercentage: 0
        };
      }
      this.stats.routingBottlenecks[stepName].occurrences++;
    }
  }

  /**
   * Run validation for N iterations
   */
  validateAll(iterations = 100, progressCallback = null) {
    this.resetStats();
    this.initializeCardTracking();

    // Set validator reference in engine for card draw tracking
    this.engine.validator = this;

    // Clone decks for each iteration to avoid state carryover
    for (let i = 0; i < iterations; i++) {
      if (progressCallback) {
        progressCallback(i + 1, iterations);
      }

      // Fresh decks for this iteration
      this.engine.decks = this.dataLoader.getDecks();
      this.engine.reset();

      // Generate quest silently (suppress logs)
      this.generateQuestSilent();

      // Track stats from this quest
      this.analyzeQuestRun();

      this.stats.totalIterations++;
    }

    // Calculate aggregate stats
    this.calculateAggregateStats();
    return this.generateReport();
  }

  /**
   * Generate quest without logging
   */
  generateQuestSilent() {
    const originalLog = this.engine.log.bind(this.engine);
    this.engine.log = () => {}; // Suppress logs

    try {
      this.engine.generateQuest();
    } finally {
      this.engine.log = originalLog; // Restore logs
    }
  }

  /**
   * Analyze the results of a single quest run
   */
  analyzeQuestRun() {
    const quest = this.engine.getQuest();
    
    // Track selected template
    if (quest.template) this.trackCardSelected(quest.template);
    
    // Track all component cards (handle both single cards and arrays)
    for (const component of Object.values(quest.components)) {
      if (Array.isArray(component)) {
        component.forEach(card => this.trackCardSelected(card));
      } else if (component) {
        this.trackCardSelected(component);
      }
    }

    // Track stats
    this.stats.fallbackFrequency += this.engine.stats.fallbacksTriggered;
    this.stats.drawAttempts += this.engine.stats.drawAttempts;
    this.stats.modifyEffectsApplied += this.engine.stats.modifyEffectsApplied;

    // Track tag usage for all components
    for (const component of Object.values(quest.components)) {
      if (Array.isArray(component)) {
        component.forEach(card => this.trackTagUsage(this.engine.getCurrentTags(card)));
      } else if (component) {
        this.trackTagUsage(this.engine.getCurrentTags(component));
      }
    }
  }

  /**
   * Calculate aggregate statistics
   */
  calculateAggregateStats() {
    // Identify overactive cards (selected much more than expected)
    const avgSelectionsPerCard = this.stats.totalIterations / Object.keys(this.stats.cardUtilization).length;
    
    Object.keys(this.stats.cardUtilization).forEach(cardId => {
      const cardStats = this.stats.cardUtilization[cardId];
      const overactiveRatio = cardStats.selectedCount / (avgSelectionsPerCard || 1);
      
      if (overactiveRatio > 1.5) {
        this.stats.overactiveCards[cardId] = {
          name: cardStats.name,
          deck: cardStats.deck,
          selectedCount: cardStats.selectedCount,
          expectedCount: avgSelectionsPerCard.toFixed(1),
          ratio: overactiveRatio.toFixed(2)
        };
      }
    });

    // Calculate average verb tightness
    if (this.stats.verbTightness.length > 0) {
      const avgTightness = this.stats.verbTightness.reduce((sum, v) => sum + v.percentage, 0) / this.stats.verbTightness.length;
      this.stats.avgVerbTightness = avgTightness.toFixed(1);
    }
  }

  /**
   * Generate a validation report
   */
  generateReport() {
    const deadCardsList = Array.from(this.stats.deadCards).map(cardId => {
      const [deck, name] = cardId.split(':');
      return { deck, name };
    });

    const overactiveCardsList = Object.values(this.stats.overactiveCards);

    const sortedTags = Object.values(this.stats.tagUtilization)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 20);

    const sortedBottlenecks = Object.entries(this.stats.routingBottlenecks)
      .map(([step, data]) => ({
        step: step,
        bottleneckOccurrences: data.occurrences,
        bottleneckPercentage: ((data.occurrences / this.stats.totalIterations) * 100).toFixed(1)
      }))
      .sort((a, b) => b.bottleneckOccurrences - a.bottleneckOccurrences);

    return {
      summary: {
        totalIterations: this.stats.totalIterations,
        totalDraws: this.stats.drawAttempts,
        avgDrawsPerQuest: (this.stats.drawAttempts / this.stats.totalIterations).toFixed(2),
        totalFallbacks: this.stats.fallbackFrequency,
        fallbackRate: ((this.stats.fallbackFrequency / this.stats.totalIterations) * 100).toFixed(1) + '%',
        avgModifyEffectsPerQuest: (this.stats.modifyEffectsApplied / this.stats.totalIterations).toFixed(2)
      },
      cardUtilization: {
        totalCards: Object.keys(this.stats.cardUtilization).length,
        cardsUsed: Object.keys(this.stats.cardUtilization).length - this.stats.deadCards.size,
        deadCards: {
          count: this.stats.deadCards.size,
          cards: deadCardsList
        },
        overactiveCards: {
          count: overactiveCardsList.length,
          cards: overactiveCardsList
        }
      },
      tagUtilization: {
        uniqueTags: Object.keys(this.stats.tagUtilization).length,
        topTags: sortedTags
      },
      verbTightness: {
        avgPercentage: this.stats.avgVerbTightness || 'N/A',
        description: 'Lower = more restrictive verb requirements'
      },
      routingBottlenecks: {
        totalBottlenecks: sortedBottlenecks.length,
        byStep: sortedBottlenecks
      }
    };
  }

  /**
   * Format report as readable text
   */
  formatReportAsText(report) {
    let text = '=== QUEST VALIDATOR REPORT ===\n\n';

    text += '📊 SUMMARY\n';
    text += `Total Iterations: ${report.summary.totalIterations}\n`;
    text += `Total Draws: ${report.summary.totalDraws}\n`;
    text += `Avg Draws/Quest: ${report.summary.avgDrawsPerQuest}\n`;
    text += `Fallback Rate: ${report.summary.fallbackRate}\n`;
    text += `Avg Modify Effects/Quest: ${report.summary.avgModifyEffectsPerQuest}\n\n`;

    text += '🃏 CARD UTILIZATION\n';
    text += `Total Cards: ${report.cardUtilization.totalCards}\n`;
    text += `Cards Used: ${report.cardUtilization.cardsUsed}\n`;
    text += `Dead Cards: ${report.cardUtilization.deadCards.count}\n`;
    if (report.cardUtilization.deadCards.count > 0) {
      text += '  Dead Cards:\n';
      report.cardUtilization.deadCards.cards.forEach(card => {
        text += `    - ${card.name} (${card.deck})\n`;
      });
    }
    text += '\n';

    text += `Overactive Cards: ${report.cardUtilization.overactiveCards.count}\n`;
    if (report.cardUtilization.overactiveCards.count > 0) {
      text += '  Overactive Cards:\n';
      report.cardUtilization.overactiveCards.cards.forEach(card => {
        text += `    - ${card.name} (${card.deck}): ${card.selectedCount} times (ratio: ${card.ratio}x)\n`;
      });
    }
    text += '\n';

    text += '🏷️ TAG UTILIZATION\n';
    text += `Unique Tags: ${report.tagUtilization.uniqueTags}\n`;
    text += 'Top 20 Tags:\n';
    report.tagUtilization.topTags.forEach((tag, idx) => {
      text += `  ${idx + 1}. ${tag.tag}: ${tag.usageCount} uses\n`;
    });
    text += '\n';

    text += '⚙️ VERB TIGHTNESS\n';
    text += `Avg Match Pool: ${report.verbTightness.avgPercentage}%\n`;
    text += `${report.verbTightness.description}\n\n`;

    text += '🔀 ROUTING BOTTLENECKS\n';
    text += `Bottleneck Steps: ${report.routingBottlenecks.totalBottlenecks}\n`;
    if (report.routingBottlenecks.byStep.length > 0) {
      report.routingBottlenecks.byStep.forEach(bottleneck => {
        text += `  ${bottleneck.step}: ${bottleneck.bottleneckOccurrences} times (${bottleneck.bottleneckPercentage}%)\n`;
      });
    }

    return text;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestValidator;
}
