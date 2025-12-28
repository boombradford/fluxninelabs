import { LRUCache } from 'lru-cache';

// Simple in-memory cache to share data between "Fast Phase" and "Deep Phase"
// This avoids fetching the HTML twice for the same URL.
const cache = new LRUCache<string, any>({
    max: 100, // Keep last 100 scans (plenty for transient use)
    ttl: 1000 * 60 * 5, // 5 minutes TTL
});

export const getCachedData = (key: string) => {
    return cache.get(key);
};

export const setCachedData = (key: string, data: any) => {
    cache.set(key, data);
};

export const generateCacheKey = (url: string) => {
    // Simple key: URL + Date (minute precision to allow re-scans but cache short term bursts)
    // Actually simpler: Just URL. We rely on the 5min TTL to expire it.
    // This means if a user hits "Deep Scan" immediately after "Fast Scan", they hit cache.
    return `flux_scan_${url.trim()}`;
};
