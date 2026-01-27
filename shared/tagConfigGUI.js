/**
 * tagConfigGUI.js
 * GUI logic for tag configuration settings
 */
/*
 * tagConfigGUI.js (refreshed)
 * Clean, robust implementation for tag configuration GUI and icon-font picker.
 */

const ICON_FONT_LIST = [
  { name: 'icon-exhausted', unicode: '\uf007' },
  { name: 'icon-disturbed', unicode: '\uf008' },
  { name: 'icon-stunned', unicode: '\uf009' },
  { name: 'icon-disoriented', unicode: '\uf00a' },
  { name: 'icon-shocked', unicode: '\uf00b' },
  { name: 'icon-staggered', unicode: '\uf00c' },
  { name: 'icon-blinded', unicode: '\uf00d' },
  { name: 'icon-poisoned', unicode: '\uf00e' },
  { name: 'icon-wounded', unicode: '\uf00f' },
  { name: 'icon-burned', unicode: '\uf010' },
  { name: 'icon-addled', unicode: '\uf012' },
  { name: 'icon-pay-money', unicode: '\uf006' },
  { name: 'icon-Green_Nature', unicode: '\uf000' },
  { name: 'icon-Steel_Power', unicode: '\uf001' },
  { name: 'icon-Red_Righteous', unicode: '\uf002' },
  { name: 'icon-Star_Any', unicode: '\uf003' },
  { name: 'icon-Yellow_Wisdom', unicode: '\uf004' },
  { name: 'icon-Blue_Justice', unicode: '\uf005' },
  { name: 'icon-weakened', unicode: '\uf011' }
];

let tagConfigManager;
let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    tagConfigManager = window.TAG_CONFIG_MANAGER;
    await tagConfigManager.init();
    renderAllTags();
    setupEventListeners();
    document.body.classList.remove('loading');
  } catch (err) {
    console.error('Failed to initialize tag config GUI:', err);
    alert('Failed to load tag configuration: ' + (err && err.message ? err.message : err));
  }
});

function setupEventListeners() {
  document.getElementById('search-tags').addEventListener('input', handleSearch);
  document.getElementById('reset-btn').addEventListener('click', handleReset);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-btn').addEventListener('click', handleImport);
  document.getElementById('save-btn').addEventListener('click', handleSave);
  document.getElementById('add-type-pair-btn').addEventListener('click', handleAddTypePair);
  document.getElementById('add-aspect-btn').addEventListener('click', handleAddAspect);
  tagConfigManager.onChange(() => renderAllTags());
}

function renderAllTags() {
  const configs = tagConfigManager.getAllConfigs();
  const polarityTags = Object.values(configs).filter(c => c.category === 'Polarity');
  const typeTags = Object.values(configs).filter(c => c.category === 'TypeTag');
  const aspectTags = Object.values(configs).filter(c => c.category === 'AspectTag');

  renderPolarityTags(polarityTags);
  renderTypeTags(typeTags);
  renderAspectTags(aspectTags);

  if (currentFilter) applySearchFilter();
}

function renderPolarityTags(tags) {
  const container = document.getElementById('polarity-tags');
  container.innerHTML = tags.map(tag => renderTagCard(tag)).join('');
  attachCardListeners(container);
}

function renderTypeTags(tags) {
  const container = document.getElementById('type-tags');
  const pairs = new Map();
  tags.forEach(tag => {
    if (tag.pairedWith) {
      const pairKey = [tag.name, tag.pairedWith].sort().join('-');
      if (!pairs.has(pairKey)) pairs.set(pairKey, []);
      pairs.get(pairKey).push(tag);
    } else {
      pairs.set(tag.name, [tag]);
    }
  });

  container.innerHTML = Array.from(pairs.values()).map(pair => {
    if (pair.length === 2) {
      const ordered = pair[0].polarityAssociation === 'Light' ? pair : pair.slice().reverse();
      const [light, shadow] = ordered;
      return `<div class="tag-pair"><div class="tag-pair-header">${escapeHtml(light.label || light.name)} ↔ ${escapeHtml(shadow.label || shadow.name)}</div>${renderTagCard(light)}${renderTagCard(shadow)}</div>`;
    }
    return `<div class="tag-pair">${renderTagCard(pair[0])}</div>`;
  }).join('');

  attachCardListeners(container);
}

