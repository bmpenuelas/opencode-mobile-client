# WebView Injection Review

`src/components/ConnectionShell.vue` injects JavaScript into the user-selected OpenCode Web UI through `InAppBrowser.executeScript`.

## Intended behavior

- Add a small in-WebView Options tab.
- Provide refresh/back/forward/browser/close actions.
- Show connection status and sanitized display host.
- Add the `Enter = newline` toggle for prompt editing.
- Route downloads through the native device flow via `handleDownloads`, and show a transient in-WebView toast when a download completes or fails.
- Hand `<a download>` files from the WebView to the host in chunks, so they are written as real files and the phone's share sheet lets the user choose where to save them (instead of the plugin's in-WebView text preview).
- Repoint sandboxed HTML preview frames from their `blob:` URL to the server's raw file route, keeping the file's directory in the URL so relative CSS/images/fonts resolve, and adding `allow-same-origin` so same-origin fonts load. The frame is served as a normal document, so it does not inherit the UI's strict `script-src` policy either.
- Turn a long-press on a workspace file row into an HTML5 drag, so a file can be dragged into the chat composer on touch devices.
- Wrap `navigator.clipboard.writeText` so copy buttons write to the phone clipboard, including servers served over plain HTTP where the Clipboard API is unavailable.
- Send links tapped in the OpenCode Web UI that point to another origin to the device browser, so they open outside the embedded session.
- Hide the redundant OpenCode server tab in the embedded mobile UI.
- Close the mobile sidebar after session navigation.

## Safety constraints

- The injected script must not log credentials or full credential-bearing URLs.
- The clipboard bridge only wraps `navigator.clipboard.writeText`; it never reads the clipboard and never sends copied text off the device.
- The link bridge only forwards the tapped link's own URL to the host app, and only when it is an `http`/`https` address on another origin than the OpenCode server. The host app re-validates the scheme before opening it and never logs the URL.
- The download bridge only reads the `blob:`/same-origin URL and filename the page already put on the download anchor; it never downloads anything the user did not trigger, and it never leaves the device.
- The preview bridge only swaps a sandboxed preview frame to the same server's raw file route (`/api/fs/read/<path>`), reusing the path the UI already shows, and only after a same-origin fetch confirms the response is HTML.
- The chat drag bridge only reads the `data-item-path` the file tree already exposes and replays it as a normal drag and drop; it never uploads or forwards the path anywhere else.
- The displayed URL is derived from the configured base URL with the scheme removed; credentials are not included.
- Dynamic string values are serialized before injection to avoid breaking the script when a user-provided URL contains special characters.
- No analytics, tracking, crash reporting, or third-party network calls are added by the injected script.
- The script runs only after the user explicitly opens a configured server in the native WebView.

## Review-risk note

Runtime script injection is used because OpenCode Mobile wraps a user-controlled OpenCode Web UI and needs native mobile controls inside that WebView. Do not remove or broaden the injection without re-reviewing these constraints.
