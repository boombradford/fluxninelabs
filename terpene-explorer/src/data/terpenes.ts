import type { Terpene } from '../types';

// Sample terpene database - based on comprehensive cannabis terpene research
// You can replace this with your actual data tables later
export const TERPENES: Terpene[] = [
    {
        id: 'myrcene',
        name: 'Myrcene',
        scientificName: 'β-Myrcene',
        category: 'earthy',
        aromas: ['earthy', 'musky', 'clove'],
        effects: ['sedative', 'relaxation', 'muscle-relaxant', 'pain-relief'],
        boilingPoint: 334,
        description: 'The most abundant terpene in cannabis. Known for its sedative effects and earthy aroma.',
        therapeuticProperties: [
            'Anti-inflammatory',
            'Analgesic (pain relief)',
            'Muscle relaxant',
            'Sedative effects'
        ],
        synergyWith: ['linalool', 'caryophyllene'],
        prevalence: 10
    },
    {
        id: 'limonene',
        name: 'Limonene',
        scientificName: 'D-Limonene',
        category: 'citrus',
        aromas: ['citrus', 'sweet'],
        effects: ['mood-elevation', 'stress-relief', 'energizing', 'anti-anxiety'],
        boilingPoint: 348,
        description: 'Bright citrus terpene that elevates mood and reduces stress.',
        therapeuticProperties: [
            'Mood elevation',
            'Stress relief',
            'Anti-anxiety',
            'Antifungal properties'
        ],
        synergyWith: ['pinene', 'linalool'],
        prevalence: 8
    },
    {
        id: 'caryophyllene',
        name: 'Beta-Caryophyllene',
        scientificName: 'β-Caryophyllene',
        category: 'spicy',
        aromas: ['spicy', 'peppery', 'woody'],
        effects: ['pain-relief', 'anti-inflammatory', 'stress-relief'],
        boilingPoint: 320,
        description: 'Unique terpene that binds to CB2 receptors, offering anti-inflammatory benefits.',
        therapeuticProperties: [
            'CB2 receptor activation',
            'Anti-inflammatory',
            'Pain relief',
            'Gastroprotective'
        ],
        synergyWith: ['myrcene', 'humulene'],
        prevalence: 9
    },
    {
        id: 'pinene',
        name: 'Pinene (Alpha/Beta)',
        scientificName: 'α-Pinene / β-Pinene',
        category: 'herbal',
        aromas: ['pine', 'herbal'],
        effects: ['focus', 'anti-inflammatory', 'energizing'],
        boilingPoint: 311,
        description: 'Fresh pine aroma that promotes alertness and memory retention.',
        therapeuticProperties: [
            'Bronchodilator',
            'Memory retention',
            'Alertness',
            'Anti-inflammatory'
        ],
        synergyWith: ['limonene'],
        prevalence: 7
    },
    {
        id: 'linalool',
        name: 'Linalool',
        scientificName: 'Linalool',
        category: 'floral',
        aromas: ['floral', 'sweet'],
        effects: ['relaxation', 'anti-anxiety', 'sleep-aid', 'mood-elevation'],
        boilingPoint: 388,
        description: 'Calming lavender-scented terpene with powerful anxiolytic properties.',
        therapeuticProperties: [
            'Anti-anxiety',
            'Sedative',
            'Mood stabilization',
            'Pain relief'
        ],
        synergyWith: ['myrcene', 'limonene'],
        prevalence: 6
    },
    {
        id: 'humulene',
        name: 'Humulene',
        scientificName: 'α-Humulene',
        category: 'herbal',
        aromas: ['earthy', 'woody', 'hoppy'],
        effects: ['appetite-stimulant', 'anti-inflammatory'],
        boilingPoint: 388,
        description: 'Earthy, hoppy terpene found in hops and cannabis.',
        therapeuticProperties: [
            'Appetite suppression',
            'Anti-inflammatory',
            'Antibacterial'
        ],
        synergyWith: ['caryophyllene'],
        prevalence: 5
    },
    {
        id: 'terpinolene',
        name: 'Terpinolene',
        scientificName: 'Terpinolene',
        category: 'herbal',
        aromas: ['herbal', 'floral', 'pine'],
        effects: ['sedative', 'relaxation'],
        boilingPoint: 366,
        description: 'Complex aroma profile with sedative and antioxidant properties.',
        therapeuticProperties: [
            'Antioxidant',
            'Sedative',
            'Antibacterial'
        ],
        synergyWith: [],
        prevalence: 4
    },
    {
        id: 'ocimene',
        name: 'Ocimene',
        scientificName: 'Ocimene',
        category: 'herbal',
        aromas: ['sweet', 'herbal', 'woody'],
        effects: ['anti-inflammatory', 'energizing'],
        boilingPoint: 212,
        description: 'Sweet, herbaceous terpene with uplifting properties.',
        therapeuticProperties: [
            'Antiviral',
            'Antifungal',
            'Decongestant'
        ],
        synergyWith: [],
        prevalence: 3
    },
    {
        id: 'bisabolol',
        name: 'Alpha-Bisabolol',
        scientificName: 'α-Bisabolol',
        category: 'floral',
        aromas: ['floral', 'sweet'],
        effects: ['anti-inflammatory', 'anti-anxiety'],
        boilingPoint: 307,
        description: 'Gentle chamomile-scented terpene with soothing properties.',
        therapeuticProperties: [
            'Anti-inflammatory',
            'Antimicrobial',
            'Skin healing'
        ],
        synergyWith: ['linalool'],
        prevalence: 3
    },
    {
        id: 'eucalyptol',
        name: 'Eucalyptol',
        scientificName: '1,8-Cineole',
        category: 'herbal',
        aromas: ['herbal', 'spicy'],
        effects: ['focus', 'pain-relief'],
        boilingPoint: 349,
        description: 'Minty, cooling terpene found in eucalyptus and cannabis.',
        therapeuticProperties: [
            'Cognitive enhancement',
            'Anti-inflammatory',
            'Pain relief'
        ],
        synergyWith: [],
        prevalence: 2
    },
    {
        id: 'nerolidol',
        name: 'Nerolidol',
        scientificName: 'Nerolidol',
        category: 'floral',
        aromas: ['floral', 'woody'],
        effects: ['sedative', 'relaxation', 'anti-anxiety'],
        boilingPoint: 252,
        description: 'Woody, floral terpene with sedative and antimicrobial properties.',
        therapeuticProperties: [
            'Sedative',
            'Antimicrobial',
            'Antifungal'
        ],
        synergyWith: ['linalool'],
        prevalence: 2
    },
    {
        id: 'borneol',
        name: 'Borneol',
        scientificName: 'Borneol',
        category: 'herbal',
        aromas: ['herbal', 'spicy'],
        effects: ['sedative', 'pain-relief'],
        boilingPoint: 412,
        description: 'Cooling, camphor-like terpene with analgesic properties.',
        therapeuticProperties: [
            'Analgesic',
            'Sedative',
            'Anti-inflammatory'
        ],
        synergyWith: [],
        prevalence: 2
    },
    {
        id: 'carene',
        name: 'Delta-3-Carene',
        scientificName: 'Δ-3-Carene',
        category: 'herbal',
        aromas: ['earthy', 'sweet', 'pine'],
        effects: ['anti-inflammatory'],
        boilingPoint: 334,
        description: 'Sweet, earthy terpene that may help with bone health.',
        therapeuticProperties: [
            'Bone health',
            'Anti-inflammatory'
        ],
        synergyWith: [],
        prevalence: 2
    },
    {
        id: 'geraniol',
        name: 'Geraniol',
        scientificName: 'Geraniol',
        category: 'floral',
        aromas: ['floral', 'sweet'],
        effects: ['mood-elevation', 'relaxation'],
        boilingPoint: 446,
        description: 'Rose-scented terpene with neuroprotective properties.',
        therapeuticProperties: [
            'Neuroprotective',
            'Antioxidant',
            'Antibacterial'
        ],
        synergyWith: ['linalool'],
        prevalence: 2
    },
    {
        id: 'farnesene',
        name: 'Beta-Farnesene',
        scientificName: 'β-Farnesene',
        category: 'herbal',
        aromas: ['herbal', 'woody', 'earthy'],
        effects: ['relaxation', 'anti-inflammatory'],
        boilingPoint: 257,
        description: 'Subtle, calming terpene with anti-inflammatory benefits.',
        therapeuticProperties: [
            'Anti-inflammatory',
            'Muscle relaxant'
        ],
        synergyWith: [],
        prevalence: 1
    }
];

// Helper functions
export const getTerpeneById = (id: string): Terpene | undefined => {
    return TERPENES.find(t => t.id === id);
};

export const getTerpenesByCategory = (category: string): Terpene[] => {
    return TERPENES.filter(t => t.category === category);
};

export const getTerpenesByEffect = (effect: string): Terpene[] => {
    return TERPENES.filter(t => t.effects.includes(effect as any));
};
