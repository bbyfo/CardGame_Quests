/**
 * IconPalette.js
 * Draggable icon palette component
 * Provides cost and harm icons that can be dragged onto card fields
 */

class IconPalette {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.render();
  }

  /**
   * Render the icon palette
   */
  render() {
    this.container.innerHTML = `
      <div class="icon-palette">
        <h3>Cost Icons</h3>
        <div class="icon-palette-grid" id="cost-icons-palette">
          ${this.renderCostIcons()}
        </div>
      </div>
      
      <div class="icon-palette mt-2">
        <h3>Harm Icons</h3>
        <div class="icon-palette-grid" id="harm-icons-palette">
          ${this.renderHarmIcons()}
        </div>
      </div>
    `;

    this.attachDragListeners();
  }

  /**
   * Render cost icons
   */
  renderCostIcons() {
    const costCodes = MONSTER_CONFIG.getAllCostCodes();
    return costCodes.map(code => {
      const icon = MONSTER_CONFIG.getCostIcon(code);
      return `
        <div 
          class="icon ${icon.cssClass} draggable" 
          draggable="true" 
          data-icon-code="${code}" 
          data-icon-type="cost"
          title="${icon.label}"
        ></div>
      `;
    }).join('');
  }

  /**
   * Render harm icons
   */
  renderHarmIcons() {
    const harmCodes = MONSTER_CONFIG.getAllHarmCodes();
    return harmCodes.map(code => {
      const icon = MONSTER_CONFIG.getHarmIcon(code);
      return `
        <div 
          class="icon ${icon.cssClass} draggable" 
          draggable="true" 
          data-icon-code="${code}" 
          data-icon-type="harm"
          title="${icon.label}"
        ></div>
      `;
    }).join('');
  }

  /**
   * Attach drag event listeners
   */
  attachDragListeners() {
    document.querySelectorAll('.icon-palette .icon[draggable="true"]').forEach(icon => {
      // Desktop drag events
      icon.addEventListener('dragstart', (e) => {
        const iconCode = e.target.dataset.iconCode;
        const iconType = e.target.dataset.iconType;
        
        e.dataTransfer.setData('icon-code', iconCode);
        e.dataTransfer.setData('icon-type', iconType);
        e.dataTransfer.effectAllowed = 'copy';
        
        e.target.style.opacity = '0.5';
        
        // Highlight all valid drop zones
        this.highlightValidDropZones(iconType, true);
      });

      icon.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
        
        // Remove all drop zone highlights
        this.highlightValidDropZones(null, false);
      });

      // Mobile touch events
      icon.addEventListener('touchstart', (e) => {
        icon.style.opacity = '0.5';
        icon.dataset.dragging = 'true';
        
        // Store data for touch events
        icon.dataset.touchIconCode = icon.dataset.iconCode;
        icon.dataset.touchIconType = icon.dataset.iconType;
        
        // Highlight all valid drop zones immediately
        this.highlightValidDropZones(icon.dataset.iconType, true);
      }, { passive: true });
      
      icon.addEventListener('touchmove', (e) => {
        if (icon.dataset.dragging !== 'true') return;
        
        e.preventDefault(); // Prevent scrolling while dragging
        const touch = e.touches[0];
        
        // Get element at touch point (check the element and its ancestors)
        let elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Traverse up to find icon-array-field if we hit a child element
        while (elementAtPoint && !elementAtPoint.classList.contains('icon-array-field')) {
          elementAtPoint = elementAtPoint.parentElement;
          // Stop at body to avoid infinite loop
          if (elementAtPoint === document.body) {
            elementAtPoint = null;
            break;
          }
        }
        
        // Update drag-over highlighting based on current position
        document.querySelectorAll('.icon-array-field').forEach(f => {
          const isTarget = f === elementAtPoint;
          const isValidType = f.dataset.iconType === icon.dataset.touchIconType;
          
          if (isTarget && isValidType) {
            f.classList.add('drag-over-active');
          } else {
            f.classList.remove('drag-over-active');
          }
        });
      });
      
      icon.addEventListener('touchend', (e) => {
        if (icon.dataset.dragging !== 'true') return;
        
        icon.style.opacity = '1';
        icon.dataset.dragging = 'false';
        
        const touch = e.changedTouches[0];
        let elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Traverse up to find icon-array-field if we hit a child element
        while (elementAtPoint && !elementAtPoint.classList.contains('icon-array-field')) {
          elementAtPoint = elementAtPoint.parentElement;
          if (elementAtPoint === document.body) {
            elementAtPoint = null;
            break;
          }
        }
        
        // Remove all highlighting
        this.highlightValidDropZones(null, false);
        
        // Handle drop if valid target
        if (elementAtPoint && elementAtPoint.classList.contains('icon-array-field')) {
          const expectedType = elementAtPoint.dataset.iconType;
          if (icon.dataset.touchIconType === expectedType) {
            // Trigger a custom event that cardMockup can listen to
            elementAtPoint.dispatchEvent(new CustomEvent('icon-drop', {
              detail: {
                iconCode: icon.dataset.touchIconCode,
                iconType: icon.dataset.touchIconType,
                fieldName: elementAtPoint.dataset.field
              }
            }));
          }
        }
      });
      
      icon.addEventListener('touchcancel', (e) => {
        icon.style.opacity = '1';
        icon.dataset.dragging = 'false';
        
        // Remove all highlighting
        this.highlightValidDropZones(null, false);
      });
    });
  }

  /**
   * Highlight valid drop zones for the given icon type
   */
  highlightValidDropZones(iconType, highlight) {
    document.querySelectorAll('.icon-array-field').forEach(field => {
      field.classList.remove('drag-over', 'drag-over-active');
      
      if (highlight && field.dataset.iconType === iconType) {
        field.classList.add('drag-over');
      }
    });
  }

  /**
   * Destroy component
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
