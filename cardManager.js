/**
 * cardManager.js
 * Card management GUI with autocomplete, validation, and form handling
 */

class CardManager {
  constructor() {
    this.dataLoader = null;
    this.cards = {};
    this.currentEditingCardId = null;
    this.instructionData = [];
    this.editingInstructionIndex = -1; // -1 means not editing
    this.allTags = {
      type: new Set(),
      aspect: new Set(),
      mutable: new Set(),
      instructionTags: new Set()
    };
    this.autocompleteSetupDone = false; // Track if event listeners are set up
    this.apiUrl = 'http://localhost:3000/api/cards'; // Backend API
    this.serverMode = false; // Detected if server is available
    this.init();
  }

  async init() {
    try {
      // Check if server is available
      await this.detectServer();
      
      if (this.serverMode) {
        // Load from server API
        const response = await fetch(this.apiUrl);
        if (response.ok) {
          this.cards = await response.json();
          console.log('✓ Loaded cards from server');
          this.showNotification('Connected to server - auto-save enabled', 'success');
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
      console.log('✓ Card Manager initialized');
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
      const response = await fetch('http://localhost:3000/api/health', {
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
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cards)
        });
        
        if (response.ok) {
          console.log('✓ Cards saved to server (cards.json)');
          this.showNotification('✓ Cards saved to server', 'success');
          
          // Also save to localStorage as backup
          localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
        } else {
          throw new Error('Server save failed');
        }
      } catch (error) {
        console.error('Server save error:', error);
        this.showNotification('⚠️ Server save failed - saved to localStorage only', 'warning');
        localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
      }
    } else {
      // Save to localStorage only
      localStorage.setItem('cardManagerCards', JSON.stringify(this.cards));
      console.log('✓ Cards saved to localStorage');
      this.showSaveReminder();
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

    this.setupTagAutocomplete('instruction-tags', 'instruction-tags-suggestions', Array.from(this.allTags.instructionTags));

    // Filter and search
    const filterDeck = document.getElementById('filter-deck');
    if (filterDeck) {
      filterDeck.addEventListener('change', () => this.renderCardsList());
    }

    const searchCards = document.getElementById('search-cards');
    if (searchCards) {
      searchCards.addEventListener('input', () => this.renderCardsList());
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
        'instruction-tags': 'instructionTags'
      };
      const tagType = tagTypeMap[inputId];
      return tagType ? Array.from(this.allTags[tagType]) : [];
    };
    
    input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
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
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value.length > 0) {
          this.addTag(inputId, value);
          input.value = '';
          if (suggestionsDiv) {
            suggestionsDiv.classList.remove('active');
          }
        }
      }
    });

    input.addEventListener('blur', () => {
      if (suggestionsDiv) {
        setTimeout(() => suggestionsDiv.classList.remove('active'), 200);
      }
    });
  }

  /**
   * Show autocomplete suggestions
   */
  showSuggestions(container, suggestions, query, inputId) {
    container.innerHTML = '';
    const unique = [...new Set(suggestions)];
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
        document.getElementById(inputId).value = '';
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

    // Check if tag already exists (clean comparison, no need to trim '×')
    const existingTags = Array.from(list.querySelectorAll('.tag')).map(t => t.textContent.trim());
    if (existingTags.includes(tagValue)) return;

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = tagValue; // Clean text only, '×' added via CSS ::after

    // Click anywhere on tag to remove it
    tag.addEventListener('click', () => {
      tag.remove();
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
      'instruction-tags': 'instruction-tags-list'
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
    // All card types now use the same Instructions system (consolidated from TargetRequirement)
  }

  /**
   * Handle form submission
   */
  handleFormSubmit(e) {
    e.preventDefault();

    const deckSelect = document.getElementById('deck-select').value;
    const cardName = document.getElementById('card-name').value.trim();

    if (!deckSelect || !cardName) {
      alert('Please select a deck and enter a card name');
      return;
    }

    const cardData = {
      Deck: this.getDeckDisplayName(deckSelect),
      CardName: cardName,
      TypeTags: this.getTagsFromList('type-tags-list'),
      AspectTags: this.getTagsFromList('aspect-tags-list'),
      mutableTags: this.getTagsFromList('mutable-tags-list'),
      Instructions: this.instructionData
    };

    // Add or update the card
    if (!Array.isArray(this.cards[deckSelect])) {
      this.cards[deckSelect] = [];
    }

    const existingIndex = this.cards[deckSelect].findIndex(c => c.CardName === cardName);
    if (existingIndex >= 0) {
      this.cards[deckSelect][existingIndex] = cardData;
    } else {
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
      'questgivers': 'QuestGiver',
      'harmedparties': 'HarmedParty',
      'verbs': 'Verb',
      'targets': 'Target',
      'locations': 'Location',
      'twists': 'Twist',
      'rewards': 'Reward',
      'failures': 'Failure'
    };
    return mapping[deckKey] || deckKey;
  }

  /**
   * Get key for deck display name
   */
  getDeckKey(displayName) {
    const mapping = {
      'QuestGiver': 'questgivers',
      'HarmedParty': 'harmedparties',
      'Verb': 'verbs',
      'Target': 'targets',
      'Location': 'locations',
      'Twist': 'twists',
      'Reward': 'rewards',
      'Failure': 'failures'
    };
    return mapping[displayName] || displayName.toLowerCase();
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
      this.instructionData.push({ TargetDeck: '', Tags: [] });
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

    const tags = this.getTagsFromList('instruction-tags-list');
    if (tags.length === 0) {
      alert('Please add at least one tag to the instruction');
      return;
    }

    const instruction = {
      TargetDeck: targetDeck,
      Tags: tags
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
      item.innerHTML = `
        <h4>${instr.TargetDeck}</h4>
        <div class="instruction-tags">
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
   * Render cards list (with filtering and search)
   */
  renderCardsList() {
    const filterDeck = document.getElementById('filter-deck').value;
    const searchQuery = document.getElementById('search-cards').value.toLowerCase();
    const list = document.getElementById('cards-list');
    if (!list) return;

    list.innerHTML = '';
    let cardCount = 0;

    for (const deckName in this.cards) {
      if (filterDeck && deckName !== filterDeck) continue;

      const deck = this.cards[deckName];
      if (!Array.isArray(deck)) continue;

      deck.forEach(card => {
        if (searchQuery && !card.CardName.toLowerCase().includes(searchQuery)) return;

        const deckDisplayName = this.getDeckDisplayName(deckName);
        const item = document.createElement('div');
        item.className = 'card-item';
        
        // Create separate sections for TypeTags and AspectTags
        const typeTagsHtml = card.TypeTags.length > 0 ? `
          <div class="tag-group">
            <span class="tag-group-label">Type:</span>
            <div class="tag-group-tags">
              ${card.TypeTags.map(t => `<span class="tag tag-type">${t}</span>`).join('')}
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

        item.innerHTML = `
          <h4>${card.CardName}</h4>
          <span class="card-deck">${deckDisplayName}</span>
          <div class="card-tags">
            ${typeTagsHtml}
            ${aspectTagsHtml}
          </div>
          <div class="card-item-actions">
            <button class="btn btn-secondary btn-edit" data-deck="${deckName}" data-name="${card.CardName}">Edit</button>
            <button class="btn btn-danger btn-delete" data-deck="${deckName}" data-name="${card.CardName}">Delete</button>
          </div>
        `;

        const editBtn = item.querySelector('.btn-edit');
        const deleteBtn = item.querySelector('.btn-delete');

        editBtn.addEventListener('click', () => this.loadCardForEdit(deckName, card.CardName));
        deleteBtn.addEventListener('click', () => this.deleteCard(deckName, card.CardName));

        list.appendChild(item);
        cardCount++;
      });
    }

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

    // Set deck select
    document.getElementById('deck-select').value = deckName;
    this.handleDeckChange({ target: { value: deckName } });

    // Set card name
    document.getElementById('card-name').value = card.CardName;

    // Set tags
    this.clearTagList('type-tags-list');
    card.TypeTags.forEach(tag => this.addTag('type-tags-input', tag));

    this.clearTagList('aspect-tags-list');
    card.AspectTags.forEach(tag => this.addTag('aspect-tags-input', tag));

    this.clearTagList('mutable-tags-list');
    card.mutableTags.forEach(tag => this.addTag('mutable-tags-input', tag));

    // Set instructions
    this.instructionData = JSON.parse(JSON.stringify(card.Instructions || []));
    this.renderInstructions();

    // Show cancel button
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.style.display = 'block';
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
    this.renderInstructions();

    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }
  }

  /**
   * Save cards to localStorage for persistence
   */
  saveCardsToFile() {
    // Convert cards object to JSON format
    const cardsJson = JSON.stringify(this.cards, null, 2);
    
    // Save to localStorage
    localStorage.setItem('cardManagerCards', cardsJson);
    console.log('✓ Cards saved to localStorage');
    
    // Also try to save to cards.json via downloadable file
    // (Browser security prevents direct file writing, but we can notify the user)
    this.showSaveReminder();
  }
  
  /**
   * Show reminder to export cards
   */
  showSaveReminder() {
    const existingReminder = document.getElementById('export-reminder');
    if (existingReminder) return; // Already showing
    
    const reminder = document.createElement('div');
    reminder.id = 'export-reminder';
    reminder.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #f39c12;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
    `;
    reminder.innerHTML = `
      <strong>⚠️ Don't forget!</strong><br>
      Click "📥 Export Cards" to save your changes to cards.json
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #f39c12;
        border: none;
        padding: 5px 10px;
        margin-top: 10px;
        border-radius: 3px;
        cursor: pointer;
        font-weight: bold;
      ">Got it</button>
    `;
    document.body.appendChild(reminder);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (reminder.parentElement) {
        reminder.remove();
      }
    }, 10000);
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
   * Reset to default cards from cards.json
   */
  async resetToDefaults() {
    if (!confirm('This will clear all your changes and reload the default cards. Are you sure?')) {
      return;
    }

    try {
      // Clear localStorage
      localStorage.removeItem('cardManagerCards');
      
      // Reload from cards.json
      if (!this.dataLoader) {
        this.dataLoader = new DataLoader();
      }
      await this.dataLoader.loadData('cards.json');
      this.cards = this.dataLoader.decks;
      
      this.extractAllTags();
      this.refreshAutocomplete();
      this.renderCardsList();
      this.resetForm();
      
      alert('✓ Reset to default cards successfully!');
      console.log('✓ Reset to defaults');
    } catch (error) {
      alert('❌ Failed to reset to defaults: ' + error.message);
      console.error('Reset error:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CardManager());
} else {
  new CardManager();
}
