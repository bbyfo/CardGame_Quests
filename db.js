/**
 * db.js
 * Database abstraction that supports raw Postgres (pg) and Supabase JS (service role key).
 * Behavior:
 *  - If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present, uses Supabase client for get/save.
 *  - Uses pg Pool when DATABASE_URL is present (used for DDL like creating tables if needed).
 */

const { Pool } = require('pg');
require('dotenv').config();

// Optional pg pool (used for DDL or when DATABASE_URL is present)
// Automatically enable SSL for known managed hosts (Supabase) or when NODE_ENV=production
const _shouldUseSSL = process.env.NODE_ENV === 'production' || !!process.env.SUPABASE_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co'));
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: _shouldUseSSL ? { rejectUnauthorized: false } : false
}) : null;

// Optional Supabase client (server-side, using service role key)
let supabase = null;
let useSupabase = false;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    useSupabase = true;
  }
} catch (err) {
  console.warn('Supabase client could not be initialized:', err.message || err);
}

/**
 * Initialize database - create cards table if it doesn't exist
 */
async function initDatabase() {
  // If using Supabase client, try a simple select to detect table existence.
  if (useSupabase) {
    try {
      const { data, error } = await supabase.from('cards').select('id').limit(1);
      if (error) {
        // If table doesn't exist and we have a pg pool, try creating it via pool
        if (pool && /does not exist|Undefined table|relation "cards" does not exist/i.test(error.message || '')) {
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY DEFAULT 1,
                data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            console.log('✓ Created cards table via pg pool (Supabase backend)');
            return true;
          } catch (err) {
            console.error('Error creating table via pg pool:', err.message || err);
            return false;
          }
        }
        // Table may be missing, but connection to Supabase is valid
        console.warn('Supabase query returned an error (table may not exist):', error.message || error);
        return true; // connection is valid
      }

      console.log('✓ Supabase project accessible');
      return true;
    } catch (err) {
      console.error('Supabase initialization error:', err.message || err);
      return false;
    }
  }

  // Fallback: use pg pool if present
  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Database initialized (pg)');
      return true;
    } catch (error) {
      console.error('Database initialization error (pg):', error.message || error);
      return false;
    }
  }

  console.warn('No database configured (neither Supabase nor DATABASE_URL found)');
  return false;
}

/**
 * Get all cards from database
 */
async function getCards() {
  const empty = () => ({
    npcs: [],
    questtemplates: [],
    locations: [],
    twists: [],
    magicitems: [],
    monsters: []
  });

  // Try Supabase client first (preferred for production)
  if (useSupabase) {
    try {
      console.log('[DB] Querying database with Supabase client...');
      const { data, error } = await supabase.from('cards').select('data').eq('id', 1).single();
      if (error) {
        if (/does not exist|Undefined table|relation "cards" does not exist/i.test(error.message || '')) {
          console.log('[DB] Cards table does not exist in Supabase, returning empty structure');
          return empty();
        }
        throw error;
      }
      console.log('[DB] Cards loaded from Supabase:', data && data.data ? Object.keys(data.data) : 'empty');
      return data && data.data ? data.data : empty();
    } catch (err) {
      console.error('[DB] Supabase getCards error:', err.message || err);
      console.error('[DB] Falling back to pg pool or empty...');
      // Fall through to pg pool if Supabase fails
    }
  }

  // Fallback: try pg pool (direct Postgres connection)
  if (pool) {
    try {
      console.log('[DB] Querying database with pg pool...');
      const result = await pool.query('SELECT data FROM cards WHERE id = 1');
      if (result.rows.length === 0) {
        console.log('[DB] No cards found in database, returning empty structure');
        return empty();
      }
      console.log('[DB] Cards loaded from pg pool:', Object.keys(result.rows[0].data));
      return result.rows[0].data;
    } catch (error) {
      console.error('[DB] Error getting cards (pg):', error.message);
      console.error('[DB] Error details:', error);
      // Fall through to empty
    }
  }

  // If both fail, return empty
  console.log('[DB] No database connection available, returning empty structure');
  return empty();
}

/**
 * Save cards to database
 */
async function saveCards(cards) {
  // Try Supabase client first (preferred for production)
  if (useSupabase) {
    try {
      console.log('[DB] Saving cards to Supabase...');
      // Upsert using Supabase client
      const { data, error } = await supabase.from('cards').upsert({ id: 1, data: cards }, { onConflict: 'id' });
      if (error) {
        console.error('[DB] Supabase save error:', error.message || error);
        throw error;
      }
      console.log('✓ Cards saved to Supabase');
      return true;
    } catch (err) {
      console.error('[DB] Supabase saveCards exception:', err.message || err);
      console.error('[DB] Falling back to pg pool...');
      // Fall through to pg pool if Supabase fails
    }
  }

  // Fallback: try pg pool (direct Postgres connection)
  if (pool) {
    try {
      console.log('[DB] Saving cards to database via pg pool...');
      await pool.query(`
        INSERT INTO cards (id, data, updated_at)
        VALUES (1, $1, CURRENT_TIMESTAMP)
        ON CONFLICT (id)
        DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP
      `, [cards]);
      console.log('✓ Cards saved to database (pg)');
      return true;
    } catch (error) {
      console.error('[DB] Error saving cards (pg):', error.message || error);
      throw error;
    }
  }

  // If both fail, throw error
  throw new Error('No database connection available for saving cards');
}

/**
 * Check if database is available
 */
async function isDatabaseAvailable() {
  // Try pg pool first (direct Postgres connection — more reliable locally)
  if (pool) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.warn('pg ping failed:', error.message || error);
      // Fall through to Supabase check
    }
  }

  // Fallback: try Supabase client (if configured)
  if (useSupabase) {
    try {
      const resp = await supabase.from('cards').select('id').limit(1);
      if (resp && resp.error) {
        console.warn('Supabase ping returned error:', resp.error.message || resp.error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase ping threw an exception:', err.message || err);
      return false;
    }
  }

  return false;
}

module.exports = {
  initDatabase,
  getCards,
  saveCards,
  isDatabaseAvailable
};
