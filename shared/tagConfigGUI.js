/**
 * tagConfigGUI.js
 * GUI logic for tag configuration settings
 */

let tagConfigManager;
let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize tag config manager
    tagConfigManager = window.TAG_CONFIG_MANAGER;
    await tagConfigManager.init();

    // Render all sections
    renderAllTags();

    // Setup event listeners
    setupEventListeners();

    // Remove loading state
    document.body.classList.remove('loading');
  } catch (error) {
    console.error('Failed to initialize tag config GUI:', error);
    alert('Failed to load tag configuration: ' + error.message);
  }
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Search
  document.getElementById('search-tags').addEventListener('input', handleSearch);

  // Toolbar buttons
  document.getElementById('reset-btn').addEventListener('click', handleReset);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-btn').addEventListener('click', handleImport);
  document.getElementById('save-btn').addEventListener('click', handleSave);

  // Add buttons
  document.getElementById('add-type-pair-btn').addEventListener('click', handleAddTypePair);
  document.getElementById('add-aspect-btn').addEventListener('click', handleAddAspect);

  // Listen for config changes
  tagConfigManager.onChange(() => {
    renderAllTags();
  });
}

/**
 * Render all tag sections
 */
function renderAllTags() {
  const configs = tagConfigManager.getAllConfigs();

  // Separate by category
  const polarityTags = Object.values(configs).filter(c => c.category === 'Polarity');
  const typeTags = Object.values(configs).filter(c => c.category === 'TypeTag');
  const aspectTags = Object.values(configs).filter(c => c.category === 'AspectTag');

  // Render each section
  renderPolarityTags(polarityTags);
  renderTypeTags(typeTags);
  renderAspectTags(aspectTags);

  // Apply search filter if active
  if (currentFilter) {
    applySearchFilter();
  }
}

/**
 * Render Polarity tags
 */
function renderPolarityTags(tags) {
  const container = document.getElementById('polarity-tags');
  container.innerHTML = tags.map(tag => renderTagCard(tag)).join('');
  attachCardListeners(container);
}

/**
 * Render TypeTags as paired cards
 */
function renderTypeTags(tags) {
  const container = document.getElementById('type-tags');

  // Group by pairs
  const pairs = new Map();
  tags.forEach(tag => {
    if (tag.pairedWith) {
      const pairKey = [tag.name, tag.pairedWith].sort().join('-');
      if (!pairs.has(pairKey)) {
        pairs.set(pairKey, []);
      }
      pairs.get(pairKey).push(tag);
    } else {
      // Unpaired tags
      pairs.set(tag.name, [tag]);
    }
  });

  container.innerHTML = Array.from(pairs.values()).map(pair => {
    if (pair.length === 2) {
      const [light, shadow] = pair[0].polarityAssociation === 'Light' ? pair : pair.reverse();
      return `
        <div class="tag-pair">
          <div class="tag-pair-header">${light.name} ↔ ${shadow.name}</div>
          ${renderTagCard(light)}
          ${renderTagCard(shadow)}
        </div>
      `;
    } else {
      return `<div class="tag-pair">${renderTagCard(pair[0])}</div>`;
    }
  }).join('');

  attachCardListeners(container);
}

/**
 * Render AspectTags
 */
function renderAspectTags(tags) {
  const container = document.getElementById('aspect-tags');
  
  if (tags.length === 0) {
    container.innerHTML = '<p class="text-muted">No custom aspect tag configurations yet</p>';
    return;
  }

  container.innerHTML = tags.map(tag => renderTagCard(tag)).join('');
  attachCardListeners(container);
}

/**
 * Render a single tag configuration card
 */
