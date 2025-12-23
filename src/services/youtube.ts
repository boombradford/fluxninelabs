

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface ChannelStats {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
}

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: string;
}

export const fetchChannelStats = async (channelHandle: string, apiKey: string): Promise<ChannelStats | null> => {
    try {
        console.log('[YouTube API] Fetching channel stats for:', channelHandle);

        // 1. Get Channel ID from Handle
        const searchUrl = `${BASE_URL}/search?part=snippet&type=channel&q=${channelHandle}&key=${apiKey}`;
        console.log('[YouTube API] Search URL:', searchUrl);
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        console.log('[YouTube API] Search response:', searchData);

        if (searchData.error) {
            console.error('[YouTube API] Error:', searchData.error);
            return null;
        }

        if (!searchData.items?.[0]?.id?.channelId) {
            console.warn('[YouTube API] No channel found');
            return null;
        }
        const channelId = searchData.items[0].id.channelId;
        console.log('[YouTube API] Found channel ID:', channelId);

        // 2. Get Channel Stats
        const statsUrl = `${BASE_URL}/channels?part=statistics&id=${channelId}&key=${apiKey}`;
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();
        console.log('[YouTube API] Stats response:', statsData);

        return statsData.items?.[0]?.statistics || null;
    } catch (error) {
        console.error("[YouTube API] Error fetching channel stats:", error);
        return null;
    }
};

export const fetchRecentVideos = async (channelHandle: string, apiKey: string): Promise<YouTubeVideo[]> => {
    try {
        // 1. Get Channel ID (Duplicate logic, could be optimized but keeping simple for now)
        const searchUrl = `${BASE_URL}/search?part=snippet&type=channel&q=${channelHandle}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.items?.[0]?.id?.channelId) return [];
        const channelId = searchData.items[0].id.channelId;

        // 2. Get Recent Videos (Uploads Playlist)
        // First get the "uploads" playlist ID
        const channelUrl = `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();
        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) return [];

        // 3. Get Videos from Playlist
        const playlistUrl = `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=5&key=${apiKey}`;
        const playlistRes = await fetch(playlistUrl);
        const playlistData = await playlistRes.json();

        // 4. Get Video Stats (View Counts)
        const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
        const videosUrl = `${BASE_URL}/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
        const videosRes = await fetch(videosUrl);
        const videosData = await videosRes.json();

        return videosData.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            viewCount: item.statistics.viewCount
        }));

    } catch (error) {
        console.error("[YouTube API] Error fetching recent videos:", error);
        return [];
    }
};

export interface VideoDetails {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    duration: string;
    tags: string[];
}

export const fetchVideoDetails = async (videoId: string, apiKey: string): Promise<VideoDetails | null> => {
    try {
        console.log('[YouTube API] Fetching video details for:', videoId);

        // Use only snippet and statistics parts (publicly accessible)
        const videoUrl = `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
        const videoRes = await fetch(videoUrl);
        const videoData = await videoRes.json();
        console.log('[YouTube API] Video details response:', videoData);

        if (videoData.error) {
            console.error('[YouTube API] Error:', videoData.error);
            return null;
        }

        if (!videoData.items || videoData.items.length === 0) {
            console.warn('[YouTube API] No video found');
            return null;
        }

        const video = videoData.items[0];

        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
            publishedAt: video.snippet.publishedAt,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount || '0',
            commentCount: video.statistics.commentCount || '0',
            duration: 'PT0S', // Duration requires contentDetails permission
            tags: video.snippet.tags || [],
        };
    } catch (error) {
        console.error("[YouTube API] Error fetching video details:", error);
        return null;
    }
};
