/**
 * server.js
 * Simple Express server for persistent card storage
 * Allows Card Manager to save directly to cards.json
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const CARDS_FILE = path.join(__dirname, 'cards.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serve static files

/**
 * GET /api/cards - Load cards
 */
app.get('/api/cards', async (req, res) => {
  try {
    const data = await fs.readFile(CARDS_FILE, 'utf8');
    res.json(JSON.parse(data));
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
    
    // Create backup of existing file
    try {
      const existingData = await fs.readFile(CARDS_FILE, 'utf8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(__dirname, `cards.backup.${timestamp}.json`);
      await fs.writeFile(backupFile, existingData);
      console.log(`✓ Backup created: ${backupFile}`);
    } catch (backupError) {
      // If backup fails, continue anyway (file might not exist yet)
      console.warn('Backup failed:', backupError.message);
    }
    
    // Write new data
    await fs.writeFile(CARDS_FILE, JSON.stringify(cards, null, 2), 'utf8');
    console.log('✓ Cards saved to cards.json');
    
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
