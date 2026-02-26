import React from 'react';
import { motion } from 'framer-motion';
import { LuTrendingUp, LuTrendingDown, LuEye, LuThumbsUp, LuUsers, LuTarget } from 'react-icons/lu';
import { formatNumber } from '../utils/analytics';

interface PerformanceOverviewProps {
    channelHealth: number;
    totalViews: number;
    avgCTR: number;
    avgEngagement: number;
    subscriberGrowth: number;
    viewsTrend: number;
    ctrTrend: number;
    engagementTrend: number;
    subsTrend: number;
}

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
    channelHealth,
    totalViews,
    avgCTR,
    avgEngagement,
    subscriberGrowth,
    viewsTrend,
    ctrTrend,
    engagementTrend,
    subsTrend
}) => {
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-blue-500 to-cyan-500';
        if (score >= 40) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };

    const TrendIndicator = ({ value }: { value: number }) => {
        const isPositive = value > 0;
        return (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <LuTrendingUp size={14} /> : <LuTrendingDown size={14} />}
                <span>{Math.abs(value).toFixed(1)}%</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Channel Health Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-purple-500/5 to-blue-500/5" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Channel Health Score</h3>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-5xl font-bold bg-gradient-to-r ${getHealthColor(channelHealth)} bg-clip-text text-transparent`}>
                                {channelHealth}
                            </span>
                            <span className="text-slate-400 text-lg">/100</span>
                        </div>
                    </div>
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getHealthColor(channelHealth)} opacity-20`} />
                </div>
                <p className="text-slate-400 text-xs mt-3">
                    {channelHealth >= 80 && "Excellent! Your channel is performing very well."}
                    {channelHealth >= 60 && channelHealth < 80 && "Good performance with room for improvement."}
                    {channelHealth >= 40 && channelHealth < 60 && "Average performance. Focus on engagement."}
                    {channelHealth < 40 && "Needs attention. Review your content strategy."}
                </p>
            </motion.div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Views */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <LuEye size={20} className="text-blue-400" />
                        </div>
                        <TrendIndicator value={viewsTrend} />
                    </div>
                    <div className="text-slate-400 text-xs mb-1">Total Views</div>
                    <div className="text-white text-2xl font-bold">{formatNumber(totalViews)}</div>
                </motion.div>

                {/* Average CTR */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <LuTarget size={20} className="text-green-400" />
                        </div>
                        <TrendIndicator value={ctrTrend} />
                    </div>
                    <div className="text-slate-400 text-xs mb-1">Average CTR</div>
                    <div className="text-white text-2xl font-bold">{(avgCTR * 100).toFixed(2)}%</div>
                </motion.div>

                {/* Engagement Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <LuThumbsUp size={20} className="text-purple-400" />
                        </div>
                        <TrendIndicator value={engagementTrend} />
                    </div>
                    <div className="text-slate-400 text-xs mb-1">Engagement Rate</div>
                    <div className="text-white text-2xl font-bold">{(avgEngagement * 100).toFixed(2)}%</div>
                </motion.div>

                {/* Subscriber Growth */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <LuUsers size={20} className="text-red-400" />
                        </div>
                        <TrendIndicator value={subsTrend} />
                    </div>
                    <div className="text-slate-400 text-xs mb-1">Subscriber Growth</div>
                    <div className="text-white text-2xl font-bold">+{formatNumber(subscriberGrowth)}</div>
                </motion.div>
            </div>
        </div>
    );
};
