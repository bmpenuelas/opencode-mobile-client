# App Store Draft Metadata

## App name

OpenCode Mobile

## Subtitle

Mobile client for OpenCode servers

## Promotional text

Connect to your own OpenCode Web server from iPhone or iPad over LAN, VPN/Tailscale, or HTTPS.

## Description

OpenCode Mobile is an unofficial mobile client for OpenCode Web. It lets you connect to an OpenCode server you control, manage saved server profiles, authenticate with Basic Auth when needed, and use the OpenCode web interface from a native mobile shell.

Recommended setup:

- Local/private servers may use HTTP on trusted LAN or VPN/Tailscale networks.
- Public/VPS servers should use HTTPS.
- Use strong authentication before exposing any OpenCode server.

This app does not include an OpenCode server. You must run OpenCode separately on a machine you control.

## Keywords

opencode, coding agent, developer tools, remote coding, web client, ssh alternative, ai coding

## Support URL

https://github.com/bmpenuelas/opencode-mobile-client/issues

## Privacy policy URL

Use the published GitHub Pages URL for `docs/privacy-policy.html`.

## Review notes

- The app connects only to server URLs configured by the user.
- HTTP support is needed for local/private and VPN/Tailscale OpenCode servers; public/VPS servers should use HTTPS.
- Broad WebView navigation is intentional because server hosts are user-provided.
- Runtime WebView script injection adds mobile controls and keyboard behavior only; it does not track users or collect analytics.
- No third-party analytics, advertising, or crash-reporting SDK is integrated by default.

## App Privacy draft

- Data collected by developer: none.
- Tracking: no.
- Third-party analytics: no.
- Crash reporting: no third-party crash reporting SDK by default.
- Data stored locally: server profile names, URLs, usernames, and passwords in platform secure storage.
