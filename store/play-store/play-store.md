# Google Play Draft Metadata

## App name

OpenCode Mobile <Client>

## Short description

Chat with your OpenCode agents anywhere

## Full description

Chat with your agents from your phone while they and the server run on your computer, with full access to your code and tools 🖥️

🔃 Seamlessly continue sessions started on your computer from your phone, or vice versa

(this is an open-source community project, non-official and not affiliated with opencode.ai)

- Features:

🌐 Connect to any OpenCode server over HTTP/HTTPS (LAN or VPN / Tailscale when you're away from home🚶)
📋 Multiple server profiles with auto-connect support
🔑 Basic Auth support (matching OpenCode's OPENCODE_SERVER_PASSWORD)
🎛️ Pull-down menu for server management while connected. Pull to refresh, tap ⋮ to open menu.
❤️ Automatic health checks with exponential reconnect
🔒 Secure storage for passwords (Keychain / EncryptedSharedPreferences)
🌓 Dark theme with light theme support (prefers-color-scheme)
⌨️ Toggleable Enter=newline mode (Enter inserts a newline, Shift+Enter sends the prompt)

If you encounter any issue you're welcome to open a new issue in GitHub or submit PRs!

GitHub repository (code, issues, detailed instructions):
https://github.com/bmpenuelas/opencode-mobile-client


Quick start: Start your OpenCode Server (REQUIRED TO USE THE APP❗)

The app is a client that connects to a OpenCode web server running on the machine where you have your code and build tools. It needs a running web server to connect to.

No authentication:
opencode web --hostname 0.0.0.0 --port 4096

With authentication (recommended):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

When auth is enabled, the username defaults to opencode in the app.

## Data Safety draft

- Data shared with developer: none.
- Data collected by developer: none.
- App activity / analytics: none.
- Crash logs: no third-party crash reporting SDK by default.
- User-provided server URLs/usernames are stored locally on device.
- Passwords are stored locally using Android secure storage.
- Network traffic goes only to OpenCode servers configured by the user.
- Photos and videos: not collected. The camera reads the pairing QR code on the device, and images are not saved or sent anywhere.

## Review notes

- `INTERNET` permission is required to connect to user-configured OpenCode servers.
- `CAMERA` permission is used when the user taps **Scan QR code** to pair with a server, and for photos attached through a file input in the OpenCode Web UI. The camera is optional, so devices without one can still install the app and paste a link.
- Cleartext HTTP is supported for local/private and VPN/Tailscale servers; public/VPS servers should use HTTPS.
- The app warns about public HTTP but does not block it to avoid breaking user-controlled deployments.
- WebView script injection is limited to mobile controls and keyboard behavior for the user-selected OpenCode Web UI.
