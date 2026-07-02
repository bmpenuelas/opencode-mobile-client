# OpenCode Mobile &lt;Client&gt; 📱

💫 A lightweight mobile client that wraps the [OpenCode Web](https://opencode.ai/docs/web/) UI as native Android and iOS apps. Connects to an already-running OpenCode server over LAN or VPN / Tailscale.

Chat with your agents from your phone while they and the server run on your computer, with full access to your code and tools 🖥️

🔃 Seamlessly continue sessions started on your computer from your phone, or vice versa

---

## Features

- 🌐 Connect to any OpenCode server over HTTP/HTTPS (LAN or VPN /
            Tailscale when you're away from home🚶)
- 📋 Multiple server profiles with auto-connect support
- 🔑 Basic Auth support (matching OpenCode's `OPENCODE_SERVER_PASSWORD`)
- 🎛️ Pull-down menu for server management while connected. Pull to refresh, tap ⋮ to open menu.
- ❤️ Automatic health checks with exponential reconnect
- 🔒 Secure storage for passwords (Keychain/EncryptedSharedPreferences)
- 🌓 Dark theme with light theme support (`prefers-color-scheme`)
- ⌨️ Toggleable Enter=newline mode (Enter inserts a newline, Shift+Enter sends the prompt)

---

## How to start your OpenCode Server (REQUIRED TO USE THE APP❗)

The app is a client that connects to a opencode web server running on the machine where you have your code and build tools. It needs a running web server to connect to.

### No authentication

```bash
opencode web --hostname 0.0.0.0 --port 4096
```

### With authentication (recommended)

```bash
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096
```

When auth is enabled, the username defaults to `opencode` in the app. Find more options in the [official docs](https://opencode.ai/docs/web/).

---

## Troubleshooting

### Cannot connect

- Verify the server is running: `opencode serve --hostname 0.0.0.0 --port 4096`
- Verify the URL is correct. Try `curl http://your-server:4096/` from another device on the same network.
- Check that the port is not firewalled.
- Ensure the server is listening on `0.0.0.0` (not `127.0.0.1`, which would only accept local connections).

### Auth required

- The server returned HTTP 401 and no password is stored in the app.
- Go to Edit Server and set the password that matches `OPENCODE_SERVER_PASSWORD`.

### Wrong credentials

- The stored username or password does not match the server.
- Try connecting with the correct credentials via curl first: `curl -u opencode:your-password http://server:4096/`

### Blank iframe

- The health check succeeded but the iframe shows nothing after 8 seconds.
- The OpenCode Web UI may be sending headers that block embedding (`X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`).
- Workaround: Use the "Open in isolated native webview" option from the menu (requires `@capgo/capacitor-inappbrowser`).

### HTTP blocked on Android/iOS

- Android: Ensure `android:networkSecurityConfig` allows cleartext (see Android Setup above).
- iOS: Ensure `NSAllowsLocalNetworking` is set in `Info.plist` (see iOS Setup above).

### Works in native app but not browser dev mode (CORS)

- This is expected. The web dev server at `localhost:5173` has a different origin than your OpenCode server.
- Use the native app build, or configure the OpenCode server to allow your dev origin via CORS headers.
- The `CapacitorHttp` plugin bypasses CORS on native, which is why health checks work in the app.

### Server reachable but embedding blocked

- Some OpenCode deployments may send `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`.
- The app detects this after 8 seconds and offers a "Refresh" button.
- If the issue persists, use the menu → "Open in isolated native webview" fallback.

---

## Contributing

PRs are welcome!

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- For native builds:
  - **Android**: Android Studio, JDK 17, Android SDK 34+
  - **iOS**: Xcode 15+ (macOS only)

### Development (UI only - for functionality related to the opencode webview you need to test on a native platform, bot Android and iOS are supported)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. The web target is for development and quick UI testing only. CORS may block health checks from the browser — test native builds for full functionality.

### Android

```bash
npm install
npm run build
npx cap add android
npx cap sync
npx cap open android
```

In Android Studio, build and run on a device/emulator.

### iOS

```bash
npm install
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

In Xcode, build and run on a device/simulator.

---

## Commands Reference

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (web) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | TypeScript type-check only |
| `npm run cap:sync` | Sync Capacitor native projects |
| `npm run cap:add:android` | Add Android platform |
| `npm run cap:add:ios` | Add iOS platform |
| `npm run cap:open:android` | Open Android project in Android Studio |
| `npm run cap:open:ios` | Open iOS project in Xcode |
| `npm run store:verify` | Check store-readiness config files and release scaffolding |
| `npm run android:play:bundle` | Build a signed Android App Bundle for Play Console (requires signing config) |
| `npm run android:play:apk` | Build a signed Android release APK (requires signing config) |

---

## Project Structure

```
src/
  main.ts                          App entry
  App.vue                          Root component
  types.ts                         TypeScript type definitions
  router/index.ts                  Vue Router config
  stores/
    serverStore.ts                 Pinia store for server profiles
    connectionStore.ts             Pinia store for connection state
  services/
    storage/
      profileStorage.ts            Server profile CRUD via Preferences
      secureSecretStorage.ts       Password storage via Keychain/EncryptedSP
      webDevSecretStorage.ts       localStorage fallback for web dev
      index.ts                     Storage adapter factory
    opencode/
      url.ts                       URL normalization, validation, sanitization
      auth.ts                      Basic Auth header generation
      health.ts                    Server health check via native HTTP
    platform/
      systemBars.ts                Status/navigation bar configuration
      backButton.ts                Android back button handler
  components/
    LandingScreen.vue              App landing page
    ServerList.vue                 Server profile list
    ServerProfileForm.vue          Add/edit server form
    ConnectionShell.vue            Full-screen iframe shell
    TopPullMenu.vue                Pull-down menu overlay
    StatusDot.vue                  Status indicator
    SettingsScreen.vue             App settings
    ConfirmDialog.vue              Reusable confirmation dialog
  styles/
    base.css                       Global styles, buttons, dark/light theme
    safe-area.css                  Safe-area CSS variables
  tests/
    url.test.ts                    URL unit tests
    auth.test.ts                   Auth unit tests
    profileStorage.test.ts         Profile storage unit tests
    connectionState.test.ts        Connection state unit tests
```

---

## Security Notes

### LAN HTTP is acceptable for trusted local networks only

The app allows connecting to HTTP servers because OpenCode servers commonly run on LAN without TLS. HTTP traffic should never traverse the public internet.

### For remote access, use a VPN or HTTPS reverse proxy

- **Recommended**: Tailscale, WireGuard, or OpenVPN to securely extend your LAN
- **Alternative**: Put OpenCode behind an HTTPS reverse proxy (Caddy, Nginx, Traefik) with proper TLS termination
- **Public/VPS servers**: use HTTPS. The app may warn on public HTTP, but does not block it unless product policy changes.

**Do not expose OpenCode directly to the public internet without strong authentication and transport security.**

### Password storage

- **Native (Android/iOS)**: Passwords are stored in platform secure storage — Android EncryptedSharedPreferences and iOS Keychain — via `@aparajita/capacitor-secure-storage`.
- **Web (development only)**: Passwords fall back to `localStorage` with the prefix `opencode_dev_pw_`. A console warning is shown on each access. This is **insecure** and only suitable for local development.
- Passwords are never logged, never shown in the UI by default, and never included in error messages.
- The `sanitizeUrlForDisplay()` helper strips credentials from URLs before display or logging.

### Iframe authentication compromise

When Basic Auth is enabled, the app constructs an iframe URL with embedded credentials (`http://username:password@host:port/`) because browsers do not allow setting custom `Authorization` headers on iframe requests. This credential-in-URL approach is a known limitation:

- The full-credential URL is built only at the moment of iframe `src` assignment and is **never stored**.
- It is **never logged** or displayed.
- For production remote access, prefer HTTPS + VPN to avoid passing credentials in URLs.

### Auth-less mode

When authentication is disabled on the server, the iframe loads the plain URL without any credentials.

---

## Known Limitations

1. **iframe authentication**: Basic Auth credentials must be passed in the iframe URL (browser security restriction). Credentials are never stored in this form.
2. **Frame-blocking headers**: Some OpenCode deployments may block iframe embedding. The app detects this and offers a fallback native webview option.
3. **Web dev CORS**: Health checks in browser dev mode may be blocked by CORS. Native builds use `CapacitorHttp` which bypasses this.
4. **Single iframe**: Only one OpenCode session at a time. The app shows one server's UI in the full screen.
5. **No server push notifications**: The app does not receive background push from OpenCode, but web notifications emitted by the connected OpenCode UI are re-emitted as local native notifications while the WebView is open.

---

## Store Release Readiness

Store-readiness notes, review-risk flags, and draft listing metadata live in:

- `docs/store-readiness.md`
- `docs/webview-injection-review.md`
- `store/`

Before release, run:

```bash
npm run store:verify
npm run lint
npm test
npm run build
```

---

## License

MIT