function renderAspectTags(tags) {
  const container = document.getElementById('aspect-tags');
  if (!tags.length) { container.innerHTML = '<p class="text-muted">No custom aspect tag configurations yet</p>'; return; }
  container.innerHTML = tags.map(tag => renderTagCard(tag)).join('');
  attachCardListeners(container);
}

function renderTagCard(tag) {
  const isDefault = tagConfigManager.defaultConfigs && tagConfigManager.defaultConfigs[tag.name];
  const color = tag.color || '';
  const textColor = tag.textColor || '#FFFFFF';
  const label = escapeHtml(tag.label || tag.name);
  let iconPreview = '';
  if (tag.iconFont && tag.iconFont.unicode) iconPreview = `<span class="icon tag-icon">${tag.iconFont.unicode}</span>`;
  else if (tag.iconUrl) iconPreview = `<img src="${escapeAttr(tag.iconUrl)}" class="tag-icon" alt="" />`;

  return `
  <div class="tag-config-card" data-tag-name="${escapeAttr(tag.name)}">
    <input type="text" class="tag-name" value="${label}" placeholder="${escapeAttr(tag.name)}" title="Internal name: ${escapeAttr(tag.name)}" />
    <div class="tag-category">${escapeHtml(tag.category)}</div>

    <div class="form-field">
      <label>Color</label>
      <div class="color-input-group">
        <input type="color" class="tag-color" value="${escapeAttr(color || '#6B7280')}" ${!tag.color ? 'disabled' : ''} />
        <input type="text" class="tag-color-hex" value="${escapeAttr(color || '#6B7280')}" ${!tag.color ? 'disabled' : ''} placeholder="No custom color" />
        <input type="checkbox" class="enable-color" ${tag.color ? 'checked' : ''} title="Enable custom color" />
      </div>
    </div>

    <div class="form-field">
      <label>Icon (from font)</label>
      <button type="button" class="icon-picker-btn btn btn-secondary btn-small">Choose Icon</button>
      <span class="icon-picker-preview">${iconPreview}</span>
    </div>

    ${tag.category === 'TypeTag' ? `
      <div class="form-field">
        <label>Polarity Association</label>
        <select class="tag-polarity">
          <option value="Light" ${tag.polarityAssociation === 'Light' ? 'selected' : ''}>Light</option>
          <option value="Shadow" ${tag.polarityAssociation === 'Shadow' ? 'selected' : ''}>Shadow</option>
        </select>
      </div>
    ` : ''}

    <div class="tag-preview">
      <div class="tag-preview-label">Preview</div>
      <span class="tag" style="background-color: ${escapeAttr(tag.color || '#6B7280')}; color: ${escapeAttr(textColor)};">${iconPreview}${label}</span>
    </div>

    ${!isDefault ? `<button class="delete-tag-btn">Delete Tag</button>` : ''}
  </div>`;
}

function attachCardListeners(container) {
  container.querySelectorAll('.tag-config-card').forEach(card => {
    const tagName = card.dataset.tagName;
    const tagNameInput = card.querySelector('.tag-name');
    if (tagNameInput) {
      tagNameInput.addEventListener('blur', () => updateTagConfig(card));
      tagNameInput.addEventListener('input', () => {
        const preview = card.querySelector('.tag-preview .tag');
        if (preview) {
          const txt = tagNameInput.value.trim() || tagName;
          const iconSpan = preview.querySelector('.tag-icon');
          preview.textContent = txt;
          if (iconSpan) preview.prepend(iconSpan);
        }
      });
    }

    const enableColorCheckbox = card.querySelector('.enable-color');
    const colorInput = card.querySelector('.tag-color');
    const hexInput = card.querySelector('.tag-color-hex');

    if (enableColorCheckbox) {
      enableColorCheckbox.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        colorInput.disabled = !enabled;
        hexInput.disabled = !enabled;
        if (enabled && !colorInput.value) { colorInput.value = '#6B7280'; hexInput.value = '#6B7280'; }
        updateTagConfig(card);
      });
    }

    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        hexInput.value = e.target.value;
        const preview = card.querySelector('.tag-preview .tag');
        if (preview && enableColorCheckbox?.checked) {
          const textColor = tagConfigManager._calculateTextColor(e.target.value);
          preview.style.backgroundColor = e.target.value;
          preview.style.color = textColor;
        }
        updateTagConfig(card);
      });
    }

    if (hexInput) {
      hexInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorInput.value = e.target.value;
          const preview = card.querySelector('.tag-preview .tag');
          if (preview && enableColorCheckbox?.checked) {
            const textColor = tagConfigManager._calculateTextColor(e.target.value);
            preview.style.backgroundColor = e.target.value;
            preview.style.color = textColor;
          }
          updateTagConfig(card);
        }
      });
    }

    const iconPickerBtn = card.querySelector('.icon-picker-btn');
    if (iconPickerBtn) iconPickerBtn.addEventListener('click', () => openIconPicker(card));

    const polaritySelect = card.querySelector('.tag-polarity');
    if (polaritySelect) polaritySelect.addEventListener('change', () => updateTagConfig(card));

    const deleteBtn = card.querySelector('.delete-tag-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete configuration for "${tagName}"?`)) tagConfigManager.deleteConfig(tagName);
      });
    }
  });
}

