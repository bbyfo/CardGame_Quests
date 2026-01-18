# PostgreSQL Setup for Render.com

## What Changed

Your app now uses PostgreSQL for persistent storage when deployed, but still works with cards.json locally.

**New Files:**
- `db.js` - Database connection and queries
- `server.js` - Updated to use database when available

**Updated:**
- `package.json` - Added `pg` (node-postgres) dependency

## Setup Steps for Render

### 1. Install PostgreSQL dependency locally (optional for testing)

```bash
npm install
```

### 2. Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `cardgame-db` (or any name)
   - **Database**: `cardgame` (default is fine)
   - **User**: `cardgame_user` (default is fine)
   - **Region**: Same as your web service
   - **Plan**: **Free** (should be selected)
4. Click **"Create Database"**
5. Wait ~2 minutes for database to spin up

### 3. Connect Database to Your Web Service

1. Go to your web service (cardgame-quests)
2. Click **"Environment"** tab
3. Render should show a link to "Add DATABASE_URL" - click it
   - OR manually add:
   - Key: `DATABASE_URL`
   - Value: Copy from your PostgreSQL database's **"Internal Database URL"**
4. If you are using Supabase instead of Render Postgres, add these server-only variables instead:
   - Key: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g. `https://db.ncqldbzabcxfdeqmvyit.supabase.co`)
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase **service role** key (get from Project Settings → API)
5. Click **"Save Changes"**

The app will automatically redeploy and connect to your configured database!

### 4. Verify It's Working

After deployment completes:
1. Check the logs: Dashboard → Your Service → Logs
2. You should see:
   ```
   ✓ Using PostgreSQL for storage
   📦 Database is empty, seeding from cards.json...
   ✓ Initial data loaded from cards.json
   ```

3. Visit your Card Manager and add a card
4. Refresh the page - card should persist!

### Run Migrations (optional but recommended)

If you prefer to create the table and seed manually, run locally or from CI:

- Create table only:

```bash
npm run migrate
```

- Create table and seed from local `cards.json`:

```bash
npm run migrate:seed
```

#### Running migrations on Render (one-off)

There are two easy ways to run migrations on Render:

**Option A — Use the Service Shell**
1. Go to Render Dashboard → **Services** → select your web service (e.g., `cardgame-quests`).
2. Click **Shell** (opens a one-off shell into your running service).
3. Run the migration command:

- If your service already has `DATABASE_URL` configured (Render Postgres):

```bash
npm run migrate
# or to seed:
npm run migrate:seed
```

- If you are using **Supabase** but do **not** have `DATABASE_URL` set in Render (you only have `SUPABASE_*` keys), run the migration command by passing the Supabase Postgres connection string as `DATABASE_URL` for the one-off command:

```bash
DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres' npm run migrate
```

> Tip: Alternatively, you can run the CREATE TABLE SQL directly in the Supabase SQL editor (see below) if you prefer not to set the connection string in the shell.

**Option B — Run a One-off Job / Background Job**
- Use Render's one-off job or create a temporary background job that runs `npm run migrate` (and includes the `DATABASE_URL` if needed). This can be useful for CI or scheduled maintenance.

#### Supabase-specific guidance

- `migrate.js` uses `DATABASE_URL` to connect. If you prefer not to supply the Postgres URL to Render for a one-off run, open your Supabase project → **SQL Editor** and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- To seed using the Supabase UI, you can run an `INSERT ... ON CONFLICT` SQL query in the SQL Editor, or run `npm run migrate:seed` from the Shell / one-off job with `DATABASE_URL` pointing at Supabase.

#### Security notes

- Keep the Supabase **service role** key and DB connection strings **server-only** and never expose them to client-side code or commit them to source control.
- The one-off shell command shown above only uses the connection string for the single command and does not persist it as a service environment variable (unless you explicitly set it in Render's Environment tab).

If you want, I can add a short CI job example that runs `npm run migrate` as part of deploy steps; otherwise, leave migration runs manual and as-needed.

## How It Works

**Local Development:**
- No DATABASE_URL → uses `cards.json` (filesystem)
- Your local workflow stays the same

**Production (Render):**
- DATABASE_URL detected → uses PostgreSQL
- All cards stored in database
- Changes persist forever (even after restarts)

## Troubleshooting

**"Database unavailable":**
- Check DATABASE_URL is set in Environment variables
- Make sure PostgreSQL database is running (not paused)

**"Initial data not loading":**
- Make sure cards.json is in your GitHub repo
- Check Render logs for errors

## Database Schema

Super simple - one table:
```sql
CREATE TABLE cards (
  id INTEGER PRIMARY KEY DEFAULT 1,  -- Always 1 (single row)
  data JSONB NOT NULL,                -- All your cards as JSON
  updated_at TIMESTAMP                -- Last update time
);
```

All 8 decks are stored in the `data` column as JSON. Easy to backup or export!
