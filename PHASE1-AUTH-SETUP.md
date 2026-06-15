# Phase 1: Authentication Configuration Guide

**Status**: Implementation Ready  
**Date**: 2026-06-15  
**Project**: gwugapcoknxqqluocjzl.supabase.co

---

## Authentication Overview

### Current Setup
- **Provider**: Supabase Auth
- **Auth Methods**: Email/Password
- **Redirect URL (Dev)**: `http://localhost:3000/auth/callback`
- **Redirect URL (Prod)**: `https://[YOUR-DOMAIN]/auth/callback` *(to be configured later)*
- **User Roles**: admin, teacher, student, parent, member, public

---

## Part 1: Basic Email/Password Configuration

### Step 1: Enable Email Provider (Already Enabled)

Supabase has Email/Password auth enabled by default. Verify:

1. Go to: **Supabase Dashboard** → **Authentication** → **Providers**
2. Check: **Email** is "Enabled"
3. Settings shown should include:
   - Allow sign-ups ✓
   - Confirm email ✓ (or set as needed)
   - Double confirm for password change ✓

### Step 2: Configure Email Settings

1. Go to: **Authentication** → **Email Templates**
2. Verify these templates exist:
   - Confirm signup
   - Invite user
   - Magic link
   - Change email
   - Reset password
   - Confirm password recovery

### Step 3: Set Up Custom SMTP

Since you selected "Custom SMTP: Yes", follow these steps:

1. Go to: **Supabase Dashboard** → **Authentication** → **Email**
2. Look for "Email provider" section
3. Select: **Custom SMTP**
4. Fill in your SMTP credentials:
   ```
   SMTP Server: [SMTP_HOST from .env.local]
   Port: [SMTP_PORT from .env.local]
   Username: [SMTP_USER from .env.local]
   Password: [SMTP_PASSWORD from .env.local]
   Sender Email: [SMTP_FROM from .env.local]
   Sender Name: [SMTP_FROM_NAME from .env.local]
   ```

5. Click "Test" to verify connection works
6. Save changes

**SMTP Provider Examples**:
```
Gmail:
- Server: smtp.gmail.com
- Port: 587
- Username: your-email@gmail.com
- Password: [Your App Password - NOT regular password]
- Security: TLS

SendGrid:
- Server: smtp.sendgrid.net
- Port: 587
- Username: apikey
- Password: [Your SendGrid API Key]
- Security: TLS

AWS SES:
- Server: email-smtp.[region].amazonaws.com
- Port: 587
- Username: [SMTP Username from AWS]
- Password: [SMTP Password from AWS]
- Security: TLS
```

---

## Part 2: Configure Redirect URLs

### Development URL
1. Go to: **Authentication** → **URL Configuration**
2. Under "Redirect URLs", click "Add URL"
3. Add: `http://localhost:3000/auth/callback`
4. Save

### Production URL (When Ready)
*(You mentioned: "will inform later")*

When you have production domain, update:
1. Add redirect: `https://[your-production-domain]/auth/callback`
2. If using www: `https://www.[your-production-domain]/auth/callback`

---

## Part 3: Configure User Metadata & Roles

### User Roles Structure

All users will have this structure in Supabase:

```sql
-- From users table (already created in Phase 1)
id: UUID
email: TEXT
full_name: TEXT
avatar_url: TEXT
role: TEXT (admin, teacher, student, parent, member, public)
status: TEXT (active, inactive, suspended)
metadata: JSONB (custom fields)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Set Default Role

When users sign up, they should default to "student" or "public" role:

**Via Next.js trigger** (preferred):
```typescript
// src/lib/supabase/auth.ts
export async function handleUserSignup(user: User) {
  const defaultRole = 'student'; // or 'public'
  
  const { error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      role: defaultRole,
      status: 'active'
    });
  
  return { error };
}
```

**Via Supabase Trigger** (database level):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status)
  VALUES (NEW.id, NEW.email, 'student', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Part 4: Email Template Customization

### Customize Email Templates

Go to: **Authentication** → **Email Templates**

Edit each template (optional customizations):

#### 1. Confirm Signup
```
Subject: Confirm your email

