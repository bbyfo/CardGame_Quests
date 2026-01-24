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
      icon.addEventListener('dragstart', (e) => {
        const iconCode = e.target.dataset.iconCode;
        const iconType = e.target.dataset.iconType;
        
        e.dataTransfer.setData('icon-code', iconCode);
        e.dataTransfer.setData('icon-type', iconType);
        e.dataTransfer.effectAllowed = 'copy';
        
        e.target.style.opacity = '0.5';
      });

      icon.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
      });
    });
  }

  /**
   * Destroy component
   */
  destroy() {
    this.container.innerHTML = '';
  }
}
