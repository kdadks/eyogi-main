# Registration Email Quick Start

## Setup in 3 Steps

### 1. Add Environment Variables to `.env.local`
```dotenv
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@eyogigurukul.com
SMTP_PASS=G^779958296916ux
SMTP_FROM_EMAIL=info@eyogigurukul.com
SMTP_FROM_NAME=EYogi Gurukul
REGISTRATION_EMAIL_TO=info@eyogigurukul.com
```

### 2. Verify nodemailer is Installed
```bash
npm list nodemailer
# Should show: nodemailer@X.X.X
```

If not installed:
```bash
npm install nodemailer @types/nodemailer --legacy-peer-deps
```

### 3. Test Registration
1. Start dev server: `npm run dev`
2. Register a new user
3. Check `info@eyogigurukul.com` for registration email

## How It Works

When a user registers:
1. Account is created in database
2. Email notification sent to `REGISTRATION_EMAIL_TO`
3. Email includes: role, registration date, status (NO personal info)

## What Gets Emailed

✅ **Included:**
- Registration timestamp
- User role (student/teacher/parent)
- Account status

❌ **NOT Included (Protected PII):**
- User's email
- Full name
- Phone number
- Address
- Date of birth

## Troubleshooting

**Email not sending?**
1. Check `.env.local` has all SMTP variables
2. Open browser console (F12) → check for errors
3. Verify Office365 credentials are correct

**Registration blocked?**
- No, registration succeeds even if email fails!
- Check browser console for email attempt logs

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `SMTP_HOST` | Email server | smtp.office365.com |
| `SMTP_PORT` | Connection port | 587 |
| `SMTP_USER` | Login email | info@eyogigurukul.com |
| `SMTP_PASS` | Login password | (your password) |
| `SMTP_FROM_EMAIL` | Sender email | info@eyogigurukul.com |
| `SMTP_FROM_NAME` | Sender name | EYogi Gurukul |
| `REGISTRATION_EMAIL_TO` | Recipient email | info@eyogigurukul.com |

## Key Files

- 📧 Email Service: `src/lib/email/emailService.ts`
- 🔌 API Endpoint: `src/app/api/auth/register/route.ts`
- 👤 Integration: `src/SSH/src/contexts/WebsiteAuthContext.tsx`

## Production Deployment

1. Set environment variables in production hosting
2. Ensure SMTP credentials are secure
3. Monitor email delivery in office logs
4. Consider adding database logging of emails

## Support

See `REGISTRATION_EMAIL_SETUP.md` for detailed documentation.
