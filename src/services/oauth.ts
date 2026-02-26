// OAuth 2.0 Configuration and Service for YouTube Analytics

const OAUTH_CONFIG = {
    clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    clientSecret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/oauth/callback`,
    scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly'
    ]
};

export interface OAuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

// Generate OAuth authorization URL
export const getAuthUrl = (): string => {
    const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        response_type: 'code',
        scope: OAUTH_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<OAuthTokens | null> => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: OAUTH_CONFIG.clientId,
                client_secret: OAUTH_CONFIG.clientSecret,
                redirect_uri: OAUTH_CONFIG.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('[OAuth] Token exchange error:', data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[OAuth] Error exchanging code for tokens:', error);
        return null;
    }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<OAuthTokens | null> => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: OAUTH_CONFIG.clientId,
                client_secret: OAUTH_CONFIG.clientSecret,
                grant_type: 'refresh_token'
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('[OAuth] Token refresh error:', data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[OAuth] Error refreshing token:', error);
        return null;
    }
};

// Fetch YouTube Analytics data (CTR, etc.)
export const fetchAnalytics = async (channelId: string, accessToken: string, startDate: string, endDate: string) => {
    try {
        const params = new URLSearchParams({
            ids: `channel==${channelId}`,
            startDate,
            endDate,
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,dislikes,comments,shares,videosAddedToPlaylists,videosRemovedFromPlaylists,estimatedRevenue,cpm,adImpressions,ctr',
            dimensions: 'day',
            sort: '-day'
        });

        const response = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error('[Analytics] Error:', data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[Analytics] Error fetching analytics:', error);
        return null;
    }
};

// Fetch video-specific analytics
export const fetchVideoAnalytics = async (videoId: string, accessToken: string, startDate: string, endDate: string) => {
    try {
        const params = new URLSearchParams({
            ids: `channel==MINE`,
            startDate,
            endDate,
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,ctr',
            dimensions: 'video',
            filters: `video==${videoId}`,
            maxResults: '1'
        });

        const response = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error('[Video Analytics] Error:', data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('[Video Analytics] Error:', error);
        return null;
    }
};

// Store tokens in localStorage
export const storeTokens = (tokens: OAuthTokens) => {
    localStorage.setItem('yt_oauth_tokens', JSON.stringify(tokens));
    localStorage.setItem('yt_oauth_expires_at', String(Date.now() + (tokens.expires_in * 1000)));
};

// Get stored tokens
export const getStoredTokens = (): OAuthTokens | null => {
    const tokensStr = localStorage.getItem('yt_oauth_tokens');
    if (!tokensStr) return null;

    try {
        return JSON.parse(tokensStr);
    } catch {
        return null;
    }
};

// Check if tokens are expired
export const areTokensExpired = (): boolean => {
    const expiresAt = localStorage.getItem('yt_oauth_expires_at');
    if (!expiresAt) return true;

    return Date.now() >= parseInt(expiresAt);
};

// Clear stored tokens
export const clearTokens = () => {
    localStorage.removeItem('yt_oauth_tokens');
    localStorage.removeItem('yt_oauth_expires_at');
};
