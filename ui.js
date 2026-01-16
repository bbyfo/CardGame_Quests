/**
 * ui.js
 * UI Controller and event handlers for the quest app
 */

class UIManager {
  constructor(engine, validator) {
    this.engine = engine;
    this.validator = validator;
    this.mode = 'normal'; // normal, step-through
    this.stepState = null;
  }

  /**
   * Initialize UI - bind event handlers
   */
  initialize() {
    // Helper to safely bind event listeners
    const bind = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    // Controls Panel buttons
    bind('btn-generate', 'click', () => this.handleGenerate());
    bind('btn-step-through', 'click', () => this.handleStepThrough());
    bind('btn-next-step', 'click', () => this.handleNextStep());
    bind('btn-validate', 'click', () => this.handleValidate());
    bind('btn-clear-logs', 'click', () => this.handleClearLogs());
    bind('btn-import-csv', 'click', () => this.handleImportCSV());
    bind('btn-export-csv', 'click', () => this.handleExportCSV());
    bind('btn-csv-template', 'click', () => this.handleDownloadTemplate());
    bind('csv-file-input', 'change', (e) => this.handleCSVFileSelected(e));

    // Settings
    const seedInput = document.getElementById('seed-input');
    if (seedInput) {
      seedInput.addEventListener('change', (e) => {
        this.setSeed(e.target.value);
      });
    }

    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
      debugToggle.addEventListener('change', (e) => {
        console.log('Debug mode:', e.target.checked);
      });
    }

