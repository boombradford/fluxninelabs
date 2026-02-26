# OAuth Troubleshooting Guide

## Issue: "Access Blocked" Error

### Quick Fixes to Try:

**1. Double-Check Google Cloud Console Settings**
Go to: https://console.cloud.google.com/apis/credentials

Make sure EXACTLY these are added:

**Authorized JavaScript origins:**
```
https://vessl.space
```

**Authorized redirect URIs:**
```
https://vessl.space/oauth/callback
```

**Important:** 
- No trailing slashes
- Must be HTTPS (not HTTP)
- Exact match required

---

**2. Wait for Propagation**
Google can take 5-30 minutes to propagate changes. Try:
- Wait 10 more minutes
- Clear browser cache
- Try incognito/private window

---

**3. Check OAuth Consent Screen**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure your app is in "Testing" mode
3. Add your Google account as a test user:
   - Click "ADD USERS"
   - Add your email
   - Save

---

**4. Verify Environment Variables in Vercel**
1. Go to: https://vercel.com/dashboard
2. Click your project → Settings → Environment Variables
3. Verify `VITE_REDIRECT_URI` = `https://vessl.space/oauth/callback`
4. If you changed it, redeploy

---

**5. Check the Actual Error Message**
The error should show:
- What redirect URI was sent
- What redirect URIs are registered

If they don't match exactly, that's the problem.

---

**6. Alternative: Use Localhost for Now**
While waiting for vessl.space to work, you can test locally:

1. In Google Cloud Console, add:
   - `http://localhost:5173` to JavaScript origins
   - `http://localhost:5173/oauth/callback` to redirect URIs

2. Run locally: `npm run dev`

3. Test OAuth at `http://localhost:5173`

---

## Still Not Working?

**Option 1: Regenerate OAuth Credentials**
Since the old credentials were shared publicly, create fresh ones:
1. Delete current OAuth 2.0 Client
2. Create new one
3. Add vessl.space URIs
4. Update Vercel environment variables
5. Redeploy

**Option 2: Check OAuth Scopes**
Make sure these scopes are requested:
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/yt-analytics.readonly`

---

## What I'm Doing Meanwhile

I'm continuing to build the analytics dashboard with:
- Performance scoring system
- Video performance cards
- Data visualizations
- Content insights

Everything will be ready when OAuth is working! 🚀
