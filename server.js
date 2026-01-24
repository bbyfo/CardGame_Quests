const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from root (for index.html, etc.)
app.use(express.static(path.join(__dirname)));

// Serve Quest Generator static files
app.use('/CardGame_QuestGenerator', express.static(path.join(__dirname, 'CardGame_QuestGenerator')));

// Serve Monster Builder static files
app.use('/CardGame_MonsterBuilder', express.static(path.join(__dirname, 'CardGame_MonsterBuilder')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', apps: ['Quest Generator', 'Monster Builder'] });
});

// Fallback to index.html for root requests
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CardGame Apps server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see available apps`);
});
