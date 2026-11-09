# OpenCode Mobile AR — fork notes

OpenCode Mobile AR is a personal fork of
[bmpenuelas/opencode-mobile-client](https://github.com/bmpenuelas/opencode-mobile-client).
It adds a complete Arabic interface, RTL layout support, and an option to change the
layout direction of the embedded OpenCode WebView.

## Upstream and licence

- **Upstream:** <https://github.com/bmpenuelas/opencode-mobile-client>
- **Licence:** MIT — see [LICENSE](../LICENSE). The upstream copyright notice is
  preserved.
- **Local clone:** `/workspace/opencode-mobile-client`

## Fork identity

| Item | Value |
|---|---|
| App name | `OpenCode Mobile AR` |
| App id (Android/iOS) | `com.opencode.mobile.ar` |
| npm package | `opencode-mobile-client-ar` |
| Version | `1.2.5-ar.1` |
| Working branch | `feat/arabic-rtl` |

Because the app id differs from the published app (`com.logicedge.opencodemobile`),
this build installs as a separate app. Existing data, saved servers, and secure
storage from the store version are **not migrated**; it is a fresh install.

## Remotes

This clone has been reconfigured so that the original repository is the
`upstream` remote:

```bash
git remote -v
# upstream  https://github.com/bmpenuelas/opencode-mobile-client.git (fetch)
# upstream  https://github.com/bmpenuelas/opencode-mobile-client.git (push)
```

When a GitHub repository and token are available, add your own fork as `origin`:

```bash
git remote add origin git@github.com:<your-user>/opencode-mobile-client.git
git push -u origin main
git push -u origin feat/arabic-rtl
```

No `origin` remote is configured yet, so nothing is pushed anywhere except
`upstream` (fetch only in practice).

## Upstream distribution links

`README.md`, `docs/index.html`, the store badges in
`src/components/StoreBadges.vue`, and the in-app "find the code on GitHub" links
in `SettingsScreen.vue` and `HelpScreen.vue` all point to the **published
upstream project** (`com.logicedge.opencodemobile`, GitHub, App Store, VS Code).
Those links are left pointing at upstream on purpose: this fork is a personal
build and is not published on any store or remote yet.

## Injected WebView direction design notes

- **Direction independence:** The OpenCode WebView's layout direction is
  controlled entirely by the **OpenCode interface direction** setting (default `ltr`),
  independently of the app UI language. The injected pull menu layout mirrors (RTL)
  when that setting is `rtl`, while its labels always follow the app UI language.
- **Platform script timing:** On iOS, the direction script installs at
  `.atDocumentStart` and uses a `MutationObserver` to set `dir` as soon as the
  root element appears. On Android, the underlying Capacitor InAppBrowser plugin
  injects `preShowScript` after page load (`onPageFinished`), so a brief initial
  paint before the direction flip is an inherent plugin limitation on Android.

## Syncing upstream changes

Keep local work rebased on top of upstream `main`:

```bash
git fetch upstream
git switch main
git rebase upstream/main
git push origin main

git switch feat/arabic-rtl
git rebase main
git push --force-with-lease origin feat/arabic-rtl
```

Resolve conflicts in the fork-specific files first: the Arabic catalogue in
`src/i18n/index.ts`, the RTL/layout changes in `src/components/`, and the
app identity files (`capacitor.config.ts`, `package.json`, Android resources,
and iOS project files).

## Verifying a build

```bash
npm ci
npm run lint
npm test
npm run build
node scripts/verify-store-readiness.mjs
```

## Manual verification pending

The automated checks cover the web shell, the i18n catalogues, and the persisted
direction preference. The following must be confirmed on a device or simulator
(Android and iOS):

1. Install the app and confirm the launcher name is **OpenCode Mobile AR**.
2. Set the device language to Arabic (or pick العربية in Settings):
   - every shell screen is translated and right-aligned;
   - back arrows point right;
   - URL, username, password fields and displayed server URLs stay left-to-right.
3. Open a server with **OpenCode interface direction** set to `rtl`:
   - the injected pull menu is right-aligned with translated labels;
   - the URL row and toggle knob are mirrored;
   - long Arabic labels wrap without clipping.
4. Switch back to LTR and confirm the original layout is unchanged.
5. Disable network access and confirm Arabic text still renders with a system
   fallback font.
6. Repeat in both light and dark themes.
