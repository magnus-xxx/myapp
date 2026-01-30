# Google OAuth Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Install Packages
```bash
npm install googleapis electron-store
```

### 2. Add Credentials
Edit `src/main/googleAuth.ts` (lines 9-11):
```typescript
const CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com'
const CLIENT_SECRET = 'GOCSPX-your_actual_secret'
const REDIRECT_URI = 'http://localhost:3000/oauth2callback'
```

### 3. Test
```bash
npm run dev
```
Then: Settings → Integrations → Connect Account

## 📁 Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `src/main/googleAuth.ts` | **NEW** OAuth handler | 270 |
| `src/main/index.ts` | IPC handlers | +47 |
| `src/preload/index.ts` | Auth API | +3 |
| `src/renderer/src/components/Settings/Integrations.tsx` | Auth status check | +20 |

## 🔧 Key Functions

### Main Process (googleAuth.ts)
```typescript
startAuth()          // Start OAuth flow
signOut()            // Clear tokens
isAuthenticated()    // Check auth status
getAuthClient()      // Get authenticated client (auto-refresh)
```

### Renderer Process
```typescript
window.api.auth.signInGoogle()   // Connect
window.api.auth.signOutGoogle()  // Disconnect
window.api.auth.checkStatus()    // Check status
```

## 🎯 OAuth Flow (30 seconds)

1. User clicks "Connect Account"
2. Browser opens → Google consent screen
3. User grants permissions
4. Browser shows success message
5. App shows "Connected" ✅

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| Cannot find module 'googleapis' | `npm install googleapis electron-store` |
| Invalid client | Check Client ID/Secret |
| Redirect URI mismatch | Add `http://localhost:3000/oauth2callback` to Google Cloud |
| Port 3000 in use | Close other apps |

## 📊 Console Logs (Success)

```
[GoogleAuth] Starting OAuth flow...
[GoogleAuth] Callback server listening on port 3000
[GoogleAuth] Opening browser for user consent...
[GoogleAuth] Received OAuth callback
[GoogleAuth] Tokens received successfully
[GoogleAuth] OAuth flow completed successfully
[Main] Google sign-in successful
[Integrations] Google Calendar connected successfully
```

## 🔐 Security Checklist

- [ ] Never commit credentials to git
- [ ] Tokens stored in electron-store (encrypted)
- [ ] Use environment variables for production
- [ ] Refresh token stored securely
- [ ] Auto token refresh enabled

## 📦 Token Storage

**Location:** `~/.config/magnus-app/config.json`

**Structure:**
```json
{
  "google_tokens": {
    "access_token": "ya29...",
    "refresh_token": "1//0g...",
    "expiry_date": 1704844800000
  }
}
```

## ✅ Testing Checklist

- [ ] Install packages
- [ ] Add credentials
- [ ] Start app
- [ ] Click "Connect Account"
- [ ] Browser opens
- [ ] Grant permissions
- [ ] See "Connected" status
- [ ] Close app
- [ ] Reopen app
- [ ] Still connected ✅
- [ ] Click "Disconnect"
- [ ] Status changes to "Not Connected"

## 🚀 Next: Calendar Sync

Once OAuth is working, implement calendar sync:

```typescript
import { getAuthClient } from './googleAuth'
import { google } from 'googleapis'

async function getEvents() {
  const auth = await getAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10
  })
  
  return response.data.items
}
```

## 📞 Support

**Docs:** `.agent/docs/google-oauth-setup-guide.md`
**Google Cloud:** https://console.cloud.google.com/
**API Docs:** https://developers.google.com/calendar/api

---

**Status:** ✅ Implementation Complete
**Ready for:** Production use after adding credentials
