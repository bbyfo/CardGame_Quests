/**
 * config.js
 * Configuration for API endpoints - auto-detects local vs deployed environment
 */

const CONFIG = {
  // Automatically detects environment
  // When deployed to Render, update the production URL below
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : window.location.origin, // Uses the current domain when deployed
  
  // Convenience getters
  get API_CARDS() {
    return `${this.API_BASE_URL}/api/cards`;
  },
  
  get API_HEALTH() {
    return `${this.API_BASE_URL}/api/health`;
  },
  
  // Environment detection
  get isLocal() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
};
