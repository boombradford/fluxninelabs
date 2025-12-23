// Historical analytics data fetching



export interface HistoricalDataPoint {
    date: string;
    views: number;
    likes?: number;
    comments?: number;
    ctr?: number;
    subscribersGained?: number;
}

/**
 * Fetch historical analytics data for a date range
 */
export const fetchHistoricalData = async (
    channelId: string,
    accessToken: string,
    startDate: string,
    endDate: string
): Promise<HistoricalDataPoint[]> => {
    try {
        const params = new URLSearchParams({
            ids: `channel==${channelId}`,
            startDate,
            endDate,
            metrics: 'views,likes,comments,subscribersGained',
            dimensions: 'day',
            sort: 'day'
        });

        const response = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error('[Historical Data] Error:', data.error);
            return [];
        }

        // Transform API response to our format
        if (data.rows && data.rows.length > 0) {
            return data.rows.map((row: any[]) => ({
                date: row[0], // day
                views: row[1] || 0,
                likes: row[2] || 0,
                comments: row[3] || 0,
                subscribersGained: row[4] || 0
            }));
        }

        return [];
    } catch (error) {
        console.error('[Historical Data] Error fetching:', error);
        return [];
    }
};

/**
 * Generate mock historical data for testing (when not authenticated)
 */
export const generateMockHistoricalData = (days: number = 30): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate realistic-looking data with some variance
        const baseViews = 5000 + Math.random() * 3000;
        const trend = Math.sin(i / 7) * 1000; // Weekly pattern
        const views = Math.floor(baseViews + trend);

        data.push({
            date: date.toISOString().split('T')[0],
            views,
            likes: Math.floor(views * (0.02 + Math.random() * 0.01)),
            comments: Math.floor(views * (0.005 + Math.random() * 0.003)),
            ctr: 0.04 + Math.random() * 0.02,
            subscribersGained: Math.floor(Math.random() * 50)
        });
    }

    return data;
};

/**
 * Calculate date range for historical data
 */
export const getDateRange = (days: number): { startDate: string; endDate: string } => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

/**
 * Aggregate data by week
 */
export const aggregateByWeek = (data: HistoricalDataPoint[]): HistoricalDataPoint[] => {
    const weeks: { [key: string]: HistoricalDataPoint } = {};

    data.forEach(point => {
        const date = new Date(point.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                date: weekKey,
                views: 0,
                likes: 0,
                comments: 0,
                subscribersGained: 0
            };
        }

        weeks[weekKey].views += point.views;
        weeks[weekKey].likes = (weeks[weekKey].likes || 0) + (point.likes || 0);
        weeks[weekKey].comments = (weeks[weekKey].comments || 0) + (point.comments || 0);
        weeks[weekKey].subscribersGained = (weeks[weekKey].subscribersGained || 0) + (point.subscribersGained || 0);
    });

    return Object.values(weeks).sort((a, b) => a.date.localeCompare(b.date));
};