function updateTagConfig(card) {
  const tagName = card.dataset.tagName;
  const config = tagConfigManager.getConfig(tagName);

  const tagNameInput = card.querySelector('.tag-name');
  const enableColor = card.querySelector('.enable-color')?.checked;
  const colorInput = card.querySelector('.tag-color');
  const polaritySelect = card.querySelector('.tag-polarity');
  const iconPreviewSpan = card.querySelector('.icon-picker-preview');

  const iconFont = card.dataset.iconFont ? JSON.parse(card.dataset.iconFont) : (config.iconFont || null);

  const updatedConfig = {
    label: tagNameInput.value.trim() || tagName,
    category: config.category,
    color: enableColor ? colorInput.value : null,
    iconUrl: config.iconUrl || null,
    iconFont: iconFont,
    polarityAssociation: polaritySelect ? polaritySelect.value : config.polarityAssociation,
    pairedWith: config.pairedWith
  };

  tagConfigManager.setConfig(tagName, updatedConfig);

  const preview = card.querySelector('.tag-preview .tag');
  const textColor = updatedConfig.color ? tagConfigManager._calculateTextColor(updatedConfig.color) : '#FFFFFF';
  preview.style.backgroundColor = updatedConfig.color || '#6B7280';
  preview.style.color = textColor;
  const iconHtml = updatedConfig.iconFont && updatedConfig.iconFont.unicode ? `<span class="icon tag-icon">${updatedConfig.iconFont.unicode}</span>` : (updatedConfig.iconUrl ? `<img src="${escapeAttr(updatedConfig.iconUrl)}" class="tag-icon" alt="" />` : '');
  preview.innerHTML = iconHtml + escapeHtml(updatedConfig.label || tagName);
  if (iconPreviewSpan) iconPreviewSpan.innerHTML = iconHtml;
}

function openIconPicker(card) {
  const modal = document.getElementById('icon-picker-modal');
  const groupsContainer = document.getElementById('icon-picker-groups');
  groupsContainer.innerHTML = '';

  const groups = { Light: [], Shadow: [], Other: [] };
  ICON_FONT_LIST.forEach(icon => {
    const name = icon.name.toLowerCase();
    if (name.includes('light') || name.includes('righteous') || name.includes('justice') || name.includes('wisdom') || name.includes('nature')) groups.Light.push(icon);
    else if (name.includes('shadow') || name.includes('deceit') || name.includes('treachery') || name.includes('disturbed') || name.includes('exhausted') || name.includes('stunned') || name.includes('shocked') || name.includes('blinded') || name.includes('poisoned') || name.includes('wounded') || name.includes('burned')) groups.Shadow.push(icon);
    else groups.Other.push(icon);
  });

  Object.entries(groups).forEach(([groupName, icons]) => {
    if (!icons.length) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'icon-picker-group';
    groupDiv.innerHTML = `<div class="icon-picker-group-label">${escapeHtml(groupName)}</div>`;
    const grid = document.createElement('div');
    grid.className = 'icon-picker-grid';

    icons.forEach(icon => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-picker-icon';
      btn.innerHTML = `<span class="icon">${icon.unicode}</span>`;
      btn.title = icon.name;

      const currentIcon = card.dataset.iconFont ? JSON.parse(card.dataset.iconFont) : (tagConfigManager.getConfig(card.dataset.tagName).iconFont || null);
      if (currentIcon && currentIcon.unicode === icon.unicode) btn.classList.add('selected');

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.icon-picker-icon').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        card.dataset.iconFont = JSON.stringify(icon);
        const iconPreviewSpan = card.querySelector('.icon-picker-preview');
        if (iconPreviewSpan) iconPreviewSpan.innerHTML = `<span class="icon tag-icon">${icon.unicode}</span>`;
      });

      grid.appendChild(btn);
    });

    groupDiv.appendChild(grid);
    groupsContainer.appendChild(groupDiv);
  });

  modal.style.display = 'flex';

  document.getElementById('icon-picker-close').onclick = () => {
    modal.style.display = 'none';
    updateTagConfig(card);
  };

  modal.onclick = (e) => { if (e.target === modal) { modal.style.display = 'none'; updateTagConfig(card); } };
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function escapeAttr(s) { return escapeHtml(s); }

