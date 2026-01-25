/**
 * monsterManager.js
 * Monster CRUD operations, validation, and auto-save
 * Adapted from cardManager.js pattern
 */

class MonsterManager {
  constructor() {
    this.dataLoader = new DataLoader();
    this.currentMonster = null;
    this.currentMonsterIndex = -1;
    this.serverMode = false;
    this.autoSaveTimeout = null;
    this.cardMockup = null;
    this.iconPalette = null;
    this.init();
  }

  /**
   * Initialize monster manager
   */
  async init() {
    console.log('Initializing Monster Manager...');
    
    // Load data
    const loaded = await this.dataLoader.loadData();
    if (!loaded) {
      this.showNotification('Failed to load monster data', 'error');
      return;
    }

    this.serverMode = this.dataLoader.serverMode;
    
    // Show data source notification
    if (this.serverMode) {
      this.showNotification('Connected to server - auto-save enabled', 'success');
    } else {
      this.showNotification('Server offline - using localStorage', 'warning');
    }

    // Enable/disable Save to Server button based on connectivity
    const saveServerBtn = document.getElementById('save-to-server-btn');
    if (saveServerBtn) {
      saveServerBtn.disabled = !this.serverMode;
      saveServerBtn.title = this.serverMode ? 'Save monsters to server (writes apps/cards.json)' : 'Server offline - click to save to localStorage instead';
    }

    console.log('Monster Manager initialized');
  }

  /**
   * Create new monster
   */
  createNewMonster() {
    this.currentMonster = MONSTER_SCHEMA.createNew();
    this.currentMonsterIndex = -1;
    return this.currentMonster;
  }

  /**
   * Load monster by ID
   */
  loadMonster(id) {
    const monster = this.dataLoader.getMonsterById(id);
    if (!monster) {
      throw new Error(`Monster with id ${id} not found`);
    }
    
    this.currentMonster = MONSTER_SCHEMA.normalize(monster);
    this.currentMonsterIndex = this.dataLoader.monsters.findIndex(m => m.id === id);
    return this.currentMonster;
  }

