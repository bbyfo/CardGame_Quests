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
    // Create DataLoader and load card data
    dataLoader = new DataLoader();
    await dataLoader.loadFromAPI('/api/cards');

    // Create QuestEngine with loaded decks
    questEngine = new QuestEngine(dataLoader.getDecks());

    // Create Validator
    validator = new QuestValidator(questEngine, dataLoader);

    // Create UI Manager
    uiManager = new UIManager(questEngine, validator);
    uiManager.initialize();

    console.log('✓ Application initialized successfully');
    console.log('Loaded decks:', Object.keys(dataLoader.decks));
    
    // Log initial state
    uiManager.addLog('✓ Quest System initialized');
    uiManager.addLog(`Loaded ${dataLoader.getAllCards().length} cards across 6 decks`);
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