function handleSearch(e) { currentFilter = e.target.value.trim().toLowerCase(); applySearchFilter(); updateFilterStatus(); }
function applySearchFilter() { document.querySelectorAll('.tag-config-card').forEach(card => { const tagName = card.dataset.tagName.toLowerCase(); if (!currentFilter || tagName.includes(currentFilter)) card.classList.remove('hidden'); else card.classList.add('hidden'); }); }
function updateFilterStatus() { const allCards = document.querySelectorAll('.tag-config-card'); const visibleCount = Array.from(allCards).filter(c => !c.classList.contains('hidden')).length; const totalCount = allCards.length; const filterStatus = document.getElementById('filter-status'); if (currentFilter) { filterStatus.textContent = `Showing ${visibleCount} of ${totalCount} tags`; filterStatus.style.color = '#667eea'; filterStatus.style.fontWeight = '600'; } else { filterStatus.textContent = 'Showing all tags'; filterStatus.style.color = '#6c757d'; filterStatus.style.fontWeight = 'normal'; } }

function handleReset() { (async () => { const useServer = confirm('Load saved tag configurations from server file (tag-config.json) if available?\n\nClick OK to load from server file, Cancel to reset to built-in defaults.'); if (useServer) { const success = await tagConfigManager.loadFromServerFile(); if (success) { alert('✓ Tag configurations loaded from server file.'); renderAllTags(); return; } else { if (!confirm('Failed to load from server file. Do you want to reset to built-in defaults instead?')) return; } } const ok = tagConfigManager.resetToDefaults(); if (ok) { alert('✓ Tag configurations reset to built-in defaults.'); renderAllTags(); } })(); }
function handleExport() { const json = tagConfigManager.exportToJSON(); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `tag-config-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }
function handleImport() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { const success = tagConfigManager.importFromJSON(ev.target.result); if (success) { alert('Tag configurations imported successfully!'); renderAllTags(); } else { alert('Failed to import tag configurations. Check file format.'); } }; reader.readAsText(file); } }; input.click(); }
function handleSave() { alert('Changes are saved automatically!'); }
function handleAddTypePair() { const lightName = prompt('Enter Light TypeTag name:'); if (!lightName) return; const shadowName = prompt('Enter Shadow TypeTag name:'); if (!shadowName) return; const lightColor = prompt('Enter Light tag color (hex):', '#6B7280'); const shadowColor = prompt('Enter Shadow tag color (hex):', '#374151'); tagConfigManager.setConfig(lightName, { category: 'TypeTag', color: lightColor, polarityAssociation: 'Light', pairedWith: shadowName }); tagConfigManager.setConfig(shadowName, { category: 'TypeTag', color: shadowColor, polarityAssociation: 'Shadow', pairedWith: lightName }); renderAllTags(); }
function handleAddAspect() { const tagName = prompt('Enter AspectTag name:'); if (!tagName) return; const color = prompt('Enter tag color (hex, or leave blank for default):', ''); tagConfigManager.setConfig(tagName, { category: 'AspectTag', color: color || null, polarityAssociation: null, pairedWith: null }); renderAllTags(); }

window._TAG_CONFIG_GUI = { ICON_FONT_LIST };