function renderTagCard(tag) {
  const isDefault = tagConfigManager.defaultConfigs[tag.name];
  const color = tag.color || '#6B7280';
  const textColor = tag.textColor || '#FFFFFF';
  const iconPreview = tag.iconUrl ? `<img src="${tag.iconUrl}" class="tag-icon" alt="" />` : '';
  const label = tag.label || tag.name;

  return `
    <div class="tag-config-card" data-tag-name="${tag.name}">
      <input type="text" class="tag-name" value="${label}" placeholder="${tag.name}" title="Internal name: ${tag.name}" />
      <div class="tag-category">${tag.category}</div>

      <!-- Color -->
      <div class="form-field">
        <label>Color</label>
        <div class="color-input-group">
          <input type="color" class="tag-color" value="${color}" ${!tag.color ? 'disabled' : ''} />
          <input type="text" class="tag-color-hex" value="${color}" ${!tag.color ? 'disabled' : ''} placeholder="No custom color" />
          <input type="checkbox" class="enable-color" ${tag.color ? 'checked' : ''} title="Enable custom color" />
        </div>
      </div>

      <!-- Icon URL -->
      <div class="form-field">
        <label>Icon URL (optional)</label>
        <input type="url" class="tag-icon-url" value="${tag.iconUrl || ''}" placeholder="https://example.com/icon.png" />
      </div>

      <!-- Polarity Association (for TypeTags) -->
      ${tag.category === 'TypeTag' ? `
        <div class="form-field">
          <label>Polarity Association</label>
          <select class="tag-polarity">
            <option value="Light" ${tag.polarityAssociation === 'Light' ? 'selected' : ''}>Light</option>
            <option value="Shadow" ${tag.polarityAssociation === 'Shadow' ? 'selected' : ''}>Shadow</option>
          </select>
        </div>
      ` : ''}

      <!-- Preview -->
      <div class="tag-preview">
        <div class="tag-preview-label">Preview</div>
        <span class="tag" style="background-color: ${color}; color: ${textColor};">
          ${iconPreview}${label}
        </span>
      </div>

      <!-- Delete (only for non-default tags) -->
      ${!isDefault ? `
        <button class="delete-tag-btn">Delete Tag</button>
      ` : ''}
    </div>
  `;
}

/**
 * Attach event listeners to tag cards
 */
function attachCardListeners(container) {
  container.querySelectorAll('.tag-config-card').forEach(card => {
    const tagName = card.dataset.tagName;

    // Tag name/label input - only update on blur to prevent focus loss while typing
    const tagNameInput = card.querySelector('.tag-name');
    if (tagNameInput) {
      tagNameInput.addEventListener('blur', () => updateTagConfig(card));
      // Update preview while typing without saving
      tagNameInput.addEventListener('input', () => {
        const preview = card.querySelector('.tag-preview .tag');
        const lastChild = preview.lastChild;
        if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
          lastChild.textContent = tagNameInput.value.trim() || card.dataset.tagName;
        } else {
          preview.textContent = tagNameInput.value.trim() || card.dataset.tagName;
        }
      });
    }

    // Enable/disable color
    const enableColorCheckbox = card.querySelector('.enable-color');
    const colorInput = card.querySelector('.tag-color');
    const hexInput = card.querySelector('.tag-color-hex');

    if (enableColorCheckbox) {
      enableColorCheckbox.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        colorInput.disabled = !enabled;
        hexInput.disabled = !enabled;
        
        if (enabled && !colorInput.value) {
          colorInput.value = '#6B7280';
          hexInput.value = '#6B7280';
        }
        
        updateTagConfig(card);
      });
    }

    // Color picker sync
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        hexInput.value = e.target.value;
        updateTagConfig(card);
      });
    }

    if (hexInput) {
      hexInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorInput.value = e.target.value;
          updateTagConfig(card);
        }
      });
    }

    // Icon URL
    const iconUrlInput = card.querySelector('.tag-icon-url');
    if (iconUrlInput) {
      iconUrlInput.addEventListener('input', () => updateTagConfig(card));
    }

    // Polarity
    const polaritySelect = card.querySelector('.tag-polarity');
    if (polaritySelect) {
      polaritySelect.addEventListener('change', () => updateTagConfig(card));
    }

    // Delete
    const deleteBtn = card.querySelector('.delete-tag-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete configuration for "${tagName}"?`)) {
          tagConfigManager.deleteConfig(tagName);
        }
      });
    }
  });
}

/**
 * Update tag configuration from card inputs
 */
