/**
 * cardManager.js
 * Card management GUI with autocomplete, validation, and form handling
 */

// Polarity-based tag constants
const LIGHT_TAGS = ['Knowledge', 'Justice', 'Righteousness', 'Nature', 'Martial', 'Wealth'];
const SHADOW_TAGS = ['Deceit', 'Tyranny', 'Zealotry', 'Blight', 'Savagery', 'Greed'];

class CardManager {
  constructor() {
    this.dataLoader = null;
    this.cards = {};
    this.currentEditingCardId = null;
    this.originalDeckName = null; // Track original deck when editing
    this.originalCardName = null; // Track original card name when editing
    this.currentCardPolarity = null; // Track current card's Polarity for instruction display
    this.instructionData = [];
    this.drawInstructionData = []; // For QuestTemplate DrawInstructions
    this.editingInstructionIndex = -1; // -1 means not editing
    this.editingDrawInstructionIndex = -1; // -1 means not editing
    this.allTags = {
      type: new Set(),
      aspect: new Set(),
      mutable: new Set(),
      instructionTags: new Set(),
      polarity: new Set()
    };
    this.autocompleteSetupDone = false; // Track if event listeners are set up
    this.serverMode = false; // Detected if server is available
    this.selectedSuggestionIndex = -1; // Track keyboard navigation in autocomplete
    this.init();
  }

  /**
   * Get allowed TypeTags based on Polarity
   * @param {string} polarity - 'Light' or 'Shadow'
   * @returns {Array} Array of allowed tag names
   */
  getPolarityAllowedTags(polarity) {
    if (polarity === 'Light') {
      return LIGHT_TAGS;
    } else if (polarity === 'Shadow') {
      return SHADOW_TAGS;
    }
    return [];
  }

  /**
   * Refresh TypeTag autocomplete suggestions based on selected Polarity
   */
  refreshTypeTagsAutocomplete() {
    const polaritySelect = document.getElementById('polarity-select');
    const polarity = polaritySelect ? polaritySelect.value : '';
    
    // Get allowed tags for this polarity
    const allowedTags = polarity ? this.getPolarityAllowedTags(polarity) : [];
    
    // Filter discovered TypeTags to only show allowed ones
    const filteredTags = Array.from(this.allTags.type).filter(tag => allowedTags.includes(tag));
    
    // Re-setup the autocomplete with filtered tags
    this.setupTagAutocomplete('type-tags-input', 'type-tags-suggestions', filteredTags);
  }

  async init() {
    try {
      // Check if server is available
      await this.detectServer();
      
      if (this.serverMode) {
        // Load from server API
        const response = await fetch(CONFIG.API_CARDS);
        if (response.ok) {
          this.cards = await response.json();
          console.log('✓ Loaded cards from server');
          
          // Get data source info from health endpoint
          let dataSourceInfo = 'server';
          try {
            const healthResponse = await fetch(CONFIG.API_HEALTH);
            if (healthResponse.ok) {
              const health = await healthResponse.json();
              dataSourceInfo = health.dataSource || health.storage || 'server';
            }
          } catch (e) {
            // Use default if health check fails
          }
          
          this.showNotification(`Connected to ${dataSourceInfo} - auto-save enabled`, 'success');
        } else {
          throw new Error('Server returned error');
        }
      } else {
        // Fall back to localStorage or cards.json
        const savedCards = localStorage.getItem('cardManagerCards');
        
        if (savedCards) {
          this.cards = JSON.parse(savedCards);
          console.log('✓ Loaded cards from localStorage');
          this.showNotification('Server offline - using localStorage', 'warning');
        } else {
          this.dataLoader = new DataLoader();
          await this.dataLoader.loadData('cards.json');
          this.cards = this.dataLoader.decks;
          console.log('✓ Loaded cards from cards.json');
          this.showNotification('Server offline - using localStorage', 'warning');
        }
      }
      
      this.extractAllTags();
      this.setupEventListeners();
      this.renderCardsList();
      this.handleDeepLink();
      console.log('✓ Card Manager initialized');
      console.log('Loaded decks:', Object.keys(this.cards));
      console.log('Card counts:', Object.entries(this.cards).map(([deck, cards]) => `${deck}: ${cards.length}`).join(', '));
    } catch (error) {
      console.error('Failed to initialize Card Manager:', error);
      this.showNotification('Error loading cards: ' + error.message, 'error');
    }
  }

