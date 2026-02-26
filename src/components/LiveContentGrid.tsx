import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, ExternalLink } from "lucide-react"
import { fetchRecentVideos } from "@/services/youtube"
import type { YouTubeVideo } from "@/services/youtube"

interface LiveContentGridProps {
    handles: string[]
}

// Fallback data in case API fails or has no key
const FALLBACK_VIDEOS: YouTubeVideo[] = [
    {
        id: "9GpNL7HS_qQ",
        title: "Sleep Token - Even in Arcadia (Album Reaction)",
        thumbnail: "https://img.youtube.com/vi/9GpNL7HS_qQ/maxresdefault.jpg",
        publishedAt: new Date().toISOString(),
        viewCount: "12500"
    },
    {
        id: "uQWPKNEUN_U",
        title: "The Midnight - Heroes (Lyric Video)",
        thumbnail: "https://img.youtube.com/vi/uQWPKNEUN_U/maxresdefault.jpg",
        publishedAt: new Date().toISOString(),
        viewCount: "8200"
    }
]

export function LiveContentGrid({ handles }: LiveContentGridProps) {
    const [videos, setVideos] = useState<YouTubeVideo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

        const loadVideos = async () => {
            // If no key, show nothing (or could show fallback)
            if (!apiKey) {
                if (mounted) {
                    setVideos(FALLBACK_VIDEOS)
                    setLoading(false)
                }
                return
            }

            try {
                const promises = handles.map(handle => fetchRecentVideos(handle, apiKey))
                const results = await Promise.all(promises)

                // Flatten array and sort by date (newest first)
                const allVideos = results.flat().sort((a, b) =>
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                )

                // Take top 4
                if (mounted) {
                    setVideos(allVideos.length > 0 ? allVideos.slice(0, 4) : FALLBACK_VIDEOS)
                    setLoading(false)
                }
            } catch (error) {
                console.error("Failed to fetch recent videos:", error)
                if (mounted) {
                    setVideos(FALLBACK_VIDEOS)
                    setLoading(false)
                }
            }
        }

        loadVideos()

        return () => { mounted = false }
    }, [handles])

    const formatViews = (views: string) => {
        const num = parseInt(views)
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num.toString()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
    }

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video, i) => (
                <motion.a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="video-card group relative rounded-2xl overflow-hidden bg-white/[0.02]"
                >
                    {/* Thumbnail Container */}
                    <div className="aspect-video w-full overflow-hidden relative">
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* Overlay on Hover */}
                        <div className="video-card-overlay absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center transform scale-50 group-hover:scale-100 transition-all duration-300">
                                <Play className="h-5 w-5 fill-current" />
                            </div>
                        </div>

                        {/* Duration / Status Badge (Simulated) */}
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono font-bold border border-white/10">
                            LATEST DROP
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] font-semibold text-white/50 uppercase tracking-wide">
                                {formatDate(video.publishedAt)}
                            </span>
                            <span className="text-[12px] font-mono text-white/50">
                                {formatViews(video.viewCount)} views
                            </span>
                        </div>

                        <h3 className="video-card-title line-clamp-2 min-h-[50px]">
                            {video.title}
                        </h3>

                        <div className="mt-4 flex items-center text-[13px] font-medium text-white/40 group-hover:text-white/70 transition-colors">
                            Watch on YouTube <ExternalLink className="h-3 w-3 ml-2" />
                        </div>
                    </div>
                </motion.a>
            ))}
        </div>
    )
}
