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
app.use(express.static(__dirname)); // Serve static files

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
    let cards;
    
    if (useDatabaseStorage) {
      cards = await db.getCards();
    } else {
      const data = await fs.readFile(CARDS_FILE, 'utf8');
      cards = JSON.parse(data);
    }
    
    res.json(cards);
  } catch (error) {
    console.error('Error reading cards:', error);
    res.status(500).json({ error: 'Failed to load cards' });
  }
});

/**
 * POST /api/cards - Save cards
 */
app.post('/api/cards', async (req, res) => {
  try {
    const cards = req.body;
    
    // Validate the data structure
    const requiredDecks = ['questgivers', 'harmedparties', 'verbs', 'targets', 'locations', 'twists', 'rewards', 'failures'];
    for (const deck of requiredDecks) {
      if (!Array.isArray(cards[deck])) {
        return res.status(400).json({ error: `Missing or invalid deck: ${deck}` });
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

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Quest System Server                                   ║
║  http://localhost:${PORT}                                ║
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
