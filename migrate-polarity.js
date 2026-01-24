const fs = require('fs');
const path = require('path');

// Tag mapping rules
const TAG_MAPPING = {
    'Arcane': 'Knowledge',
    'Order': 'Justice'
};

const SHADOW_INDICATORS = ['darkness', 'necromancy', 'terror', 'deception', 'madness', 'secrets', 'berserker', 'demon', 'undead', 'aberration', 'warlord', 'tyranny'];
const LIGHT_INDICATORS = ['compassion', 'hero', 'purity', 'faith', 'leadership', 'noble', 'law', 'wisdom'];
const RIGHTEOUSNESS_INDICATORS = ['faith', 'purity', 'compassion', 'sacred', 'holy'];
const ZEALOTRY_INDICATORS = ['tyranny', 'fanatic', 'inquisitor', 'oppression'];

// Migration statistics
const stats = {
    confident: [],
    iffy: [],
    dubious: [],
    totalCards: 0
};

function determinePolarity(card) {
    const typeTags = card.TypeTags || [];
    const aspectTags = (card.AspectTags || []).map(t => t.toLowerCase());
    
    // Rule 1: Shadow TypeTag wins conflicts
    if (typeTags.includes('Shadow')) {
        return { polarity: 'Shadow', confidence: 'confident', reason: 'Has Shadow TypeTag' };
    }
    
    // Rule 2: Light TypeTag
    if (typeTags.includes('Light')) {
        return { polarity: 'Light', confidence: 'confident', reason: 'Has Light TypeTag' };
    }
    
    // Rule 3: Infer from AspectTags if no Light/Shadow
    const hasShadowAspects = aspectTags.some(tag => SHADOW_INDICATORS.some(ind => tag.includes(ind)));
    const hasLightAspects = aspectTags.some(tag => LIGHT_INDICATORS.some(ind => tag.includes(ind)));
    
    if (hasShadowAspects && !hasLightAspects) {
        return { polarity: 'Shadow', confidence: 'iffy', reason: `Inferred from AspectTags: ${aspectTags.filter(tag => SHADOW_INDICATORS.some(ind => tag.includes(ind))).join(', ')}` };
    }
    
    if (hasLightAspects && !hasShadowAspects) {
        return { polarity: 'Light', confidence: 'iffy', reason: `Inferred from AspectTags: ${aspectTags.filter(tag => LIGHT_INDICATORS.some(ind => tag.includes(ind))).join(', ')}` };
    }
    
    // Rule 4: Default to Light for neutral cards
    if (typeTags.length > 0) {
        return { polarity: 'Light', confidence: 'iffy', reason: `Default to Light (neutral TypeTags: ${typeTags.join(', ')})` };
    }
    
    // Rule 5: No TypeTags - dubious
    return { polarity: 'Light', confidence: 'dubious', reason: 'No TypeTags found, defaulted to Light' };
}

function renameTag(tag) {
    return TAG_MAPPING[tag] || tag;
}

function shouldAddRighteousness(card, polarity) {
    if (polarity !== 'Light') return false;
    const aspectTags = (card.AspectTags || []).map(t => t.toLowerCase());
    return aspectTags.some(tag => RIGHTEOUSNESS_INDICATORS.some(ind => tag.includes(ind)));
}

function shouldAddZealotry(card, polarity) {
    if (polarity !== 'Shadow') return false;
    const aspectTags = (card.AspectTags || []).map(t => t.toLowerCase());
    return aspectTags.some(tag => ZEALOTRY_INDICATORS.some(ind => tag.includes(ind)));
}

