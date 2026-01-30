import { google } from 'googleapis'
import { shell } from 'electron'
import Store from 'electron-store'
import * as http from 'http'
import * as url from 'url'

// Initialize electron-store for persistent token storage
const store = new Store()

// OAuth 2.0 Credentials
// TODO: Replace with your actual credentials from Google Cloud Console
const CLIENT_ID = '127984558266-skhi78oek2rc0qbdu37ki1nka51co1og.apps.googleusercontent.com'
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE'
const REDIRECT_URI = 'http://localhost:3000/oauth2callback'

// Scopes for Google Calendar API + User Info
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]

// User Profile Interface
export interface GoogleUserProfile {
  email: string
  name: string
  picture: string
}

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
)

/**
 * Start the OAuth 2.0 authentication flow
 * Opens browser for user consent and handles the callback
 */
export async function startAuth(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      console.log('[GoogleAuth] Starting OAuth flow...')

      // Generate authentication URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: SCOPES,
        prompt: 'consent' // Force consent screen to get refresh token
      })

      console.log('[GoogleAuth] Auth URL generated:', authUrl)

      // Create temporary HTTP server to handle OAuth callback
      const server = http.createServer(async (req, res) => {
        try {
          // Parse the request URL
          const queryObject = url.parse(req.url!, true).query

          // Check if this is the OAuth callback
          if (req.url!.startsWith('/oauth2callback')) {
            console.log('[GoogleAuth] Received OAuth callback')

            // Extract authorization code
            const code = queryObject.code as string

            if (!code) {
              throw new Error('No authorization code received')
            }

            console.log('[GoogleAuth] Authorization code received')

            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <html>
                <head>
                  <title>Authentication Successful</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background: #0a0a0a;
                      color: #e5e7eb;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                      background: rgba(255, 255, 255, 0.05);
                      border-radius: 12px;
                      border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    h1 { color: #10b981; margin: 0 0 1rem 0; }
                    p { margin: 0; color: #9ca3af; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>✓ Authentication Successful!</h1>
                    <p>You can close this window and return to the app.</p>
                  </div>
                </body>
              </html>
            `)

            // Close the server
            server.close()

            // Exchange authorization code for tokens
            console.log('[GoogleAuth] Exchanging code for tokens...')
            const { tokens } = await oauth2Client.getToken(code)
            
            console.log('[GoogleAuth] Tokens received successfully')

            // Set credentials on the OAuth client
            oauth2Client.setCredentials(tokens)

            // Store tokens persistently
            store.set('google_tokens', {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expiry_date: tokens.expiry_date,
              token_type: tokens.token_type,
              scope: tokens.scope
            })

            console.log('[GoogleAuth] Tokens saved to store')

            // Fetch user profile information
            try {
              console.log('[GoogleAuth] Fetching user profile...')
              const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
              const userInfoResponse = await oauth2.userinfo.get()
              const userInfo = userInfoResponse.data

              const userProfile: GoogleUserProfile = {
                email: userInfo.email || '',
                name: userInfo.name || '',
                picture: userInfo.picture || ''
              }

              store.set('google_user_profile', userProfile)
              console.log('[GoogleAuth] User profile saved:', userProfile.email)
            } catch (profileError) {
              console.error('[GoogleAuth] Failed to fetch user profile:', profileError)
              // Continue anyway - tokens are still valid
            }

            console.log('[GoogleAuth] OAuth flow completed successfully')

            resolve({ success: true })
          }
        } catch (error: any) {
          console.error('[GoogleAuth] Error handling callback:', error)
          
          // Send error response to browser
          res.writeHead(500, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <head>
                <title>Authentication Failed</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: #0a0a0a;
                    color: #e5e7eb;
                  }
                  .container {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 12px;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                  }
                  h1 { color: #ef4444; margin: 0 0 1rem 0; }
                  p { margin: 0; color: #9ca3af; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>✕ Authentication Failed</h1>
                  <p>Please try again or check the console for errors.</p>
                </div>
              </body>
            </html>
          `)

          server.close()
          resolve({ 
            success: false, 
            error: error.message || 'Failed to exchange authorization code' 
          })
        }
      })

      // Start server on port 3000
      server.listen(3000, () => {
        console.log('[GoogleAuth] Callback server listening on port 3000')
        
        // Open authentication URL in default browser
        console.log('[GoogleAuth] Opening browser for user consent...')
        shell.openExternal(authUrl)
      })

      // Handle server errors
      server.on('error', (error: any) => {
        console.error('[GoogleAuth] Server error:', error)
        resolve({ 
          success: false, 
          error: error.message || 'Server failed to start. Port 3000 may be in use.' 
        })
      })

      // Set timeout for authentication (5 minutes)
      setTimeout(() => {
        server.close()
        resolve({ 
          success: false, 
          error: 'Authentication timeout - user did not complete the flow within 5 minutes' 
        })
      }, 5 * 60 * 1000)
    } catch (error: any) {
      console.error('[GoogleAuth] Fatal error in startAuth:', error)
      resolve({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      })
    }
  })
}

