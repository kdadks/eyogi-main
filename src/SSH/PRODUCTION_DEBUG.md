# SSH Admin Production Debugging Guide

## Issue: Infinite Spinner on Hard Refresh

### Quick Fixes Applied:

1. **Reduced Auth Timeout**: From 6 seconds to 3 seconds for faster failure
2. **Added Recovery Mechanism**: Automatic fallback after 4 seconds in AdminProtectedRoute  
3. **Session Check Timeout**: 2-second timeout on session checks to prevent hanging
4. **Debug Logging**: Added production debugging utility

### For Production Debugging:

Open browser console and run:
```javascript
// Enable debug logging
window.sshAuthDebug.enableDebugMode()

// Check auth health
window.sshAuthDebug.checkAuthHealth()

// Disable debug logging when done
window.sshAuthDebug.disableDebugMode()
```

### If Still Getting Stuck Spinner:

1. **Clear Browser Storage**:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Force Redirect to Login**:
   ```javascript
   window.location.href = '/ssh-app/admin/login'
   ```

3. **Check Network Issues**:
   - Look for failed Supabase requests in Network tab
   - Check if CORS or CSP is blocking requests

### Route Structure:
- Production URL: `https://eyogi-main.vercel.app/ssh-app/admin/enrollments`
- Vercel rewrites handle routing to `/ssh-app/index.html`
- React Router handles internal navigation

### Common Causes:
1. **Network timeouts** - Fixed with 2s session timeout
2. **Supabase connection issues** - Added retry logic  
3. **Browser cache issues** - Clear storage fixes this
4. **Auth state inconsistency** - Recovery mechanism handles this

### Files Modified:
- `src/SSH/src/contexts/AuthContext.tsx` - Main auth improvements
- `src/SSH/src/components/auth/AdminProtectedRoute.tsx` - Fallback UI
- `src/SSH/src/lib/authDebug.ts` - Debug utility (new)