  /**
   * Detect if server is available
   */
  async detectServer() {
    try {
      const response = await fetch(CONFIG.API_HEALTH, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      this.serverMode = response.ok;
      return this.serverMode;
    } catch (error) {
      this.serverMode = false;
      return false;
    }
  }

  /**
   * Save cards with auto-persistence
   */
  async saveCardsToFile() {
    if (this.serverMode) {
      // Save to server
      try {
        const response = await fetch(CONFIG.API_CARDS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cards)
        });
        
        if (response.ok) {
          console.log('✓ Cards saved to database');
          this.showNotification('✓ Cards saved to database', 'success');
          
          // Also save to localStorage as backup
          localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
        } else {
          // Get error details from response
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Server save failed:', errorData);
          throw new Error(errorData.error || 'Server save failed');
        }
      } catch (error) {
        console.error('Server save error:', error);
        this.showNotification(`⚠️ Server save failed: ${error.message} - saved to localStorage only`, 'warning');
        localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
      }
    } else {
      // Save to localStorage only
      localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
      console.log('✓ Cards saved to localStorage');
      this.showNotification('⚠️ Server offline - saved to localStorage only', 'warning');
    }
  }
  
  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    const colors = {
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Extract all unique tags from cards for autocomplete suggestions
   */
  extractAllTags() {
    for (const deckName in this.cards) {
      const deck = this.cards[deckName];
      if (Array.isArray(deck)) {
        deck.forEach(card => {
          if (card.Polarity) {
            this.allTags.polarity.add(card.Polarity);
          }
          if (card.TypeTags) {
            card.TypeTags.forEach(tag => {
              this.allTags.type.add(tag);
              this.allTags.instructionTags.add(tag); // TypeTags available for instructions
            });
          }
          if (card.AspectTags) {
            card.AspectTags.forEach(tag => this.allTags.aspect.add(tag));
          }
          if (card.mutableTags) {
            card.mutableTags.forEach(tag => this.allTags.mutable.add(tag));
          }
        });
      }
    }
    
    // Log discovered tags for debugging
    console.log('✓ Discovered Polarities:', Array.from(this.allTags.polarity).sort().join(', '));
    console.log('✓ Discovered TypeTags:', Array.from(this.allTags.type).sort().join(', '));
    console.log('✓ Discovered AspectTags:', Array.from(this.allTags.aspect).sort().join(', '));
    
    // Add all valid TypeTags to type and instructionTags sets (both Light and Shadow)
    [...LIGHT_TAGS, ...SHADOW_TAGS].forEach(tag => {
      this.allTags.type.add(tag);
      this.allTags.instructionTags.add(tag);
    });
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Form submission
    const form = document.getElementById('card-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Deck selection change
    const deckSelect = document.getElementById('deck-select');
    if (deckSelect) {
      deckSelect.addEventListener('change', (e) => this.handleDeckChange(e));
    }

    // Polarity selection change - refresh TypeTag autocomplete
    const polaritySelect = document.getElementById('polarity-select');
    if (polaritySelect) {
      polaritySelect.addEventListener('change', () => {
        this.currentCardPolarity = polaritySelect.value;
        this.refreshTypeTagsAutocomplete();
        this.renderInstructions(); // Re-render to update Polarity tags
      });
    }

    // Clear form button
    const clearBtn = document.getElementById('btn-clear-form');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.resetForm());
    }

    // Cancel edit button
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.resetForm());
    }

    // Tag inputs with autocomplete
    this.setupTagAutocomplete('type-tags-input', 'type-tags-suggestions', Array.from(this.allTags.type));
    this.setupTagAutocomplete('aspect-tags-input', 'aspect-tags-suggestions', Array.from(this.allTags.aspect));
    this.setupTagAutocomplete('mutable-tags-input', null, Array.from(this.allTags.mutable));

    // Add instruction button
    const addInstrBtn = document.getElementById('btn-add-instruction');
    if (addInstrBtn) {
      addInstrBtn.addEventListener('click', () => this.openInstructionModal());
    }

    // Add draw instruction button
    const addDrawInstrBtn = document.getElementById('btn-add-draw-instruction');
    if (addDrawInstrBtn) {
      addDrawInstrBtn.addEventListener('click', () => this.openDrawInstructionModal());
    }

    // Modal controls
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeInstructionModal());
    }

    const saveInstrBtn = document.getElementById('btn-save-instruction');
    if (saveInstrBtn) {
      saveInstrBtn.addEventListener('click', () => this.saveInstruction());
    }

    const cancelInstrBtn = document.getElementById('btn-cancel-instruction');
    if (cancelInstrBtn) {
      cancelInstrBtn.addEventListener('click', () => this.closeInstructionModal());
    }

    // Draw instruction modal controls
    const drawModalClose = document.getElementById('draw-modal-close');
    if (drawModalClose) {
      drawModalClose.addEventListener('click', () => this.closeDrawInstructionModal());
    }

    const saveDrawInstrBtn = document.getElementById('btn-save-draw-instruction');
    if (saveDrawInstrBtn) {
      saveDrawInstrBtn.addEventListener('click', () => this.saveDrawInstruction());
    }

    const cancelDrawInstrBtn = document.getElementById('btn-cancel-draw-instruction');
    if (cancelDrawInstrBtn) {
      cancelDrawInstrBtn.addEventListener('click', () => this.closeDrawInstructionModal());
    }

    this.setupTagAutocomplete('instruction-tags', 'instruction-tags-suggestions', Array.from(this.allTags.instructionTags));
    this.setupTagAutocomplete('draw-tags-input', 'draw-tags-suggestions', Array.from(this.allTags.instructionTags));

    // Populate all deck select dropdowns
    this.populateAllDeckSelects();

    // Filter and search
    const filterDeck = document.getElementById('filter-deck');
    if (filterDeck) {
      filterDeck.addEventListener('change', () => this.renderCardsList());
    }

    const searchCards = document.getElementById('search-cards');
    if (searchCards) {
      searchCards.addEventListener('input', () => this.renderCardsList());
    }

    // TypeTag filter with autocomplete
    this.setupTagAutocomplete('filter-type-tags-input', 'filter-type-tags-suggestions', Array.from(this.allTags.type));

    // TypeTag filter match mode
    const filterTagMatchMode = document.getElementById('filter-tag-match-mode');
    if (filterTagMatchMode) {
      filterTagMatchMode.addEventListener('change', () => this.renderCardsList());
    }

    // Watch for tag changes in the filter tag list
    const filterTagList = document.getElementById('filter-type-tags-list');
    if (filterTagList) {
      // Use MutationObserver to detect when tags are added or removed
      const observer = new MutationObserver(() => this.renderCardsList());
      observer.observe(filterTagList, { childList: true });
    }

    // Export button
    const exportBtn = document.getElementById('btn-export-cards');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCards());
    }

    // Import button
    const importBtn = document.getElementById('btn-import-cards');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.triggerImport());
    }

    // File input for import
    const fileInput = document.getElementById('file-import');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    // Reset to defaults button
    const resetBtn = document.getElementById('btn-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // CSV Template download button
    const csvTemplateBtn = document.getElementById('btn-csv-template');
    if (csvTemplateBtn) {
      csvTemplateBtn.addEventListener('click', () => this.downloadCSVTemplate());
    }

    // Import CSV button
    const importCSVBtn = document.getElementById('btn-import-csv');
    if (importCSVBtn) {
      importCSVBtn.addEventListener('click', () => this.triggerCSVImport());
    }

    // CSV file input
    const csvFileInput = document.getElementById('csv-file-input');
    if (csvFileInput) {
      csvFileInput.addEventListener('change', (e) => this.handleCSVImport(e));
    }

    // Export CSV button
    const exportCSVBtn = document.getElementById('btn-export-csv');
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', () => this.exportCSV());
    }

    // Reload data button
    const reloadDataBtn = document.getElementById('btn-reload-data');
    if (reloadDataBtn) {
      reloadDataBtn.addEventListener('click', () => this.reloadCardData());
    }

    // Setup collapsible sections
    this.setupCollapsibleSections();
  }

  /**
   * Setup collapsible sections with toggle functionality
   */
  setupCollapsibleSections() {
    const browserHeaders = document.querySelectorAll('.browser-header');
    browserHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        e.preventDefault();
        const btn = header.querySelector('.toggle-btn');
        if (!btn) return;
        
        const sectionId = btn.dataset.section;
        const section = document.getElementById(sectionId);
        if (!section) return;

        const isCollapsed = section.classList.contains('collapsed');
        if (isCollapsed) {
          // Expand
          section.classList.remove('collapsed');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          // Collapse
          section.classList.add('collapsed');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /**
   * Refresh autocomplete suggestions with updated tags
   */
  refreshAutocomplete() {
    // Just update the tag sets - the event handlers will use the current values
    // No need to re-setup event listeners
    console.log('✓ Autocomplete refreshed with new tags');
  }

  /**
   * Set up autocomplete for tag input
   */
  setupTagAutocomplete(inputId, suggestionsId, suggestions) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const suggestionsDiv = suggestionsId ? document.getElementById(suggestionsId) : null;
    
    // Helper to get current suggestions for this input
    const getCurrentSuggestions = () => {
      const tagTypeMap = {
        'type-tags-input': 'type',
        'aspect-tags-input': 'aspect',
        'mutable-tags-input': 'mutable',
        'instruction-tags': 'instructionTags',
        'draw-tags-input': 'instructionTags',
        'filter-type-tags-input': 'type'
      };
      const tagType = tagTypeMap[inputId];
      return tagType ? Array.from(this.allTags[tagType]) : [];
    };
    
    input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      this.selectedSuggestionIndex = -1; // Reset selection on input change
      if (value.length > 0 && suggestionsDiv) {
        const currentSuggestions = getCurrentSuggestions();
        const filtered = currentSuggestions.filter(s => 
          s.toLowerCase().includes(value.toLowerCase())
        );
        this.showSuggestions(suggestionsDiv, filtered, value, inputId);
      } else if (suggestionsDiv) {
        suggestionsDiv.classList.remove('active');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (!suggestionsDiv) return;
      
      const isDropdownVisible = suggestionsDiv.classList.contains('active');
      const options = suggestionsDiv.querySelectorAll('.autocomplete-option');
      
      // Handle arrow keys and tab for navigation
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab') && isDropdownVisible && options.length > 0) {
        e.preventDefault();
        
        // Remove current selection
        if (this.selectedSuggestionIndex >= 0 && options[this.selectedSuggestionIndex]) {
          options[this.selectedSuggestionIndex].classList.remove('selected');
        }
        
        // Update index
        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
          this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % options.length;
        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
          this.selectedSuggestionIndex = this.selectedSuggestionIndex <= 0 ? options.length - 1 : this.selectedSuggestionIndex - 1;
        }
        
        // Apply new selection
        options[this.selectedSuggestionIndex].classList.add('selected');
        options[this.selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
      }
      // Handle Enter key
      else if (e.key === 'Enter') {
        e.preventDefault();
        
        // If dropdown is visible and an option is selected, use that
        if (isDropdownVisible && this.selectedSuggestionIndex >= 0 && options[this.selectedSuggestionIndex]) {
          const selectedText = options[this.selectedSuggestionIndex].textContent;
          this.addTag(inputId, selectedText);
          input.value = '';
          suggestionsDiv.classList.remove('active');
          this.selectedSuggestionIndex = -1;
        }
        // Otherwise use the typed value
        else {
          const value = e.target.value.trim();
          if (value.length > 0) {
            this.addTag(inputId, value);
            input.value = '';
            suggestionsDiv.classList.remove('active');
            this.selectedSuggestionIndex = -1;
          }
        }
      }
      // Handle Escape to close dropdown
      else if (e.key === 'Escape' && isDropdownVisible) {
        suggestionsDiv.classList.remove('active');
        this.selectedSuggestionIndex = -1;
      }
    });

    input.addEventListener('blur', () => {
      if (suggestionsDiv) {
        setTimeout(() => {
          suggestionsDiv.classList.remove('active');
          this.selectedSuggestionIndex = -1;
        }, 200);
      }
    });
  }

  /**
   * Show autocomplete suggestions
   */
  showSuggestions(container, suggestions, query, inputId, justAddedTag = null) {
    container.innerHTML = '';
    
    // Get existing tags from the corresponding tag list
    const listId = this.getTagListId(inputId);
    const existingTags = listId ? this.getTagsFromList(listId) : [];
    
    // Also exclude the tag that was just added (if any)
    if (justAddedTag) {
      existingTags.push(justAddedTag);
    }
    
    // Filter out tags that are already added
    const availableSuggestions = suggestions.filter(s => !existingTags.includes(s));
    
    const unique = [...new Set(availableSuggestions)];
    const limited = unique.slice(0, 8);

    if (limited.length === 0) {
      container.classList.remove('active');
      return;
    }

    limited.forEach(suggestion => {
      const option = document.createElement('div');
      option.className = 'autocomplete-option';
      option.textContent = suggestion;
      option.addEventListener('click', () => {
        this.addTag(inputId, suggestion);
        const input = document.getElementById(inputId);
        input.value = '';
        // Clear suggestions immediately
        container.innerHTML = '';
        container.classList.remove('active');
      });
      container.appendChild(option);
    });

    container.classList.add('active');
  }

  /**
   * Add a tag to the appropriate tag list
   */
  addTag(inputId, tagValue) {
    const listId = this.getTagListId(inputId);
    const list = document.getElementById(listId);
    if (!list) return;

    // Validate TypeTags against discovered tags AND Polarity
    if (inputId === 'type-tags-input' || inputId === 'filter-type-tags-input') {
      const validTypeTags = Array.from(this.allTags.type);
      if (!validTypeTags.includes(tagValue)) {
        this.showNotification(
          `⚠️ Invalid TypeTag: "${tagValue}". Valid tags are: ${validTypeTags.sort().join(', ')}`,
          'warning'
        );
        return;
      }
      
      // Additional validation for type-tags-input: check Polarity compatibility
      if (inputId === 'type-tags-input') {
        const polaritySelect = document.getElementById('polarity-select');
        const polarity = polaritySelect ? polaritySelect.value : '';
        
        if (polarity) {
          const allowedTags = this.getPolarityAllowedTags(polarity);
          if (!allowedTags.includes(tagValue)) {
            this.showNotification(
              `❌ Cannot add '${tagValue}' to ${polarity} Polarity card. ${polarity} cards can only have: ${allowedTags.join(', ')}`,
              'error'
            );
            return;
          }
        } else {
          this.showNotification(
            '⚠️ Please select a Polarity before adding TypeTags',
            'warning'
          );
          return;
        }
      }
    }

    // Check if tag already exists (clean comparison, no need to trim '×')
    const existingTags = Array.from(list.querySelectorAll('.tag')).map(t => t.textContent.trim());
    if (existingTags.includes(tagValue)) return;

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = tagValue; // Clean text only, '×' added via CSS ::after

    // Click anywhere on tag to remove it
    tag.addEventListener('click', () => {
      tag.remove();
      // Trigger input event to refresh suggestions after removing a tag
      const input = document.getElementById(inputId);
      if (input && input.value.trim().length > 0) {
        input.dispatchEvent(new Event('input'));
      }
    });

    list.appendChild(tag);
  }

  /**
   * Get the corresponding tag list ID for an input ID
   */
  getTagListId(inputId) {
    const mapping = {
      'type-tags-input': 'type-tags-list',
      'aspect-tags-input': 'aspect-tags-list',
      'mutable-tags-input': 'mutable-tags-list',
      'instruction-tags': 'instruction-tags-list',
      'draw-tags-input': 'draw-tags-list',
      'filter-type-tags-input': 'filter-type-tags-list'
    };
    return mapping[inputId] || null;
  }

  /**
   * Get tags from a tag list
   */
  getTagsFromList(listId) {
    const list = document.getElementById(listId);
    if (!list) return [];
    
    return Array.from(list.querySelectorAll('.tag'))
      .map(tag => tag.textContent.trim())
      .filter(text => text.length > 0);
  }

  /**
   * Return tags de-duplicated while preserving order
   */
  dedupeTags(tags) {
    if (!Array.isArray(tags)) return tags;
    const out = [];
    tags.forEach(t => { if (!out.includes(t)) out.push(t); });
    return out;
  }

  /**
   * Clear a tag list
   */
  clearTagList(listId) {
    const list = document.getElementById(listId);
    if (list) {
      list.innerHTML = '';
    }
  }

  /**
   * Handle deck selection change
   */
  handleDeckChange(e) {
    const selectedDeck = e.target.value;
    const isQuestTemplate = selectedDeck === 'questtemplates';
    
    // Show/hide appropriate fields based on deck type
    const instructionsSection = document.getElementById('instructions-section');
    const questTemplateFields = document.getElementById('questtemplate-fields');
    
    if (instructionsSection) {
      instructionsSection.style.display = isQuestTemplate ? 'none' : 'block';
    }
    if (questTemplateFields) {
      questTemplateFields.style.display = isQuestTemplate ? 'block' : 'none';
    }
  }

  /**
   * Handle form submission
   */
  handleFormSubmit(e) {
    e.preventDefault();

    const deckSelect = document.getElementById('deck-select').value;
    const cardName = document.getElementById('card-name').value.trim();
    const polarity = document.getElementById('polarity-select').value;

    if (!deckSelect || !cardName) {
      alert('Please select a deck and enter a card name');
      return;
    }

    // Validate Polarity is selected
    if (!polarity) {
      alert('❌ Polarity is required. Please select Light or Shadow.');
      return;
    }

    // Get TypeTags and validate against Polarity
    const typeTags = this.dedupeTags(this.getTagsFromList('type-tags-list'));
    const allowedTags = this.getPolarityAllowedTags(polarity);
    const invalidTags = typeTags.filter(tag => !allowedTags.includes(tag));
    
    if (invalidTags.length > 0) {
      alert(`❌ Invalid TypeTags for ${polarity} Polarity: ${invalidTags.join(', ')}\n\n${polarity} cards can only have: ${allowedTags.join(', ')}`);
      return;
    }

    const isQuestTemplate = deckSelect === 'questtemplates';

    const cardData = {
      Deck: this.getDeckDisplayName(deckSelect),
      CardName: cardName,
      Polarity: polarity,
      TypeTags: typeTags,
      AspectTags: this.dedupeTags(this.getTagsFromList('aspect-tags-list')),
      mutableTags: this.dedupeTags(this.getTagsFromList('mutable-tags-list')),
      DesignerNotes: document.getElementById('designer-notes')?.value || ''
    };

    // Add appropriate instruction/draw instruction data based on deck type
    if (isQuestTemplate) {
      cardData.DrawInstructions = this.drawInstructionData;
      cardData.RewardText = document.getElementById('reward-text')?.value || '';
      cardData.ConsequenceText = document.getElementById('consequence-text')?.value || '';
    } else {
      cardData.Instructions = this.instructionData;
    }

    // If editing an existing card
    if (this.originalDeckName && this.originalCardName) {
      // Remove from original deck if deck was changed
      if (this.originalDeckName !== deckSelect) {
        const originalDeck = this.cards[this.originalDeckName];
        if (Array.isArray(originalDeck)) {
          const index = originalDeck.findIndex(c => c.CardName === this.originalCardName);
          if (index >= 0) {
            originalDeck.splice(index, 1);
          }
        }
      } else {
        // Same deck, just remove the old card (by old name in case name was changed)
        const deck = this.cards[deckSelect];
        const index = deck.findIndex(c => c.CardName === this.originalCardName);
        if (index >= 0) {
          deck.splice(index, 1);
        }
      }
      
      // Add to target deck
      if (!Array.isArray(this.cards[deckSelect])) {
        this.cards[deckSelect] = [];
      }
      this.cards[deckSelect].push(cardData);
      
      // Clear edit tracking
      this.originalDeckName = null;
      this.originalCardName = null;
    } else {
      // Adding a new card
      if (!Array.isArray(this.cards[deckSelect])) {
        this.cards[deckSelect] = [];
      }
      this.cards[deckSelect].push(cardData);
    }

    this.saveCardsToFile();
    alert(`✓ Card "${cardName}" saved successfully!`);
    
    // Re-extract tags and refresh autocomplete after saving
    this.extractAllTags();
    this.refreshAutocomplete();
    
    this.resetForm();
    this.renderCardsList();
  }

  /**
   * Get display name for deck
   */
  getDeckDisplayName(deckKey) {
    const mapping = {
      'npcs': 'NPC',
      'questtemplates': 'Quest Template',
      'locations': 'Location',
      'twists': 'Twist',
      'magicitems': 'Magic Item',
      'monsters': 'Monster',
      'loot': 'Loot'
    };
    return mapping[deckKey] || deckKey;
  }

  /**
   * Get key for deck display name
   */
  getDeckKey(displayName) {
    const mapping = {
      'NPC': 'npcs',
      'Quest Template': 'questtemplates',
      'Location': 'locations',
      'Twist': 'twists',
      'Magic Item': 'magicitems',
      'Monster': 'monsters',
      'Loot': 'loot'
    };
    return mapping[displayName] || displayName.toLowerCase();
  }

  /**
   * Populate all deck select elements with available decks
   * This ensures consistency across the application
   */
  populateAllDeckSelects() {
    // Get deck names from loaded data and sort them
    const deckNames = Object.keys(this.cards).sort().filter(deckKey => Array.isArray(this.cards[deckKey]));

    // Populate the main card form deck selector
    const deckSelect = document.getElementById('deck-select');
    if (deckSelect) {
      const currentValue = deckSelect.value;
      deckSelect.innerHTML = '<option value="">-- Select Deck --</option>';
      deckNames.forEach(deckKey => {
        const option = document.createElement('option');
        option.value = deckKey;
        option.textContent = this.getDeckDisplayName(deckKey);
        deckSelect.appendChild(option);
      });
      if (currentValue && deckNames.includes(currentValue)) {
        deckSelect.value = currentValue;
      }
    }

    // Populate the filter deck dropdown
    const filterDeck = document.getElementById('filter-deck');
    if (filterDeck) {
      filterDeck.innerHTML = '<option value="">All Decks</option>';
      deckNames.forEach(deckKey => {
        const option = document.createElement('option');
        option.value = deckKey;
        option.textContent = this.getDeckDisplayName(deckKey);
        filterDeck.appendChild(option);
      });
    }

    // Populate the draw instruction deck dropdown
    const drawDeck = document.getElementById('draw-deck');
    if (drawDeck) {
      const currentValue = drawDeck.value;
      drawDeck.innerHTML = '<option value="">-- Select Deck --</option>';
      deckNames.forEach(deckKey => {
        const option = document.createElement('option');
        option.value = deckKey;
        option.textContent = this.getDeckDisplayName(deckKey);
        drawDeck.appendChild(option);
      });
      if (currentValue && deckNames.includes(currentValue)) {
        drawDeck.value = currentValue;
      }
    }
  }

  /**
   * Populate the deck filter dropdown dynamically from loaded decks
   * @deprecated Use populateAllDeckSelects() instead for consistency
   */
  populateDeckFilter() {
    this.populateAllDeckSelects();
  }

  /**
   * Populate the draw-deck dropdown with available decks
   * @deprecated Use populateAllDeckSelects() instead for consistency
   */
  populateDrawDeckDropdown() {
    this.populateAllDeckSelects();
  }

  /**
   * Open instruction modal
   */
  openInstructionModal() {
    const modal = document.getElementById('instruction-modal');
    const title = document.getElementById('instruction-modal-title');
    if (modal) {
      modal.style.display = 'flex';
      if (title) title.textContent = 'Add Instruction';
      this.editingInstructionIndex = -1; // -1 means adding new
      this.instructionData.push({ TargetDeck: '', Tags: [], faceDown: false });
      
      // Clear faceDown checkbox
      const faceDownCheckbox = document.getElementById('instruction-face-down');
      if (faceDownCheckbox) faceDownCheckbox.checked = false;
    }
  }

  /**
   * Edit an existing instruction
   */
  editInstruction(index) {
    const instruction = this.instructionData[index];
    if (!instruction) return;

    // Set editing index
    this.editingInstructionIndex = index;

    // Populate modal with instruction data
    const targetDeckSelect = document.getElementById('instruction-target-deck');
    if (targetDeckSelect) {
      targetDeckSelect.value = instruction.TargetDeck;
    }

    // Clear and populate tags list
    this.clearTagList('instruction-tags-list');
    instruction.Tags.forEach(tag => {
      this.addTag('instruction-tags', tag);
    });

    // Set faceDown checkbox
    const faceDownCheckbox = document.getElementById('instruction-face-down');
    if (faceDownCheckbox) {
      faceDownCheckbox.checked = instruction.faceDown || false;
    }

    // Open modal with edit title
    const modal = document.getElementById('instruction-modal');
    const title = document.getElementById('instruction-modal-title');
    if (modal) {
      modal.style.display = 'flex';
      if (title) title.textContent = 'Edit Instruction';
    }
  }

  /**
   * Close instruction modal
   */
  closeInstructionModal() {
    const modal = document.getElementById('instruction-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.clearTagList('instruction-tags-list');
    const targetDeckSelect = document.getElementById('instruction-target-deck');
    if (targetDeckSelect) {
      targetDeckSelect.value = '';
    }
  }

  /**
   * Save instruction from modal
   */
  saveInstruction() {
    const targetDeck = document.getElementById('instruction-target-deck').value;
    if (!targetDeck) {
      alert('Please select a target deck');
      return;
    }

    const tags = this.dedupeTags(this.getTagsFromList('instruction-tags-list'));
    if (tags.length === 0) {
      alert('Please add at least one tag to the instruction');
      return;
    }

    const faceDown = document.getElementById('instruction-face-down').checked;

    const instruction = {
      TargetDeck: targetDeck,
      Tags: tags,
      faceDown: faceDown
    }; 

    if (this.editingInstructionIndex >= 0) {
      // Editing existing instruction
      this.instructionData[this.editingInstructionIndex] = instruction;
    } else {
      // Adding new instruction - replace the placeholder
      if (this.instructionData.length > 0) {
        this.instructionData[this.instructionData.length - 1] = instruction;
      }
    }

    this.renderInstructions();
    this.closeInstructionModal();
  }

  /**
   * Render instructions list
   */
  renderInstructions() {
    const list = document.getElementById('instructions-list');
    if (!list) return;

    list.innerHTML = '';

    this.instructionData.forEach((instr, index) => {
      const item = document.createElement('div');
      item.className = 'instruction-item';
      item.style.cursor = 'pointer';
      item.title = 'Click to edit';
      // Get card's Polarity to display as first tag
      const polarityTag = this.currentCardPolarity ? `<span class="polarity-badge polarity-${this.currentCardPolarity.toLowerCase()}">${this.currentCardPolarity}</span>` : '';
      
      item.innerHTML = `
        <h4>${instr.TargetDeck}</h4>
        <div class="instruction-tags">
          ${polarityTag}
          ${instr.Tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <span class="instruction-remove" data-index="${index}">✕</span>
      `;

      // Click to edit instruction
      item.addEventListener('click', (e) => {
        // Don't trigger edit if clicking remove button
        if (e.target.classList.contains('instruction-remove')) return;
        this.editInstruction(index);
      });

      const removeBtn = item.querySelector('.instruction-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.instructionData.splice(index, 1);
        this.renderInstructions();
      });

      list.appendChild(item);
    });
  }

  /**
   * Open draw instruction modal
   */
  openDrawInstructionModal() {
    const modal = document.getElementById('draw-instruction-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.editingDrawInstructionIndex = -1; // -1 means adding new
      
      // Populate deck dropdown
      this.populateDrawDeckDropdown();
      
      // Reset form
      document.getElementById('draw-action').value = '';
      document.getElementById('draw-deck').value = '';
      document.getElementById('draw-count').value = '1';
      document.getElementById('draw-label').value = '';
      document.getElementById('draw-prefix').value = '';
      document.getElementById('draw-suffix').value = '';
      document.getElementById('draw-polarity').value = '';
      this.clearTagList('draw-tags-list');
      
      // Clear faceDown checkbox
      const faceDownCheckbox = document.getElementById('draw-face-down');
      if (faceDownCheckbox) faceDownCheckbox.checked = false;
    }
  }

  /**
   * Close draw instruction modal
   */
  closeDrawInstructionModal() {
    const modal = document.getElementById('draw-instruction-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.clearTagList('draw-tags-list');
  }

  /**
   * Save draw instruction from modal
   */
  saveDrawInstruction() {
    const action = document.getElementById('draw-action').value;
    const deck = document.getElementById('draw-deck').value;
    const count = parseInt(document.getElementById('draw-count').value);
    const label = document.getElementById('draw-label').value.trim();
    const prefix = document.getElementById('draw-prefix').value.trim();
    const suffix = document.getElementById('draw-suffix').value.trim();
    const polarity = document.getElementById('draw-polarity').value || null;
    const tags = this.dedupeTags(this.getTagsFromList('draw-tags-list'));
    const faceDown = document.getElementById('draw-face-down').checked; 

    if (!action) {
      alert('Please select an action');
      return;
    }

    if (!deck) {
      alert('Please select a deck');
      return;
    }

    if (!label) {
      alert('Please enter a label');
      return;
    }

    const drawInstruction = {
      action: action,
      deck: deck,
      count: count,
      tags: tags,
      label: label,
      prefix: prefix || '',
      suffix: suffix || '',
      polarity: polarity,
      faceDown: faceDown
    };

    if (this.editingDrawInstructionIndex >= 0) {
      // Editing existing instruction
      this.drawInstructionData[this.editingDrawInstructionIndex] = drawInstruction;
    } else {
      // Adding new instruction
      this.drawInstructionData.push(drawInstruction);
    }

    this.renderDrawInstructions();
    this.closeDrawInstructionModal();
  }

  /**
   * Render draw instructions list
   */
  renderDrawInstructions() {
    const list = document.getElementById('draw-instructions-list');
    if (!list) return;

    list.innerHTML = '';

    this.drawInstructionData.forEach((instr, index) => {
      const item = document.createElement('div');
      item.className = 'instruction-item';
      item.style.cursor = 'pointer';
      item.title = 'Click to edit';
      
      const canMoveUp = index > 0;
      const canMoveDown = index < this.drawInstructionData.length - 1;
      
      // Build preview text with prefix/suffix
      let previewText = '';
      if (instr.prefix) previewText += `<em>"${instr.prefix}"</em> `;
      previewText += `<strong>[${instr.label}]</strong>`;
      if (instr.suffix) previewText += ` <em>"${instr.suffix}"</em>`;
      
      item.innerHTML = `
        <div class="instruction-header">
          <h4>${instr.label} (${instr.action})</h4>
          <div class="instruction-controls">
            <button class="instruction-move-up" data-index="${index}" ${!canMoveUp ? 'disabled' : ''} title="Move up">▲</button>
            <button class="instruction-move-down" data-index="${index}" ${!canMoveDown ? 'disabled' : ''} title="Move down">▼</button>
            <span class="instruction-remove" data-index="${index}">✕</span>
          </div>
        </div>
        <div class="instruction-preview">${previewText}</div>
        <div class="instruction-details">
          <span><strong>Deck:</strong> ${instr.deck}</span>
          <span><strong>Count:</strong> ${instr.count}</span>
        </div>
        ${instr.tags.length > 0 || instr.polarity ? `<div class="instruction-tags">
          ${instr.polarity ? `<span class="polarity-badge polarity-${instr.polarity.toLowerCase()}">${instr.polarity}</span>` : ''}
          ${instr.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>` : ''}
      `;

      // Click to edit instruction
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('instruction-remove') ||
            e.target.classList.contains('instruction-move-up') ||
            e.target.classList.contains('instruction-move-down')) {
          return;
        }
        this.editDrawInstruction(index);
      });

      // Move up button
      const moveUpBtn = item.querySelector('.instruction-move-up');
      moveUpBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (index > 0) {
          [this.drawInstructionData[index - 1], this.drawInstructionData[index]] = 
            [this.drawInstructionData[index], this.drawInstructionData[index - 1]];
          this.renderDrawInstructions();
        }
      });

      // Move down button
      const moveDownBtn = item.querySelector('.instruction-move-down');
      moveDownBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (index < this.drawInstructionData.length - 1) {
          [this.drawInstructionData[index], this.drawInstructionData[index + 1]] = 
            [this.drawInstructionData[index + 1], this.drawInstructionData[index]];
          this.renderDrawInstructions();
        }
      });

      // Remove button
      const removeBtn = item.querySelector('.instruction-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.drawInstructionData.splice(index, 1);
        this.renderDrawInstructions();
      });

      list.appendChild(item);
    });
  }

  /**
   * Edit an existing draw instruction
   */
  editDrawInstruction(index) {
    const instruction = this.drawInstructionData[index];
    if (!instruction) return;

    this.editingDrawInstructionIndex = index;

    // Populate deck dropdown first
    this.populateDrawDeckDropdown();

    // Populate modal
    document.getElementById('draw-action').value = instruction.action;
    document.getElementById('draw-deck').value = instruction.deck;
    document.getElementById('draw-count').value = instruction.count;
    document.getElementById('draw-label').value = instruction.label;
    document.getElementById('draw-prefix').value = instruction.prefix || '';
    document.getElementById('draw-suffix').value = instruction.suffix || '';
    document.getElementById('draw-polarity').value = instruction.polarity || '';

    // Clear and populate tags
    this.clearTagList('draw-tags-list');
    if (instruction.tags && Array.isArray(instruction.tags)) {
      instruction.tags.forEach(tag => {
        this.addTag('draw-tags-input', tag);
      });
    }

    // Set faceDown checkbox
    const faceDownCheckbox = document.getElementById('draw-face-down');
    if (faceDownCheckbox) {
      faceDownCheckbox.checked = instruction.faceDown || false;
    }

    // Open modal
    const modal = document.getElementById('draw-instruction-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Render cards list (with filtering and search)
   */
  /**
   * Handle deep linking from quest output
   * Opens the Browse Cards section and scrolls to the specified card
   */
  handleDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('cardId');
    const cardName = urlParams.get('cardName');
    
    if (cardId || cardName) {
      // Expand Browse Cards section
      const browseSection = document.querySelector('[data-section="browse-cards"]');
      const browseContent = document.getElementById('browse-cards');
      if (browseContent && browseContent.classList.contains('collapsed')) {
        browseContent.classList.remove('collapsed');
        if (browseSection) {
          browseSection.setAttribute('aria-expanded', 'true');
        }
      }
      
      // Wait for render to complete, then scroll to card
      setTimeout(() => {
        this.scrollToCard(cardId, cardName);
      }, 300);
    }
  }

  /**
   * Scroll to and highlight a specific card in the Browse Cards list
   */
  scrollToCard(cardId, cardName) {
    const list = document.getElementById('cards-list');
    if (!list) return;
    
    // Find the card item
    const cardItems = list.querySelectorAll('.card-item');
    let targetCard = null;
    
    for (const item of cardItems) {
      const nameElement = item.querySelector('h4');
      if (nameElement && nameElement.textContent === cardName) {
        targetCard = item;
        break;
      }
    }
    
    if (targetCard) {
      // Add highlight class
      targetCard.classList.add('card-highlight');
      
      // Scroll to the card with smooth behavior
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        targetCard.classList.remove('card-highlight');
      }, 3000);
    }
  }

  renderCardsList() {
    const filterDeck = document.getElementById('filter-deck').value;
    const searchQuery = document.getElementById('search-cards').value.toLowerCase();
    const list = document.getElementById('cards-list');
    if (!list) return;

    // Get TypeTag filter values
    const filterTagMatchMode = document.getElementById('filter-tag-match-mode').value; // "any" or "all"
    const filterTagList = document.getElementById('filter-type-tags-list');
    const filterTags = [];
    if (filterTagList) {
      const tagElements = filterTagList.querySelectorAll('.tag');
      tagElements.forEach(tagEl => {
        const tagText = tagEl.textContent.replace('×', '').trim();
        if (tagText) filterTags.push(tagText);
      });
    }

    console.log('[renderCardsList] filterDeck:', filterDeck, 'searchQuery:', searchQuery);
    console.log('[renderCardsList] TypeTag filter:', filterTags, 'match mode:', filterTagMatchMode);
    console.log('[renderCardsList] Available decks:', Object.keys(this.cards));

    list.innerHTML = '';
    let cardCount = 0;

    // Collect all matching cards
    const allCards = [];

    for (const deckName in this.cards) {
      if (filterDeck && deckName !== filterDeck) continue;

      const deck = this.cards[deckName];
      if (!Array.isArray(deck)) continue;

      console.log(`[renderCardsList] Deck ${deckName} has ${deck.length} cards`);

      deck.forEach(card => {
        if (searchQuery && !card.CardName.toLowerCase().includes(searchQuery)) return;

        // Apply TypeTag filter
        if (filterTags.length > 0) {
          const cardTypeTags = card.TypeTags || [];
          if (filterTagMatchMode === 'all') {
            // Card must have ALL filter tags
            const hasAllTags = filterTags.every(tag => cardTypeTags.includes(tag));
            if (!hasAllTags) return;
          } else {
            // Card must have ANY filter tag (OR logic)
            const hasAnyTag = filterTags.some(tag => cardTypeTags.includes(tag));
            if (!hasAnyTag) return;
          }
        }

        allCards.push({ card, deckName });
      });
    }

    console.log(`[renderCardsList] Found ${allCards.length} matching cards`);

    // Update count display
    const countDisplay = document.getElementById('cards-count');
    if (countDisplay) {
      countDisplay.textContent = `Showing ${allCards.length} card${allCards.length === 1 ? '' : 's'}`;
    }

    // Sort cards alphabetically by CardName
    allCards.sort((a, b) => a.card.CardName.localeCompare(b.card.CardName));

    // Render sorted cards
    allCards.forEach(({ card, deckName }) => {
      const deckDisplayName = this.getDeckDisplayName(deckName);
      const item = document.createElement('div');
      item.className = 'card-item';
      
      // Create Polarity badge
      const polarityBadgeHtml = card.Polarity ? `<span class="polarity-badge polarity-${card.Polarity.toLowerCase()}">${card.Polarity}</span>` : '';
      
      // Create separate sections for TypeTags and AspectTags with specific CSS classes
      const typeTagsHtml = card.TypeTags.length > 0 ? `
        <div class="tag-group">
          <span class="tag-group-label">Type:</span>
          <div class="tag-group-tags">
            ${card.TypeTags.map(t => `<span class="tag tag-type tag-${t.toLowerCase()}">${t}</span>`).join('')}
          </div>
        </div>
      ` : '';
      
      const aspectTagsHtml = card.AspectTags.length > 0 ? `
        <div class="tag-group">
          <span class="tag-group-label">Aspect:</span>
          <div class="tag-group-tags">
            ${card.AspectTags.map(t => `<span class="tag tag-aspect">${t}</span>`).join('')}
          </div>
        </div>
      ` : '';

      // Create instructions section - check for both DrawInstructions (QuestTemplate) and Instructions (other cards)
      let instructionsHtml = '';
      
      if (card.DrawInstructions && card.DrawInstructions.length > 0) {
        // QuestTemplate card - show DrawInstructions
        instructionsHtml = `
          <div class="instructions-section">
            <div class="section-title">Draw Instructions:</div>
            ${card.DrawInstructions.map(inst => {
              const tags = inst.tags || [];
              const tagsText = tags.length > 0 ? ` with tag(s) ${tags.join(', ')}` : '';
              return `
                <div class="instruction-item">
                  <strong>${inst.label}:</strong><br>
                  ${inst.action} ${inst.count} from ${inst.deck}${tagsText}
                </div>
              `;
            }).join('')}
          </div>
        `;
        
        // Also show RewardText and ConsequenceText if present
        if (card.RewardText || card.ConsequenceText) {
          instructionsHtml += `
            <div class="instructions-section">
              ${card.RewardText ? `<div class="section-title">Reward:</div><div class="outcome-text">${card.RewardText}</div>` : ''}
              ${card.ConsequenceText ? `<div class="section-title">Consequence:</div><div class="outcome-text">${card.ConsequenceText}</div>` : ''}
            </div>
          `;
        }
      } else if (card.Instructions && card.Instructions.length > 0) {
        // Regular card - show Instructions
        instructionsHtml = `
          <div class="instructions-section">
            <div class="section-title">Instructions:</div>
            ${card.Instructions.map(inst => `
              <div class="instruction-item">
                <span class="instruction-target">${inst.TargetDeck}</span>
                <span class="instruction-tags">[${inst.Tags.join(', ')}]</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        instructionsHtml = '<div class="instructions-section"><div class="section-title">No Instructions</div></div>';
      }

      item.innerHTML = `
        <div class="card-item-left">
          <h4>${polarityBadgeHtml}${card.CardName}</h4>
          <span class="card-deck">${deckDisplayName}</span>
          <div class="card-tags">
            ${typeTagsHtml}
            ${aspectTagsHtml}
          </div>
          ${card.DesignerNotes ? `<div class="designer-notes"><strong>Designer Notes:</strong> ${card.DesignerNotes}</div>` : ''}
          <div class="card-item-actions">
            <button class="btn btn-secondary btn-edit" data-deck="${deckName}" data-name="${card.CardName}">Edit</button>
            <button class="btn btn-secondary btn-duplicate" data-deck="${deckName}" data-name="${card.CardName}">Duplicate</button>
            <button class="btn btn-danger btn-delete" data-deck="${deckName}" data-name="${card.CardName}">Delete</button>
          </div>
        </div>
        <div class="card-item-right">
          ${instructionsHtml}
        </div>
      `;

      const editBtn = item.querySelector('.btn-edit');
      const duplicateBtn = item.querySelector('.btn-duplicate');
      const deleteBtn = item.querySelector('.btn-delete');

      editBtn.addEventListener('click', () => this.loadCardForEdit(deckName, card.CardName));
      duplicateBtn.addEventListener('click', () => this.duplicateCard(deckName, card.CardName));
      deleteBtn.addEventListener('click', () => this.deleteCard(deckName, card.CardName));

      list.appendChild(item);
      cardCount++;
    });

    if (cardCount === 0) {
      list.innerHTML = '<div class="card-item no-results"><p>No cards found</p></div>';
    }
  }

  /**
   * Load card for editing
   */
  loadCardForEdit(deckName, cardName) {
    const deck = this.cards[deckName];
    const card = deck.find(c => c.CardName === cardName);
    if (!card) return;

    // Auto-expand Create/Edit Card section if it's collapsed
    const formContent = document.getElementById('card-form');
    const formToggleBtn = document.querySelector('[data-section="card-form"]');
    if (formContent && formContent.classList.contains('collapsed')) {
      formContent.classList.remove('collapsed');
      if (formToggleBtn) {
        formToggleBtn.setAttribute('aria-expanded', 'true');
      }
    }

    // Track the original deck and card name for update operation
    this.originalDeckName = deckName;
    this.originalCardName = cardName;

    // Set deck select
    document.getElementById('deck-select').value = deckName;
    this.handleDeckChange({ target: { value: deckName } });

    // Set card name
    document.getElementById('card-name').value = card.CardName;

    // Set Polarity
    const polaritySelect = document.getElementById('polarity-select');
    if (polaritySelect && card.Polarity) {
      polaritySelect.value = card.Polarity;
      this.currentCardPolarity = card.Polarity; // Track for instruction rendering
      this.refreshTypeTagsAutocomplete(); // Refresh autocomplete for this Polarity
    }

    // Set tags
    this.clearTagList('type-tags-list');
    card.TypeTags.forEach(tag => this.addTag('type-tags-input', tag));

    this.clearTagList('aspect-tags-list');
    card.AspectTags.forEach(tag => this.addTag('aspect-tags-input', tag));

    this.clearTagList('mutable-tags-list');
    card.mutableTags.forEach(tag => this.addTag('mutable-tags-input', tag));

    // Set instructions based on card type
    const isQuestTemplate = deckName === 'questtemplates';
    
    if (isQuestTemplate) {
      // Load DrawInstructions for QuestTemplate cards
      this.drawInstructionData = JSON.parse(JSON.stringify(card.DrawInstructions || []));
      this.renderDrawInstructions();
      
      // Load RewardText and ConsequenceText
      const rewardTextEl = document.getElementById('reward-text');
      const consequenceTextEl = document.getElementById('consequence-text');
      if (rewardTextEl) rewardTextEl.value = card.RewardText || '';
      if (consequenceTextEl) consequenceTextEl.value = card.ConsequenceText || '';
    } else {
      // Load regular Instructions for other card types
      this.instructionData = JSON.parse(JSON.stringify(card.Instructions || []));
      this.renderInstructions();
    }

    // Load designer notes
    const designerNotesEl = document.getElementById('designer-notes');
    if (designerNotesEl) designerNotesEl.value = card.DesignerNotes || '';

    // Show cancel button
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.style.display = 'block';
    }

    // Scroll to form
    document.querySelector('.card-form-section').scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Duplicate a card (load as new card with "COPY OF " prefix)
   */
  duplicateCard(deckName, cardName) {
    const deck = this.cards[deckName];
    const card = deck.find(c => c.CardName === cardName);
    if (!card) return;

    // Auto-expand Create/Edit Card section if it's collapsed
    const formContent = document.getElementById('card-form');
    const formToggleBtn = document.querySelector('[data-section="card-form"]');
    if (formContent && formContent.classList.contains('collapsed')) {
      formContent.classList.remove('collapsed');
      if (formToggleBtn) {
        formToggleBtn.setAttribute('aria-expanded', 'true');
      }
    }

    // DO NOT track original deck/card name - this is a new card, not an edit
    this.originalDeckName = null;
    this.originalCardName = null;

    // Set deck select
    document.getElementById('deck-select').value = deckName;
    this.handleDeckChange({ target: { value: deckName } });

    // Set card name with "COPY OF " prefix
    document.getElementById('card-name').value = `COPY OF ${card.CardName}`;

    // Set Polarity
    const polaritySelect = document.getElementById('polarity-select');
    if (polaritySelect && card.Polarity) {
      polaritySelect.value = card.Polarity;
      this.currentCardPolarity = card.Polarity; // Track for instruction rendering
      this.refreshTypeTagsAutocomplete(); // Refresh autocomplete for this Polarity
    }

    // Set tags
    this.clearTagList('type-tags-list');
    card.TypeTags.forEach(tag => this.addTag('type-tags-input', tag));

    this.clearTagList('aspect-tags-list');
    card.AspectTags.forEach(tag => this.addTag('aspect-tags-input', tag));

    this.clearTagList('mutable-tags-list');
    card.mutableTags.forEach(tag => this.addTag('mutable-tags-input', tag));

    // Set instructions based on card type
    const isQuestTemplate = deckName === 'questtemplates';
    
    if (isQuestTemplate) {
      // Load DrawInstructions for QuestTemplate cards
      this.drawInstructionData = JSON.parse(JSON.stringify(card.DrawInstructions || []));
      this.renderDrawInstructions();
      
      // Load RewardText and ConsequenceText
      const rewardTextEl = document.getElementById('reward-text');
      const consequenceTextEl = document.getElementById('consequence-text');
      if (rewardTextEl) rewardTextEl.value = card.RewardText || '';
      if (consequenceTextEl) consequenceTextEl.value = card.ConsequenceText || '';
    } else {
      // Load regular Instructions for other card types
      this.instructionData = JSON.parse(JSON.stringify(card.Instructions || []));
      this.renderInstructions();
    }

    // Load designer notes
    const designerNotesEl = document.getElementById('designer-notes');
    if (designerNotesEl) designerNotesEl.value = card.DesignerNotes || '';

    // DO NOT show cancel button - this is a new card
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }

    // Scroll to form
    document.querySelector('.card-form-section').scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Delete a card
   */
  deleteCard(deckName, cardName) {
    if (!confirm(`Are you sure you want to delete "${cardName}"?`)) return;

    const deck = this.cards[deckName];
    const index = deck.findIndex(c => c.CardName === cardName);
    if (index >= 0) {
      deck.splice(index, 1);
      this.saveCardsToFile();
      
      // Re-extract tags and refresh autocomplete after deleting
      this.extractAllTags();
      this.refreshAutocomplete();
      
      this.renderCardsList();
      alert(`✓ Card "${cardName}" deleted successfully!`);
    }
  }

  /**
   * Reset form to blank state
   */
  resetForm() {
    document.getElementById('card-form').reset();
    this.clearTagList('type-tags-list');
    this.clearTagList('aspect-tags-list');
    this.clearTagList('mutable-tags-list');
    this.instructionData = [];
    this.drawInstructionData = [];
    this.renderInstructions();
    this.renderDrawInstructions();
    
    // Clear edit tracking
    this.originalDeckName = null;
    this.originalCardName = null;
    this.currentCardPolarity = null; // Clear tracked Polarity

    // Reset TypeTag autocomplete to show all tags (no Polarity filter)
    this.setupTagAutocomplete('type-tags-input', 'type-tags-suggestions', Array.from(this.allTags.type));

    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }

    // Hide QuestTemplate fields by default
    const questTemplateFields = document.getElementById('questtemplate-fields');
    const instructionsSection = document.getElementById('instructions-section');
    if (questTemplateFields) questTemplateFields.style.display = 'none';
    if (instructionsSection) instructionsSection.style.display = 'block';
  }

  /**
   * Export cards as JSON
   */
  exportCards() {
    const cardsJson = JSON.stringify(this.cards, null, 2);
    const blob = new Blob([cardsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cards.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Trigger file import dialog
   */
  triggerImport() {
    const fileInput = document.getElementById('file-import');
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle imported JSON file
   */
  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCards = JSON.parse(text);
      
      // Validate the structure
      if (!importedCards || typeof importedCards !== 'object') {
        throw new Error('Invalid cards file format');
      }

      // Update cards
      this.cards = importedCards;
      this.saveCardsToFile();
      this.extractAllTags();
      this.refreshAutocomplete();
      this.populateDeckFilter();
      this.renderCardsList();
      
      alert('✓ Cards imported successfully!');
      console.log('✓ Cards imported from file');
    } catch (error) {
      alert('❌ Failed to import cards: ' + error.message);
      console.error('Import error:', error);
    }

    // Reset file input
    event.target.value = '';
  }

  /**
   * Reset to default cards from database
   */
  async resetToDefaults() {
    if (!confirm('This will clear all your changes and reload the default cards from cards.json file. If connected to a server, it will also update the database. Are you sure?')) {
      return;
    }

    try {
      // Clear localStorage
      localStorage.removeItem('cardManagerCards');
      
      // FORCE reload from cards.json (bypass server/database cache)
      console.log('Force reloading from cards.json...');
      if (!this.dataLoader) {
        this.dataLoader = new DataLoader();
      }
      await this.dataLoader.loadData('cards.json');
      this.cards = this.dataLoader.decks;
      console.log('✓ Cards reloaded from cards.json');
      console.log('Loaded decks:', Object.keys(this.cards));
      
      // If server mode, save the fresh data to server/database
      if (this.serverMode) {
        console.log('Updating server with fresh data...');
        const response = await fetch(CONFIG.API_CARDS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cards)
        });
        if (response.ok) {
          console.log('✓ Server database updated with fresh data');
        }
      }
      
      this.extractAllTags();
      this.refreshAutocomplete();
      this.populateDeckFilter();
      this.renderCardsList();
      this.resetForm();
      
      alert('✓ Reset to default cards successfully!');
      console.log('✓ Reset to defaults');
    } catch (error) {
      alert('❌ Failed to reset to defaults: ' + error.message);
      console.error('Reset error:', error);
    }
  }

  /**
   * Download CSV template
   */
  downloadCSVTemplate() {
    const template = CSVImporter.generateTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✓ CSV template downloaded');
  }

  /**
   * Trigger CSV import file dialog
   */
  triggerCSVImport() {
    const input = document.getElementById('csv-file-input');
    if (input) {
      input.click();
    }
  }

  /**
   * Handle CSV file import
   */
  async handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Loading CSV file: ${file.name}...`);

    try {
      const decks = await CSVImporter.parseCSV(file);
      console.log('✓ CSV parsed successfully');

      // Validate decks
      const errors = CSVImporter.validateDecks(decks);
      if (errors.length > 0) {
        console.warn('⚠️ Validation warnings:', errors);
      }

      // Convert CSV deck structure to card manager format
      const convertedCards = this.convertCSVToCards(decks);
      
      // Merge with existing cards
      Object.keys(convertedCards).forEach(deckName => {
        if (!this.cards[deckName]) {
          this.cards[deckName] = [];
        }
        this.cards[deckName].push(...convertedCards[deckName]);
      });

      // Save and update
      this.saveCardsToFile();
      this.extractAllTags();
      this.refreshAutocomplete();
      this.populateDeckFilter();
      this.renderCardsList();

      const totalCards = Object.values(convertedCards).reduce((sum, arr) => sum + arr.length, 0);
      alert(`✓ CSV imported successfully! Added ${totalCards} cards.`);
      console.log('✓ CSV import complete');

      // Reset file input
      event.target.value = '';
    } catch (error) {
      alert(`❌ CSV Import Error: ${error.message}`);
      console.error('CSV import error:', error);
      event.target.value = '';
    }
  }

  /**
   * Convert CSV deck format to card manager format
   */
  convertCSVToCards(csvDecks) {
    const cards = {};
    
    // Map CSV deck names to card manager deck names
    const deckMapping = {
      'questgivers': 'npcs',
      'harmedparties': 'npcs',
      'verbs': 'questtemplates',
      'targets': 'npcs',
      'locations': 'locations',
      'twists': 'twists',
      'rewards': 'loot',
      'failures': 'twists'
    };

    Object.entries(csvDecks).forEach(([csvDeckName, csvCards]) => {
      const targetDeck = deckMapping[csvDeckName] || csvDeckName;
      
      if (!cards[targetDeck]) {
        cards[targetDeck] = [];
      }

      csvCards.forEach(csvCard => {
        const card = {
          id: `${targetDeck}-${csvCard.name}-${Math.random()}`,
          Deck: targetDeck.charAt(0).toUpperCase() + targetDeck.slice(1),
          CardName: csvCard.name,
          TypeTags: csvCard.tags || [],
          AspectTags: [],
          mutableTags: [],
          Instructions: []
        };

        cards[targetDeck].push(card);
      });
    });

    return cards;
  }

  /**
   * Export cards as CSV
   */
  exportCSV() {
    try {
      // Convert cards to CSV format
      const csvContent = this.generateCSVFromCards();
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cards_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✓ CSV exported successfully');
    } catch (error) {
      alert(`❌ Failed to export CSV: ${error.message}`);
      console.error('CSV export error:', error);
    }
  }

  /**
   * Generate CSV content from cards
   */
  generateCSVFromCards() {
    let csv = 'Deck,Name,Tags\n';
    
    for (const deckName in this.cards) {
      const deck = this.cards[deckName];
      if (Array.isArray(deck)) {
        deck.forEach(card => {
          const name = (card.CardName || '').replace(/"/g, '""');
          const tags = (card.TypeTags || []).join('|');
          csv += `${deckName},"${name}","${tags}"\n`;
        });
      }
    }
    
    return csv;
  }

  /**
   * Reload card data from database/API
   */
  async reloadCardData() {
    try {
      console.log('🔄 Reloading card data from database...');

      // Check if server mode is available
      let dataSource = 'Unknown';
      try {
        const healthResponse = await fetch('/api/health');
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          dataSource = health.dataSource || `${health.storage} storage`;
        }
      } catch (e) {
        console.warn('Server unavailable, loading from local file');
      }

      // Reload data
      if (!this.dataLoader) {
        this.dataLoader = new DataLoader();
      }
      
      try {
        await this.dataLoader.loadFromAPI('/api/cards');
      } catch (apiError) {
        console.warn('API unavailable, falling back to cards.json');
        await this.dataLoader.loadData('cards.json');
      }

      this.cards = this.dataLoader.decks;
      
      // Update UI
      this.extractAllTags();
      this.refreshAutocomplete();
      this.populateDeckFilter();
      this.renderCardsList();

      const totalCards = Object.values(this.cards).reduce((sum, deck) => sum + (Array.isArray(deck) ? deck.length : 0), 0);
      alert(`✓ Card data reloaded successfully!\n📊 Data source: ${dataSource}\nLoaded ${totalCards} cards`);
      console.log('✓ Card data reloaded');
    } catch (error) {
      alert(`❌ Failed to reload card data: ${error.message}`);
      console.error('Reload error:', error);
    }
  }

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CardManager());
} else {
  new CardManager();
}
