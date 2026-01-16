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
    this.allTags = {
      type: new Set(),
      aspect: new Set(),
      mutable: new Set(),
      instructionTags: new Set()
    };
    this.init();
  }

  async init() {
    try {
      this.dataLoader = new DataLoader();
      await this.dataLoader.loadData('cards.json');
      this.cards = this.dataLoader.decks;
      this.extractAllTags();
      this.setupEventListeners();
      this.renderCardsList();
      console.log('✓ Card Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Card Manager:', error);
    }
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
            card.TypeTags.forEach(tag => this.allTags.type.add(tag));
          }
          if (card.AspectTags) {
            card.AspectTags.forEach(tag => this.allTags.aspect.add(tag));
          }
          if (card.mutableTags) {
            card.mutableTags.forEach(tag => this.allTags.mutable.add(tag));
          }
          if (card.Instructions) {
            card.Instructions.forEach(instr => {
              if (instr.Tags) {
                instr.Tags.forEach(tag => this.allTags.instructionTags.add(tag));
              }
            });
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
  }

  /**
   * Set up autocomplete for tag input
   */
  setupTagAutocomplete(inputId, suggestionsId, suggestions) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const suggestionsDiv = suggestionsId ? document.getElementById(suggestionsId) : null;
    
    input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length > 0 && suggestionsDiv) {
        const filtered = suggestions.filter(s => 
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

    // Check if tag already exists
    const existingTags = Array.from(list.querySelectorAll('.tag')).map(t => t.textContent.trim());
    if (existingTags.includes(tagValue)) return;

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `
      ${tagValue}
      <span class="tag-remove">×</span>
    `;

    tag.querySelector('.tag-remove').addEventListener('click', () => {
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
      .map(tag => tag.textContent.replace('×', '').trim())
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
    if (modal) {
      modal.style.display = 'flex';
      this.instructionData.push({ TargetDeck: '', Tags: [] });
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
    const instruction = {
      TargetDeck: targetDeck,
      Tags: tags
    };

    // Replace the last added instruction with actual data
    if (this.instructionData.length > 0) {
      this.instructionData[this.instructionData.length - 1] = instruction;
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
      item.innerHTML = `
        <h4>${instr.TargetDeck}</h4>
        <div class="instruction-tags">
          ${instr.Tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <span class="instruction-remove" data-index="${index}">✕</span>
      `;

      const removeBtn = item.querySelector('.instruction-remove');
      removeBtn.addEventListener('click', () => {
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
        
        const tagsHtml = [
          ...card.TypeTags.map(t => `<span class="tag">${t}</span>`),
          ...card.AspectTags.map(t => `<span class="tag">${t}</span>`)
        ].join('');

        item.innerHTML = `
          <h4>${card.CardName}</h4>
          <span class="card-deck">${deckDisplayName}</span>
          <div class="card-tags">${tagsHtml}</div>
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
   * Save cards to file (would be done via CSV export or server call in real app)
   */
  saveCardsToFile() {
    // Convert cards object to JSON format
    const cardsJson = JSON.stringify(this.cards, null, 2);
    
    // For now, we'll just log it
    console.log('Cards data updated. Use Export function to save.');
    
    // In a real app, this would send data to the server
    // For local testing, user would download and replace cards.json
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CardManager());
} else {
  new CardManager();
}
