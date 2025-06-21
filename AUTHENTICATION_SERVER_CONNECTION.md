# Authentication & Server Connection

## Overview
The Authentication & Server Connection feature handles connecting the mobile app to an AudioBookshelf server instance, authenticating users, and maintaining secure connections. It supports both local authentication and OpenID Connect, with custom headers support for advanced network configurations.

## Key Components

### Pages
- `pages/connect.vue`: Main connection screen for entering server details
- `pages/server-select.vue`: Server selection when multiple servers are configured

### Components
- `components/connection/ServerConnectForm.vue`: Form for server URL and credentials input
- `components/connection/ServerUrlTextInput.vue`: Specialized input for server URLs with validation
- `components/connection/CustomHeadersForm.vue`: Form for adding custom HTTP headers
- `components/app/ConnectionIndicator.vue`: Visual indicator of connection status

### Store Modules
- `store/user.js`: User authentication state and token management
- `store/servers.js`: Server configuration and management

### Services
- `plugins/serverHandler.js`: Core server communication logic
- `services/AbsSocketIO.js`: WebSocket connection management
- `services/ApiService.js`: HTTP API communication

## Authentication Flow

### 1. Server Connection
```javascript
// Server validation flow in serverHandler.js
1. User enters server URL
2. App attempts HTTPS connection first
3. Falls back to HTTP if HTTPS fails and user allows
4. Validates server is AudioBookshelf instance via /ping endpoint
5. Stores server configuration
```

### 2. Local Authentication
```javascript
// Login flow
POST /login
{
  username: string,
  password: string
}
Response: {
  user: UserObject,
  userDefaultLibraryId: string,
  serverSettings: ServerSettingsObject,
  ereaderDevices: Array,
  Source: "mobile"
}
```

### 3. OpenID Connect Flow
```javascript
// OAuth flow with PKCE
1. Generate code verifier and challenge
2. Open browser to /auth/openid/mobile-redirect
3. Handle callback to abs://oauth
4. Exchange code for token
5. Store authentication token
```

## Data Models

### Server Configuration
```javascript
{
  id: string,           // UUID v4
  name: string,         // Display name
  address: string,      // Server URL
  customHeaders: [{     // Optional custom headers
    name: string,
    value: string
  }],
  userId: string,       // Authenticated user ID
  username: string,     // For display
  token: string         // JWT auth token
}
```

### Device Data
```javascript
{
  deviceId: string,         // Unique device identifier
  name: string,             // Device name
  clientName: "Audiobookshelf Mobile",
  clientVersion: string,    // App version
  deviceInfo: {
    manufacturer: string,
    model: string,
    platform: string,
    osVersion: string
  }
}
```

## API Endpoints

### Authentication
- `POST /login`: Local authentication
- `GET /auth/openid/mobile-redirect`: OAuth initiation
- `POST /auth/openid/callback`: OAuth token exchange
- `POST /logout`: End session

### Server Status
- `GET /ping`: Validate server instance
- `GET /api/authorize`: Validate token
- `POST /api/syncUserAudiobookData`: Initial data sync

## Security Considerations

1. **HTTPS Enforcement**: Always attempts HTTPS first, requires user consent for HTTP
2. **Token Storage**: JWT tokens stored securely in local database
3. **PKCE Implementation**: Protects OAuth flow from interception
4. **Custom Headers**: Supports authentication proxies and reverse proxies
5. **Session Management**: Automatic token refresh and logout on 401

## Error Handling

### Connection Errors
- Invalid URL format
- Network unreachable
- Server not responding
- Invalid SSL certificate (with override option)

### Authentication Errors
- Invalid credentials
- Account locked
- Server configuration issues
- OAuth flow interruption

## State Management

### Vuex Store Structure
```javascript
user: {
  user: null,          // Current user object
  settings: {},        // User preferences
  serverConnectionConfig: null,
  serverSettings: {},  // Server-side settings
  libraryItemProgress: {}, // Playback progress cache
}

servers: {
  servers: [],         // All configured servers
  currentServerAddress: null
}
```

## WebSocket Connection

The app maintains a persistent WebSocket connection for real-time updates:
- Progress sync
- Library updates
- Download status
- Server events

### Socket Events
- `connect`: Establishes connection
- `disconnect`: Handles reconnection
- `authenticate`: Sends auth token
- `user_updated`: Updates user data
- `library_updated`: Refreshes library data

## Custom Headers Support

Allows configuration of custom HTTP headers for:
- Reverse proxy authentication
- API gateway requirements
- Custom authentication schemes
- CORS bypass

## Best Practices

1. **Server URL**: Always include protocol (https:// or http://)
2. **Custom Headers**: Use for proxy authentication, not primary auth
3. **Multiple Servers**: Each server maintains separate auth state
4. **Token Expiry**: App handles automatic re-authentication
5. **Network Changes**: Connection indicator shows real-time status

## Troubleshooting

### Common Issues
1. **"Failed to connect"**: Check server URL and network
2. **"Invalid server"**: Ensure connecting to AudioBookshelf instance
3. **"Authentication failed"**: Verify credentials or OAuth configuration
4. **"Connection timeout"**: Check firewall and proxy settings

### Debug Information
- Connection logs available in Settings > Logs
- Server response details in error messages
- WebSocket status in connection indicator