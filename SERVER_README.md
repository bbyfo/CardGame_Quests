# Quest System - Server Setup Guide

## Persistent Storage & Collaboration

The Quest System now includes a Node.js backend server for automatic card persistence and team collaboration.

## Quick Start

### 1. Install Dependencies

```bash
cd e:\CardGame\CardGame_from_OneDrive\QuestSystem\app
npm install
```

### 2. Start the Server

**Option A: Use the batch file (Windows)**
```
Double-click START_SERVER.bat
```

**Option B: Command line**
```bash
npm start
```

### 3. Access the Application

- **Quest System**: http://localhost:3000/index.html
- **Card Manager**: http://localhost:3000/cardManager.html

## Features

### Automatic Saving
- Card Manager now **auto-saves to cards.json** when you add/edit cards
- No more manual export/import steps!
- Changes are immediately visible to all team members

### Backup System
- Server creates timestamped backups before each save
- Backups stored as: `cards.backup.YYYY-MM-DDTHH-MM-SS.json`

### Fallback Mode
- If server is offline, Card Manager falls back to localStorage
- You'll see a warning: "Server offline - using localStorage"
- Can still work offline, then reconnect later

## For Collaboration

### On Your Computer (Host)
1. Start the server with `START_SERVER.bat`
2. Find your IP address: `ipconfig` (look for IPv4)
3. Share your IP with team members (e.g., `192.168.1.100`)

### On Team Members' Computers
1. Open browser and go to: `http://YOUR_IP:3000/cardManager.html`
2. Example: `http://192.168.1.100:3000/cardManager.html`
3. Everyone now edits the same cards.json file!

### For Online Hosting
To host this online for remote collaboration:

1. **Deploy to a hosting service:**
   - Heroku (free tier available)
   - Render.com (free tier available)
   - Your own VPS (DigitalOcean, AWS, etc.)

2. **Update the API URL** in cardManager.js:
   ```javascript
   this.apiUrl = 'https://your-domain.com/api/cards';
   ```

3. **Security considerations:**
   - Add authentication (username/password)
   - Add rate limiting
   - Use HTTPS for production

## API Endpoints

- `GET /api/cards` - Load cards
- `POST /api/cards` - Save cards
- `GET /api/health` - Server health check

## Troubleshooting

**"Server offline" warning**
- Make sure START_SERVER.bat is running
- Check console for errors
- Verify port 3000 isn't blocked by firewall

**Changes not saving**
- Check browser console for errors
- Verify server logs show save requests
- Check file permissions on cards.json

**Team members can't connect**
- Check Windows Firewall allows port 3000
- Verify everyone is on the same network
- Try disabling antivirus temporarily

## Technical Details

- **Server**: Express.js (Node.js)
- **Port**: 3000 (configurable in server.js)
- **Storage**: cards.json (with automatic backups)
- **Fallback**: localStorage for offline work

---

**Questions?** Check the console logs for detailed error messages.
