# Vercel Deployment Guide

## Current Setup (Development)

For now, use these redirect origins in the Power-Up Admin Portal:
```
http://localhost:8080
http://127.0.0.1:8080
```

## Vercel Deployment Steps

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add TRELLO_TOKEN
```

### 2. Update Power-Up Admin Portal

After deployment, update the redirect origins to:
```
https://your-project-name.vercel.app
https://your-custom-domain.com (if you have one)
```

### 3. Environment Variables in Vercel

Set these in your Vercel dashboard:
- `TRELLO_API_KEY`: c31098c5e8f0950912fc406cafee00b6
- `TRELLO_SECRET`: db8162b4741e199546c61f5771b09420d5f2d9edcd7da5863e96ab86b015f709
- `TRELLO_TOKEN`: (your token from authorization flow)

### 4. Update Configuration

The app will automatically detect it's running on Vercel and use the production redirect origins.

## Development vs Production

- **Development**: Uses localhost redirect origins
- **Production**: Uses Vercel domain redirect origins
- **Automatic**: The app detects the environment and uses appropriate settings


