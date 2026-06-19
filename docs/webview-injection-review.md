# WebView Injection Review

`src/components/ConnectionShell.vue` injects JavaScript into the user-selected OpenCode Web UI through `InAppBrowser.executeScript`.

## Intended behavior

- Add a small in-WebView Options tab.
- Provide refresh/back/forward/browser/close actions.
- Show connection status and sanitized display host.
- Add the `Enter = newline` toggle for prompt editing.
- Hide the redundant OpenCode server tab in the embedded mobile UI.
- Close the mobile sidebar after session navigation.

## Safety constraints

- The injected script must not log credentials or full credential-bearing URLs.
- The displayed URL is derived from the configured base URL with the scheme removed; credentials are not included.
- Dynamic string values are serialized before injection to avoid breaking the script when a user-provided URL contains special characters.
- No analytics, tracking, crash reporting, or third-party network calls are added by the injected script.
- The script runs only after the user explicitly opens a configured server in the native WebView.

## Review-risk note

Runtime script injection is used because OpenCode Mobile wraps a user-controlled OpenCode Web UI and needs native mobile controls inside that WebView. Do not remove or broaden the injection without re-reviewing these constraints.
