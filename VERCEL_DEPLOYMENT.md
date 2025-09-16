# Vercel Deployment Guide for eyogi-main

## 🚀 Deploy to Vercel

### Step 1: Connect to Vercel
1. Go to **https://vercel.com**
2. **Sign up/Login** with your GitHub account
3. **Import** your `eyogi-main` repository
4. Vercel will auto-detect it as a Next.js project

### Step 2: Environment Variables in Vercel
Go to your Vercel project **Settings > Environment Variables** and add:

```
DATABASE_URI=postgresql://eyogi_owner:u84AQOlDWfTh@ep-damp-sky-a2k6s8md-pooler.eu-central-1.aws.neon.tech/eyogi?sslmode=require&channel_binding=require

PAYLOAD_SECRET=6c63b98ec327488f201b633c

UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzg5Njc0NWE2ZjBhMjZhZmJlNDI2NmM0ZWFhMjFiZGQ3NmIwOTZmYWNmNzAwY2E0ZTBjOGM5YzViNDY5MWViZGYiLCJhcHBJZCI6ImFtYWFxZ3JuaGIiLCJyZWdpb25zIjpbInNlYTEiXX0=

NODE_ENV=production

RESEND_API_KEY=your_resend_key_here
```

### Step 3: Deploy Settings
Vercel will automatically use:
- **Build Command**: `yarn build`
- **Install Command**: `yarn install`
- **Output Directory**: `.next`
- **Framework**: Next.js

### Step 4: Access Your Deployed App
After deployment, you'll get URLs like:
- **Frontend**: `https://your-app-name.vercel.app`
- **Admin Panel**: `https://your-app-name.vercel.app/admin`
- **API**: `https://your-app-name.vercel.app/api/*`

## ✅ What Will Work After Deployment

1. **✅ Full Next.js Frontend** - All pages, components, styling
2. **✅ PayloadCMS Admin Panel** - Upload images, manage content
3. **✅ API Endpoints** - All `/api/*` routes including `/api/media/*`
4. **✅ Database Operations** - Connected to your Neon PostgreSQL
5. **✅ UploadThing Integration** - File uploads will use UploadThing URLs
6. **✅ Image Optimization** - Next.js image optimization with proper domains

## 🎯 Post-Deployment Steps

1. **Update Your Local Environment**:
   ```
   NEXT_PUBLIC_SERVER_URL=https://your-app-name.vercel.app
   ```

2. **Test Image Uploads**:
   - Go to `https://your-app-name.vercel.app/admin`
   - Upload a new image
   - Verify it gets an UploadThing URL (starts with `https://utfs.io/`)

3. **Verify Frontend**:
   - Check that all pages load correctly
   - Verify images display properly
   - Test navigation and functionality

## 🔧 Troubleshooting

If you encounter issues:

1. **Check Vercel Function Logs** in the Vercel dashboard
2. **Verify Environment Variables** are set correctly
3. **Check Database Connection** in the logs
4. **Ensure UploadThing Token** is valid

## 📱 Mobile & Performance

Vercel automatically provides:
- ✅ **Global CDN** for fast loading worldwide
- ✅ **Automatic HTTPS** with custom domain support
- ✅ **Image Optimization** for different screen sizes
- ✅ **Edge Functions** for fast API responses