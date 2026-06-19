# Store Readiness Notes

This project intentionally supports user-provided OpenCode servers:

- Local/private and VPN/Tailscale URLs may use `http://`.
- Public/VPS URLs should use `https://`.
- Public HTTP is warned in the app but is not blocked unless product policy changes.

## Implemented readiness items

- iOS privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`.
- Cross-platform privacy policy: `docs/privacy-policy.html`.
- iOS ATS allowances for user-provided local/private HTTP and WebView loading.
- iOS `UIRequiredDeviceCapabilities` set to `arm64`.
- iOS Release xcconfig: `ios/release.xcconfig`.
- Android release signing/R8 scaffolding in `android/app/build.gradle`.
- Android network security config remains compatible with user-provided HTTP servers.
- CI sanity checks for lint, tests, build, store-readiness config, and Android debug build.

## Review-risk flags to disclose, not silently remove

1. **Broad navigation / WebView loading**
   - `capacitor.config.ts` allows arbitrary user-provided server hosts.
   - This is required because users connect to their own OpenCode server URLs.

2. **HTTP support**
   - Local/private and VPN/Tailscale servers commonly run without TLS.
   - Public/VPS servers should be HTTPS.
   - Restricting HTTP at the native config level can break valid local/VPN use cases.

3. **Runtime WebView script injection**
   - `src/components/ConnectionShell.vue` injects a small toolbar and keyboard helper into the OpenCode Web UI.
   - The injection is product functionality, not tracking or analytics.
   - See `docs/webview-injection-review.md`.

4. **No crash SDK by default**
   - The privacy policy currently states there is no third-party crash reporting, analytics, advertising, or tracking SDK.
   - Adding Sentry, Firebase Crashlytics, or similar requires updating this policy plus App Store / Play disclosures.

## Manual release checklist

- Run `npm run store:verify`.
- Run `npm run lint`, `npm test`, and `npm run build`.
- Android: configure `android/keystore.properties` or the four `ANDROID_*` signing environment variables before `npm run android:play:bundle`.
- iOS: verify Xcode Release archive uses the expected Apple Developer team and distribution certificate.
- Store forms: complete App Store privacy labels, Play Data Safety, content rating, encryption/export compliance, support URL, and privacy URL.
