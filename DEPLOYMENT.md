# Creator Studio - Deployment Guide

## Prerequisites
- A domain name (e.g., `studio.yourdomain.com`)
- Google Cloud Console access
- Node.js installed locally

## Step 1: Prepare Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```
   VITE_YOUTUBE_API_KEY=your_api_key_here
   VITE_OAUTH_CLIENT_ID=your_client_id_here
   VITE_OAUTH_CLIENT_SECRET=your_client_secret_here
   VITE_REDIRECT_URI=https://your-domain.com/oauth/callback
   ```

## Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://your-domain.com`
5. Under **Authorized redirect URIs**, add:
   - `https://your-domain.com/oauth/callback`
6. Click **Save**

## Step 3: Build for Production

```bash
npm run build
```

This creates a `dist` folder with your production-ready app.

## Step 4: Deploy

### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add each `VITE_*` variable from `.env.local`

4. Connect your custom domain:
   - In Vercel dashboard, go to Settings → Domains
   - Add your domain and follow DNS instructions

### Option B: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variables in Netlify dashboard
4. Connect your custom domain in Netlify settings

### Option C: Traditional Hosting (AWS S3, DigitalOcean, etc.)

1. Upload the `dist` folder contents to your web server
2. Configure your web server to serve `index.html` for all routes
3. Ensure HTTPS is enabled

## Step 5: Test OAuth Flow

1. Visit your deployed domain
2. Click "Login for Analytics"
3. Authorize with Google
4. Verify you're redirected back and can see CTR data

## Security Notes

⚠️ **IMPORTANT**: Your OAuth client secret was shared publicly in chat. You MUST:
1. Go to Google Cloud Console
2. Delete the current OAuth client
3. Create a new one with fresh credentials
4. Update your `.env.local` with the new credentials

## Troubleshooting

- **OAuth redirect mismatch**: Ensure the redirect URI in Google Console exactly matches your domain
- **Blank screen**: Check browser console for errors
- **API errors**: Verify environment variables are set correctly in your hosting platform

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API key | `AIzaSy...` |
| `VITE_OAUTH_CLIENT_ID` | OAuth 2.0 Client ID | `123456...apps.googleusercontent.com` |
| `VITE_OAUTH_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-...` |
| `VITE_REDIRECT_URI` | OAuth redirect URI | `https://yourdomain.com/oauth/callback` |
