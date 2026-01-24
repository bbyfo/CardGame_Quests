/**
 * sheets.js
 * Specialized bottom sheet implementations for different field types
 */

/**
 * Tag Selector Sheet (TypeTags, AspectTags)
 */
class TagSelectorSheet extends BottomSheet {
  constructor(fieldName, currentTags, polarity = null) {
    const isTypeTags = fieldName === 'TypeTags';
    const availableTags = isTypeTags 
      ? (polarity === 'Light' ? MONSTER_CONFIG.LIGHT_TAGS : MONSTER_CONFIG.SHADOW_TAGS)
      : MONSTER_CONFIG.ASPECT_TAGS;

    super(`${fieldName}-sheet`, {
      title: isTypeTags ? 'Type Tags' : 'Aspect Tags',
      content: TagSelectorSheet.renderContent(availableTags, currentTags),
      showFooter: true
    });

    this.fieldName = fieldName;
    this.currentTags = [...currentTags];
    this.availableTags = availableTags;
    this.polarity = polarity;

    this.attachTagListeners();
  }

  static renderContent(availableTags, selectedTags) {
    return `
      <div class="form-group">
        <label>Select tags:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
          ${availableTags.map(tag => `
            <label class="checkbox-group">
              <input 
                type="checkbox" 
                value="${tag}" 
                ${selectedTags.includes(tag) ? 'checked' : ''}
              />
              <span>${tag}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachTagListeners() {
    const contentEl = this.getContentElement();
    contentEl.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const tag = e.target.value;
        if (e.target.checked) {
          if (!this.currentTags.includes(tag)) {
            this.currentTags.push(tag);
          }
        } else {
          const index = this.currentTags.indexOf(tag);
          if (index > -1) {
            this.currentTags.splice(index, 1);
          }
        }
      });
    });
  }

  getTags() {
    return this.currentTags;
  }
}

/**
 * Image Picker Sheet
 */
class ImagePickerSheet extends BottomSheet {
  constructor(currentImageUrl) {
    super('image-picker-sheet', {
      title: 'Monster Image',
      content: ImagePickerSheet.renderContent(currentImageUrl),
      showFooter: true
    });

    this.imageUrl = currentImageUrl || '';
  }

  static renderContent(currentImageUrl) {
    return `
      <div class="form-group">
        <label for="image-url">Image URL:</label>
        <input 
          type="url" 
          id="image-url" 
          value="${currentImageUrl || ''}" 
          placeholder="https://example.com/monster.jpg"
        />
      </div>
      ${currentImageUrl ? `
        <div class="form-group">
          <label>Preview:</label>
          <img 
            src="${currentImageUrl}" 
            alt="Preview" 
            style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;"
            onerror="this.style.display='none'"
          />
        </div>
      ` : ''}
    `;
  }

  getImageUrl() {
    const input = document.getElementById('image-url');
    return input ? input.value.trim() : '';
  }
}

/**
 * Habitat Selector Sheet
 */
class HabitatSelectorSheet extends BottomSheet {
  constructor(currentHabitats) {
    super('habitat-sheet', {
      title: 'Habitat / Biomes',
      content: HabitatSelectorSheet.renderContent(currentHabitats),
      showFooter: true
    });

    this.currentHabitats = [...currentHabitats];
  }

  static renderContent(selectedHabitats) {
    return `
      <div class="form-group">
        <label>Select habitats where this monster appears:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
          ${MONSTER_CONFIG.HABITATS.map(habitat => `
            <label class="checkbox-group">
              <input 
                type="checkbox" 
                value="${habitat}" 
                ${selectedHabitats.includes(habitat) ? 'checked' : ''}
              />
              <span>${habitat}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  getHabitats() {
    const checkboxes = this.getContentElement().querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }
}

/**
 * Notes Editor Sheet
 */
class NotesEditorSheet extends BottomSheet {
  constructor(currentNotes) {
    super('notes-sheet', {
      title: 'Designer Notes',
      content: NotesEditorSheet.renderContent(currentNotes),
      showFooter: true
    });
  }

  static renderContent(currentNotes) {
    return `
      <div class="form-group">
        <label for="designer-notes">Internal notes (not shown on card):</label>
        <textarea 
          id="designer-notes" 
          rows="8" 
          placeholder="Add design notes, balance considerations, etc..."
        >${currentNotes || ''}</textarea>
      </div>
    `;
  }

  getNotes() {
    const textarea = document.getElementById('designer-notes');
    return textarea ? textarea.value.trim() : '';
  }
}

/**
 * Flavor Text Sheet
 */
class FlavorTextSheet extends BottomSheet {
  constructor(currentFlavorText) {
    super('flavor-sheet', {
      title: 'Flavor Text',
      content: FlavorTextSheet.renderContent(currentFlavorText),
      showFooter: true
    });
  }

