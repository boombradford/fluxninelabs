import { useState, useEffect } from "react"
import { fetchChannelStats } from "@/services/youtube"

interface YouTubeStatsProps {
    handles: string[]
    fallback: string
}

export function YouTubeStats({ handles, fallback }: YouTubeStatsProps) {
    const [stats, setStats] = useState<{ totalViews: number | null, loading: boolean }>({
        totalViews: null,
        loading: true
    })

    useEffect(() => {
        let mounted = true
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

        const loadStats = async () => {
            // Debug log
            console.log('[YouTubeStats] Key available:', !!apiKey, 'Key start:', apiKey?.substring(0, 5))

            if (!apiKey) {
                if (mounted) setStats({ totalViews: null, loading: false })
                return
            }

            try {
                const promises = handles.map(handle => fetchChannelStats(handle, apiKey))
                const results = await Promise.all(promises)

                let totalViews = 0
                let hasData = false

                results.forEach(channel => {
                    if (channel) {
                        totalViews += parseInt(channel.viewCount || '0', 10)
                        hasData = true
                    }
                })

                if (mounted) {
                    // If we got ANY data, show it. Otherwise use fallback.
                    setStats({ totalViews: hasData ? totalViews : null, loading: false })
                }
            } catch (error) {
                console.error("Failed to fetch YouTube stats:", error)
                if (mounted) setStats({ totalViews: null, loading: false })
            }
        }

        loadStats()

        return () => { mounted = false }
    }, [handles])

    if (stats.loading) {
        // While loading, show fallback with a subtle pulse to indicate activity
        return <span className="animate-pulse">{fallback}</span>
    }

    if (stats.totalViews !== null) {
        // Format: 3.6M -> 3,642,102+
        return (
            <span className="tabular-nums whitespace-nowrap">
                {stats.totalViews.toLocaleString('en-US')}+
            </span>
        )
    }

    // Graceful fallback
    return <span>{fallback}</span>
}
