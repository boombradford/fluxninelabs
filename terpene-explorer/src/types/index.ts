// Terpene category for color coding
export type TerpeneCategory = 'citrus' | 'herbal' | 'floral' | 'earthy' | 'spicy';

// Effects that terpenes can provide
export type Effect =
    | 'sedative'
    | 'energizing'
    | 'focus'
    | 'relaxation'
    | 'anti-inflammatory'
    | 'pain-relief'
    | 'anti-anxiety'
    | 'mood-elevation'
    | 'stress-relief'
    | 'creativity'
    | 'appetite-stimulant'
    | 'sleep-aid'
    | 'muscle-relaxant';

// Aroma descriptors
export type Aroma =
    | 'citrus'
    | 'pine'
    | 'earthy'
    | 'floral'
    | 'spicy'
    | 'herbal'
    | 'musky'
    | 'woody'
    | 'sweet'
    | 'peppery'
    | 'hoppy'
    | 'clove'
    | 'diesel'
    | 'berry'
    | 'orange'
    | 'skunk'
    | 'chemical';

// Individual terpene data structure
export interface Terpene {
    id: string;
    name: string;
    scientificName: string;
    category: TerpeneCategory;
    aromas: Aroma[];
    effects: Effect[];
    boilingPoint: number; // Fahrenheit
    description: string;
    therapeuticProperties: string[];
    synergyWith?: string[]; // IDs of other terpenes that pair well (entourage effect)
    prevalence: number; // 1-10 scale for sizing nodes in visualization
}

// Strain data structure
export interface Strain {
    id: string;
    name: string;
    type: 'indica' | 'sativa' | 'hybrid';
    description: string;
    dominantTerpenes: {
        terpeneId: string;
        percentage: number;
    }[];
    effects: Effect[];
    flavorProfile: Aroma[];
}

// For the suggestion engine
export interface UserPreference {
    desiredEffects: Effect[];
    avoidEffects?: Effect[];
    preferredAromas?: Aroma[];
}

// Suggestion result
export interface TerpeneRecommendation {
    recommendedTerpenes: {
        terpene: Terpene;
        relevanceScore: number; // 0-100
    }[];
    matchingStrains: {
        strain: Strain;
        matchScore: number; // 0-100
    }[];
}