    // Populate verb selector
    this.populateVerbSelector();
  }

  /**
   * Populate the verb selector dropdown with distinct verbs
   */
  populateVerbSelector() {
    const selector = document.getElementById('verb-selector');
    if (!selector) return;

    // Clear existing options except the first one
    while (selector.options.length > 1) {
      selector.remove(1);
    }

    // Get distinct verbs from the engine's deck
    const verbs = this.engine.decks.verbs;
    const verbNames = [...new Set(verbs.map(v => v.CardName))].sort();

    // Add verb options
    for (const verbName of verbNames) {
      const option = document.createElement('option');
      option.value = verbName;
      option.textContent = verbName;
      selector.appendChild(option);
    }
  }

  /**
   * Get the selected verb from the dropdown (or null for random)
   */
  getSelectedVerb() {
    const selector = document.getElementById('verb-selector');
    if (!selector || !selector.value) return null;

    const verbName = selector.value;
    const verb = this.engine.decks.verbs.find(v => v.CardName === verbName);
    return verb || null;
  }

  /**
   * Handle Generate Quest button
   */
  handleGenerate() {
    this.clearLogs();
    this.mode = 'normal';
    document.getElementById('btn-next-step').disabled = true;
    
    const selectedVerb = this.getSelectedVerb();
    const quest = this.engine.generateQuest(selectedVerb);
    
    if (quest) {
      this.displayQuest(quest);
      this.displayLogs(this.engine.getLogs());
    } else {
      this.addLog('ERROR: Quest generation failed');
    }
  }

  /**
   * Handle Step Through Mode button
   */
  handleStepThrough() {
    this.clearLogs();
    this.mode = 'step-through';
    this.engine.reset();
    this.stepState = {
      step: 0, // 0: Quest Giver, 1: Harmed Party, 2: Verb, 3: Target, 4: Location, 5: Twist, 6: Reward/Failure
      questGiver: null,
      harmedParty: null,
      verb: null,
      target: null,
      location: null,
      twist: null,
      selectedVerb: this.getSelectedVerb()
    };

    document.getElementById('btn-next-step').disabled = false;
    this.addLog('Step-through mode activated. Click "Next Step" to proceed.');
  }

  /**
   * Handle Next Step button (in step-through mode)
   */
  handleNextStep() {
    if (this.mode !== 'step-through') {
      return;
    }

    const step = this.stepState.step;

    if (step === 0) {
      // Draw Quest Giver
      this.stepState.questGiver = this.engine.stepDrawQuestGiver();
      this.addLog(`Drawn Quest Giver: ${this.stepState.questGiver.CardName}`);
      this.addLog(`Type Tags: [${this.stepState.questGiver.TypeTags.join(', ')}]`);
      this.addLog(`Aspect Tags: [${this.stepState.questGiver.AspectTags.join(', ')}]`);
    } else if (step === 1) {
      // Draw Harmed Party
      this.stepState.harmedParty = this.engine.stepDrawHarmedParty();
      this.addLog(`Drawn Harmed Party: ${this.stepState.harmedParty.CardName}`);
      this.addLog(`Type Tags: [${this.stepState.harmedParty.TypeTags.join(', ')}]`);
      this.addLog(`Aspect Tags: [${this.stepState.harmedParty.AspectTags.join(', ')}]`);
    } else if (step === 2) {
      // Draw Verb
      this.stepState.verb = this.engine.stepDrawVerb(this.stepState.selectedVerb);
      this.addLog(`Drawn Verb: ${this.stepState.verb.CardName}`);
      this.addLog(`Target Requirement: [${this.stepState.verb.TargetRequirement.join(', ')}]`);
    } else if (step === 3) {
      // Draw Target
      this.stepState.target = this.engine.stepDrawTarget(this.stepState.verb);
      this.addLog(`Drawn Target: ${this.stepState.target.CardName}`);
      this.addLog(`Target Tags: [${this.engine.getCurrentTags(this.stepState.target).join(', ')}]`);
    } else if (step === 4) {
      // Draw Location
      this.stepState.location = this.engine.stepDrawLocation(this.stepState.target);
      this.addLog(`Drawn Location: ${this.stepState.location.CardName}`);
      this.addLog(`Location Tags: [${this.engine.getCurrentTags(this.stepState.location).join(', ')}]`);
    } else if (step === 5) {
      // Draw Twist
      this.stepState.twist = this.engine.stepDrawTwist(this.stepState.location);
      this.addLog(`Drawn Twist: ${this.stepState.twist.CardName}`);
      this.addLog(`Twist Tags: [${this.engine.getCurrentTags(this.stepState.twist).join(', ')}]`);
    } else if (step === 6) {
      // Draw Reward and Failure
      const { reward, failure } = this.engine.stepDrawRewardAndFailure(this.stepState.twist);
      this.addLog(`Drawn Reward: ${reward.CardName}`);
      this.addLog(`Drawn Failure: ${failure.CardName}`);
      this.stepState.step++; // Allow one more click to end
    } else if (step === 7) {
      this.addLog('Quest complete! Click "Generate Quest" to start a new quest.');
      document.getElementById('btn-next-step').disabled = true;
      this.displayQuest(this.engine.getQuest());
      return;
    }

    this.stepState.step++;
  }

  /**
   * Handle Validate button
   */
  handleValidate() {
    const iterationsInput = document.getElementById('iterations-input');
    const iterations = parseInt(iterationsInput.value) || 100;

    this.clearLogs();
    this.addLog(`Running validator with ${iterations} iterations...`);
    document.getElementById('btn-validate').disabled = true;

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const report = this.validator.validateAll(iterations, (current, total) => {
          if (current % 10 === 0) {
            this.addLog(`Progress: ${current}/${total} iterations`);
          }
        });

        const reportText = this.validator.formatReportAsText(report);
        this.clearLogs();
        this.addLog(reportText);

        // Also display as structured data
        this.displayValidationReport(report);
      } finally {
        document.getElementById('btn-validate').disabled = false;
      }
    }, 100);
  }

  /**
   * Display validation report in structured format
   */
  displayValidationReport(report) {
    const questOutput = document.getElementById('quest-output');
    questOutput.innerHTML = '<h3>Validation Report</h3>';

    // Summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'report-section';
    summaryDiv.innerHTML = `
      <h4>Summary</h4>
      <p><strong>Total Iterations:</strong> ${report.summary.totalIterations}</p>
      <p><strong>Avg Draws/Quest:</strong> ${report.summary.avgDrawsPerQuest}</p>
      <p><strong>Fallback Rate:</strong> ${report.summary.fallbackRate}</p>
    `;
    questOutput.appendChild(summaryDiv);

    // Card Utilization
    const cardDiv = document.createElement('div');
    cardDiv.className = 'report-section';
    cardDiv.innerHTML = `
      <h4>Card Utilization</h4>
      <p><strong>Total Cards:</strong> ${report.cardUtilization.totalCards}</p>
      <p><strong>Cards Used:</strong> ${report.cardUtilization.cardsUsed}</p>
      <p><strong>Dead Cards:</strong> ${report.cardUtilization.deadCards.count}</p>
      <p><strong>Overactive Cards:</strong> ${report.cardUtilization.overactiveCards.count}</p>
    `;
    questOutput.appendChild(cardDiv);

    // Tag Utilization
    const tagDiv = document.createElement('div');
    tagDiv.className = 'report-section';
    tagDiv.innerHTML = `<h4>Top Tags</h4><ul>${report.tagUtilization.topTags.slice(0, 10).map(t => `<li>${t.tag}: ${t.usageCount}</li>`).join('')}</ul>`;
    questOutput.appendChild(tagDiv);
  }

  /**
   * Display a quest in the Quest Output section
   */
  displayQuest(quest) {
    const container = document.getElementById('quest-output');
    container.innerHTML = '';

    const questHTML = `
      <div class="quest-display">
        <h3>Generated Quest</h3>
        <div class="quest-role">
          <strong>Quest Giver:</strong> ${quest.questGiver.CardName}
          <div class="tags">
            <span class="tag-label">Type Tags:</span> ${quest.questGiver.TypeTags.join(', ')}
            <span class="tag-label">Aspect Tags:</span> ${quest.questGiver.AspectTags.join(', ')}
          </div>
        </div>
        <div class="quest-role">
          <strong>Harmed Party:</strong> ${quest.harmedParty.CardName}
          <div class="tags">
            <span class="tag-label">Type Tags:</span> ${quest.harmedParty.TypeTags.join(', ')}
            <span class="tag-label">Aspect Tags:</span> ${quest.harmedParty.AspectTags.join(', ')}
          </div>
        </div>
        <div class="quest-role">
          <strong>Verb:</strong> ${quest.verb.CardName}
        </div>
        <div class="quest-role">
          <strong>Target:</strong> ${quest.target.CardName}
          <div class="tags">
            <span class="tag-label">Type Tags:</span> ${quest.target.TypeTags.join(', ')}
            <span class="tag-label">Aspect Tags:</span> ${quest.target.AspectTags.join(', ')}
            ${quest.target.mutableTags.length > 0 ? `<span class="tag-label">Mutable Tags:</span> ${quest.target.mutableTags.join(', ')}` : ''}
          </div>
        </div>
        <div class="quest-role">
          <strong>Location:</strong> ${quest.location.CardName}
          <div class="tags">
            <span class="tag-label">Type Tags:</span> ${quest.location.TypeTags.join(', ')}
            <span class="tag-label">Aspect Tags:</span> ${quest.location.AspectTags.join(', ')}
            ${quest.location.mutableTags.length > 0 ? `<span class="tag-label">Mutable Tags:</span> ${quest.location.mutableTags.join(', ')}` : ''}
          </div>
        </div>
        <div class="quest-role">
          <strong>Twist:</strong> ${quest.twist.CardName}
          <div class="tags">
            <span class="tag-label">Type Tags:</span> ${quest.twist.TypeTags.join(', ')}
            <span class="tag-label">Aspect Tags:</span> ${quest.twist.AspectTags.join(', ')}
            ${quest.twist.mutableTags.length > 0 ? `<span class="tag-label">Mutable Tags:</span> ${quest.twist.mutableTags.join(', ')}` : ''}
          </div>
        </div>
        <div class="quest-role">
          <strong>Reward:</strong> ${quest.reward.CardName}
        </div>
        <div class="quest-role">
          <strong>Failure:</strong> ${quest.failure.CardName}
        </div>
      </div>
    `;

    container.innerHTML = questHTML;
  }

  /**
   * Display logs in the Log Window
   */
  displayLogs(logs) {
    const logWindow = document.getElementById('log-window');
    logWindow.innerHTML = '';

    logs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';

      let content = `<span class="log-num">[${log.timestamp}]</span> ${log.message}`;
      if (log.data && Object.keys(log.data).length > 0) {
        content += ` <span class="log-data">${JSON.stringify(log.data)}</span>`;
      }

      logEntry.innerHTML = content;
      logWindow.appendChild(logEntry);
    });

    // Auto-scroll to bottom
    logWindow.scrollTop = logWindow.scrollHeight;
  }

  /**
   * Add a log entry to the log window
   */
  addLog(message) {
    const logWindow = document.getElementById('log-window');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-num">[${logWindow.children.length}]</span> ${message}`;
    logWindow.appendChild(logEntry);
    logWindow.scrollTop = logWindow.scrollHeight;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    document.getElementById('log-window').innerHTML = '';
  }

  /**
   * Handle Clear Logs button
   */
  handleClearLogs() {
    this.clearLogs();
  }

  /**
   * Set a seed for pseudo-random generation (stub for now)
   */
  setSeed(seed) {
    // In a full implementation, this would seed a PRNG
    console.log('Seed set to:', seed);
  }

  /**
   * Handle CSV import button click
   */
  handleImportCSV() {
    document.getElementById('csv-file-input').click();
  }

  /**
   * Handle CSV file selection
   */
  async handleCSVFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.clearLogs();
    this.addLog(`Loading CSV file: ${file.name}...`);

    try {
      const decks = await CSVImporter.parseCSV(file);
      this.addLog('✓ CSV parsed successfully');

      // Validate decks
      const errors = CSVImporter.validateDecks(decks);
      if (errors.length > 0) {
        this.addLog('⚠️ Validation warnings:');
        errors.forEach(error => this.addLog(`  - ${error}`));
      }

      // Show summary
      this.addLog(`\n📊 Deck Summary:`);
      this.addLog(`  Quest Givers: ${decks.questgivers.length}`);
      this.addLog(`  Harmed Parties: ${decks.harmedparties.length}`);
      this.addLog(`  Verbs: ${decks.verbs.length}`);
      this.addLog(`  Targets: ${decks.targets.length}`);
      this.addLog(`  Locations: ${decks.locations.length}`);
      this.addLog(`  Twists: ${decks.twists.length}`);
      this.addLog(`  Rewards: ${decks.rewards.length}`);
      this.addLog(`  Failures: ${decks.failures.length}`);
      this.addLog(`  Total: ${Object.values(decks).reduce((sum, arr) => sum + arr.length, 0)} cards`);

      // Update engine with new decks
      this.engine.decks = decks;
      this.validator.dataLoader.decks = decks;
      this.validator.dataLoader.allCards = Object.values(decks).flat();

      // Repopulate verb selector with new decks
      this.populateVerbSelector();

      this.addLog('\n✓ Decks loaded successfully! Ready to generate quests.');
      this.addLog('Tip: Run validation to check card balance.');

      // Reset file input
      event.target.value = '';
    } catch (error) {
      this.addLog(`❌ CSV Import Error: ${error.message}`);
      event.target.value = '';
    }
  }

  /**
   * Handle CSV export button click
   */
  handleExportCSV() {
    try {
      CSVImporter.downloadAsCSV(this.engine.decks);
      this.addLog('✓ CSV exported as quest_cards.csv');
    } catch (error) {
      this.addLog(`❌ CSV Export Error: ${error.message}`);
    }
  }

  /**
   * Handle CSV template download
   */
  handleDownloadTemplate() {
    try {
      CSVImporter.downloadTemplate();
      this.addLog('✓ CSV template downloaded as quest_cards_template.csv');
      this.addLog('Edit the template in Google Sheets or Excel, then import it here.');
    } catch (error) {
      this.addLog(`❌ Template Download Error: ${error.message}`);
    }
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
