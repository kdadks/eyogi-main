# Deployment Configuration Issues

## Current Problem
Images are not working on Netlify production because:

1. **Netlify is static hosting** - doesn't run PayloadCMS server
2. **Media URLs use `/api/media/` endpoints** - these don't exist on Netlify
3. **UploadThing should be used for production** - but images are still saved with local URLs

## Solution Required

### Option 1: Deploy PayloadCMS Separately (Recommended)
1. Deploy PayloadCMS admin to a server platform (Railway, Render, Vercel Pro)
2. Configure UploadThing environment variables in both places
3. Use UploadThing URLs for all media storage

### Option 2: Use UploadThing URLs Only
1. Ensure all new media uploads use UploadThing URLs
2. Migrate existing media to UploadThing
3. Update existing content to use UploadThing URLs

## Environment Variables Needed for Production
```
UPLOADTHING_TOKEN=your_uploadthing_token
PAYLOAD_SECRET=your_payload_secret
DATABASE_URI=your_production_database_url
NEXT_PUBLIC_SERVER_URL=https://your-payload-admin-url.com
```

## Immediate Fix Applied
- Added production checks to gracefully handle `/api/media/` URLs
- Images with local URLs will show placeholders in production
- UploadThing URLs will work normally