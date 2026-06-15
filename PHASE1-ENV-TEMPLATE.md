# Phase 1 Environment Variables Configuration

**Status**: Ready to configure  
**Date**: 2026-06-15  
**Phase**: 1 - Foundation Setup

---

## Environment Variables Setup

### Copy `.env.local` Template

Create or update `.env.local` in project root with:

```env
# ============================================
# SUPABASE CONFIGURATION (New Unified Project)
# ============================================

# Project URL (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://gwugapcoknxqqluocjzl.supabase.co

# Anon Key (public, safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dWdhcGNva254cXFsdW9janpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MjIxOTcsImV4cCI6MjA5NzA5ODE5N30.HRip6rywVDB-OkpvMD2MkaWfOnn3E710j8wcoidiw70

# Service Role Key (private, only for server-side - NEVER commit or expose!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dWdhcGNva254cXFsdW9janpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUyMjE5NywiZXhwIjoyMDk3MDk4MTk3fQ.-8PAxgeMkbhhzbWRDBi9ZHB2UIqCzV_nS--mR9S0Hfw

# ============================================
# APPLICATION URLS
# ============================================

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ============================================
# EMAIL CONFIGURATION (Custom SMTP)
# ============================================
# For Supabase Auth emails and transactional emails

SMTP_HOST=smtp.YOUR-EMAIL-PROVIDER.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password-or-token
SMTP_FROM=noreply@eyogi.com
SMTP_FROM_NAME=eYogi

# Note: Common SMTP providers:
# Gmail: smtp.gmail.com:587 (use App Password)
# SendGrid: smtp.sendgrid.net:587 (use apikey as password)
# AWS SES: email-smtp.[region].amazonaws.com:587
# Mailgun: smtp.mailgun.org:587

# ============================================
# SUPABASE AUTH CONFIGURATION
# ============================================

# Email confirmation required?
NEXT_PUBLIC_AUTH_EMAIL_CONFIRMATION_REQUIRED=true

# Auto-confirm emails (set to false in production)
NEXT_PUBLIC_AUTH_AUTO_CONFIRM=false

# ============================================
# STORAGE CONFIGURATION
# ============================================

# Max file sizes (in MB)
NEXT_PUBLIC_MAX_FILE_SIZE_MEDIA=10
NEXT_PUBLIC_MAX_FILE_SIZE_COURSE_MATERIALS=100
NEXT_PUBLIC_MAX_FILE_SIZE_USER_UPLOADS=50

# Allowed file types (MIME types, comma-separated)
NEXT_PUBLIC_ALLOWED_MEDIA_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# ============================================
# FEATURE FLAGS
# ============================================

NEXT_PUBLIC_ENABLE_SSH_UNIVERSITY=true
NEXT_PUBLIC_ENABLE_MEMBERSHIP=true
NEXT_PUBLIC_ENABLE_BLOG=true

# ============================================
# DEVELOPMENT ONLY (Remove for production)
# ============================================

# Enable debug logging
DEBUG=false
NEXT_PUBLIC_DEBUG_MODE=false

# ============================================
# TODO: PRODUCTION ENVIRONMENT
# ============================================
# Will be configured later with production domain
# NEXT_PUBLIC_SUPABASE_URL=[production-url]
# NEXT_PUBLIC_APP_URL=[production-domain]
# etc.
```

---

## Step-by-Step Setup Instructions

### Step 1: Create `.env.local` File
```bash
# In project root
touch .env.local

# Or in PowerShell:
New-Item -Path ".env.local" -Type File
```

### Step 2: Fill in SMTP Details

**CRITICAL**: You mentioned custom SMTP. Provide:
- SMTP_HOST: ?
- SMTP_PORT: ?
- SMTP_USER: ?
- SMTP_PASSWORD: ?
- SMTP_FROM: ?

**Important**: For Supabase Auth emails:
1. Go to Supabase Dashboard → Settings → Auth
2. Scroll to "Email" section
3. Add custom SMTP credentials

### Step 3: Verify Environment Variables

```bash
# Test connection (Node.js script)
node -e "
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('✅ URL:', url ? '✓' : '✗');
console.log('✅ Anon Key:', anon ? '✓' : '✗');
"
```

### Step 4: DO NOT COMMIT `.env.local`

Verify `.gitignore` includes:
```gitignore
.env.local
.env.*.local
.env
```

---

## Environment Variables Reference

| Variable | Visibility | Purpose | Example |
|----------|-----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project endpoint | `https://gwugapcoknxqqluocjzl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anonymous auth key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Server-side admin key | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | Public | App domain | `http://localhost:3000` |
| `SMTP_*` | Private | Email configuration | `smtp.gmail.com` |
| `NEXT_PUBLIC_MAX_FILE_SIZE_*` | Public | File upload limits | `10` |

---

## Security Checklist

- [ ] `.env.local` is NOT committed to git
- [ ] Service role key is ONLY on server (never in Next.js client code)
- [ ] SMTP password is stored securely (not in git)
- [ ] Anon key is safe to expose (has limited permissions)
- [ ] All sensitive values are in environment, not hardcoded
- [ ] `.gitignore` properly configured

---

## Next Actions

1. **Fill in SMTP details** (ask your email provider)
2. **Create `.env.local`** with values above
3. **Test connection** to Supabase
4. **Verify all variables** are accessible from Next.js
5. **Proceed to Authentication Setup** (next document)

---

## Files Related to This Phase

- Current: **PHASE1-ENV-TEMPLATE.md** ← You are here
- Next: **PHASE1-AUTH-SETUP.md**
- Next: **PHASE1-STORAGE-SETUP.md**
- Next: **PHASE1-RLS-POLICIES.md**
