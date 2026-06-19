# Google Play Draft Metadata

## App name

OpenCode Mobile

## Short description

Connect to your own OpenCode Web server from Android.

## Full description

OpenCode Mobile is an unofficial Android client for OpenCode Web. Connect to an OpenCode server you control, save multiple server profiles, authenticate with Basic Auth when needed, and use the OpenCode web interface from a mobile-friendly native shell.

The app is for developers who already run OpenCode on their own computer, LAN server, VPN/Tailscale network, or HTTPS VPS.

Security recommendations:

- Local/private and VPN/Tailscale servers may use HTTP on trusted networks.
- Public/VPS servers should use HTTPS.
- Use strong authentication before exposing OpenCode outside your trusted network.

This app does not include or host an OpenCode server.

## Data Safety draft

- Data shared with developer: none.
- Data collected by developer: none.
- App activity / analytics: none.
- Crash logs: no third-party crash reporting SDK by default.
- User-provided server URLs/usernames are stored locally on device.
- Passwords are stored locally using Android secure storage.
- Network traffic goes only to OpenCode servers configured by the user.

## Review notes

- `INTERNET` permission is required to connect to user-configured OpenCode servers.
- Cleartext HTTP is supported for local/private and VPN/Tailscale servers; public/VPS servers should use HTTPS.
- The app warns about public HTTP but does not block it to avoid breaking user-controlled deployments.
- WebView script injection is limited to mobile controls and keyboard behavior for the user-selected OpenCode Web UI.
