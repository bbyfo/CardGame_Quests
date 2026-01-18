/*
 * migrate.js
 * Create the `cards` table if it doesn't exist. Optionally seed from cards.json with --seed
 *
 * Usage:
 *   node migrate.js           # create table
 *   node migrate.js --seed    # create table and seed from cards.json
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL env var not set. Add it to .env or set it in env variables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTable() {
  const sql = `
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `;
  await pool.query(sql);
  console.log('✓ cards table created or already exists');
}

async function seedFromJson() {
  try {
    const file = path.join(__dirname, 'cards.json');
    const content = await fs.readFile(file, 'utf8');
    const cards = JSON.parse(content);

    await pool.query(`
      INSERT INTO cards (id, data, updated_at)
      VALUES (1, $1, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP
    `, [cards]);

    console.log('✓ Seeded cards from cards.json');
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    throw err;
  }
}

(async () => {
  try {
    await createTable();

    if (process.argv.includes('--seed')) {
      await seedFromJson();
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await pool.end(); } catch(e){}
    process.exit(1);
  }
})();