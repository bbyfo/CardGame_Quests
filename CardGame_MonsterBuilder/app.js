/**
 * app.js
 * Main orchestrator for Monster Builder
 * Initializes global state and shared utilities
 */

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Prevent FOUC
document.addEventListener('DOMContentLoaded', () => {
  // Remove loading class after a short delay to ensure styles are loaded
  setTimeout(() => {
    document.body.classList.remove('loading');
  }, 100);
});

// Utility functions
const Utils = {
  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Format date
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString();
  },

  /**
   * Generate random ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};

// Export to global scope
window.Utils = Utils;

console.log('Monster Builder App initialized');
