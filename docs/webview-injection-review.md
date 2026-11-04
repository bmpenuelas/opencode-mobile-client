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

## Status on OpenCode v2

The v2 web UI was rebuilt, so most selectors written for v1 match nothing there. They fail silently and stay in place for v1 servers. Checked against the v2.2.5 UI at 320px and 375px wide:

| Injection | On v2 | Why |
|---|---|---|
| Options tab and pull-down menu | Works | Adds its own elements. It covers the middle of a long session title. |
| Notification bridge | Not re-tested | Replaces `window.Notification`, so it doesn't depend on the page's markup. |
| Enter = new line | Works | Matches `composer-editor`, and leaves Enter alone while `composer-suggestions` is open so it can pick a `/` or `@` item. |
| Narrow composer fix | Not needed | The v2 composer fits and Send stays on screen. |
| Sidebar auto-close | Not needed | v2 has no `sidebar-nav-mobile`; it uses a tabs drawer. |
| Reload on resume | Not needed | The v2 UI reconnected to a restarted server by itself and kept the draft. Resuming a suspended phone was not tested. |
| Hiding full-screen errors | Unknown | Its error text is specific to v1, and it was not seen on v2. |

