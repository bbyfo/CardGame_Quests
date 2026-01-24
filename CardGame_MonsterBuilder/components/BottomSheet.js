/**
 * BottomSheet.js
 * Base bottom sheet component for mobile-friendly overlays
 */

class BottomSheet {
  constructor(id, options = {}) {
    this.id = id;
    this.title = options.title || 'Edit';
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.content = options.content || '';
    this.showFooter = options.showFooter !== false;
    
    this.create();
  }

  /**
   * Create the bottom sheet DOM elements
   */
  create() {
    // Remove existing sheet with same ID
    const existing = document.getElementById(this.id);
    if (existing) {
      existing.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.id = `${this.id}-overlay`;
    overlay.addEventListener('click', () => this.close());

    // Create sheet
    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.id = this.id;
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <h2>${this.title}</h2>
        <button class="sheet-close" aria-label="Close">×</button>
      </div>
      <div class="sheet-content" id="${this.id}-content">
        ${this.content}
      </div>
      ${this.showFooter ? `
        <div class="sheet-footer">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-primary" data-action="save">Save</button>
        </div>
      ` : ''}
    `;

    // Add to body
    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    // Attach listeners
    this.attachListeners();
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    const sheet = document.getElementById(this.id);
    const overlay = document.getElementById(`${this.id}-overlay`);

    // Close button
    const closeBtn = sheet.querySelector('.sheet-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Footer buttons
    const cancelBtn = sheet.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.onCancel();
        this.close();
      });
    }

    const saveBtn = sheet.querySelector('[data-action="save"]');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.onSave();
        this.close();
      });
    }

    // ESC key
    this.escListener = (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escListener);
  }

  /**
   * Open the sheet
   */
  open() {
    const sheet = document.getElementById(this.id);
    const overlay = document.getElementById(`${this.id}-overlay`);
    
    if (sheet && overlay) {
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        sheet.classList.add('active');
      });
    }
  }

  /**
   * Close the sheet
   */
  close() {
    const sheet = document.getElementById(this.id);
    const overlay = document.getElementById(`${this.id}-overlay`);
    
    if (sheet && overlay) {
      overlay.classList.remove('active');
      sheet.classList.remove('active');
    }
  }

  /**
   * Check if sheet is open
   */
  isOpen() {
    const sheet = document.getElementById(this.id);
    return sheet && sheet.classList.contains('active');
  }

  /**
   * Update content
   */
  updateContent(html) {
    const contentEl = document.getElementById(`${this.id}-content`);
    if (contentEl) {
      contentEl.innerHTML = html;
    }
  }

  /**
   * Get content element
   */
  getContentElement() {
    return document.getElementById(`${this.id}-content`);
  }

  /**
   * Destroy sheet
   */
  destroy() {
    const sheet = document.getElementById(this.id);
    const overlay = document.getElementById(`${this.id}-overlay`);
    
    if (sheet) sheet.remove();
    if (overlay) overlay.remove();
    
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener);
    }
  }
}