function updateTagConfig(card) {
  const tagName = card.dataset.tagName;
  const config = tagConfigManager.getConfig(tagName);

  const tagNameInput = card.querySelector('.tag-name');
  const enableColor = card.querySelector('.enable-color')?.checked;
  const colorInput = card.querySelector('.tag-color');
  const iconUrlInput = card.querySelector('.tag-icon-url');
  const polaritySelect = card.querySelector('.tag-polarity');

  const updatedConfig = {
    label: tagNameInput.value.trim() || tagName,
    category: config.category,
    color: enableColor ? colorInput.value : null,
    iconUrl: iconUrlInput.value.trim() || null,
    polarityAssociation: polaritySelect ? polaritySelect.value : config.polarityAssociation,
    pairedWith: config.pairedWith
  };

  tagConfigManager.setConfig(tagName, updatedConfig);

  // Update preview
  const preview = card.querySelector('.tag-preview .tag');
  const textColor = updatedConfig.color ? tagConfigManager._calculateTextColor(updatedConfig.color) : '#FFFFFF';
  preview.style.backgroundColor = updatedConfig.color || '#6B7280';
  preview.style.color = textColor;

  const iconPreview = updatedConfig.iconUrl ? `<img src="${updatedConfig.iconUrl}" class="tag-icon" alt="" />` : '';
  preview.innerHTML = iconPreview + (updatedConfig.label || tagName);
}

/**
 * Handle search filter
 */
function handleSearch(e) {
  currentFilter = e.target.value.trim().toLowerCase();
  applySearchFilter();

  const allCards = document.querySelectorAll('.tag-config-card');
  const visibleCount = Array.from(allCards).filter(card => !card.classList.contains('hidden')).length;
  const totalCount = allCards.length;

  const filterStatus = document.getElementById('filter-status');
  if (currentFilter) {
    filterStatus.textContent = `Showing ${visibleCount} of ${totalCount} tags`;
    filterStatus.style.color = '#667eea';
    filterStatus.style.fontWeight = '600';
  } else {
    filterStatus.textContent = 'Showing all tags';
    filterStatus.style.color = '#6c757d';
    filterStatus.style.fontWeight = 'normal';
  }
}

/**
 * Apply search filter to cards
 */
function applySearchFilter() {
  document.querySelectorAll('.tag-config-card').forEach(card => {
    const tagName = card.dataset.tagName.toLowerCase();
    if (!currentFilter || tagName.includes(currentFilter)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

/**
 * Handle reset to defaults (offers to load from server file)
 */
async function handleReset() {
  // Ask user whether to load from server file or use built-in defaults
  const useServer = confirm('Load saved tag configurations from server file (tag-config.json) if available?\n\nClick OK to load from server file, Cancel to reset to built-in defaults.');

  if (useServer) {
    const success = await tagConfigManager.loadFromServerFile();
    if (success) {
      alert('✓ Tag configurations loaded from server file.');
      renderAllTags();
      return;
    } else {
      if (!confirm('Failed to load from server file. Do you want to reset to built-in defaults instead?')) {
        return;
      }
    }
  }

  // Fallback: reset to built-in defaults
  const ok = tagConfigManager.resetToDefaults();
  if (ok) {
    alert('✓ Tag configurations reset to built-in defaults.');
    renderAllTags();
  }
}

/**
 * Handle export
 */
function handleExport() {
  const json = tagConfigManager.exportToJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tag-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Handle import
 */
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = tagConfigManager.importFromJSON(e.target.result);
        if (success) {
          alert('Tag configurations imported successfully!');
          renderAllTags();
        } else {
          alert('Failed to import tag configurations. Check file format.');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

/**
 * Handle save (just shows confirmation)
 */
function handleSave() {
  alert('Changes are saved automatically!');
}

/**
 * Handle add new type pair
 */
function handleAddTypePair() {
  const lightName = prompt('Enter Light TypeTag name:');
  if (!lightName) return;

  const shadowName = prompt('Enter Shadow TypeTag name:');
  if (!shadowName) return;

  const lightColor = prompt('Enter Light tag color (hex):', '#6B7280');
  const shadowColor = prompt('Enter Shadow tag color (hex):', '#374151');

  tagConfigManager.setConfig(lightName, {
    category: 'TypeTag',
    color: lightColor,
    polarityAssociation: 'Light',
    pairedWith: shadowName
  });

  tagConfigManager.setConfig(shadowName, {
    category: 'TypeTag',
    color: shadowColor,
    polarityAssociation: 'Shadow',
    pairedWith: lightName
  });

  renderAllTags();
}

/**
 * Handle add new aspect tag
 */
function handleAddAspect() {
  const tagName = prompt('Enter AspectTag name:');
  if (!tagName) return;

  const color = prompt('Enter tag color (hex, or leave blank for default):', '');

  tagConfigManager.setConfig(tagName, {
    category: 'AspectTag',
    color: color || null,
    polarityAssociation: null,
    pairedWith: null
  });

  renderAllTags();
}
