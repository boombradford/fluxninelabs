import React from 'react';
import { motion } from 'framer-motion';
import { LuEye as Eye, LuThumbsUp as ThumbsUp, LuMessageSquare as MessageSquare, LuExternalLink as ExternalLink, LuCopy as Copy } from 'react-icons/lu';
import type { VideoAnalytics, PerformanceGrade, TrendDirection } from '../utils/analytics';
import { formatNumber, getGradeColor, getTrendStyle } from '../utils/analytics';

interface VideoPerformanceCardProps {
    video: {
        id: string;
        title: string;
        thumbnail: string;
        publishedAt: string;
    };
    analytics: VideoAnalytics;
    grade: PerformanceGrade;
    trend: TrendDirection;
    onClick?: () => void;
}

export const VideoPerformanceCard: React.FC<VideoPerformanceCardProps> = ({
    video,
    analytics,
    grade,
    trend,
    onClick
}) => {
    const trendStyle = getTrendStyle(trend);
    const gradeColor = getGradeColor(grade);

    const copyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/20"
        >
            {/* Grade Badge */}
            <div className={`absolute top-3 right-3 z-10 w-12 h-12 rounded-full bg-gradient-to-br ${gradeColor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {grade}
            </div>

            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3 className="text-white font-bold text-sm line-clamp-2 mb-3 group-hover:text-red-400 transition-colors">
                    {video.title}
                </h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                            <Eye size={10} />
                            <span>Views</span>
                        </div>
                        <div className="text-white text-sm font-bold">{formatNumber(analytics.views)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                            <ThumbsUp size={10} />
                            <span>Likes</span>
                        </div>
                        <div className="text-white text-sm font-bold">{formatNumber(analytics.likes)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                            <MessageSquare size={10} />
                            <span>Comments</span>
                        </div>
                        <div className="text-white text-sm font-bold">{formatNumber(analytics.comments)}</div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {analytics.ctr > 0 && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1">
                                <span className="text-green-400 text-xs font-medium">{(analytics.ctr * 100).toFixed(1)}% CTR</span>
                            </div>
                        )}
                        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-2 py-1">
                            <span className="text-purple-400 text-xs font-medium">{(analytics.engagementRate * 100).toFixed(1)}% Eng</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 ${trendStyle.color} text-sm font-bold`}>
                        <span>{trendStyle.icon}</span>
                        <span className="text-xs">Trend</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        <ExternalLink size={12} />
                        <span>View</span>
                    </a>
                    <button
                        onClick={copyLink}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-colors"
                    >
                        <Copy size={12} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
