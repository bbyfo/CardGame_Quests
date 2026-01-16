/**
 * csvImporter.js
 * Parse CSV files and convert to quest card JSON format
 */

class CSVImporter {
  /**
   * Parse CSV file and convert to JSON format
   */
  static async parseCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csv = event.target.result;
          const json = this.csvToJson(csv);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Convert CSV text to JSON format
   */
  static csvToJson(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have headers and at least one data row');
    }

    // Parse header row
    const headers = this.parseCSVLine(lines[0]);
    
    // Validate required columns
    const required = ['Deck', 'CardName'];
    const missing = required.filter(col => !headers.includes(col));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }

    // Parse data rows
    const cards = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue; // Skip empty lines
      
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      try {
        const card = this.rowToCard(headers, values);
        cards.push(card);
      } catch (error) {
        throw new Error(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (cards.length === 0) {
      throw new Error('No valid card data found in CSV');
    }

    // Organize by deck
    const organized = this.organizeByDeck(cards);
    return organized;
  }

  /**
   * Parse a CSV line handling quoted fields
   */
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Don't forget last field
    result.push(current.trim());
    return result;
  }

  /**
   * Convert CSV row to card object
   */
  static rowToCard(headers, values) {
    const card = {};

    // Map CSV columns to card properties
    for (let i = 0; i < headers.length && i < values.length; i++) {
      const header = headers[i].trim();
      let value = values[i].trim();

      if (!header) continue; // Skip empty headers

      // Handle special array fields
      if (['TypeTags', 'AspectTags'].includes(header)) {
        card[header] = this.parseTags(value);
      } else if (header === 'mutableTags') {
        card[header] = this.parseTags(value) || [];
      } else if (header === 'TargetRequirement') {
        card[header] = this.parseTags(value) || [];
      } else if (header === 'Instructions') {
        // Instructions: pipe-separated deck instructions
        // Format: Location[Building;Vault;Fortress]|Target[Magic Item;Artifact]
        card[header] = this.parseInstructions(value);
      } else if (value === '') {
        card[header] = value;
      } else {
        card[header] = value;
      }
    }

    // Validate required fields
    if (!card.Deck) throw new Error('Missing Deck');
    if (!card.CardName) throw new Error('Missing CardName');

    // Set defaults for missing fields
    card.TypeTags = card.TypeTags || [];
    card.AspectTags = card.AspectTags || [];
    card.mutableTags = card.mutableTags || [];
    card.Instructions = card.Instructions || [];

    // TargetRequirement only for Verbs
    if (card.Deck.toLowerCase() !== 'verb') {
      delete card.TargetRequirement;
    } else {
      card.TargetRequirement = card.TargetRequirement || [];
    }

    return card;
  }

  /**
   * Parse tags from semicolon or pipe separated string
   */
  static parseTags(tagString) {
    if (!tagString || tagString === '') return [];
    
    // Support multiple separators: semicolon, pipe, comma
    const separators = /[;|,]/;
    return tagString
      .split(separators)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Parse instructions from pipe-separated format
   * Format: Location[Building;Vault;Fortress]|Target[Magic Item;Artifact]
   */
  static parseInstructions(instructionString) {
    if (!instructionString || instructionString.trim() === '') {
      return [];
    }

    const instructions = [];
    const parts = instructionString.split('|');
    
    for (const part of parts) {
      const match = part.match(/^(\w+)\[(.+)\]$/);
      if (match) {
        const targetDeck = match[1].trim();
        const tagsString = match[2];
        const tags = this.parseTags(tagsString);
        
        if (targetDeck && tags.length > 0) {
          instructions.push({
            TargetDeck: targetDeck,
            Tags: tags
          });
        }
      }
    }
    
    return instructions;
  }

  /**
   * Organize cards by deck
   */
  static organizeByDeck(cards) {
    const organized = {
      questgivers: [],
      harmedparties: [],
      verbs: [],
      targets: [],
      locations: [],
      twists: [],
      rewards: [],
      failures: []
    };

    const deckMap = {
      'questgiver': 'questgivers',
      'harmedparty': 'harmedparties',
      'verb': 'verbs',
      'target': 'targets',
      'location': 'locations',
      'twist': 'twists',
      'reward': 'rewards',
      'failure': 'failures'
    };

    for (const card of cards) {
      const deckKey = deckMap[card.Deck.toLowerCase()];
      if (!deckKey) {
        throw new Error(`Invalid deck: ${card.Deck}. Must be one of: Verb, Target, Location, Twist, Reward, Failure`);
      }
      organized[deckKey].push(card);
    }

    return organized;
  }

  /**
   * Validate deck structure
   */
  static validateDecks(decks) {
    const errors = [];

    // Check deck sizes
    const minSizes = {
      questgivers: 2,
      harmedparties: 2,
      verbs: 3,
      targets: 4,
      locations: 3,
      twists: 3,
      rewards: 2,
      failures: 2
    };

    for (const [deck, minSize] of Object.entries(minSizes)) {
      if (decks[deck].length < minSize) {
        errors.push(`${deck}: ${decks[deck].length} cards (minimum ${minSize})`);
      }
    }

    // Check verb targets have TargetRequirement
    for (const verb of decks.verbs) {
      if (!verb.TargetRequirement || verb.TargetRequirement.length === 0) {
        errors.push(`Verb "${verb.CardName}": Missing TargetRequirement (must specify what kind of Target this verb works with, e.g., "Evil Monster", "Character", "Location")`);
      }
    }

    // Check for duplicate card names within deck
    for (const [deckName, cards] of Object.entries(decks)) {
      const names = new Set();
      for (const card of cards) {
        if (names.has(card.CardName)) {
          errors.push(`${deckName}: Duplicate card name "${card.CardName}"`);
        }
        names.add(card.CardName);
      }
    }

    return errors;
  }

  /**
   * Get CSV template as string
   */
  static getCSVTemplate() {
    return `Deck,CardName,TypeTags,AspectTags,Instructions,TargetRequirement
QuestGiver,King,Royalty;Authority,Leadership,,
QuestGiver,Noble House,Aristocracy;Wealth,Power,,
HarmedParty,Demon Lord,Evil;Supernatural,Darkness,,
HarmedParty,Corporate Rival,Business;Competition,Commerce,,
Verb,Defend,Protective;Action,Military,Target[Evil Monster],Evil Monster
Verb,Retrieve,Heroic;Action,Quest,,Magical
Verb,Heist,Criminal;Action,Stealth,Location[Building;Vault;Fortress]|Target[Magic Item;Artifact;Jewel],City;Vault
Target,Ironfang Raider,Evil Monster;Humanoid,Military,ThisCard[Hostile],
Target,Forgotten Amulet,Magical;Artifact,Ancient,,
Target,Castle Guard,Structure;Humanoid,Military,Location[Fortified],
Location,Dark Forest,Wilderness;Dangerous,Nature,Twist[Perilous],
Location,Ancient Ruins,Exploration;Ancient,Mystery,,
Location,Bank Vault,Building;Secure,Commerce,Reward[Protected]|Failure[Protected],
Twist,Betrayal,Danger;Social,Mystery,Failure[Treacherous],
Twist,Time Pressure,Challenge;Urgency,Quest,,
Twist,Sabotage,Danger;Deception,Crime,Reward[Compromised]|Failure[Compromised],
Reward,Gold Coins,Treasure;Wealth,Commerce,,
Reward,Magical Sword,Weapon;Magical,Magic,ThisCard[Enchanted],
Failure,Death,Permanent;Catastrophic,Doom,,
Failure,Curse,Magical;Permanent,Magic,ThisCard[Afflicted],`;
  }

  /**
   * Download CSV template
   */
  static downloadTemplate() {
    const csv = this.getCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quest_cards_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Convert JSON decks to CSV format
   */
  static jsonToCSV(decks) {
    const rows = [];
    
    // Header
    rows.push([
      'Deck',
      'CardName',
      'TypeTags',
      'AspectTags',
      'Instructions',
      'TargetRequirement'
    ]);

    // Collect all cards from all decks
    const allCards = [];
    for (const [deckName, cards] of Object.entries(decks)) {
      for (const card of cards) {
        allCards.push({ deckName: deckName.slice(0, -1), ...card }); // Remove 's' from plural
      }
    }

    // Convert to rows
    for (const card of allCards) {
      // Convert Instructions array to pipe-separated format
      let instructionsStr = '';
      if (card.Instructions && Array.isArray(card.Instructions) && card.Instructions.length > 0) {
        instructionsStr = card.Instructions
          .map(instr => `${instr.TargetDeck}[${instr.Tags.join(';')}]`)
          .join('|');
      }

      rows.push([
        card.Deck || card.deckName,
        card.CardName,
        (card.TypeTags && card.TypeTags.join(';')) || '',
        (card.AspectTags && card.AspectTags.join(';')) || '',
        instructionsStr,
        (card.TargetRequirement && card.TargetRequirement.join(';')) || ''
      ]);
    }

    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if needed
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
  }

  /**
   * Download decks as CSV
   */
  static downloadAsCSV(decks) {
    const csv = this.jsonToCSV(decks);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quest_cards.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVImporter;
}
