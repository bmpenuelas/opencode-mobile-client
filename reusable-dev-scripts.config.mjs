import { defineConfig } from 'reusable-dev-scripts'

// One row per store listing language: `app` is the draft file code, `android`/`ios` are the folder
// names supply (Google Play) and deliver (App Store) expect. Keep in step with ASC and Play Console.
const LOCALES = [
  { app: 'en-US', android: 'en-US', ios: 'en-US' },
  { app: 'de-DE', android: 'de-DE', ios: 'de-DE' },
  { app: 'es-ES', android: 'es-ES', ios: 'es-ES' },
  { app: 'fr-FR', android: 'fr-FR', ios: 'fr-FR' },
  { app: 'hi-IN', android: 'hi-IN', ios: 'hi' },
  { app: 'id-ID', android: 'id', ios: 'id' },
  { app: 'it-IT', android: 'it-IT', ios: 'it' },
  { app: 'ja-JP', android: 'ja-JP', ios: 'ja' },
  { app: 'ko-KR', android: 'ko-KR', ios: 'ko' },
  { app: 'pt-PT', android: 'pt-PT', ios: 'pt-PT' },
  { app: 'ru-RU', android: 'ru-RU', ios: 'ru' },
  { app: 'th-TH', android: 'th', ios: 'th' },
  { app: 'tr-TR', android: 'tr-TR', ios: 'tr' },
  { app: 'vi-VN', android: 'vi', ios: 'vi' },
  { app: 'zh-Hans-CN', android: 'zh-CN', ios: 'zh-Hans' },
]

export default defineConfig({
  version: 1,
  capacitor: { platforms: ['android', 'ios'] },
  android: { appId: 'com.logicedge.opencodemobile' },
  store: {
    root: 'store',
    locales: LOCALES,
    defaultLocales: { android: 'en-US', ios: 'en-US' },
    iosDevices: { iphone: true, ipad: true, watch: false },
    androidId: 'com.logicedge.opencodemobile',
    iosId: 'com.logicedge.opencodemobile',
    // Keys live outside the checkout, in the same files the other Logic Edge apps use (the variables
    // fastlane reads). Never commit their contents.
    allowExternalCredentials: true,
    playKey: process.env.SUPPLY_JSON_KEY,
    appleKey: process.env.APP_STORE_CONNECT_API_KEY_PATH,
    iosProject: 'ios/App/App.xcodeproj',
    iosScheme: 'App',
    // Git policy stays in the app: after the store accepted a build, commit and push the version files.
    hooks: { afterBuildUpload: [['node', 'scripts/commit-publish.mjs', '{platform}']] },
  },
})
