/**
 * app.js
 * Main application entry point - initializes all modules
 */

let dataLoader;
let questEngine;
let validator;
let uiManager;

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Initialize tag configuration manager first
    if (window.TAG_CONFIG_MANAGER) {
      await window.TAG_CONFIG_MANAGER.init().catch(err => console.warn('Tag config init failed:', err));
      console.log('TAG_CONFIG_MANAGER initialized. Sample tag (Martial):', window.TAG_CONFIG_MANAGER.getConfig('Martial'));
    }

    // Check data source from server health endpoint
    let dataSourceInfo = 'Unknown';
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        dataSourceInfo = health.dataSource || `${health.storage} storage`;
      }
    } catch (e) {
      dataSourceInfo = 'Server unavailable';
    }

    // Create DataLoader and load card data
    dataLoader = new DataLoader();
    await dataLoader.loadFromAPI('/api/cards');

    // Make dataLoader globally accessible for deck refreshing
    window.dataLoader = dataLoader;

    // Create QuestEngine with loaded decks
    questEngine = new QuestEngine(dataLoader.getDecks());

    // Create Validator
    validator = new QuestValidator(questEngine, dataLoader);

    // Create UI Manager
    uiManager = new UIManager(questEngine, validator);
    uiManager.initialize();

    // Make uiManager globally accessible for toggle buttons
    window.uiManager = uiManager;

    console.log('✓ Application initialized successfully');
    console.log('Loaded decks:', Object.keys(dataLoader.decks));
    console.log('Data source:', dataSourceInfo);
    
    // Log initial state
    uiManager.addLog('✓ Quest System initialized');
    uiManager.addLog(`📊 Data source: ${dataSourceInfo}`);
    uiManager.addLog(`Loaded ${dataLoader.getAllCards().length} cards across ${Object.keys(dataLoader.decks).length} decks`);
    uiManager.addLog('Ready to generate quests!');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('log-window').innerHTML = `<div class="log-entry"><span style="color: red;">ERROR: ${error.message}</span></div>`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
