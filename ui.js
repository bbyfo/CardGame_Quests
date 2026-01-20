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
    bind('btn-reload-data', 'click', () => this.handleReloadData());
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
        this.engine.debugMode = e.target.checked;
        console.log('Debug mode:', e.target.checked ? 'Verbose logging enabled' : 'Concise logging enabled');
      });
    }

    const redrawLimit = document.getElementById('redraw-limit');
    if (redrawLimit) {
      // Initialize engine with current dropdown value
      this.engine.maxRedraws = parseInt(redrawLimit.value);
      
      redrawLimit.addEventListener('change', (e) => {
        this.engine.maxRedraws = parseInt(e.target.value);
        const displayValue = this.engine.maxRedraws === -1 ? '∞ (infinite)' : this.engine.maxRedraws;
        console.log('Max redraws set to:', displayValue);
      });
    }

    // Populate verb selector
    this.populateVerbSelector();
    
    // Setup collapsible sections
    this.setupCollapsibleSections();
  }

  /**
   * Setup collapsible sections with toggle buttons
   */
  setupCollapsibleSections() {
    const browserHeaders = document.querySelectorAll('.browser-header');
    
    browserHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        e.preventDefault();
        const button = header.querySelector('.toggle-btn');
        if (!button) return;
        
        const sectionId = button.dataset.section;
        const contentElement = document.getElementById(`${sectionId}-content`);
        
        if (contentElement) {
          contentElement.classList.toggle('collapsed');
          const isExpanded = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        }
      });
    });
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

    // Get distinct quest templates from the engine's deck
    const templates = this.engine.decks.questtemplates || [];
    const templateNames = [...new Set(templates.map(t => t.CardName))].sort();

    // Add template options
    for (const templateName of templateNames) {
      const option = document.createElement('option');
      option.value = templateName;
      option.textContent = templateName;
      selector.appendChild(option);
    }
  }

  /**
   * Get the selected verb from the dropdown (or null for random)
   */
  getSelectedVerb() {
    const selector = document.getElementById('verb-selector');
    if (!selector || !selector.value) return null;

    const templateName = selector.value;
    const templates = this.engine.decks.questtemplates || [];
    const template = templates.find(t => t.CardName === templateName);
    return template || null;
  }

  /**
   * Handle Generate Quest button
   */
  handleGenerate() {
    this.clearLogs();
    this.mode = 'normal';
    document.getElementById('btn-next-step').disabled = true;
    
    // Update engine debug mode from checkbox
    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
      this.engine.debugMode = debugToggle.checked;
    }
    
    // Auto-collapse Generation Settings section if it's open
    const settingsContent = document.getElementById('generation-settings-content');
    const settingsToggleBtn = document.querySelector('[data-section="generation-settings"]');
    if (settingsContent && !settingsContent.classList.contains('collapsed')) {
      settingsContent.classList.add('collapsed');
      if (settingsToggleBtn) {
        settingsToggleBtn.setAttribute('aria-expanded', 'false');
      }
    }
    
    // Refresh decks with fresh copies for new quest
    if (window.dataLoader) {
      this.engine.decks = window.dataLoader.getDecks();
      // Shuffle all decks before quest generation
      this.engine.shuffleDecks();
    }
    
    const selectedVerb = this.getSelectedVerb();
    const quest = this.engine.generateQuest(selectedVerb);
    
    // Always display logs (especially important if quest generation failed)
    this.displayLogs(this.engine.getLogs());
    
    if (quest) {
      this.displayQuest(quest);
    } else {
      // Quest generation failed - logs will show the detailed error
      const questOutput = document.getElementById('quest-output');
      questOutput.innerHTML = '<p class="error-message">Quest generation failed. See log for details.</p>';
    }
  }

  /**
   * Handle Step Through Mode button
   */
  handleStepThrough() {
    alert('Step-through mode is currently disabled. This feature needs to be updated to work with the new instruction-driven quest generation system.\n\nPlease use the "Generate Quest" button instead.');
    return;
    
    // Refresh decks with fresh copies for new quest
    if (window.dataLoader) {
      this.engine.decks = window.dataLoader.getDecks();
      // Shuffle all decks before quest generation
      this.engine.shuffleDecks();
    }
    
    // Update engine debug mode from checkbox
    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
      this.engine.debugMode = debugToggle.checked;
    }
    
    this.stepState = {
      step: 0, // 0: Verb, 1: Quest Giver, 2: Harmed Party, 3: Target, 4: Location, 5: Twist, 6: Reward, 7: Failure
      questGiver: null,
      harmedParty: null,
      verb: null,
      target: null,
      location: null,
      twist: null,
      reward: null,
      failure: null,
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

    alert('Step-through mode is currently disabled. This feature needs to be updated to work with the new instruction-driven quest generation system.\n\nPlease use the "Generate Quest" button instead.');
    
    // Reset to normal mode
    this.mode = 'normal';
    document.getElementById('btn-next-step').style.display = 'none';
    document.getElementById('btn-generate').style.display = 'inline-block';
    document.getElementById('btn-step-through').style.display = 'inline-block';
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
    
    // Build dead cards list
    let deadCardsHTML = '';
    if (report.cardUtilization.deadCards.count > 0) {
      deadCardsHTML = '<ul>' + report.cardUtilization.deadCards.cards
        .slice(0, 10)
        .map(c => `<li>${c.name} (${c.deck})</li>`)
        .join('') + '</ul>';
      if (report.cardUtilization.deadCards.count > 10) {
        deadCardsHTML += `<p><em>...and ${report.cardUtilization.deadCards.count - 10} more</em></p>`;
      }
    }
    
    // Build overactive cards list
    let overactiveCardsHTML = '';
    if (report.cardUtilization.overactiveCards.count > 0) {
      overactiveCardsHTML = '<ul>' + report.cardUtilization.overactiveCards.cards
        .slice(0, 10)
        .map(c => `<li>${c.name} (${c.deck}): ${c.selectedCount} times (${c.ratio}x expected)</li>`)
        .join('') + '</ul>';
      if (report.cardUtilization.overactiveCards.count > 10) {
        overactiveCardsHTML += `<p><em>...and ${report.cardUtilization.overactiveCards.count - 10} more</em></p>`;
      }
    }
    
    cardDiv.innerHTML = `
      <h4>Card Utilization</h4>
      <p><strong>Total Cards:</strong> ${report.cardUtilization.totalCards}</p>
      <p><strong>Cards Used:</strong> ${report.cardUtilization.cardsUsed}</p>
      <p><strong>Dead Cards:</strong> ${report.cardUtilization.deadCards.count}</p>
      ${deadCardsHTML}
      <p><strong>Overactive Cards:</strong> ${report.cardUtilization.overactiveCards.count}</p>
      ${overactiveCardsHTML}
    `;
    questOutput.appendChild(cardDiv);

    // Tag Utilization
    const tagDiv = document.createElement('div');
    tagDiv.className = 'report-section';
    tagDiv.innerHTML = `<h4>Top Tags</h4><ul>${report.tagUtilization.topTags.slice(0, 10).map(t => `<li>${t.tag}: ${t.usageCount}</li>`).join('')}</ul>`;
    questOutput.appendChild(tagDiv);
  }

  /**
   * Generate player-facing instruction text
   * This function can be reused for CSV export
   */
  generatePlayerInstruction(instructionData) {
    if (!instructionData || !instructionData.deck) return '';
    
    const { deck, count, tags, label } = instructionData;
    const countText = count > 1 ? `${count} cards` : '1 card';
    const deckText = deck;
    
    let tagsText = '';
    if (tags && tags.length > 0) {
      tagsText = ` which have ${tags.join(', ')}`;
    }
    
    return `Draw ${countText} from ${deckText}${tagsText}.`;
  }

  /**
   * Display a quest in the Quest Output section
   */
  displayQuest(quest) {
    const container = document.getElementById('quest-output');
    container.innerHTML = '';

    // Helper function to format instructions
    const formatInstructions = (instructions) => {
      if (!instructions || instructions.length === 0) return '';
      return `<div class="instructions">
        <span class="tag-label">Instructions:</span>
        ${instructions.map(inst => `<div class="instruction-item">${inst.TargetDeck}: [${inst.Tags.join(', ')}]</div>`).join('')}
      </div>`;
    };

    // Helper function to format a component (single card or array of cards)
    const formatComponent = (label, componentData) => {
      if (!componentData) return '';
      
      // Get instruction metadata (prefix/suffix/deck/count/tags) for this label
      const instructionMeta = quest.instructions && quest.instructions[label] ? quest.instructions[label] : {};
      const prefix = instructionMeta.prefix || '';
      const suffix = instructionMeta.suffix || '';
      
      // Generate player-facing instruction
      const playerInstruction = this.generatePlayerInstruction(instructionMeta);
      const playerInstructionHTML = playerInstruction ? 
        `<div class="player-instruction">📋 <em>${playerInstruction}</em></div>` : '';
      
      // Helper to wrap card name with prefix/suffix
      const wrapCardName = (cardName) => {
        let wrapped = '';
        if (prefix) wrapped += `<span class="prefix">${prefix} </span>`;
        wrapped += `<strong class="card-name">${cardName}</strong>`;
        if (suffix) wrapped += `<span class="suffix"> ${suffix}</span>`;
        return wrapped;
      };
      
      // Handle array of cards (multiple draws for same label)
      if (Array.isArray(componentData)) {
        return `<div class="quest-role">
          ${componentData.map((card, index) => `
            <div class="multi-card-item">
              <span class="card-number">#${index + 1}</span> ${wrapCardName(card.CardName)}
              <button class="btn-go-to-card" onclick="window.open('cardManager.html?cardId=${encodeURIComponent(card.id || '')}&cardName=${encodeURIComponent(card.CardName)}', '_blank')" title="Open in Card Manager">🔍 Go to Card</button>
              ${playerInstructionHTML}
              <div class="tags">
                <span class="tag-label">Type Tags:</span> ${card.TypeTags.join(', ')}
                <span class="tag-label">Aspect Tags:</span> ${card.AspectTags.join(', ')}
                ${card.mutableTags && card.mutableTags.length > 0 ? `<span class="tag-label">Mutable Tags:</span> ${card.mutableTags.join(', ')}` : ''}
              </div>
              ${formatInstructions(card.Instructions)}
            </div>
          `).join('')}
        </div>`;
      }
      
      // Handle single card
      return `<div class="quest-role">
        <div class="quest-role-header">
          ${wrapCardName(componentData.CardName)}
          <button class="btn-go-to-card" onclick="window.open('cardManager.html?cardId=${encodeURIComponent(componentData.id || '')}&cardName=${encodeURIComponent(componentData.CardName)}', '_blank')" title="Open in Card Manager">🔍 Go to Card</button>
        </div>
        ${playerInstructionHTML}
        <div class="tags">
          <span class="tag-label">Type Tags:</span> ${componentData.TypeTags.join(', ')}
          <span class="tag-label">Aspect Tags:</span> ${componentData.AspectTags.join(', ')}
          ${componentData.mutableTags && componentData.mutableTags.length > 0 ? `<span class="tag-label">Mutable Tags:</span> ${componentData.mutableTags.join(', ')}` : ''}
        </div>
        ${formatInstructions(componentData.Instructions)}
      </div>`;
    };

    // Build quest display HTML
    let questHTML = `
      <div class="quest-display">
        <h3>Generated Quest</h3>
        <div class="quest-role">
          <div class="quest-role-header">
            <strong>Template:</strong> <span class="card-name">${quest.template.CardName}</span>
            <button class="btn-go-to-card" onclick="window.open('cardManager.html?cardId=${encodeURIComponent(quest.template.id || '')}&cardName=${encodeURIComponent(quest.template.CardName)}', '_blank')" title="Open in Card Manager">🔍 Go to Template</button>
          </div>
        </div>
    `;

    // Add all components dynamically by label
    for (const [label, component] of Object.entries(quest.components)) {
      questHTML += formatComponent(label, component);
    }

    // Add reward and consequence text
    questHTML += `
        <div class="quest-role quest-outcome">
          <strong>Reward:</strong> 
          <div class="outcome-text">${quest.rewardText || 'No reward specified'}</div>
        </div>
        <div class="quest-role quest-outcome">
          <strong>Consequence:</strong> 
          <div class="outcome-text">${quest.consequenceText || 'No consequence specified'}</div>
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
      
      // Add error class for error logs
      if (log.type === 'error') {
        logEntry.classList.add('log-error');
      }
      
      // Add rejected class for rejected draw entries
      if (log.message && log.message.includes('REJECTED')) {
        logEntry.classList.add('log-rejected');
      }
      
      // Add fallback class for fallback triggered entries
      if (log.message && (log.message.includes('Fallback') || log.message.includes('FALLBACK'))) {
        logEntry.classList.add('log-fallback');
      }
      
      // Add dynamic color for match pool based on percentage
      if (log.message && log.message.includes('match pool:')) {
        const percentMatch = log.message.match(/\((\d+\.\d+)%\)/);
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1]);
          if (percent === 0) {
            logEntry.classList.add('log-pool-critical');
          } else if (percent < 25) {
            logEntry.classList.add('log-pool-very-low');
          } else if (percent < 40) {
            logEntry.classList.add('log-pool-low');
          } else if (percent < 60) {
            logEntry.classList.add('log-pool-medium');
          } else if (percent < 80) {
            logEntry.classList.add('log-pool-good');
          } else {
            logEntry.classList.add('log-pool-excellent');
          }
        }
      }

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
   * Handle Reload Card Data button
   */
  async handleReloadData() {
    this.clearLogs();
    this.addLog('🔄 Reloading card data from database...');

    try {
      // Check data source from server health endpoint
      let dataSourceInfo = 'Unknown';
      try {
        const healthResponse = await fetch('/api/health');
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          dataSourceInfo = health.dataSource || `${health.storage} storage`;
        }
      } catch (e) {
        dataSourceInfo = 'Server unavailable';
      }

      // Reload data from database via API
      await dataLoader.loadFromAPI('/api/cards');
      
      // Update engine with fresh decks
      this.engine.decks = dataLoader.getDecks();
      
      // Repopulate quest template selector
      this.populateVerbSelector();
      
      this.addLog(`✓ Card data reloaded successfully`);
      this.addLog(`📊 Data source: ${dataSourceInfo}`);
      this.addLog(`Loaded ${dataLoader.getAllCards().length} cards across ${Object.keys(this.engine.decks).length} decks`);
      
      // Log deck counts
      const deckCounts = Object.entries(this.engine.decks)
        .map(([name, cards]) => `${name}: ${cards.length}`)
        .join(', ');
      this.addLog(`Deck counts: ${deckCounts}`);
    } catch (error) {
      this.addLog(`❌ ERROR: Failed to reload card data: ${error.message}`);
      console.error('Reload error:', error);
    }
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
