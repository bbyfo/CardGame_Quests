/**
 * server.js
 * Express server with PostgreSQL for persistent card storage
 * Falls back to cards.json for local development
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CARDS_FILE = path.join(__dirname, 'cards.json');

// Track if database is available
let useDatabaseStorage = false;
// Human-readable data source summary (updated during startup)
let dataSourceSummary = 'filesystem (cards.json)';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files for the top-level apps directory (configurable via APPS_ROOT)
// Default: parent directory (one level up). When this project lives in
// apps/CardGame_Quests, the default APPS_ROOT will be the `apps` folder that
// contains multiple app folders (e.g., CardGame_Quests, CardGame_MonsterBuilder).
const APPS_ROOT = process.env.APPS_ROOT || path.join(__dirname, '..');
app.use(express.static(APPS_ROOT)); // Serve top-level apps folder
app.use(express.static(__dirname)); // Fallback to current app folder
console.log(`ℹ Serving static files from: ${APPS_ROOT}`);

// Initialize database on startup
(async () => {
  if (process.env.DATABASE_URL) {
    console.log('🔍 Database URL detected, attempting to connect...');
    useDatabaseStorage = await db.isDatabaseAvailable();
    
    if (useDatabaseStorage) {
      await db.initDatabase();
      console.log('✓ Using PostgreSQL for storage');
      
      // Check if database is empty and seed from cards.json if needed
      const cards = await db.getCards();
      const isEmpty = Object.values(cards).every(deck => deck.length === 0);
      
      if (isEmpty) {
        console.log('📦 Database is empty, seeding from cards.json...');
        try {
          const fileData = await fs.readFile(CARDS_FILE, 'utf8');
          await db.saveCards(JSON.parse(fileData));
          console.log('✓ Initial data loaded from cards.json');
        } catch (error) {
          console.warn('⚠ Could not seed from cards.json:', error.message);
        }
      }
    } else {
      console.log('⚠ Database unavailable, falling back to file storage');
    }
  } else {
    console.log('ℹ No DATABASE_URL found, using file storage (cards.json)');
  }

  // Status summary for data source — helpful when running locally
  try {
    let source = 'filesystem (cards.json)';

    if (process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
      if (supConfigured && useDatabaseStorage) source = 'Supabase (service role) - available';
      else if (supConfigured && !useDatabaseStorage) source = 'Supabase (service role) - unavailable, falling back to filesystem';
      else source = 'Supabase configuration incomplete (missing URL or service role key)';
    } else if (process.env.DATABASE_URL) {
      if (useDatabaseStorage) source = 'Postgres (DATABASE_URL) - available';
      else source = 'Postgres (DATABASE_URL) - unavailable, falling back to filesystem';
    }

    dataSourceSummary = source;
    console.log(`ℹ Data source: ${dataSourceSummary}`);
  } catch (e) {
    console.warn('Could not determine data source status:', e.message || e);
  }

})();

/**
 * GET /api/cards - Load cards
 */
app.get('/api/cards', async (req, res) => {
  try {
    console.log(`[API] GET /api/cards - Storage mode: ${useDatabaseStorage ? 'database' : 'filesystem'}`);
    let cards;
    
    if (useDatabaseStorage) {
      console.log('[API] Loading cards from database...');
      cards = await db.getCards();
      console.log('[API] Cards loaded from database:', Object.keys(cards));
    } else {
      console.log('[API] Loading cards from filesystem...');
      const data = await fs.readFile(CARDS_FILE, 'utf8');
      cards = JSON.parse(data);
      console.log('[API] Cards loaded from filesystem:', Object.keys(cards));
    }
    
    res.json(cards);
  } catch (error) {
    console.error('[API] Error reading cards:', error.message);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to load cards', details: error.message });
  }
});

/**
 * POST /api/cards - Save cards
 */
app.post('/api/cards', async (req, res) => {
  try {
    const cards = req.body;
    
    console.log('[API] POST /api/cards - Received card data');
    console.log('[API] Deck keys in request:', Object.keys(cards));
    
    // Validate the data structure
    const requiredDecks = ['npcs', 'questtemplates', 'locations', 'twists', 'loot', 'monsters'];
    for (const deck of requiredDecks) {
      if (!Array.isArray(cards[deck])) {
        const errorMsg = `Missing or invalid deck: ${deck}. Received decks: ${Object.keys(cards).join(', ')}`;
        console.error('[API] Validation failed:', errorMsg);
        return res.status(400).json({ error: errorMsg });
      }
    }
    
    if (useDatabaseStorage) {
      // Save to database
      await db.saveCards(cards);
      console.log('✓ Cards saved to database');
    } else {
      // Save to file (local development)
      // Create backup of existing file
      try {
        const existingData = await fs.readFile(CARDS_FILE, 'utf8');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(__dirname, `cards.backup.${timestamp}.json`);
        await fs.writeFile(backupFile, existingData);
        console.log(`✓ Backup created: ${backupFile}`);
      } catch (backupError) {
        console.warn('Backup failed:', backupError.message);
      }
      
      // Write new data
      await fs.writeFile(CARDS_FILE, JSON.stringify(cards, null, 2), 'utf8');
      console.log('✓ Cards saved to cards.json');
    }
    
    res.json({ success: true, message: 'Cards saved successfully' });
  } catch (error) {
    console.error('Error saving cards:', error);
    res.status(500).json({ error: 'Failed to save cards' });
  }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    storage: useDatabaseStorage ? 'postgresql' : 'filesystem',
    dataSource: dataSourceSummary,
    timestamp: new Date().toISOString() 
  });
});

/**
 * GET /api/tag-config - Load tag configurations
 */
app.get('/api/tag-config', async (req, res) => {
  try {
    const tagConfigFile = path.join(__dirname, 'tag-config.json');
    
    // Try to read from file
    try {
      const data = await fs.readFile(tagConfigFile, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      // File doesn't exist yet, return empty config
      res.json({ tagConfigurations: {}, version: 1 });
    }
  } catch (error) {
    console.error('Error loading tag config:', error);
    res.status(500).json({ error: 'Failed to load tag configuration' });
  }
});

/**
 * POST /api/tag-config - Save tag configurations
 */
app.post('/api/tag-config', async (req, res) => {
  try {
    const tagConfigFile = path.join(__dirname, 'tag-config.json');
    const config = req.body;
    
    // Validate
    if (!config.tagConfigurations) {
      return res.status(400).json({ error: 'Invalid tag configuration format' });
    }
    
    // Save to file
    await fs.writeFile(tagConfigFile, JSON.stringify(config, null, 2), 'utf8');
    console.log('✓ Tag configuration saved');
    
    res.json({ success: true, message: 'Tag configuration saved successfully' });
  } catch (error) {
    console.error('Error saving tag config:', error);
    res.status(500).json({ error: 'Failed to save tag configuration' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Quest System Server                                   ║
║  http://localhost:${PORT}                              ║
║                                                        ║
║  Apps Root: ${APPS_ROOT}                               ║
║                                                        ║
║  Example apps:                                         ║
║  • http://localhost:${PORT}/CardGame_QuestGenerator    ║
║  • http://localhost:${PORT}/CardGame_MonsterBuilder    ║
║                                                        ║
║  API Endpoints:                                        ║
║  • GET  /api/cards   - Load cards                     ║
║  • POST /api/cards   - Save cards                     ║
║  • GET  /api/health  - Health check                   ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Server shutting down gracefully');
  process.exit(0);
});
