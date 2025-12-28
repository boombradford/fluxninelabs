import type { Strain } from '../types';

// A realistic seed database of popular strains with scientifically accurate terpene profiles
// This acts as our "Local Cache" before we connect to a live API
export const STRAIN_SEED_DATA: Strain[] = [
    {
        id: 'blue-dream',
        name: 'Blue Dream',
        type: 'hybrid',
        description: 'A legendary sativa-dominant hybrid originating in California. Balances full-body relaxation with gentle cerebral invigoration.',
        dominantTerpenes: [
            { terpeneId: 'myrcene', percentage: 0.8 },
            { terpeneId: 'pinene', percentage: 0.5 },
            { terpeneId: 'caryophyllene', percentage: 0.4 }
        ],
        effects: ['creativity', 'energizing', 'mood-elevation'],
        flavorProfile: ['sweet', 'berry', 'herbal']
    },
    {
        id: 'og-kush',
        name: 'OG Kush',
        type: 'hybrid',
        description: 'The genetic backbone of West Coast cannabis varieties. Known for its distinct earthy pine scent and crushing stress-relief effects.',
        dominantTerpenes: [
            { terpeneId: 'myrcene', percentage: 1.1 },
            { terpeneId: 'limonene', percentage: 0.7 },
            { terpeneId: 'caryophyllene', percentage: 0.6 }
        ],
        effects: ['stress-relief', 'relaxation', 'appetite-stimulant'],
        flavorProfile: ['earthy', 'pine', 'woody']
    },
    {
        id: 'granddaddy-purple',
        name: 'Granddaddy Purple',
        type: 'indica',
        description: 'Famous indica cross of Purple Urkle and Big Bud. Delivers a fusion of cerebral euphoria and deep physical relaxation.',
        dominantTerpenes: [
            { terpeneId: 'myrcene', percentage: 1.4 },
            { terpeneId: 'caryophyllene', percentage: 0.5 },
            { terpeneId: 'linalool', percentage: 0.4 }
        ],
        effects: ['sleep-aid', 'muscle-relaxant', 'pain-relief'],
        flavorProfile: ['sweet', 'berry', 'floral']
    },
    {
        id: 'jack-herer',
        name: 'Jack Herer',
        type: 'sativa',
        description: 'Named after the cannabis activist, this spicy, pine-scented strain has captured numerous awards for its quality and potency.',
        dominantTerpenes: [
            { terpeneId: 'terpinolene', percentage: 0.9 },
            { terpeneId: 'caryophyllene', percentage: 0.4 },
            { terpeneId: 'pinene', percentage: 0.3 }
        ],
        effects: ['energizing', 'creativity', 'focus'],
        flavorProfile: ['pine', 'spicy', 'herbal']
    },
    {
        id: 'sour-diesel',
        name: 'Sour Diesel',
        type: 'sativa',
        description: 'Invigorating sativa named for its pungent, diesel-like aroma. Excellent for combating stress and depression.',
        dominantTerpenes: [
            { terpeneId: 'caryophyllene', percentage: 0.6 },
            { terpeneId: 'myrcene', percentage: 0.5 },
            { terpeneId: 'limonene', percentage: 0.5 }
        ],
        effects: ['energizing', 'stress-relief', 'mood-elevation'],
        flavorProfile: ['diesel', 'earthy', 'citrus']
    },
    {
        id: 'girl-scout-cookies',
        name: 'GSC (Girl Scout Cookies)',
        type: 'hybrid',
        description: 'GSC produces euphoric effects followed by full-body relaxation. One of the most popular strains globally.',
        dominantTerpenes: [
            { terpeneId: 'caryophyllene', percentage: 0.9 },
            { terpeneId: 'limonene', percentage: 0.6 },
            { terpeneId: 'humulene', percentage: 0.4 }
        ],
        effects: ['relaxation', 'mood-elevation', 'pain-relief'],
        flavorProfile: ['sweet', 'earthy', 'spicy']
    },
    {
        id: 'tangie',
        name: 'Tangie',
        type: 'sativa',
        description: 'A tribute to Tangerine Dream. Famous for its refreshing tangerine aroma and uplifting effects.',
        dominantTerpenes: [
            { terpeneId: 'myrcene', percentage: 0.4 },
            { terpeneId: 'pinene', percentage: 0.2 },
            { terpeneId: 'limonene', percentage: 0.1 }
        ],
        effects: ['energizing', 'creativity', 'mood-elevation'],
        flavorProfile: ['citrus', 'sweet', 'orange']
    },
    {
        id: 'northern-lights',
        name: 'Northern Lights',
        type: 'indica',
        description: 'One of the most famous strains of all time, a pure indica known for its resinous buds and fast flowering.',
        dominantTerpenes: [
            { terpeneId: 'myrcene', percentage: 0.9 },
            { terpeneId: 'caryophyllene', percentage: 0.3 },
            { terpeneId: 'pinene', percentage: 0.2 }
        ],
        effects: ['sleep-aid', 'muscle-relaxant', 'stress-relief'],
        flavorProfile: ['earthy', 'pine', 'sweet']
    }
];