/**
 * Sign out by clearing stored tokens and user profile
 */
export function signOut(): void {
  console.log('[GoogleAuth] Signing out...')
  store.delete('google_tokens')
  store.delete('google_user_profile')
  oauth2Client.setCredentials({})
  console.log('[GoogleAuth] Tokens and profile cleared')
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  const tokens = store.get('google_tokens') as any
  return !!(tokens && tokens.access_token)
}

/**
 * Get the authenticated OAuth2 client
 * Automatically refreshes tokens if expired
 */
export async function getAuthClient() {
  const tokens = store.get('google_tokens') as any
  
  if (!tokens || !tokens.access_token) {
    throw new Error('Not authenticated - please sign in first')
  }

  // Set stored credentials
  oauth2Client.setCredentials(tokens)

  // Check if token is expired and refresh if needed
  if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
    console.log('[GoogleAuth] Token expired, refreshing...')
    
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Update stored tokens
      store.set('google_tokens', {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || tokens.refresh_token,
        expiry_date: credentials.expiry_date,
        token_type: credentials.token_type,
        scope: credentials.scope
      })

      console.log('[GoogleAuth] Token refreshed successfully')
      oauth2Client.setCredentials(credentials)
    } catch (error) {
      console.error('[GoogleAuth] Failed to refresh token:', error)
      throw new Error('Failed to refresh authentication - please sign in again')
    }
  }

  return oauth2Client
}

/**
 * Get stored tokens (for debugging)
 */
export function getStoredTokens() {
  return store.get('google_tokens')
}

/**
 * Fetch Google Calendar events and convert to Magnus Item format
 */
export async function getGoogleEvents(timeMin: string, timeMax: string) {
  try {
    console.log('=== MAIN: Fetching Google Events ===')
    console.log('MAIN: Time range:', { timeMin, timeMax })

    // Check if authenticated
    const tokens = store.get('google_tokens') as any
    if (!tokens || !tokens.access_token) {
      console.log('MAIN: Not authenticated, returning empty array')
      return []
    }

    console.log('MAIN: Authenticated, proceeding with API call...')

    // Get authenticated client (handles token refresh)
    const auth = await getAuthClient()

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth })

    console.log('MAIN: Calling Google Calendar API...')


    // Fetch events from primary calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
      maxResults: 250 // Limit to prevent overwhelming the app
    })

    const events = response.data.items || []
    console.log(`MAIN: Google API responded. Items found: ${events.length}`)
    
    if (events.length > 0) {
      console.log('MAIN: First event sample (RAW):', {
        id: events[0].id,
        summary: events[0].summary,
        start: events[0].start,
        end: events[0].end
      })
    }

    // CRITICAL FIX: DO NOT MAP OR RENAME KEYS HERE.
    // Just return the raw array. Let the Frontend handle the logic.
    console.log(`MAIN: Returning ${events.length} RAW items to renderer.`)
    console.log('=== MAIN: Google Events fetch complete ===')
    return events
  } catch (error: any) {
    console.error('MAIN: Google API Error:', error)
    console.error('MAIN: Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    })
    
    // If auth error, return empty array (user needs to re-authenticate)
    if (error.message?.includes('authentication')) {
      console.log('[GoogleAuth] Authentication error, clearing tokens')
      signOut()
      return []
    }
    
    throw error
  }
}

/**
 * Get stored user profile
 */
export function getUserProfile(): GoogleUserProfile | null {
  const profile = store.get('google_user_profile') as GoogleUserProfile | undefined
  return profile || null
}

/**
 * Delete a Google Calendar event
 * @param eventId The Google Calendar event ID to delete
 */
export async function deleteGoogleEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[GoogleAuth] Deleting Google Calendar event:', eventId)

    // Get authenticated client
    const auth = await getAuthClient()

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth })

    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    })

    console.log('[GoogleAuth] Event deleted successfully:', eventId)
    return { success: true }
  } catch (error: any) {
    console.error('[GoogleAuth] Failed to delete event:', error)
    
    // Handle specific error cases
    if (error.code === 404) {
      return { success: false, error: 'Event not found. It may have already been deleted.' }
    }
    if (error.code === 403) {
      return { success: false, error: 'Permission denied. You may not have access to delete this event.' }
    }
    if (error.message?.includes('authentication')) {
      signOut()
      return { success: false, error: 'Authentication expired. Please sign in again.' }
    }

    return { success: false, error: error.message || 'Failed to delete event' }
  }
}