  static renderContent(currentFlavorText) {
    return `
      <div class="form-group">
        <label for="flavor-text">Narrative flavor text:</label>
        <textarea 
          id="flavor-text" 
          rows="6" 
          placeholder="Add atmospheric description..."
        >${currentFlavorText || ''}</textarea>
      </div>
    `;
  }

  getFlavorText() {
    const textarea = document.getElementById('flavor-text');
    return textarea ? textarea.value.trim() : '';
  }
}

/**
 * Special Abilities Sheet
 */
class SpecialAbilitiesSheet extends BottomSheet {
  constructor(currentAbilities) {
    super('abilities-sheet', {
      title: 'Special Abilities',
      content: SpecialAbilitiesSheet.renderContent(currentAbilities),
      showFooter: true
    });

    this.abilities = [...currentAbilities];
    this.attachAbilityListeners();
  }

  static renderContent(abilities) {
    return `
      <div class="form-group">
        <label>Special abilities:</label>
        <div id="abilities-list" style="margin-top: 0.5rem;">
          ${abilities.map((ability, index) => `
            <div class="flex items-center gap-1 mb-1">
              <input 
                type="text" 
                value="${ability}" 
                data-index="${index}"
                style="flex: 1;"
                placeholder="Ability name..."
              />
              <button class="btn btn-small btn-danger" data-action="remove" data-index="${index}">×</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-small btn-secondary mt-2" id="add-ability">+ Add Ability</button>
      </div>
    `;
  }

  attachAbilityListeners() {
    const contentEl = this.getContentElement();

    // Add ability button
    const addBtn = contentEl.querySelector('#add-ability');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.abilities.push('');
        this.updateContent(SpecialAbilitiesSheet.renderContent(this.abilities));
        this.attachAbilityListeners();
      });
    }

    // Remove buttons
    contentEl.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.abilities.splice(index, 1);
        this.updateContent(SpecialAbilitiesSheet.renderContent(this.abilities));
        this.attachAbilityListeners();
      });
    });

    // Input changes
    contentEl.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.abilities[index] = e.target.value;
      });
    });
  }

  getAbilities() {
    return this.abilities.filter(a => a.trim() !== '');
  }
}

/**
 * Instruction Editor Sheet
 * Reuses instruction patterns from QuestGenerator cardManager
 */
class InstructionEditorSheet extends BottomSheet {
  constructor(currentInstructions) {
    super('instructions-sheet', {
      title: 'Card Instructions',
      content: InstructionEditorSheet.renderContent(currentInstructions),
      showFooter: true
    });

    this.instructions = JSON.parse(JSON.stringify(currentInstructions));
    this.attachInstructionListeners();
  }

  static renderContent(instructions) {
    return `
      <div class="form-group">
        <label>Instructions:</label>
        <p style="font-size: 0.85rem; color: #6c757d; margin-bottom: 1rem;">
          Instructions modify card behavior during quest generation.
        </p>
        <div id="instructions-list" style="margin-top: 0.5rem;">
          ${instructions.map((instr, index) => `
            <div class="p-2 mb-2" style="border: 1px solid #dee2e6; border-radius: 8px;">
              <div class="flex justify-between items-center mb-1">
                <strong>Instruction ${index + 1}</strong>
                <button class="btn btn-small btn-danger" data-action="remove" data-index="${index}">×</button>
              </div>
              <div class="form-group">
                <label>Target Deck:</label>
                <input 
                  type="text" 
                  value="${instr.TargetDeck || ''}" 
                  data-index="${index}"
                  data-field="TargetDeck"
                  placeholder="e.g., ThisCard, Monster, Loot"
                />
              </div>
              <div class="form-group">
                <label>Tags:</label>
                <input 
                  type="text" 
                  value="${(instr.Tags || []).join(', ')}" 
                  data-index="${index}"
                  data-field="Tags"
                  placeholder="e.g., Hostile, Aggressive"
                />
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-small btn-secondary mt-2" id="add-instruction">+ Add Instruction</button>
      </div>
    `;
  }

  attachInstructionListeners() {
    const contentEl = this.getContentElement();

    // Add instruction button
    const addBtn = contentEl.querySelector('#add-instruction');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.instructions.push({ TargetDeck: '', Tags: [] });
        this.updateContent(InstructionEditorSheet.renderContent(this.instructions));
        this.attachInstructionListeners();
      });
    }

    // Remove buttons
    contentEl.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.instructions.splice(index, 1);
        this.updateContent(InstructionEditorSheet.renderContent(this.instructions));
        this.attachInstructionListeners();
      });
    });

    // Input changes
    contentEl.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        
        if (field === 'Tags') {
          this.instructions[index].Tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        } else {
          this.instructions[index][field] = e.target.value;
        }
      });
    });
  }

  getInstructions() {
    return this.instructions.filter(instr => instr.TargetDeck || instr.Tags.length > 0);
  }
}
