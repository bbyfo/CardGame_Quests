/*
 * test-supabase-connection.js
 * Quick test to connect to Supabase using either Supabase JS (service role) or `pg`.
 *
 * Usage:
 *   1. Ensure `.env` contains either:
 *        - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred), or
 *        - DATABASE_URL
 *   2. Run: `node test-supabase-connection.js`
 */

require('dotenv').config();

const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSupabaseTest() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase.from('cards').select('id').limit(1);
    console.log('✅ Supabase client connected');

    if (error) {
      console.warn('Supabase query returned error (table may not exist):', error.message || error);
      console.log('\nYou can create the table via Supabase SQL editor with:\n');
      console.log("CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY DEFAULT 1, data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);");
      process.exit(0);
    }

    if (Array.isArray(data)) {
      console.log('cards table exists:', data.length >= 0);
      // Attempt to count rows (we can try selecting count using RPC via SQL editor if needed)
      const rows = await supabase.from('cards').select('id');
      console.log('cards rows fetched (up to query limit):', rows.data ? rows.data.length : 0);
    }

    process.exit(0);
  } catch (err) {
    console.error('Supabase connection error:', err.message || err);
    process.exit(1);
  }
}

async function runPgTest() {
  const { Client } = require('pg');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL set; cannot run pg test.');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const now = await client.query('SELECT NOW() AS now');
    console.log('✅ Connected via pg — server time:', now.rows[0].now);

    const tableCheck = await client.query("SELECT to_regclass('public.cards') AS exists");
    const exists = tableCheck.rows[0].exists !== null;
    console.log('cards table exists:', exists);

    if (!exists) {
      console.log('\nYou can create the table with:\n');
      console.log("CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY DEFAULT 1, data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);");
    } else {
      const count = await client.query('SELECT COUNT(*) FROM cards');
      console.log('cards count:', count.rows[0].count);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('pg connection error:', err.message || err);
    process.exit(1);
  }
}

(async () => {
  if (hasSupabase) {
    await runSupabaseTest();
  } else {
    await runPgTest();
  }
})();
