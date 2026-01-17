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
4. Click **"Save Changes"**

The app will automatically redeploy and connect to PostgreSQL!

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