  /**
   * Save current monster
   */
  async saveMonster() {
    if (!this.currentMonster) {
      throw new Error('No monster to save');
    }

    // Validate
    const validation = MONSTER_SCHEMA.validate(this.currentMonster);
    if (!validation.valid) {
      this.showNotification(`Validation failed: ${validation.errors.join(', ')}`, 'error');
      return false;
    }

    try {
      // Update or add
      if (this.currentMonsterIndex >= 0) {
        this.dataLoader.updateMonster(this.currentMonster.id, this.currentMonster);
        console.log('Monster updated:', this.currentMonster.CardName);
      } else {
        this.dataLoader.addMonster(this.currentMonster);
        this.currentMonsterIndex = this.dataLoader.monsters.length - 1;
        console.log('Monster added:', this.currentMonster.CardName);
      }

      // Save to storage
      await this.dataLoader.saveData();
      this.showNotification('Monster saved successfully', 'success');
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      this.showNotification(`Save failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Delete monster by ID
   */
  async deleteMonster(id) {
    if (!confirm('Are you sure you want to delete this monster?')) {
      return false;
    }

    try {
      this.dataLoader.deleteMonster(id);
      await this.dataLoader.saveData();
      
      // Clear current if it was deleted
      if (this.currentMonster && this.currentMonster.id === id) {
        this.currentMonster = null;
        this.currentMonsterIndex = -1;
      }

      this.showNotification('Monster deleted', 'success');
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      this.showNotification(`Delete failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Update field on current monster
   */
  updateField(fieldName, value) {
    if (!this.currentMonster) {
      console.warn('No current monster to update');
      return;
    }

    this.currentMonster[fieldName] = value;
    
    // Trigger auto-save
    this.scheduleAutoSave();
  }

  /**
   * Schedule auto-save (debounced)
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      await this.saveMonster();
    }, 1000); // Save 1 second after last change
  }

  /**
   * Get all monsters
   */
  getAllMonsters() {
    return this.dataLoader.getMonsters();
  }

  /**
   * Filter monsters
   */
  filterMonsters(criteria) {
    return this.dataLoader.filterMonsters(criteria);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return this.dataLoader.getStatistics();
  }

  /**
   * Export monsters as JSON
   */
  exportJSON() {
    const json = this.dataLoader.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monsters-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('Monsters exported', 'success');
  }

  /**
   * Import monsters from JSON file
   */
  async importJSON(file) {
    try {
      const text = await file.text();
      const success = this.dataLoader.importJSON(text);
      
      if (success) {
        await this.dataLoader.saveData();
        this.showNotification('Monsters imported successfully', 'success');
        return true;
      } else {
        this.showNotification('Import failed: invalid JSON format', 'error');
        return false;
      }
    } catch (error) {
      console.error('Import failed:', error);
      this.showNotification(`Import failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('notification-toast');
    if (existing) {
      existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Initialize builder UI (called from monsterBuilder.html)
   */
  initBuilderUI(monsterId = null) {
    // Load or create monster
    if (monsterId) {
      this.loadMonster(monsterId);
    } else {
      this.createNewMonster();
    }

    // Initialize card mockup
    this.cardMockup = new CardMockup('card-mockup-container', this.currentMonster);

    // Initialize icon palette
    this.iconPalette = new IconPalette('icon-palette-container');

    // Listen for card changes
    document.getElementById('card-mockup-container').addEventListener('monster-changed', (e) => {
      this.updateField(e.detail.fieldName, e.detail.value);
    });

    // Listen for sheet open events
    document.getElementById('card-mockup-container').addEventListener('open-sheet', (e) => {
      this.openSheetForField(e.detail.fieldName);
    });

    // Setup save button
    const saveBtn = document.getElementById('save-monster-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveMonster());
    }

    // Setup back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    console.log('Builder UI initialized');
  }

  /**
   * Open bottom sheet for specific field
   */
  openSheetForField(fieldName) {
    const self = this;

    switch (fieldName) {
      case 'TypeTags': {
        const sheet = new TagSelectorSheet('TypeTags', this.currentMonster.TypeTags, this.currentMonster.Polarity);
        sheet.onSave = function() {
          self.updateField('TypeTags', sheet.getTags());
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'AspectTags': {
        const sheet = new TagSelectorSheet('AspectTags', this.currentMonster.AspectTags);
        sheet.onSave = function() {
          self.updateField('AspectTags', sheet.getTags());
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'CardImage': {
        const sheet = new ImagePickerSheet(this.currentMonster.CardImage);
        sheet.onSave = function() {
          self.updateField('CardImage', sheet.getImageUrl() || null);
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'Habitat': {
        const sheet = new HabitatSelectorSheet(this.currentMonster.Habitat || []);
        sheet.onSave = function() {
          self.updateField('Habitat', sheet.getHabitats());
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'DesignerNotes': {
        const sheet = new NotesEditorSheet(this.currentMonster.DesignerNotes);
        sheet.onSave = function() {
          self.updateField('DesignerNotes', sheet.getNotes() || null);
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'FlavorText': {
        const sheet = new FlavorTextSheet(this.currentMonster.FlavorText);
        sheet.onSave = function() {
          self.updateField('FlavorText', sheet.getFlavorText() || null);
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'SpecialAbilities': {
        const sheet = new SpecialAbilitiesSheet(this.currentMonster.SpecialAbilities || []);
        sheet.onSave = function() {
          self.updateField('SpecialAbilities', sheet.getAbilities());
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }

      case 'Instructions': {
        const sheet = new InstructionEditorSheet(this.currentMonster.Instructions || []);
        sheet.onSave = function() {
          self.updateField('Instructions', sheet.getInstructions());
          self.cardMockup.loadMonster(self.currentMonster);
        };
        sheet.open();
        break;
      }
    }
  }

  /**
   * Initialize list UI (called from index.html)
   */
  initListUI() {
    // Initialize filter dropdowns
    this.populateFilterDropdowns();
    
    // Initial render with default sort (alphabetical)
    this.renderMonsterList();

    // Setup new monster button
    const newBtn = document.getElementById('new-monster-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        window.location.href = 'monsterBuilder.html';
      });
    }

    // Setup export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportJSON());
    }

    // Setup import button
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            this.importJSON(file).then(success => {
              if (success) this.renderMonsterList();
            });
          }
        };
        input.click();
      });
    }

    // Save to server (writes apps/cards.json) or localStorage if offline
    const saveToServerBtn = document.getElementById('save-to-server-btn');
    if (saveToServerBtn) {
      saveToServerBtn.addEventListener('click', async () => {
        if (!this.serverMode) {
          if (!confirm('Server appears to be offline. Save to localStorage instead? Click OK to save locally, Cancel to abort.')) {
            return;
          }
          try {
            await this.dataLoader.saveToLocalStorage();
            this.showNotification('Saved monsters to localStorage', 'success');
            return;
          } catch (error) {
            console.error('Local save failed:', error);
            this.showNotification('Save failed: ' + error.message, 'error');
            return;
          }
        }

        // If server is online, persist to server (cards.json)
        try {
          await this.saveAllToServer();
        } catch (error) {
          console.error('Save to server failed:', error);
          this.showNotification('Save failed: ' + error.message, 'error');
        }
      });
    }

    // Setup search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderMonsterList());
    }

    // Setup filter dropdowns
    const polarityFilter = document.getElementById('polarity-filter');
    if (polarityFilter) {
      polarityFilter.addEventListener('change', () => this.renderMonsterList());
    }

    const typeTagFilter = document.getElementById('typetag-filter');
    if (typeTagFilter) {
      typeTagFilter.addEventListener('change', () => this.renderMonsterList());
    }

    const habitatFilter = document.getElementById('habitat-filter');
    if (habitatFilter) {
      habitatFilter.addEventListener('change', () => this.renderMonsterList());
    }

    // Setup sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.renderMonsterList());
    }

    console.log('List UI initialized');
  }

  /**
   * Populate filter dropdowns with available options
   */
  populateFilterDropdowns() {
    const monsters = this.getAllMonsters();
    
    // Populate type tags
    const typeTagSet = new Set();
    monsters.forEach(m => {
      if (m.TypeTags) m.TypeTags.forEach(tag => typeTagSet.add(tag));
    });
    
    const typeTagFilter = document.getElementById('typetag-filter');
    if (typeTagFilter) {
      const sortedTypeTags = Array.from(typeTagSet).sort();
      sortedTypeTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        typeTagFilter.appendChild(option);
      });
    }

    // Populate habitats
    const habitatSet = new Set();
    monsters.forEach(m => {
      if (m.Habitat) m.Habitat.forEach(habitat => habitatSet.add(habitat));
    });
    
    const habitatFilter = document.getElementById('habitat-filter');
    if (habitatFilter) {
      const sortedHabitats = Array.from(habitatSet).sort();
      sortedHabitats.forEach(habitat => {
        const option = document.createElement('option');
        option.value = habitat;
        option.textContent = habitat;
        habitatFilter.appendChild(option);
      });
    }
  }

  /**
   * Render monster list
   */
  renderMonsterList() {
    const container = document.getElementById('monster-list');
    if (!container) return;

    let monsters = this.getAllMonsters();
    const totalMonsters = monsters.length;

    // Apply filters
    monsters = this.applyFilters(monsters);

    // Apply sorting
    monsters = this.applySorting(monsters);

    // Update filter status
    this.updateFilterStatus(monsters.length, totalMonsters);

    if (monsters.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #95a5a6;">
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">No monsters found</p>
          <p>Try adjusting your filters or create a new monster</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="monster-grid">
        ${monsters.map(monster => this.renderMonsterCard(monster)).join('')}
      </div>
    `;

    // Attach click handlers
    container.querySelectorAll('.monster-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        window.location.href = `monsterBuilder.html?id=${encodeURIComponent(id)}`;
      });
    });
  }

  /**
   * Apply filters to monster list
   */
  applyFilters(monsters) {
    const searchInput = document.getElementById('search-input');
    const polarityFilter = document.getElementById('polarity-filter');
    const typeTagFilter = document.getElementById('typetag-filter');
    const habitatFilter = document.getElementById('habitat-filter');

    let filtered = [...monsters];

    // Search filter
    if (searchInput && searchInput.value.trim()) {
      const searchTerm = searchInput.value.trim().toLowerCase();
      filtered = filtered.filter(m => 
        (m.CardName || '').toLowerCase().includes(searchTerm)
      );
    }

    // Polarity filter
    if (polarityFilter && polarityFilter.value !== 'all') {
      filtered = filtered.filter(m => m.Polarity === polarityFilter.value);
    }

    // Type tag filter
    if (typeTagFilter && typeTagFilter.value !== 'all') {
      filtered = filtered.filter(m => 
        m.TypeTags && m.TypeTags.includes(typeTagFilter.value)
      );
    }

    // Habitat filter
    if (habitatFilter && habitatFilter.value !== 'all') {
      filtered = filtered.filter(m => 
        m.Habitat && m.Habitat.includes(habitatFilter.value)
      );
    }

    return filtered;
  }

  /**
   * Apply sorting to monster list
   */
  applySorting(monsters) {
    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : 'name-asc';

    const sorted = [...monsters];

    switch (sortValue) {
      case 'name-asc':
        sorted.sort((a, b) => {
          const nameA = (a.CardName || '').toLowerCase();
          const nameB = (b.CardName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      
      case 'name-desc':
        sorted.sort((a, b) => {
          const nameA = (a.CardName || '').toLowerCase();
          const nameB = (b.CardName || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
      
      case 'polarity':
        sorted.sort((a, b) => {
          if (a.Polarity === b.Polarity) {
            return (a.CardName || '').localeCompare(b.CardName || '');
          }
          return (a.Polarity || '').localeCompare(b.Polarity || '');
        });
        break;
      
      case 'recent':
        // Sort by ID descending (assuming higher ID = more recent)
        sorted.sort((a, b) => {
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          return idB - idA;
        });
        break;
    }

    return sorted;
  }

  /**
   * Update filter status message
   */
  updateFilterStatus(showing, total) {
    const statusElement = document.getElementById('filter-status');
    if (!statusElement) return;

    if (showing === total) {
      statusElement.textContent = `Showing all ${total} monsters`;
      statusElement.style.color = '#6c757d';
    } else {
      statusElement.textContent = `Showing ${showing} of ${total} monsters`;
      statusElement.style.color = '#667eea';
      statusElement.style.fontWeight = '600';
    }
  }

  /**
   * Render single monster card for list
   */
  renderMonsterCard(monster) {
    return `
      <div class="monster-card" data-id="${monster.id}">
        <h3>${monster.CardName || 'Unnamed Monster'}</h3>
        <div class="polarity-badge ${monster.Polarity}">${monster.Polarity}</div>
        <div class="tags">
          ${(monster.TypeTags || []).map(tag => `<span class="tag light">${tag}</span>`).join('')}
          ${(monster.AspectTags || []).map(tag => `<span class="tag shadow">${tag}</span>`).join('')}
        </div>
        ${monster.MoveStrategy ? `<div style="margin-top: 0.5rem; font-size: 0.85rem;">Strategy: ${monster.MoveStrategy}</div>` : ''}
      </div>
    `;
  }

  /**
   * Persist all monsters (writes to server cards.json when online)
   */
  async saveAllToServer() {
    // If a monster is being edited, ensure it's saved first
    if (this.currentMonster) {
      const saved = await this.saveMonster();
      if (!saved) throw new Error('Current monster validation failed — aborting save');
    }

    // Save all data via DataLoader (will POST to /api/cards when serverMode is true)
    await this.dataLoader.saveData();
    this.showNotification('Monsters saved to server (cards.json)', 'success');
  }
}

// Add notification animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
