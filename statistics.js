/**
 * Statistics Page
 * Renders various statistics and analytics for the card collection
 */

class StatisticsManager {
  constructor() {
    this.cards = {};
    this.charts = {};
    this.initialize();
  }

  async initialize() {
    try {
      // Load card data
      const loader = new DataLoader();
      await loader.loadData();
      this.cards = loader.decks;

      // Render all statistics
      this.renderDeckStatistics();
      this.renderTypeTagStatistics();
      this.renderTagStatistics();
    } catch (error) {
      console.error('Error initializing statistics:', error);
      this.showError('Failed to load card data');
    }
  }

  /**
   * Render deck statistics with Chart.js
   */
  renderDeckStatistics() {
    const ctx = document.getElementById('deck-chart');
    if (!ctx) return;

    // Count cards per deck
    const deckCounts = {};
    let totalCards = 0;

    for (const deckName in this.cards) {
      const deck = this.cards[deckName];
      if (Array.isArray(deck)) {
        deckCounts[deckName] = deck.length;
        totalCards += deck.length;
      }
    }

    // Sort by count descending
    const sortedDecks = Object.entries(deckCounts)
      .sort(([, a], [, b]) => b - a);

    const labels = sortedDecks.map(([name]) => this.getDeckDisplayName(name));
    const data = sortedDecks.map(([, count]) => count);
    const percentages = sortedDecks.map(([, count]) => 
      ((count / totalCards) * 100).toFixed(1) + '%'
    );

    // Destroy existing chart if it exists
    if (this.charts.deckChart) {
      this.charts.deckChart.destroy();
    }

    // Create chart
    this.charts.deckChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Cards',
          data: data,
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a',
            '#fee140'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: window.innerWidth < 768 ? 0 : 750
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const deckName = sortedDecks[index][0];
            this.handleDeckClick(deckName);
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const count = context.parsed.y;
                const percentage = percentages[context.dataIndex];
                return `${count} cards (${percentage})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Render type tag statistics with Chart.js
   */
  renderTypeTagStatistics() {
    const ctx = document.getElementById('type-tag-chart');
    if (!ctx) return;

    // Count type tag usage
    const tagCounts = {};

    for (const deckName in this.cards) {
      const deck = this.cards[deckName];
      if (!Array.isArray(deck)) continue;

      deck.forEach(card => {
        if (Array.isArray(card.TypeTags)) {
          card.TypeTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
    }

    // Sort by count descending and take top 20
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    const labels = sortedTags.map(([tag]) => tag);
    const data = sortedTags.map(([, count]) => count);

    // Destroy existing chart if it exists
    if (this.charts.typeTagChart) {
      this.charts.typeTagChart.destroy();
    }

    // Create horizontal bar chart
    this.charts.typeTagChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Usage Count',
          data: data,
          backgroundColor: '#667eea',
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: window.innerWidth < 768 ? 0 : 750
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Used in ${context.parsed.x} cards`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Render tag statistics (from cardManager.js)
   */
  renderTagStatistics() {
    const statsContainer = document.getElementById('tag-stats-content');
    if (!statsContainer) return;

    // Count tag usage across all cards
    const tagCounts = {
      type: {},
      aspect: {},
      mutable: {}
    };

    for (const deckName in this.cards) {
      const deck = this.cards[deckName];
      if (!Array.isArray(deck)) continue;

      deck.forEach(card => {
        // Count TypeTags
        if (Array.isArray(card.TypeTags)) {
          card.TypeTags.forEach(tag => {
            tagCounts.type[tag] = (tagCounts.type[tag] || 0) + 1;
          });
        }

        // Count AspectTags
        if (Array.isArray(card.AspectTags)) {
          card.AspectTags.forEach(tag => {
            tagCounts.aspect[tag] = (tagCounts.aspect[tag] || 0) + 1;
          });
        }

        // Count mutableTags
        if (Array.isArray(card.mutableTags)) {
          card.mutableTags.forEach(tag => {
            tagCounts.mutable[tag] = (tagCounts.mutable[tag] || 0) + 1;
          });
        }
      });
    }

    // Sort tags alphabetically within each category and build HTML
    const renderCategory = (title, tags) => {
      const sortedTags = Object.entries(tags)
        .sort(([tagA], [tagB]) => tagA.localeCompare(tagB));

      if (sortedTags.length === 0) {
        return `
          <div class="tag-category">
            <h4>${title}</h4>
            <p style="color: #999; font-size: 0.9em;">No tags</p>
          </div>
        `;
      }

      const entriesHtml = sortedTags.map(([tag, count]) => `
        <div class="tag-entry">
          <span class="tag-name">${tag}</span>
          <span class="tag-count">${count}</span>
        </div>
      `).join('');

      return `
        <div class="tag-category">
          <h4>${title}</h4>
          <div class="tag-list">
            ${entriesHtml}
          </div>
        </div>
      `;
    };

    // Build the complete HTML
    const html = `
      ${renderCategory('Type Tags', tagCounts.type)}
      ${renderCategory('Aspect Tags', tagCounts.aspect)}
      ${renderCategory('Mutable Tags', tagCounts.mutable)}
    `;

    statsContainer.innerHTML = html;
  }

  /**
   * Handle deck click - navigate to card manager with filter
   */
  handleDeckClick(deckName) {
    const confirmed = confirm(`View ${this.getDeckDisplayName(deckName)} cards in Card Manager?`);
    if (confirmed) {
      window.location.href = `cardManager.html?deck=${deckName}`;
    }
  }

  /**
   * Get display name for deck
   */
  getDeckDisplayName(deckKey) {
    const mapping = {
      'npcs': 'NPC',
      'questtemplates': 'Quest Template',
      'locations': 'Location',
      'twists': 'Twist',
      'magicitems': 'Magic Item',
      'monsters': 'Monster',
      'loot': 'Loot'
    };
    return mapping[deckKey] || deckKey;
  }

  /**
   * Show error message
   */
  showError(message) {
    const containers = [
      document.getElementById('deck-chart'),
      document.getElementById('type-tag-chart'),
      document.getElementById('tag-stats-content')
    ];

    containers.forEach(container => {
      if (container) {
        container.innerHTML = `<div class="loading-message" style="color: #e74c3c;">${message}</div>`;
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StatisticsManager());
} else {
  new StatisticsManager();
}