Body:
Click the link below to confirm your email address:

{{ .ConfirmationURL }}

This link expires in 24 hours.
```

#### 2. Invite User (for admin creating users)
```
Subject: You're invited to eYogi

Body:
You've been invited to join eYogi!

Click here to set up your account:
{{ .ConfirmationURL }}
```

#### 3. Magic Link (passwordless login)
```
Subject: Your eYogi login link

Body:
Click here to log in to your eYogi account:
{{ .ConfirmationURL }}

This link expires in 1 hour.
```

#### 4. Reset Password
```
Subject: Reset your eYogi password

Body:
Click the link below to reset your password:
{{ .ConfirmationURL }}

If you didn't request this, you can ignore this email.
```

---

## Part 5: Authentication Flow Implementation

### Sign Up Flow
```typescript
// src/app/api/auth/register/route.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const supabase = createServerSupabase()

  // Sign up user
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({
    message: 'Check your email to confirm your account',
    user
  })
}
```

### Sign In Flow
```typescript
// src/app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { email, password } = await req.json()
  const supabase = createServerSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 401 })
  }

  return Response.json(data)
}
```

### Auth Callback Handler
```typescript
// src/app/auth/callback/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerSupabase()
    await supabase.auth.exchangeCodeForSession(code)
  }

  redirect('/')
}
```

---

## Part 6: Authorization with RLS

### User Session Access

```typescript
// Get current user session
const { data: { session } } = await supabase.auth.getSession()

// Get current user details from users table
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', session?.user?.id)
  .single()

// Check if user is admin
const isAdmin = user?.role === 'admin'
```

### Protected Routes Example

```typescript
// src/middleware.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function middleware(req: Request) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Check admin role for admin routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/ssh-admin/:path*']
}
```

---

## Part 7: Testing Authentication

### Test Endpoints

```bash
# Test Sign Up
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Test Sign In
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Verify in Supabase Dashboard

1. Go to: **Authentication** → **Users**
2. Should see newly created test user
3. Email status shows "Confirmed" or "Unconfirmed" based on settings

---

## Part 8: Security Checklist

- [ ] Email provider configured (Custom SMTP)
- [ ] SMTP credentials verified and working
- [ ] Redirect URLs configured (dev + future prod)
- [ ] Email templates customized with branding
- [ ] User creation trigger set up (auto-assign roles)
- [ ] RLS policies in place (see PHASE1-RLS-POLICIES.md)
- [ ] Sign up/login endpoints created
- [ ] Protected routes middleware configured
- [ ] Testing completed successfully
- [ ] No hardcoded secrets in code

---

## Troubleshooting

### Issue: Emails not being sent
**Check**:
1. SMTP credentials correct in Supabase dashboard
2. SMTP password/API key not expired
3. "From" email verified in SMTP provider
4. Firewall/network allows SMTP port 587
5. Check auth logs in Supabase

### Issue: Redirect loop after login
**Check**:
1. Redirect URL matches exactly (with/without www, http vs https)
2. Auth callback route exists and working
3. Session cookie configuration correct

### Issue: Users can't sign up
**Check**:
1. Email provider enabled in Supabase
2. Allow sign-ups toggle is ON
3. Email confirmation settings (immediate or wait for confirmation)
4. SMTP working properly

---

## Next Phase

After authentication configured:
1. ✅ Environment variables set
2. ✅ Email/SMTP configured
3. ✅ Redirect URLs set
4. ⏭️ **Next**: Configure Storage (PHASE1-STORAGE-SETUP.md)
5. ⏭️ Then: Configure RLS Policies (PHASE1-RLS-POLICIES.md)

---

## Files in Phase 1

- PHASE1-ENV-TEMPLATE.md
- **PHASE1-AUTH-SETUP.md** ← You are here
- PHASE1-STORAGE-SETUP.md
- PHASE1-RLS-POLICIES.md
- PHASE1-CHECKLIST.md