function migrateCard(card) {
    const oldTypeTags = [...(card.TypeTags || [])];
    
    // Determine Polarity
    const { polarity, confidence, reason } = determinePolarity(card);
    
    // Remove Light and Shadow from TypeTags
    let newTypeTags = oldTypeTags.filter(tag => tag !== 'Light' && tag !== 'Shadow');
    
    // Rename tags
    newTypeTags = newTypeTags.map(renameTag);
    
    // Add Righteousness or Zealotry if appropriate
    if (shouldAddRighteousness(card, polarity) && !newTypeTags.includes('Righteousness')) {
        newTypeTags.push('Righteousness');
    }
    if (shouldAddZealotry(card, polarity) && !newTypeTags.includes('Zealotry')) {
        newTypeTags.push('Zealotry');
    }
    
    // Update card
    card.Polarity = polarity;
    card.TypeTags = newTypeTags;
    
    // Update Instructions Tags
    if (card.Instructions && Array.isArray(card.Instructions)) {
        card.Instructions.forEach(instruction => {
            if (instruction.Tags && Array.isArray(instruction.Tags)) {
                instruction.Tags = instruction.Tags
                    .filter(tag => tag !== 'Light' && tag !== 'Shadow')
                    .map(renameTag);
            }
        });
    }
    
    // Check for AspectTag/Polarity mismatches
    const aspectTags = (card.AspectTags || []).map(t => t.toLowerCase());
    const hasShadowAspects = aspectTags.some(tag => SHADOW_INDICATORS.some(ind => tag.includes(ind)));
    const hasLightAspects = aspectTags.some(tag => LIGHT_INDICATORS.some(ind => tag.includes(ind)));
    
    let mismatchWarning = '';
    if (polarity === 'Light' && hasShadowAspects) {
        mismatchWarning = `⚠️ MISMATCH: Light Polarity but has Shadow AspectTags: ${aspectTags.filter(tag => SHADOW_INDICATORS.some(ind => tag.includes(ind))).join(', ')}`;
    } else if (polarity === 'Shadow' && hasLightAspects) {
        mismatchWarning = `⚠️ MISMATCH: Shadow Polarity but has Light AspectTags: ${aspectTags.filter(tag => LIGHT_INDICATORS.some(ind => tag.includes(ind))).join(', ')}`;
    }
    
    // Track statistics
    const entry = {
        id: card.id || 'NO-ID',
        name: card.CardName || 'NO-NAME',
        deck: card.Deck || 'NO-DECK',
        polarity,
        oldTypeTags: oldTypeTags.join(', ') || 'NONE',
        newTypeTags: newTypeTags.join(', ') || 'NONE',
        aspectTags: (card.AspectTags || []).join(', ') || 'NONE',
        reason,
        mismatch: mismatchWarning
    };
    
    if (mismatchWarning) {
        stats.dubious.push(entry);
    } else {
        stats[confidence].push(entry);
    }
    
    stats.totalCards++;
    
    return card;
}

function migrateQuestTemplate(template) {
    const oldTypeTags = [...(template.TypeTags || [])];
    
    // Determine Polarity for quest templates
    let polarity = 'Light';
    if (oldTypeTags.includes('Shadow')) {
        polarity = 'Shadow';
    }
    
    // Remove Light and Shadow from TypeTags
    let newTypeTags = oldTypeTags.filter(tag => tag !== 'Light' && tag !== 'Shadow');
    
    // Rename tags
    newTypeTags = newTypeTags.map(renameTag);
    
    // Update template
    template.Polarity = polarity;
    template.TypeTags = newTypeTags;
    
    // Update DrawInstructions tags and add polarity: null
    if (template.DrawInstructions && Array.isArray(template.DrawInstructions)) {
        template.DrawInstructions.forEach(instruction => {
            if (instruction.tags && Array.isArray(instruction.tags)) {
                instruction.tags = instruction.tags
                    .filter(tag => tag !== 'Light' && tag !== 'Shadow')
                    .map(renameTag);
            }
            // Add explicit polarity: null for any Polarity matching
            instruction.polarity = null;
        });
    }
    
    stats.totalCards++;
    stats.confident.push({
        id: template.id || 'NO-ID',
        name: template.CardName || 'NO-NAME',
        deck: template.Deck || 'Quest Template',
        polarity,
        oldTypeTags: oldTypeTags.join(', ') || 'NONE',
        newTypeTags: newTypeTags.join(', ') || 'NONE',
        aspectTags: (template.AspectTags || []).join(', ') || 'NONE',
        reason: 'Quest Template',
        mismatch: ''
    });
    
    return template;
}

