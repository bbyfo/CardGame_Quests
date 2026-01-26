/**
 * cardMockup.js
 * Live card mockup component with inline editing
 * Renders a visual monster card with editable zones
 */

class CardMockup {
  constructor(containerId, initialMonster = null) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.monster = initialMonster || MONSTER_SCHEMA.createNew();
    this.components = {};
    this.eventListeners = [];
    
    this.render();
  }

  /**
   * Render the complete card mockup
   */
  render() {
    this.container.innerHTML = `
      <div class="card-mockup-container">
        <div class="card-mockup ${this.getFrameClass()}" id="monster-card">
          ${this.renderHeader()}
          ${this.renderImage()}
          ${this.renderTags()}
          ${this.renderIconArrays()}
          ${this.renderStats()}
          ${this.renderFooterButtons()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Get frame CSS class based on FrameStyle
   */
  getFrameClass() {
    const polarity = this.monster.Polarity ? `frame-${this.monster.Polarity.toLowerCase()}` : '';
    const frame = this.monster.FrameStyle ? `frame-${this.monster.FrameStyle}` : '';
    return `${polarity} ${frame}`.trim();
  }

  /**
   * Render card header (name and polarity)
   */
  renderHeader() {
    return `
      <div class="card-header">
        <div class="card-name" id="card-name" data-field="CardName">
          ${this.monster.CardName || 'Unnamed Monster'}
        </div>
        <div class="card-polarity ${this.monster.Polarity}" id="card-polarity" data-field="Polarity">
          ${this.monster.Polarity}
        </div>
      </div>
    `;
  }

  /**
   * Render card image
   */
  renderImage() {
    const hasImage = this.monster.CardImage;
    return `
      <div class="card-image ${hasImage ? '' : 'placeholder'}" id="card-image" data-field="CardImage">
        ${hasImage 
          ? `<img src="${this.monster.CardImage}" alt="${this.monster.CardName}" />`
          : '🖼️ Tap to add image'
        }
      </div>
    `;
  }

  /**
   * Render tags (TypeTags and AspectTags)
   */
  renderTags() {
    return `
      <div class="card-tags">
        <div class="tag-group">
          <div class="tag-group-label">Type Tags</div>
          <div class="tag-list" id="type-tags" data-field="TypeTags">
            ${this.renderTagList(this.monster.TypeTags, 'light')}
          </div>
        </div>
        <div class="tag-group">
          <div class="tag-group-label">Aspect Tags</div>
          <div class="tag-list" id="aspect-tags" data-field="AspectTags">
            ${this.renderTagList(this.monster.AspectTags, 'shadow')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render tag list
   */
  renderTagList(tags, styleClass) {
    if (!tags || tags.length === 0) {
      return '<span style="color: #95a5a6; font-size: 0.85rem;">Tap to add tags</span>';
    }
    return tags.map(tag => `<span class="tag ${styleClass}">${tag}</span>`).join('');
  }

  /**
   * Render icon array fields (BlockCost, ToVanquish, OnHit)
   */
  renderIconArrays() {
    return `
      <div class="icon-array-field" data-field="BlockCost" data-icon-type="cost">
        <div class="icon-array-label">Block Cost</div>
        <div class="icon-array-content" id="block-cost-icons">
          ${this.renderIconArray(this.monster.BlockCost, 'cost')}
        </div>
      </div>
      
      <div class="icon-array-field" data-field="ToVanquish" data-icon-type="cost">
        <div class="icon-array-label">To Vanquish</div>
        <div class="icon-array-content" id="to-vanquish-icons">
          ${this.renderIconArray(this.monster.ToVanquish, 'cost')}
        </div>
      </div>
      
      <div class="icon-array-field" data-field="OnHit" data-icon-type="harm">
        <div class="icon-array-label">On Hit</div>
        <div class="icon-array-content" id="on-hit-icons">
          ${this.renderIconArray(this.monster.OnHit, 'harm')}
        </div>
      </div>
    `;
  }

  /**
   * Render icon array
   */
  renderIconArray(iconCodes, iconType) {
    if (!iconCodes || iconCodes.length === 0) {
      return '<span style="color: #95a5a6; font-size: 0.85rem;">Drag icons here</span>';
    }

    return iconCodes.map((code, index) => {
      const iconConfig = iconType === 'cost' 
        ? MONSTER_CONFIG.getCostIcon(code)
        : MONSTER_CONFIG.getHarmIcon(code);
      
      if (!iconConfig) return '';
      
      return `
        <div class="icon ${iconConfig.cssClass}" data-index="${index}" data-code="${code}">
          <span class="remove-icon" data-action="remove">×</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Render stats (numeric and enum fields)
   */
  renderStats() {
    return `
      <div class="card-stats">
        <div class="stat-field">
          <div class="stat-label">Move Distance</div>
          <div class="numeric-stepper" data-field="MoveDistance">
            <button data-action="decrement">−</button>
            <span class="value">${this.monster.MoveDistance ?? '—'}</span>
            <button data-action="increment">+</button>
          </div>
        </div>
        
        <div class="stat-field">
          <div class="stat-label">Attack Range</div>
          <div class="numeric-stepper" data-field="AttackRange">
            <button data-action="decrement">−</button>
            <span class="value">${this.monster.AttackRange ?? '—'}</span>
            <button data-action="increment">+</button>
          </div>
        </div>
        
        <div class="stat-field full-width">
          <div class="stat-label">Movement Strategy</div>
          <div class="enum-cycler" id="move-strategy" data-field="MoveStrategy">
            ${this.renderMoveStrategy()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render move strategy enum cycler
   */
  renderMoveStrategy() {
    if (!this.monster.MoveStrategy) {
      return '<span style="color: #95a5a6;">Tap to select strategy</span>';
    }

    const strategy = MONSTER_CONFIG.getMoveStrategy(this.monster.MoveStrategy);
    if (!strategy) return this.monster.MoveStrategy;

    return `
      <div class="icon icon-strategy-${strategy.code}">${strategy.symbol}</div>
      <span class="label">${strategy.label}</span>
    `;
  }

  /**
   * Render footer buttons for sheet-based fields
   */
  renderFooterButtons() {
    const buttonData = [
      { field: 'Habitat', label: '🌍 Habitat', count: this.monster.Habitat?.length },
      { field: 'Instructions', label: '📜 Instructions', count: this.monster.Instructions?.length },
      { field: 'SpecialAbilities', label: '✨ Abilities', count: this.monster.SpecialAbilities?.length },
      { field: 'FlavorText', label: '📖 Flavor', hasValue: !!this.monster.FlavorText },
      { field: 'DesignerNotes', label: '📝 Notes', hasValue: !!this.monster.DesignerNotes }
    ];

    return `
      <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
        ${buttonData.map(btn => `
          <button class="btn btn-small btn-secondary" data-sheet="${btn.field}">
            ${btn.label}
            ${btn.count ? ` (${btn.count})` : ''}
            ${btn.hasValue ? ' ✓' : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Card name click
    const cardName = document.getElementById('card-name');
    if (cardName) {
      cardName.addEventListener('click', () => this.openNameEditor());
    }

    // Polarity click (cycle)
    const cardPolarity = document.getElementById('card-polarity');
    if (cardPolarity) {
      cardPolarity.addEventListener('click', () => this.cyclePolarity());
    }

    // Card image click
    const cardImage = document.getElementById('card-image');
    if (cardImage) {
      cardImage.addEventListener('click', () => this.openSheet('CardImage'));
    }

    // Tag list clicks
    const typeTags = document.getElementById('type-tags');
    if (typeTags) {
      typeTags.addEventListener('click', () => this.openSheet('TypeTags'));
    }

    const aspectTags = document.getElementById('aspect-tags');
    if (aspectTags) {
      aspectTags.addEventListener('click', () => this.openSheet('AspectTags'));
    }

    // Move strategy click
    const moveStrategy = document.getElementById('move-strategy');
    if (moveStrategy) {
      moveStrategy.addEventListener('click', () => this.cycleMoveStrategy());
    }

    // Numeric steppers
    document.querySelectorAll('.numeric-stepper').forEach(stepper => {
      const field = stepper.dataset.field;
      stepper.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          this.updateNumericField(field, action);
        });
      });
    });

    // Icon array drag-and-drop
    this.setupIconArrayDragDrop();

    // Icon remove buttons
    document.querySelectorAll('.remove-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const icon = e.target.closest('.icon');
        const array = icon.closest('.icon-array-field');
        const field = array.dataset.field;
        const index = parseInt(icon.dataset.index);
        this.removeIconFromArray(field, index);
      });
    });

    // Sheet buttons
    document.querySelectorAll('[data-sheet]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.sheet;
        this.openSheet(field);
      });
    });
  }

  /**
   * Setup drag-and-drop for icon arrays
   */
  setupIconArrayDragDrop() {
    // Make icon array fields drop zones
    document.querySelectorAll('.icon-array-field').forEach(field => {
      // Desktop drag events
      field.addEventListener('dragover', (e) => {
        e.preventDefault();
        field.classList.add('drag-over');
      });

      field.addEventListener('dragleave', () => {
        field.classList.remove('drag-over');
      });

      field.addEventListener('drop', (e) => {
        e.preventDefault();
        field.classList.remove('drag-over');
        
        const iconCode = e.dataTransfer.getData('icon-code');
        const iconType = e.dataTransfer.getData('icon-type');
        const fieldName = field.dataset.field;
        const expectedType = field.dataset.iconType;
        
        // Validate icon type matches field
        if (iconType === expectedType) {
          this.addIconToArray(fieldName, iconCode);
        }
      });

      // Mobile touch event (custom event from IconPalette)
      field.addEventListener('icon-drop', (e) => {
        const { iconCode, iconType, fieldName } = e.detail;
        const expectedType = field.dataset.iconType;
        
        // Validate icon type matches field
        if (iconType === expectedType && fieldName === field.dataset.field) {
          this.addIconToArray(fieldName, iconCode);
        }
      });
    });
  }

  /**
   * Open name editor (simple prompt for now)
   */
  openNameEditor() {
    const newName = prompt('Enter monster name:', this.monster.CardName);
    if (newName !== null && newName.trim() !== '') {
      this.updateField('CardName', newName.trim());
    }
  }

  /**
   * Cycle polarity (Light <-> Shadow)
   */
  cyclePolarity() {
    const newPolarity = this.monster.Polarity === 'Light' ? 'Shadow' : 'Light';
    
    // Clear TypeTags when changing polarity (they're polarity-restricted)
    this.updateField('Polarity', newPolarity);
    this.updateField('TypeTags', []);
  }

  /**
   * Cycle move strategy
   */
  cycleMoveStrategy() {
    const strategies = MONSTER_CONFIG.getAllStrategyCodes();
    const currentIndex = strategies.indexOf(this.monster.MoveStrategy);
    const nextIndex = (currentIndex + 1) % (strategies.length + 1); // +1 for null
    
    const newStrategy = nextIndex === strategies.length ? null : strategies[nextIndex];
    this.updateField('MoveStrategy', newStrategy);
  }

  /**
   * Update numeric field
   */
  updateNumericField(field, action) {
    let currentValue = this.monster[field];
    if (currentValue === null || currentValue === undefined) {
      currentValue = 0;
    }

    let newValue = currentValue;
    if (action === 'increment') {
      newValue = Math.min(currentValue + 1, 20);
    } else if (action === 'decrement') {
      newValue = Math.max(currentValue - 1, 0);
    }

    this.updateField(field, newValue);
  }

  /**
   * Add icon to array field
   */
  addIconToArray(field, iconCode) {
    const currentArray = [...(this.monster[field] || [])];
    currentArray.push(iconCode);
    this.updateField(field, currentArray);
  }

  /**
   * Remove icon from array field
   */
  removeIconFromArray(field, index) {
    const currentArray = [...(this.monster[field] || [])];
    currentArray.splice(index, 1);
    this.updateField(field, currentArray);
  }

  /**
   * Open bottom sheet for field
   */
  openSheet(fieldName) {
    // Dispatch custom event that will be handled by the main app
    const event = new CustomEvent('open-sheet', {
      detail: { fieldName, monster: this.monster }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Update field and re-render
   */
  updateField(fieldName, value) {
    this.monster[fieldName] = value;
    
    // Dispatch change event
    const event = new CustomEvent('monster-changed', {
      detail: { fieldName, value, monster: this.monster }
    });
    this.container.dispatchEvent(event);

    // Re-render card
    this.render();
  }

  /**
   * Load new monster
   */
  loadMonster(monster) {
    this.monster = MONSTER_SCHEMA.normalize(monster);
    this.render();
  }

  /**
   * Get current monster data
   */
  getMonster() {
    return { ...this.monster };
  }

  /**
   * Update monster data without re-rendering
   */
  updateMonster(updates) {
    this.monster = { ...this.monster, ...updates };
  }

  /**
   * Destroy component
   */
  destroy() {
    this.container.innerHTML = '';
    this.eventListeners = [];
  }
}
