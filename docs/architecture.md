# Architecture

## Overview

OpenCode Mobile is a Vue 3 + TypeScript application running inside a Capacitor WebView on Android and iOS. It wraps the OpenCode Web UI by embedding it in an iframe, providing a native-feeling mobile shell with server management, secure credential storage, and connection lifecycle handling.

---

## Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI Framework | Vue 3 (Composition API) | Lightweight, modern reactive framework |
| Language | TypeScript (strict) | Type safety across the codebase |
| State Management | Pinia | Official Vue 3 state management |
| Routing | Vue Router 5 | SPA routing with typed routes |
| Mobile Shell | Capacitor 8 | Access to native APIs (HTTP, storage, bars) |
| Secure Storage | `@aparajita/capacitor-secure-storage` | Keychain (iOS) + EncryptedSharedPreferences (Android) |
| Preferences | `@capacitor/preferences` | Non-sensitive metadata storage |
| Testing | Vitest + jsdom | Fast, Vite-native test runner |
| Styling | Plain CSS | No framework lock-in, dark/light via `prefers-color-scheme` |

---

## Component Tree

```
App.vue
└── <router-view>
    ├── LandingScreen.vue           (path: /)
    │   ├── StatusDot.vue
    │   └── Buttons: Connect, Add, Manage, Settings
    │
    ├── ServerList.vue              (path: /servers)
    │   └── ServerCard (inline)
    │       ├── StatusDot.vue
    │       └── Actions: Connect, Edit, Duplicate, Default, Delete
    │
    ├── ServerProfileForm.vue       (path: /servers/new, /servers/:id/edit)
    │
    ├── SettingsScreen.vue          (path: /settings)
    │
    └── ConnectionShell.vue         (path: /connect/:id)
        ├── <iframe>               (full-screen, OpenCode UI)
        ├── ChevronHandle          (top center, fixed)
        ├── TopPullMenu.vue        (overlay panel)
        │   ├── StatusDot.vue
        │   └── Actions: Reconnect, Refresh, Switch, Edit, Disconnect
        ├── DisconnectedBanner
        ├── LoadingOverlay
        └── FrameBlockedOverlay
```

---

## Data Flow

### Profile Management

```
User → ServerProfileForm → serverStore.add/update → profileStorage (Preferences) + secureSecretStorage (Keychain/SP)
```

### Connection Lifecycle

```
1. User taps "Connect" on a server profile
2. serverStore.getPassword(profileId) → secureSecretStorage
3. connectionStore.connect(profileId):
   a. state → 'checking'
   b. health.check(baseUrl, credentials) → native HTTP HEAD/GET
   c. On success → state → 'connected', start health poll interval
   d. On 401 without stored pw → state → 'auth_required'
   e. On 401 with stored pw → state → 'wrong_credentials'
   f. On network error → state → 'unreachable'
4. On 'connected': router navigates to /connect/:id
5. ConnectionShell builds iframe URL (with embedded Basic Auth if needed)
6. Every 10s (configurable): health poll checks connectivity
7. On health failure: state → 'disconnected', start exponential reconnect
8. Reconnect: 1s, 2s, 4s, 8s, 15s, 30s (configurable)
```

### Health Check

```
checkServerHealth(options):
  normalizedUrl = normalizeUrl(baseUrl) + "/"
  headers = {}
  if auth enabled: headers.Authorization = "Basic base64(user:pass)"

  if native platform:
    CapacitorHttp.request({ method: "HEAD", url, headers, timeout })
  else:
    fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(timeout) })

  classify by status code:
    2xx/3xx → 'connected'
    401 without auth → 'auth_required'
    401 with auth → 'wrong_credentials'
    network error / timeout → 'unreachable'
```

---

## Route Design

| Path | Component | Purpose |
|---|---|---|
| `/` | `LandingScreen` | Default — show app status, CTA buttons |
| `/servers` | `ServerList` | List all saved server profiles |
| `/servers/new` | `ServerProfileForm` | Create new server |
| `/servers/:id/edit` | `ServerProfileForm` | Edit existing server |
| `/settings` | `SettingsScreen` | Timeout, poll interval, reconnect toggle |
| `/connect/:id` | `ConnectionShell` | Full-screen iframe + menu overlay |

---

## State Management

### serverStore (Pinia)

- `profiles: ServerProfile[]` — all saved server profiles
- `loading: boolean` — loading state
- `load()` — load from Preferences on app start
- `add(data)` — create new profile
- `update(id, data)` — update fields
- `remove(id)` — delete profile + its stored password
- `duplicate(id)` — copy with "(copy)" suffix
- `setDefault(id)` — set as default, unset others
- `getPassword(id)` / `setPassword(id, pw)` / `deletePassword(id)` — secret storage

### connectionStore (Pinia)

- `state: ConnectionState` — current connection state machine
- `activeServerId` — currently connected server
- `reconnectAttempt` — counter for exponential backoff
- `healthCheckTimeout` / `healthPollInterval` / `exponentialReconnectEnabled` — settings
- `connect(id)` — run health check, transition to connected on success
- `disconnect()` — stop health poll, reset state
- `cancelReconnect()` — stop reconnection attempts
- `setFrameBlocked()` — mark iframe embedding as failed

---

## Storage Layer

```
getSecretStorage():
  if Capacitor.isNativePlatform() → secureSecretStorage
  else → webDevSecretStorage
```

### profileStorage

- Uses `@capacitor/preferences` to store JSON array of `ServerProfile`
- No sensitive data (passwords stored separately)

### secureSecretStorage

- Uses `@aparajita/capacitor-secure-storage`
- Keys prefixed with `opencode_pw_` + profile ID
- Only available on native platforms

### webDevSecretStorage

- Uses `localStorage` with prefix `opencode_dev_pw_`
- Logs console warning on each access
- Only intended for browser dev/testing

---

## Security Architecture

### Principles

1. **Separation of concerns**: Passwords stored separately from profile metadata
2. **No credential logging**: `sanitizeUrlForDisplay()` strips credentials before any display/log
3. **No credential-in-URL persistence**: The full credential URL is built at iframe `src` assignment time only
4. **Platform secure storage**: Native keychain/encrypted preferences on device

### What is stored where

| Data | Storage | Notes |
|---|---|---|
| Server name, URL, flags | `@capacitor/preferences` | Plain JSON |
| Password | `@aparajita/capacitor-secure-storage` | Encrypted at rest |
| iframe URL (with credentials) | Never stored | Built fresh each time |
| Auth header | Never stored | Built fresh each health check |

---

## Platform Integration

### Android

- Cleartext HTTP via network security config
- Capacitor back button handler
- SystemBars for status/navigation bar styling

### iOS

- ATS configured for local networking (`NSAllowsLocalNetworking`)
- Safe area via `viewport-fit=cover` + `env(safe-area-inset-*)` CSS
- `apple-mobile-web-app-status-bar-style: black-translucent`

### Web (dev only)

- Vite dev server at `localhost:5173`
- localStorage fallback for secrets (with warning)
- CORS-dependent health checks

---

## Testing Strategy

| Test file | What it covers |
|---|---|
| `url.test.ts` | normalizeUrl, validateUrl, sanitizeUrlForDisplay, buildIframeUrl |
| `auth.test.ts` | buildBasicAuthHeader, encodeBasicAuthCredentials |
| `profileStorage.test.ts` | CRUD operations, default selection, duplication |
| `connectionState.test.ts` | State transitions, connect/disconnect flows |

Tests use Vitest with jsdom environment. Capacitor plugins are mocked.
