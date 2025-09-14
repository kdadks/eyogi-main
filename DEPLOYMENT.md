# Netlify Deployment Guide

This guide explains how to deploy the eYogi application to Netlify with automatic deployments.

## Prerequisites

1. [Netlify account](https://netlify.com)
2. [GitHub repository](https://github.com) with your code
3. Node.js 20+ installed locally

## Quick Deploy to Netlify

### Option 1: Deploy Button (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kdadks/eyogi-main)

### Option 2: Manual Setup

1. **Connect your repository to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository

2. **Configure build settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   Node.js version: 20
   ```

3. **Set environment variables:**
   - Go to Site Settings → Environment Variables
   - Add your environment variables (see `.env.example`)

### Option 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize site:**
   ```bash
   netlify init
   ```

4. **Deploy:**
   ```bash
   npm run netlify:deploy
   ```

## Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Required for production
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://your-site.netlify.app
DATABASE_URI=your_database_connection_string
PAYLOAD_SECRET=your_payload_secret_key

# Optional
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
RESEND_API_KEY=your_resend_api_key
```

## Automatic Deployments

The repository includes GitHub Actions workflows for automatic deployments:

### Production Deployment
- **Trigger:** Push to `main` branch
- **File:** `.github/workflows/deploy-production.yml`
- **Environment:** Production

### Preview Deployments
- **Trigger:** Pull requests to `main` branch
- **File:** `.github/workflows/netlify-deploy.yml`
- **Environment:** Deploy Preview

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and Variables → Actions
2. Add these repository secrets:

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
```

### Getting Netlify Credentials:

1. **Auth Token:**
   - Go to [Netlify User Settings](https://app.netlify.com/user/applications)
   - Generate a new access token

2. **Site ID:**
   - Go to your site's dashboard
   - Go to Site Settings → General
   - Copy the Site ID

## Manual Deployment Commands

```bash
# Build the application
npm run build

# Deploy to production
npm run netlify:deploy

# Deploy preview
npm run netlify:preview

# Run local Netlify dev server
npm run netlify:dev

# Use custom deploy script
npm run deploy
```

## Deployment Features

### Included Features:
- ✅ Automatic deployments from GitHub
- ✅ Deploy previews for pull requests
- ✅ Build optimization for Next.js
- ✅ Static asset caching
- ✅ Security headers
- ✅ SSH app routing support
- ✅ Form handling support
- ✅ Lighthouse CI integration

### Configuration Files:
- `netlify.toml` - Netlify configuration
- `.github/workflows/` - GitHub Actions
- `deploy.js` - Custom deployment script

## Troubleshooting

### Build Issues:
1. Check Node.js version (should be 20+)
2. Verify environment variables are set
3. Check build logs in Netlify dashboard

### Routing Issues:
- Next.js routing is handled by `netlify.toml`
- SSH app routes are configured with redirects

### Performance:
- Static assets are automatically cached
- Uses Next.js optimizations
- Includes security headers

## Support

For deployment issues:
1. Check [Netlify Documentation](https://docs.netlify.com)
2. Review build logs in Netlify dashboard
3. Check GitHub Actions logs for CI/CD issues

## Site URLs

After deployment, your site will be available at:
- **Production:** `https://your-site-name.netlify.app`
- **Custom Domain:** Configure in Netlify dashboard

---

🚀 **Happy Deploying!** Your eYogi application should now be automatically deployed to Netlify.