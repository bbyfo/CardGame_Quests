/**
 * db.js
 * PostgreSQL database connection and queries
 */

const { Pool } = require('pg');

// Create connection pool
// Render automatically sets DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Initialize database - create cards table if it doesn't exist
 */
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Database initialized');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Get all cards from database
 */
async function getCards() {
  try {
    const result = await pool.query('SELECT data FROM cards WHERE id = 1');
    
    if (result.rows.length === 0) {
      // No data yet, return empty structure
      return {
        questgivers: [],
        harmedparties: [],
        verbs: [],
        targets: [],
        locations: [],
        twists: [],
        rewards: [],
        failures: []
      };
    }
    
    return result.rows[0].data;
  } catch (error) {
    console.error('Error getting cards:', error);
    throw error;
  }
}

/**
 * Save cards to database
 */
async function saveCards(cards) {
  try {
    // Use UPSERT (INSERT ... ON CONFLICT UPDATE)
    await pool.query(`
      INSERT INTO cards (id, data, updated_at)
      VALUES (1, $1, CURRENT_TIMESTAMP)
      ON CONFLICT (id)
      DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP
    `, [cards]);
    
    console.log('✓ Cards saved to database');
    return true;
  } catch (error) {
    console.error('Error saving cards:', error);
    throw error;
  }
}

/**
 * Check if database is available
 */
async function isDatabaseAvailable() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  initDatabase,
  getCards,
  saveCards,
  isDatabaseAvailable
};
