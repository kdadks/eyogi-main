# Railway Deployment Guide for PayloadCMS Admin

## Step 1: Create Railway Account & Deploy
1. Go to https://railway.app and sign up with GitHub
2. Connect your `eyogi-main` repository
3. Railway will auto-detect it as a Node.js project

## Step 2: Environment Variables in Railway
Set these in Railway's environment variables:

```
DATABASE_URI=postgresql://eyogi_owner:u84AQOlDWfTh@ep-damp-sky-a2k6s8md-pooler.eu-central-1.aws.neon.tech/eyogi?sslmode=require&channel_binding=require
PAYLOAD_SECRET=6c63b98ec327488f201b633c
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzg5Njc0NWE2ZjBhMjZhZmJlNDI2NmM0ZWFhMjFiZGQ3NmIwOTZmYWNmNzAwY2E0ZTBjOGM5YzViNDY5MWViZGYiLCJhcHBJZCI6ImFtYWFxZ3JuaGIiLCJyZWdpb25zIjpbInNlYTEiXX0=
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://your-app-name.up.railway.app
PORT=3000
```

## Step 3: Railway Deployment Settings
- **Build Command**: `yarn build`
- **Start Command**: `yarn start`
- **Port**: 3000

## Step 4: Update Netlify Environment Variables
After Railway deployment, update Netlify with:
```
NEXT_PUBLIC_SERVER_URL=https://your-railway-app.up.railway.app
UPLOADTHING_TOKEN=your_uploadthing_token
```

## Step 5: Update Your Local Environment
Update `.env.local` with the Railway URL:
```
NEXT_PUBLIC_SERVER_URL=https://your-railway-app.up.railway.app
```

## Result
- **Railway**: Runs PayloadCMS admin with working image uploads
- **Netlify**: Serves your static frontend 
- **UploadThing**: Handles image storage for both
- **Database**: Shared Neon PostgreSQL database