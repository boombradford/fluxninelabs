// Helper to get CTR for recent videos
import { fetchVideoAnalytics } from './oauth';

export const getVideoCTR = async (videoId: string, accessToken: string): Promise<number | null> => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analytics = await fetchVideoAnalytics(videoId, accessToken, startDate, endDate);

    if (!analytics || !analytics.rows || analytics.rows.length === 0) {
        return null;
    }

    // CTR is usually the last metric in the response
    const ctrIndex = analytics.columnHeaders?.findIndex((h: any) => h.name === 'ctr');
    if (ctrIndex === -1) return null;

    const ctr = analytics.rows[0][ctrIndex];
    return ctr ? parseFloat(ctr) : null;
};
