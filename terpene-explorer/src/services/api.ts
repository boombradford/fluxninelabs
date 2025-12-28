import type { Strain } from '../types';
import { STRAIN_SEED_DATA } from '../data/strains_seed';

// Configuration for potential API endpoints
// const API_BASE_URL = 'https://api.otreeba.com/v1'; // Example
// const API_KEY = import.meta.env.VITE_STRAIN_API_KEY;

/**
 * StrainService
 * 
 * Handles all interactions with strain data.
 * Currently uses a "Hybrid Architecture":
 * 1. Primary: Fast, local seed data for instant loading
 * 2. Secondary (Future): Fetch from API for broader results
 */
export const StrainService = {
    /**
     * Fetch all available strains
     * In a real app, this would be paginated
     */
    getAllStrains: async (): Promise<Strain[]> => {
        // Simulate network latency for realism if desired
        // await new Promise(resolve => setTimeout(resolve, 300));
        return STRAIN_SEED_DATA;
    },

    /**
     * Get a specific strain by its ID
     */
    getStrainById: async (id: string): Promise<Strain | undefined> => {
        return STRAIN_SEED_DATA.find(s => s.id === id);
    },

    /**
     * Find strains that contain a specific dominant terpene
     * This connects the "Terpene Universe" to the "Strain Explorer"
     */
    getStrainsByTerpene: async (terpeneId: string): Promise<Strain[]> => {
        return STRAIN_SEED_DATA.filter(strain =>
            strain.dominantTerpenes.some(t => t.terpeneId === terpeneId)
        ).sort((a, b) => {
            // Sort by percentage of that terpene (descending)
            const getPct = (s: Strain) => s.dominantTerpenes.find(t => t.terpeneId === terpeneId)?.percentage || 0;
            return getPct(b) - getPct(a);
        });
    },

    /**
     * Search strains by name, effect, or aroma
     */
    searchStrains: async (query: string): Promise<Strain[]> => {
        const lowerQuery = query.toLowerCase();
        return STRAIN_SEED_DATA.filter(strain =>
            strain.name.toLowerCase().includes(lowerQuery) ||
            strain.description.toLowerCase().includes(lowerQuery) ||
            strain.effects.some(e => e.toLowerCase().includes(lowerQuery)) ||
            strain.flavorProfile.some(f => f.toLowerCase().includes(lowerQuery))
        );
    }
};

/**
 * Service for fetching scientific research via PubMed API (E-utilities)
 * This adds the "Trust Layer" to our application
 */
export const ScienceService = {
    /**
     * Search PubMed for research articles related to a terpene + therapeutic property
     * Example: "Linalool anxiety"
     */
    fetchResearch: async (terpeneName: string, condition: string) => {
        try {
            const term = `${terpeneName} ${condition} therapeutic`;
            const encodedTerm = encodeURIComponent(term);
            const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedTerm}&retmode=json&retmax=3`;

            const response = await fetch(url);
            const data = await response.json();

            // Note: This returns IDs. A second call to 'esummary' is needed for titles/authors.
            // For V1, we just return the count and IDs to show "proof of concept"
            return {
                ids: data.esearchresult.idlist,
                count: data.esearchresult.count
            };
        } catch (error) {
            console.error('Failed to fetch research:', error);
            return { ids: [], count: 0 };
        }
    }
};
