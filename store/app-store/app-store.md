# App Store Draft Metadata

## App name

OpenCode Mobile

## Subtitle

Mobile client for OpenCode servers

## Promotional text

Chat with your OpenCode agent on your phone - continue conversations or start new ones seamlessly

## Description

Seamlessly continue OpenCode sessions started on your computer from your phone, or continue mobile sessions back on your computer.

(this is an open source community project. It is unofficial and is not affiliated with opencode.ai)

FEATURES:

◆ Connect to any OpenCode server over HTTP or HTTPS, whether on your local network or remotely through a VPN such as Tailscale.
◆ Create multiple server profiles and automatically connect to your preferred server.
◆ Basic Auth support, including OpenCode servers configured with OPENCODE_SERVER_PASSWORD.
◆ Pull down while connected to access server management. Pull to refresh or open the menu to switch and manage servers.
◆ Automatic server health checks with exponential reconnect when the connection is interrupted.
◆ Secure password storage using Keychain.
◆ Dark and light themes with automatic system theme support.
◆ Optional Enter newline mode. Enter inserts a new line and Shift+Enter sends the prompt.
◆ OPEN SOURCE

Found a bug or have an idea for an improvement?

Contributions are welcome. You can report issues, suggest features, or submit pull requests on GitHub.

GitHub repository:
https://github.com/bmpenuelas/opencode-mobile-client

◆ QUICK START:

An OpenCode server is required to use the app.

The app acts as a client and connects to an OpenCode web server running on the computer where your source code and development tools are located.

► Without authentication

opencode web --hostname 0.0.0.0 --port 4096

► With authentication

Authentication is recommended when the server is accessible beyond your trusted local network.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

When authentication is enabled, the default username in the app is: opencode

## Keywords

opencode, mobile, ai, agent, client, remote, coding

## Support URL

https://github.com/bmpenuelas/opencode-mobile-client/issues

## Privacy policy URL

Use the published GitHub Pages URL for `docs/privacy-policy.html`.

## Review notes

OpenCode Mobile does not include, create, configure, manage, or monitor any VPN functionality. It does not use NetworkExtension, a packet-tunnel provider, an app-proxy provider, or any VPN entitlement.
References to VPN or Tailscale only explain that a user may independently use an existing VPN/private network to reach their own self-hosted OpenCode server. The app uses the device’s normal network connection and does not inspect, route, capture, or alter VPN traffic.
What user information is collected using VPN?
None. The app does not have any VPN functionality and therefore it does not collect any user information using VPN.

Why is this information collected?
No VPN-related information is collected or used for any purpose. (the app does not even have any VPN functionality at all)

Is this data shared with third parties or stored elsewhere?
No. The app does not have any VPN functionality. So no VPN data is collected and therefore no VPN-related data is shared with third parties or stored on developer-controlled servers.

The app stores user-configured server profile details locally on the device: profile name, server URL, and username in local app storage; passwords are stored in the iOS Keychain. The app has no developer-operated backend, analytics, advertising, or crash-reporting service.
When a user connects, requests are sent directly to the OpenCode server they configured and control. Any data handled by that server is governed by that server owner’s practices, not collected by this app.

1- Regarding Guideline 2.3.10 - Performance - Accurate Metadata

Thank you. We have updated the App Store description to remove Android references.

2- Regarding Guideline 2.1 - Information Needed

For testing, please use the app’s built-in demo account:

Host: http://192.168.1.123:4096
Username: demo_user_1234
Password: demo_password_12345678

Testing steps:

1- Open the app and select Add Server.
2- Enter any server name.
3- Tap "Use URL and password instead", enter the host and enable Authentication.
4- Enter the demo username and password above.
5- Save the server profile and select Connect.

This demo account activates an in-app demonstration session for App Review and does not access a live server or contain personal, customer, or production data.

This app is a client. So for regular use, it connects to an OpenCode server that the user runs on their own computer or server, therefore they will connect to their own host and use their own login details.

## App Privacy draft

- Data collected by developer: none.
- Tracking: no.
- Third-party analytics: no.
- Crash reporting: no third-party crash reporting SDK by default.
- Data stored locally: server profile names, URLs, usernames, and passwords in platform secure storage.
- Camera: used when the user taps **Scan QR code** to pair with a server, and for photos attached through a file input in the OpenCode Web UI. The QR code is read on the device, and images are not saved or sent anywhere, so this adds no data type to the App Privacy answers.
