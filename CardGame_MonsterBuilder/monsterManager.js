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
    let sheet = null;

    switch (fieldName) {
      case 'TypeTags':
        sheet = new TagSelectorSheet('TypeTags', this.currentMonster.TypeTags, this.currentMonster.Polarity);
        sheet.onSave = () => {
          this.updateField('TypeTags', sheet.getTags());
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'AspectTags':
        sheet = new TagSelectorSheet('AspectTags', this.currentMonster.AspectTags);
        sheet.onSave = () => {
          this.updateField('AspectTags', sheet.getTags());
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'CardImage':
        sheet = new ImagePickerSheet(this.currentMonster.CardImage);
        sheet.onSave = () => {
          this.updateField('CardImage', sheet.getImageUrl() || null);
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'Habitat':
        sheet = new HabitatSelectorSheet(this.currentMonster.Habitat || []);
        sheet.onSave = () => {
          this.updateField('Habitat', sheet.getHabitats());
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'DesignerNotes':
        sheet = new NotesEditorSheet(this.currentMonster.DesignerNotes);
        sheet.onSave = () => {
          this.updateField('DesignerNotes', sheet.getNotes() || null);
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'FlavorText':
        sheet = new FlavorTextSheet(this.currentMonster.FlavorText);
        sheet.onSave = () => {
          this.updateField('FlavorText', sheet.getFlavorText() || null);
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'SpecialAbilities':
        sheet = new SpecialAbilitiesSheet(this.currentMonster.SpecialAbilities || []);
        sheet.onSave = () => {
          this.updateField('SpecialAbilities', sheet.getAbilities());
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;

      case 'Instructions':
        sheet = new InstructionEditorSheet(this.currentMonster.Instructions || []);
        sheet.onSave = () => {
          this.updateField('Instructions', sheet.getInstructions());
          this.cardMockup.loadMonster(this.currentMonster);
        };
        break;
    }

    if (sheet) {
      sheet.open();
    }
  }

  /**
   * Initialize list UI (called from index.html)
   */
  initListUI() {
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

    console.log('List UI initialized');
  }

  /**
   * Render monster list
   */
  renderMonsterList() {
    const container = document.getElementById('monster-list');
    if (!container) return;

    const monsters = this.getAllMonsters();

    if (monsters.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #95a5a6;">
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">No monsters yet</p>
          <p>Click "New Monster" to create your first monster card</p>
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
