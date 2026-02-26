import { LRUCache } from 'lru-cache';

// Simple in-memory cache to share data between "Fast Phase" and "Deep Phase"
// This avoids fetching the HTML twice for the same URL.
// OPTIMIZATION: Increased TTL to 1 hour - most sites don't change that frequently
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
    max: 100, // Keep last 100 scans (plenty for transient use)
    ttl: 1000 * 60 * 60, // 1 hour TTL (was 5 min) - much faster repeat audits
});

export const getCachedData = (key: string) => {
    return cache.get(key);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setCachedData = (key: string, data: any) => {
    cache.set(key, data);
};

export const generateCacheKey = (url: string) => {
    // Simple key: URL + Date (minute precision to allow re-scans but cache short term bursts)
    // Actually simpler: Just URL. We rely on the 5min TTL to expire it.
    // This means if a user hits "Deep Scan" immediately after "Fast Scan", they hit cache.
    return `flux_scan_${url.trim()}`;
};