function generateReport() {
    let report = '═══════════════════════════════════════════════════════════════\n';
    report += '              POLARITY MIGRATION VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    
    report += `Total Cards Migrated: ${stats.totalCards}\n\n`;
    
    // Confident
    report += `✓ CONFIDENT (${stats.confident.length} cards)\n`;
    report += '─'.repeat(63) + '\n';
    report += 'Cards with explicit Light/Shadow TypeTag assignments\n\n';
    
    // Iffy
    report += `\n⚠ IFFY (${stats.iffy.length} cards)\n`;
    report += '─'.repeat(63) + '\n';
    report += 'Cards inferred from context or single neutral tags\n\n';
    stats.iffy.forEach(entry => {
        report += `Card: ${entry.name} (${entry.deck})\n`;
        report += `  ID: ${entry.id}\n`;
        report += `  Assigned Polarity: ${entry.polarity}\n`;
        report += `  Old TypeTags: ${entry.oldTypeTags}\n`;
        report += `  New TypeTags: ${entry.newTypeTags}\n`;
        report += `  AspectTags: ${entry.aspectTags}\n`;
        report += `  Reason: ${entry.reason}\n\n`;
    });
    
    // Dubious
    report += `\n❌ DUBIOUS (${stats.dubious.length} cards) - REQUIRES MANUAL REVIEW\n`;
    report += '─'.repeat(63) + '\n';
    report += 'Cards with mismatches or no TypeTags\n\n';
    stats.dubious.forEach(entry => {
        report += `Card: ${entry.name} (${entry.deck})\n`;
        report += `  ID: ${entry.id}\n`;
        report += `  Assigned Polarity: ${entry.polarity}\n`;
        report += `  Old TypeTags: ${entry.oldTypeTags}\n`;
        report += `  New TypeTags: ${entry.newTypeTags}\n`;
        report += `  AspectTags: ${entry.aspectTags}\n`;
        report += `  Reason: ${entry.reason}\n`;
        if (entry.mismatch) {
            report += `  ${entry.mismatch}\n`;
        }
        report += `\n`;
    });
    
    report += '\n═══════════════════════════════════════════════════════════════\n';
    report += '                         END OF REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n';
    
    return report;
}

// Main migration
try {
    console.log('Starting Polarity migration...\n');
    
    const cardsPath = path.join(__dirname, 'cards.json');
    const data = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    
    // Migrate all decks
    for (const deckName in data) {
        if (Array.isArray(data[deckName])) {
            console.log(`Migrating deck: ${deckName}...`);
            data[deckName] = data[deckName].map(card => {
                if (deckName.toLowerCase().includes('quest')) {
                    return migrateQuestTemplate(card);
                } else {
                    return migrateCard(card);
                }
            });
        }
    }
    
    // Write migrated cards.json
    fs.writeFileSync(cardsPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✓ cards.json migrated successfully!\n');
    
    // Generate and write report
    const report = generateReport();
    fs.writeFileSync(path.join(__dirname, 'MIGRATION_REPORT.txt'), report, 'utf8');
    console.log('✓ MIGRATION_REPORT.txt generated!\n');
    
    // Console summary
    console.log('Migration Summary:');
    console.log(`  ✓ Confident: ${stats.confident.length} cards`);
    console.log(`  ⚠ Iffy: ${stats.iffy.length} cards`);
    console.log(`  ❌ Dubious: ${stats.dubious.length} cards (review MIGRATION_REPORT.txt)\n`);
    
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
