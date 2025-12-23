import React from 'react';
import { motion } from 'framer-motion';
import { LuX, LuEye, LuThumbsUp, LuMessageSquare, LuExternalLink, LuCopy, LuCalendar, LuClock, LuTag } from 'react-icons/lu';
import type { VideoDetails } from '../services/youtube';

interface VideoDetailViewProps {
    video: VideoDetails;
    onClose: () => void;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({ video, onClose }) => {
    const copyLink = () => {
        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1c] rounded-3xl border border-white/10 shadow-2xl custom-scrollbar"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#1a1a1c]/95 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{video.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <LuCalendar size={14} />
                                {new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                                <LuClock size={14} />
                                {video.duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <LuX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Thumbnail & Player Placeholder */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
                        <img
                            src={video.thumbnail.replace('mqdefault', 'maxresdefault')}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a
                                href={`https://www.youtube.com/watch?v=${video.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300"
                            >
                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
                            </a>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <LuEye size={18} />
                                <span>Views</span>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">
                                {parseInt(video.viewCount).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <LuThumbsUp size={18} />
                                <span>Likes</span>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">
                                {parseInt(video.likeCount).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <LuMessageSquare size={18} />
                                <span>Comments</span>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">
                                {parseInt(video.commentCount).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            Description
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                            {video.description}
                        </p>
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <LuTag size={18} /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {video.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-default">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                        >
                            <LuExternalLink size={20} />
                            Open in YouTube
                        </a>
                        <button
                            onClick={copyLink}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <LuCopy size={20} />
                            Copy Link
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
