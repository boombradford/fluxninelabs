#!/bin/bash

# Creator Studio - Quick Deploy Script

echo "🚀 Creator Studio Deployment"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local file found!"
    echo "📝 Creating from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "✅ Created .env.local"
    echo "⚠️  Please edit .env.local with your credentials before deploying!"
    echo ""
    exit 1
fi

echo "📦 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Production files are in: ./dist"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Vercel: npx vercel --prod"
    echo "2. Or deploy to Netlify: npx netlify deploy --prod"
    echo "3. Or upload ./dist folder to your hosting"
    echo ""
    echo "Don't forget to:"
    echo "- Add environment variables to your hosting platform"
    echo "- Update OAuth redirect URIs in Google Cloud Console"
    echo ""
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi
