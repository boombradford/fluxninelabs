// Performance scoring and analytics utilities

export type PerformanceGrade = 'A' | 'B' | 'C' | 'D';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface VideoAnalytics {
    videoId: string;
    views: number;
    ctr: number;
    engagementRate: number;
    avgViewDuration: number;
    likes: number;
    comments: number;
    publishedAt: string;
}

export interface ChannelMetrics {
    avgViews: number;
    avgCTR: number;
    avgEngagement: number;
    avgViewDuration: number;
}

export interface VideoPerformance {
    video: VideoAnalytics;
    grade: PerformanceGrade;
    trend: TrendDirection;
    score: number;
}

/**
 * Calculate performance grade based on video metrics vs channel average
 */
export function calculateGrade(
    video: VideoAnalytics,
    channelAverage: ChannelMetrics
): PerformanceGrade {
    const scores = {
        ctr: channelAverage.avgCTR > 0 ? video.ctr / channelAverage.avgCTR : 1,
        engagement: channelAverage.avgEngagement > 0 ? video.engagementRate / channelAverage.avgEngagement : 1,
        views: channelAverage.avgViews > 0 ? video.views / channelAverage.avgViews : 1,
        watchTime: channelAverage.avgViewDuration > 0 ? video.avgViewDuration / channelAverage.avgViewDuration : 1
    };

    // Weighted average: CTR and engagement are most important
    const totalScore = (
        scores.ctr * 0.35 +
        scores.engagement * 0.35 +
        scores.views * 0.15 +
        scores.watchTime * 0.15
    );

    if (totalScore >= 1.2) return 'A'; // 20% above average
    if (totalScore >= 0.9) return 'B'; // Within 10% of average
    if (totalScore >= 0.7) return 'C'; // 30% below average
    return 'D'; // More than 30% below average
}

/**
 * Calculate trend direction compared to channel average
 */
export function calculateTrend(
    videoScore: number,
    channelAverage: number
): TrendDirection {
    const diff = videoScore - channelAverage;
    const threshold = channelAverage * 0.1; // 10% threshold

    if (diff > threshold) return 'up';
    if (diff < -threshold) return 'down';
    return 'stable';
}

/**
 * Calculate channel health score (0-100)
 */
export function calculateChannelHealth(metrics: ChannelMetrics): number {
    // Benchmark against typical YouTube metrics
    const benchmarks = {
        ctr: 0.05, // 5% is good
        engagement: 0.03, // 3% is good
        viewDuration: 300 // 5 minutes is good
    };

    const scores = {
        ctr: Math.min((metrics.avgCTR / benchmarks.ctr) * 100, 100),
        engagement: Math.min((metrics.avgEngagement / benchmarks.engagement) * 100, 100),
        duration: Math.min((metrics.avgViewDuration / benchmarks.viewDuration) * 100, 100)
    };

    return Math.round((scores.ctr + scores.engagement + scores.duration) / 3);
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Format duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get grade color for styling
 */
export function getGradeColor(grade: PerformanceGrade): string {
    switch (grade) {
        case 'A': return 'from-green-500 to-emerald-500';
        case 'B': return 'from-blue-500 to-cyan-500';
        case 'C': return 'from-yellow-500 to-orange-500';
        case 'D': return 'from-red-500 to-pink-500';
    }
}

/**
 * Get trend icon and color
 */
export function getTrendStyle(trend: TrendDirection): { icon: string; color: string } {
    switch (trend) {
        case 'up': return { icon: '↑', color: 'text-green-400' };
        case 'down': return { icon: '↓', color: 'text-red-400' };
        case 'stable': return { icon: '→', color: 'text-slate-400' };
    }
}
