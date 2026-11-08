# OpenCode Mobile AR (Phase 0+1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a personal fork named OpenCode Mobile AR with a complete Arabic UI, correct RTL layout, and an optional RTL direction for the embedded OpenCode WebView.

**Architecture:** Extend the existing single-file i18n module with an `ar` catalogue and direction helpers; flip direction through the `dir` attribute on `<html>`; convert the few physical Tailwind utilities in the shell to logical ones; inject only `document.documentElement.dir` into the OpenCode WebView, controlled by a persisted setting.

**Tech Stack:** Vue 3, TypeScript, Capacitor 8, Tailwind CSS 4, Pinia, Vitest + jsdom, Android Gradle, Xcode project files.

**Spec:** `docs/superpowers/specs/2026-11-08-opencode-mobile-ar-design.md`

## Global Constraints

- App name is exactly `OpenCode Mobile AR`; app id is exactly `com.opencode.mobile.ar`; package version is `1.2.5-ar.1`.
- Arabic copy is Modern Standard Arabic (فصحى مبسّطة), concise, suitable for a compact mobile UI.
- Keep placeholders (`{name}`, `{url}`), HTML tags (`<strong>`, `<code>`, `<a>`), and URLs unchanged inside translations.
- Keep these Latin: `OpenCode`, `OpenCode Web`, `GitHub`, `Tailscale`, `Google Play`, `App Store`, `VS Code`, `LTR`, `RTL`, `URL`, `Pinia`, `WebView`.
- Terminology: server = خادم، session = جلسة، connection = اتصال، reconnect = إعادة الاتصال، settings = الإعدادات، notifications = الإشعارات، default = افتراضي، password = كلمة المرور، username = اسم المستخدم، health check = فحص الاتصال.
- Arabic must not use `letter-spacing`; use a normal line height.
- `ar` must contain every key in `en-US`. Other locales may remain subsets of `en-US` and fall back to English; they must not contain unknown keys.
- Default WebView direction is `ltr`. Never translate the embedded OpenCode UI; only change its layout direction.
- Do not add runtime dependencies. `@vue/test-utils` is already installed.
- LTR islands (URL, username, password fields, displayed server URL, inline `<code>`) stay left-to-right even in RTL.
- Commits use the repository's existing English conventional style.
- Environment: Alpine Linux; install npm with `/sbin/apk add --no-cache npm` if missing.

## Review Focus

These are the inputs and conditions most likely to break; each has a test or explicit manual check in the task that owns the code.

1. Mixed Arabic UI with Latin URLs/commands — must not reorder or mirror URLs, host names, or code snippets. Tests: Task 4 LTR-island checks, Task 6 manual checklist.
2. Switching language while the app is open — every screen, status tooltip, and demo message must update immediately and flip `dir` without a reload. Test: Task 3 locale-switch test.
3. Corrupt or unknown persisted locale / direction values — the app must boot in `en-US` / `ltr` instead of throwing. Tests: Task 2 unknown-locale test, Task 4 invalid-direction test.
4. Arabic device locale variants (`ar`, `ar-EG`, `ar-SA`) and OS locale changes — all must detect Arabic. Tests: Task 2 detection tests.
5. RTL injected pull menu with long Arabic labels on narrow screens — no clipping, correct switch-knob direction, readable status row. Manual check: Task 5.
6. Arabic font unavailable offline — fall back to system Arabic fonts without broken shaping. Manual check: Task 6.

---

### Task 1: Fork identity and toolchain

**Files:**
- Create: `docs/fork.md`
- Modify: `capacitor.config.ts`
- Modify: `package.json`
- Modify: `index.html`
- Modify: `src/components/LandingScreen.vue`
- Modify: `src/components/SettingsScreen.vue`
- Modify: `src/services/storage/webDevSecretStorage.ts`
- Modify: `android/app/build.gradle`
- Rename: `android/app/src/main/java/com/logicedge/opencodemobile/MainActivity.java` → `android/app/src/main/java/com/opencode/mobile/ar/MainActivity.java`
- Modify: `android/app/proguard-rules.pro`
- Modify: `scripts/screenshots-android.mjs`, `scripts/screenshots-ios.mjs`
- Modify: `android/app/src/main/res/values/strings.xml` and `values-*/strings.xml` (all 9 files)
- Modify: `android/app/src/main/res/xml/locales_config.xml`
- Modify: `ios/App/App/Info.plist`
- Modify: `ios/App/App/*.lproj/InfoPlist.strings` (all 8 files)
- Modify: `ios/App/App.xcodeproj/project.pbxproj`

**Interfaces:**
- Consumes: nothing.
- Produces: `appId = com.opencode.mobile.ar`, `appName = OpenCode Mobile AR`, active branch `feat/arabic-rtl`, remote `upstream`, installed `node_modules`.

- [ ] **Step 1: Install the toolchain and dependencies**

```bash
/sbin/apk add --no-cache npm
npm -v
cd /workspace/opencode-mobile-client
npm ci
```

Expected: `npm -v` prints a version and `npm ci` finishes with `added ... packages`.

- [ ] **Step 2: Prepare git**

```bash
cd /workspace/opencode-mobile-client
git remote rename origin upstream
git switch -c feat/arabic-rtl
git remote -v
```

Expected: `upstream` points at `https://github.com/bmpenuelas/opencode-mobile-client.git`; branch is `feat/arabic-rtl`.

- [ ] **Step 3: Update the application identity**

Apply these exact values:

| File | Change |
|---|---|
| `capacitor.config.ts` | `appId: 'com.opencode.mobile.ar'`, `appName: 'OpenCode Mobile AR'` |
| `package.json` | `"name": "opencode-mobile-client-ar"`, `"version": "1.2.5-ar.1"` |
| `index.html` | `<title>OpenCode Mobile AR</title>` |
| `src/components/LandingScreen.vue` | heading `OpenCode Mobile <Client>` → `OpenCode Mobile AR` |
| `src/components/SettingsScreen.vue` | about line `OpenCode Mobile <Client>` → `OpenCode Mobile AR` |
| `src/services/storage/webDevSecretStorage.ts` | console prefix `[OpenCode Mobile Client]` → `[OpenCode Mobile AR]` |
| `android/app/build.gradle` | `namespace = "com.opencode.mobile.ar"`, `applicationId "com.opencode.mobile.ar"` |
| `android/.../MainActivity.java` | move to `com/opencode/mobile/ar/` and set `package com.opencode.mobile.ar;` |
| `android/app/proguard-rules.pro` | keep rule becomes `com.opencode.mobile.ar.MainActivity` |
| `scripts/screenshots-android.mjs`, `screenshots-ios.mjs` | `APP_ID` = `com.opencode.mobile.ar` |
| `android/.../values/strings.xml` | `app_name`, `title_activity_main` = `OpenCode Mobile AR`; `package_name`, `custom_url_scheme` = `com.opencode.mobile.ar` |
| other `values-*/strings.xml` (8 files) | `app_name`, `title_activity_main` = `OpenCode Mobile AR` |
| `ios/App/App/Info.plist` | `CFBundleDisplayName` = `OpenCode Mobile AR`; replace every `OpenCode Mobile` occurrence (including the App Store review comment) with `OpenCode Mobile AR` |
| `ios/.../*.lproj/InfoPlist.strings` (8 files) | `CFBundleDisplayName` and `CFBundleName` = `OpenCode Mobile AR`; replace `OpenCode Mobile` in the usage description |
| `ios/.../project.pbxproj` | both `PRODUCT_BUNDLE_IDENTIFIER = com.opencode.mobile.ar;` |

Do not change `MARKETING_VERSION` (`1.2.5`) or `CURRENT_PROJECT_VERSION` (`1002005`); Gradle derives the same values from `1.2.5-ar.1`.

- [ ] **Step 4: Register Arabic on both platforms**

- `android/app/src/main/res/xml/locales_config.xml`: add `<locale android:name="ar" />` after the `en-US` entry.
- `ios/App/App/Info.plist`: add a `CFBundleLocalizations` array containing `en`, `de`, `es`, `fr`, `hi`, `pt`, `ru`, `zh-Hans`, `ar`.

- [ ] **Step 5: Write `docs/fork.md`**

Include: upstream URL and MIT licence; the local clone path; `upstream`/`origin` remote model; commands to add the user's fork later (`git remote add origin <url>`); sync commands (`git fetch upstream && git rebase upstream/main`); note that changing `appId` means a fresh install with no data migration.

- [ ] **Step 6: Verify identity consistency**

```bash
cd /workspace/opencode-mobile-client
git grep -n "com.logicedge.opencodemobile" -- ':!README.md' ':!docs' ':!src/components/StoreBadges.vue' ':!docs/superpowers/plans'
git grep -n "OpenCode Mobile" -- ':!docs' ':!store' ':!README.md' ':!package-lock.json'
node scripts/verify-store-readiness.mjs
npm run lint
```

Expected: the first command prints nothing (the excluded files are upstream
distribution links, documented in `docs/fork.md`); the second prints only lines
containing `OpenCode Mobile AR`; store verification prints `ok -` lines and no
`not ok`; lint passes.

- [ ] **Step 7: Commit**

```bash
git add capacitor.config.ts package.json index.html docs/fork.md \
  src/components/LandingScreen.vue src/components/SettingsScreen.vue \
  src/services/storage/webDevSecretStorage.ts \
  android/app/build.gradle android/app/src/main/res \
  ios/App/App/Info.plist ios/App/App.xcodeproj/project.pbxproj ios/App/App/*.lproj/InfoPlist.strings
git commit -m "chore: rebrand fork as OpenCode Mobile AR"
```

---

### Task 2: Arabic locale and document direction

**Files:**
- Create: `src/tests/i18n.test.ts`
- Modify: `src/i18n/index.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Locale` includes `'ar'`.
  - `supportedLocales` includes `{ code: 'ar', label: 'العربية' }`.
  - `isRtl(locale: Locale): boolean`.
  - `applyDocumentLocale(locale: Locale): void` — sets `document.documentElement.lang` and `.dir`.
  - `catalogKeys(locale: Locale): string[]` — sorted key list.
  - `setLocale(locale)` also calls `applyDocumentLocale(locale)`.

- [ ] **Step 1: Write the failing tests**

Create `src/tests/i18n.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

const LOCALE_KEY = 'opencode-mobile.locale'

async function loadI18n() {
  vi.resetModules()
  return import('@/i18n')
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
  document.documentElement.dir = ''
  Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true })
})

describe('catalogues', () => {
  it('Arabic covers every English key', async () => {
    const { catalogKeys } = await loadI18n()
    expect(catalogKeys('ar')).toEqual(catalogKeys('en-US'))
  })

  it('other locales add no unknown keys', async () => {
    const { catalogKeys, supportedLocales } = await loadI18n()
    const english = catalogKeys('en-US')
    for (const { code } of supportedLocales) {
      if (code === 'en-US') continue
      expect(catalogKeys(code).filter((key) => !english.includes(key))).toEqual([])
    }
  })
})

describe('direction', () => {
  it('marks only Arabic as RTL', async () => {
    const { isRtl } = await loadI18n()
    expect(isRtl('ar')).toBe(true)
    expect(isRtl('en-US')).toBe(false)
    expect(isRtl('fr')).toBe(false)
  })

  it('setLocale updates lang and dir', async () => {
    const { setLocale } = await loadI18n()
    setLocale('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    setLocale('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('applyDocumentLocale works standalone', async () => {
    const { applyDocumentLocale } = await loadI18n()
    applyDocumentLocale('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })
})

describe('detection', () => {
  it('detects Arabic device locales', async () => {
    Object.defineProperty(window.navigator, 'language', { value: 'ar-EG', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('ar')
  })

  it('prefers the saved locale', async () => {
    localStorage.setItem(LOCALE_KEY, 'ar')
    Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('ar')
  })

  it('ignores an unknown saved locale', async () => {
    localStorage.setItem(LOCALE_KEY, 'xx')
    Object.defineProperty(window.navigator, 'language', { value: 'fr-FR', configurable: true })
    const { useI18n } = await loadI18n()
    expect(useI18n().locale.value).toBe('fr')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run src/tests/i18n.test.ts`

Expected: FAIL because `catalogKeys` is not exported and `'ar'` is not a supported locale.

- [ ] **Step 3: Extend `src/i18n/index.ts`**

- Add `{ code: 'ar', label: 'العربية' }` to `supportedLocales`.
- Add `if (language.startsWith('ar')) return 'ar'` to `detectedLocale()`.
- Add the `ar` catalogue with all 110 keys from `en`, translated per Global Constraints. Preserve HTML tags, placeholders, and Latin brand names. Use `…` for ellipses and `«»`/`“”` consistently with existing style.
- Add `catalogs['ar'] = ar`.
- Add and export:

```ts
export function isRtl(locale: Locale): boolean {
  return locale === 'ar'
}

export function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
}

export function catalogKeys(locale: Locale): string[] {
  return Object.keys(catalogs[locale]).sort()
}
```

- Update `setLocale()` to call `applyDocumentLocale(locale)` instead of setting `lang` directly.

- [ ] **Step 4: Apply the locale before mount**

In `src/main.ts`, import `applyDocumentLocale` and `useI18n`, then call `applyDocumentLocale(useI18n().locale.value)` before `app.mount('#app')`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/tests/i18n.test.ts`

Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/index.ts src/main.ts src/tests/i18n.test.ts
git commit -m "feat(i18n): add Arabic locale and RTL document direction"
```

---

### Task 3: Localize remaining hardcoded strings

**Files:**
- Create: `src/tests/localization.test.ts`
- Modify: `src/i18n/index.ts` (add the keys below to `en` and `ar` only)
- Modify: `src/components/StatusDot.vue`
- Modify: `src/components/DemoSessionMock.vue`
- Modify: `src/components/ServerProfileForm.vue`
- Modify: `src/components/StoreBadges.vue`
- Modify: `src/components/ConnectionShell.vue`
- Modify: `src/stores/connectionStore.ts`

**Interfaces:**
- Consumes: `t`, `setLocale`, `useI18n` from Task 2.
- Produces: every user-visible shell string resolves through `t()`; new keys listed below.

- [ ] **Step 1: Add the new keys to `en` and `ar`**

| Key | English | Arabic |
|---|---|---|
| `connection.profileNotFound` | `Server profile not found.` | `لم يُعثر على ملف الخادم.` |
| `connection.wrongCredentialsMessage` | `The username or password is incorrect.` | `اسم المستخدم أو كلمة المرور غير صحيحة.` |
| `connection.serverUnreachable` | `Server at {url} is not reachable.` | `تعذّر الوصول إلى الخادم على {url}.` |
| `connection.notificationFallback` | `OpenCode notification` | `إشعار OpenCode` |
| `form.usernamePlaceholder` | `username` | `اسم المستخدم` |
| `form.passwordPlaceholder` | `password` | `كلمة المرور` |
| `store.googlePlay` | `Get it on Google Play` | `احصل عليه من Google Play` |
| `store.appStore` | `Download on the App Store` | `نزّله من App Store` |
| `store.vscode` | `Get it for VS Code` | `احصل عليه من VS Code` |
| `menu.options` | `Options` | `الخيارات` |
| `menu.enter` | `Enter` | `مفتاح Enter` |
| `menu.scrollControls` | `Scroll prompt controls` | `تمرير أدوات الإدخال` |
| `settings.webviewDirection` | `OpenCode interface direction` | `اتجاه واجهة OpenCode` |
| `settings.webviewDirectionHint` | `Only changes layout direction. OpenCode text stays in its original language.` | `يغيّر اتجاه التخطيط فقط. تبقى نصوص OpenCode بلغتها الأصلية.` |
| `settings.webviewDirectionLtr` | `Left to right (LTR)` | `من اليسار إلى اليمين (LTR)` |
| `settings.webviewDirectionRtl` | `Right to left (RTL)` | `من اليمين إلى اليسار (RTL)` |
| `demo.followupAssistant` | `Sure — profiles are stored locally, connection state is managed in Pinia, and successful checks transition into the full-screen session view. There is also reconnect handling and periodic health polling once the session is up.` | `بالتأكيد — تُحفظ الملفات محلياً، وتُدار حالة الاتصال عبر Pinia، وينتقل الفحص الناجح إلى عرض الجلسة بملء الشاشة. كما توجد معالجة لإعادة الاتصال وفحص دوري للاتصال بعد بدء الجلسة.` |
| `demo.followupUser` | `Could you add a lightweight demo mode for sales walkthroughs?` | `هل يمكنك إضافة وضع عرض تجريبي خفيف للعروض التوضيحية؟` |
| `demo.demoAnswer` | `Yes. I would special-case a known demo profile, keep the status online, and swap the webview for a local chat mock so the experience stays smooth during a walkthrough.` | `نعم. سأخصص ملفاً معروفاً للعرض التجريبي، وأبقي الحالة متصلة، وأستبدل WebView بمحادثة محلية وهمية ليبقى العرض سلساً.` |
| `demo.replyConnect` | `The connection path looks healthy. I would keep the preflight health check, mark the profile online, and then hand off into the session shell once authentication succeeds.` | `مسار الاتصال سليم. سأبقي فحص الاتصال المسبق، وأعلّم الملف متصلاً، ثم أنتقل إلى غلاف الجلسة بعد نجاح المصادقة.` |
| `demo.replyFix` | `I found the likely failure point. I would patch it in the store/component boundary first, then run a build and validate the behavior with a quick end-to-end check.` | `حدّدت نقطة الفشل المحتملة. سأعالجها عند الحد بين المخزن والمكوّن أولاً، ثم أشغّل البناء وأتحقق من السلوك بفحص سريع من البداية إلى النهاية.` |
| `demo.replyUi` | `The UI direction makes sense. I would keep the layout simple, preserve the current visual language, and make the session feel consistent with the live OpenCode view.` | `اتجاه الواجهة منطقي. سأبقي التخطيط بسيطاً، وأحافظ على اللغة البصرية الحالية، وأجعل الجلسة متسقة مع عرض OpenCode المباشر.` |
| `demo.replyVerify` | `I would validate this with a production build plus a quick manual pass through the main connection scenarios: success, auth failure, unreachable server, and reconnect.` | `سأتحقق من ذلك ببناء إنتاجي مع جولة يدوية سريعة على سيناريوهات الاتصال الرئيسية: النجاح، فشل المصادقة، تعذّر الوصول، وإعادة الاتصال.` |
| `demo.replyDemo` | `For the demo flow, I would keep the status pinned online and preload a believable conversation so the session immediately feels active when someone taps Connect.` | `لوضع العرض، سأبقي الحالة متصلة وأحمّل محادثة واقعية مسبقاً لتبدو الجلسة نشطة فور الضغط على اتصال.` |

- [ ] **Step 2: Write the failing tests**

Create `src/tests/localization.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setLocale, t } from '@/i18n'
import StatusDot from '@/components/StatusDot.vue'
import DemoSessionMock from '@/components/DemoSessionMock.vue'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: '[]' }),
    set: vi.fn(),
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getString: vi.fn().mockResolvedValue({ value: null }),
    setString: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}))

const arabic = /[\u0600-\u06FF]/

beforeEach(() => {
  localStorage.clear()
  setLocale('en-US')
})

describe('StatusDot', () => {
  it('localizes status titles after a locale switch', async () => {
    const wrapper = mount(StatusDot, { props: { status: 'connected' } })
    expect(wrapper.attributes('title')).toBe('Connected')
    setLocale('ar')
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('title')).toBe(t('status.connected'))
    expect(wrapper.attributes('title')).toMatch(arabic)
  })
})

describe('DemoSessionMock', () => {
  it('rebuilds demo content when the locale changes', async () => {
    const wrapper = mount(DemoSessionMock, { props: { profileName: 'Demo' } })
    expect(wrapper.text()).toContain('profiles are stored locally')
    setLocale('ar')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(arabic)
    expect(wrapper.text()).not.toContain('profiles are stored locally')
  })
})

describe('connection errors', () => {
  it('uses the Arabic profile-not-found message', async () => {
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const i18n = await import('@/i18n')
    i18n.setLocale('ar')
    const { useConnectionStore } = await import('@/stores/connectionStore')
    const store = useConnectionStore()
    await store.connect('missing-id')
    expect(store.lastError).toBe(i18n.t('connection.profileNotFound'))
  })
})
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `npx vitest run src/tests/localization.test.ts`

Expected: FAIL because `StatusDot` still renders English titles, demo content is hardcoded, and the store error is English.

- [ ] **Step 4: Implement the localization changes**

- `StatusDot.vue`: import `useI18n`; map each status to existing `status.*` keys; return `t(key)`.
- `connectionStore.ts`: import `t`; replace the three English `lastError` strings with `t('connection.profileNotFound')`, `t('connection.wrongCredentialsMessage')`, and `t('connection.serverUnreachable', { url: profile.baseUrl })`.
- `ServerProfileForm.vue`: use `:placeholder="t('form.usernamePlaceholder')"` and `:placeholder="t('form.passwordPlaceholder')"`; add `dir="ltr"` to the URL, username, and password inputs and to the URL placeholder example.
- `StoreBadges.vue`: replace `aria-label` literals with `:aria-label="t('store.googlePlay')"`, `t('store.appStore')`, `t('store.vscode')`.
- `ConnectionShell.vue`: replace `'OpenCode notification'` with `t('connection.notificationFallback')`; replace `'Scroll prompt controls '` with `t('menu.scrollControls') + ' '`; replace `'Options \\u22EE'` with `t('menu.options') + ' \\u22EE'`; replace the toggle's `'Enter'` literal with `t('menu.enter')`.
- `DemoSessionMock.vue`: destructure `{ t, locale }` from `useI18n()`; replace hardcoded `assistant-2`, `user-2`, `assistant-3`, the five reply branches, and the default reply with the new keys. Extract a `buildMessages()` function and call it on mount and in `watch(locale, buildMessages)`; reset `draft.value` only on first mount, not on locale change.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/tests/localization.test.ts src/tests/i18n.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/index.ts src/components/StatusDot.vue src/components/DemoSessionMock.vue \
  src/components/ServerProfileForm.vue src/components/StoreBadges.vue \
  src/components/ConnectionShell.vue src/stores/connectionStore.ts src/tests/localization.test.ts
git commit -m "feat(i18n): localize remaining shell and demo strings"
```

---

### Task 4: Persisted WebView direction preference

**Files:**
- Create: `src/services/storage/uiPreferences.ts`
- Create: `src/tests/uiPreferences.test.ts`
- Modify: `src/components/SettingsScreen.vue`
- Modify: `src/i18n/index.ts` (keys from Task 3 already added)

**Interfaces:**
- Consumes: `settings.webviewDirection*` keys from Task 3.
- Produces:
  - `export type WebviewDirection = 'ltr' | 'rtl'`
  - `export const WEBVIEW_DIRECTION_KEY = 'opencode-mobile.webviewDirection'`
  - `getWebviewDirection(): WebviewDirection` — returns `ltr` when unset or invalid.
  - `setWebviewDirection(value: WebviewDirection): void`

- [ ] **Step 1: Write the failing tests**

Create `src/tests/uiPreferences.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getWebviewDirection,
  setWebviewDirection,
  WEBVIEW_DIRECTION_KEY,
} from '@/services/storage/uiPreferences'

beforeEach(() => {
  localStorage.clear()
})

describe('webview direction preference', () => {
  it('defaults to ltr', () => {
    expect(getWebviewDirection()).toBe('ltr')
  })

  it('persists rtl', () => {
    setWebviewDirection('rtl')
    expect(localStorage.getItem(WEBVIEW_DIRECTION_KEY)).toBe('rtl')
    expect(getWebviewDirection()).toBe('rtl')
  })

  it('falls back to ltr for an invalid stored value', () => {
    localStorage.setItem(WEBVIEW_DIRECTION_KEY, 'sideways')
    expect(getWebviewDirection()).toBe('ltr')
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run src/tests/uiPreferences.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `src/services/storage/uiPreferences.ts`**

Implement the exported type, key, getter, and setter above. The getter reads `localStorage.getItem(WEBVIEW_DIRECTION_KEY)` and returns it only when it is exactly `'ltr'` or `'rtl'`; otherwise `'ltr'`.

- [ ] **Step 4: Add the Settings control**

In `SettingsScreen.vue`:

- Import `getWebviewDirection`, `setWebviewDirection`, `type WebviewDirection`.
- Add `const webviewDirection = ref<WebviewDirection>(getWebviewDirection())`.
- Add a section after the language selector with heading `t('settings.webviewDirection')`, a `<select>` bound to `webviewDirection`, two options using `t('settings.webviewDirectionLtr')` / `t('settings.webviewDirectionRtl')`, and a hint paragraph using `t('settings.webviewDirectionHint')`.
- Add `watch(webviewDirection, (value) => setWebviewDirection(value))`.

- [ ] **Step 5: Run tests and lint**

Run: `npx vitest run src/tests/uiPreferences.test.ts && npm run lint`

Expected: PASS and no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/storage/uiPreferences.ts src/tests/uiPreferences.test.ts src/components/SettingsScreen.vue
git commit -m "feat(settings): persist WebView direction preference"
```

---

### Task 5: Inject direction and RTL into the WebView

**Files:**
- Create: `src/services/platform/webviewDirection.ts`
- Create: `src/tests/webviewDirection.test.ts`
- Modify: `src/components/ConnectionShell.vue`

**Interfaces:**
- Consumes: `WebviewDirection`, `getWebviewDirection` from Task 4; `isRtl`, `useI18n` from Task 2.
- Produces: `buildDirectionScript(direction: WebviewDirection): string` returning a self-invoking script that sets `document.documentElement.dir`.

- [ ] **Step 1: Write the failing test**

Create `src/tests/webviewDirection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildDirectionScript } from '@/services/platform/webviewDirection'

describe('buildDirectionScript', () => {
  it('sets rtl', () => {
    expect(buildDirectionScript('rtl')).toContain('document.documentElement.dir')
    expect(buildDirectionScript('rtl')).toContain('"rtl"')
  })

  it('sets ltr', () => {
    expect(buildDirectionScript('ltr')).toContain('"ltr"')
  })

  it('wraps the code so it is safe to execute repeatedly', () => {
    expect(buildDirectionScript('rtl').trim().startsWith('(function')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/tests/webviewDirection.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `src/services/platform/webviewDirection.ts`**

```ts
import type { WebviewDirection } from '@/services/storage/uiPreferences'

export function buildDirectionScript(direction: WebviewDirection): string {
  return `(function(){if(document.documentElement)document.documentElement.dir=${JSON.stringify(direction)};})();`
}
```

- [ ] **Step 4: Wire it into `ConnectionShell.vue`**

- Import `getWebviewDirection` and `buildDirectionScript`.
- Destructure `locale` alongside `t` from `useI18n()`.
- Change `preShowScript: buildNotificationBridgeScript()` to `preShowScript: buildNotificationBridgeScript() + '\n' + buildDirectionScript(getWebviewDirection())`.
- In the `browserPageLoaded` handler, after the existing executeScript calls, execute `buildDirectionScript(getWebviewDirection())` again.
- In `buildToolbarScript(status: string, displayUrl: string, rtl: boolean)`: update the single call site to pass `isRtl(locale.value)` as the third argument; set `panel.dir = rtl ? 'rtl' : 'ltr'`; when `rtl`, swap the back/forward glyphs (`\\u2190` ↔ `\\u2192`) and use `t('menu.options')`, `t('menu.enter')`, and `t('menu.scrollControls')` for the hardcoded labels.
- Add an RTL CSS block inside the injected toolbar stylesheet, scoped to `#oc-panel[dir="rtl"]`: `text-align:right`; `#oc-panel-url{margin-left:0;margin-right:auto}`; `.oc-lbl{padding-left:0;padding-right:10px}`; `.oc-switch .oc-knob{left:auto;right:2px}`; `#oc-panel-toggle input:checked+.oc-switch .oc-knob,#oc-panel-toggle .oc-switch.oc-on .oc-knob{transform:translateX(-8px)}`.

- [ ] **Step 5: Run tests and type-check**

Run: `npx vitest run src/tests/webviewDirection.test.ts && npm run lint`

Expected: PASS and no type errors.

- [ ] **Step 6: Manual check of the injected UI**

Open a server with the app in Arabic and `webviewDirection = rtl`: the pull menu is right-aligned, the URL sits on the left edge of the row, the enter-toggle knob moves left when enabled, and long Arabic labels wrap without clipping. Repeat with `ltr` to confirm no regression.

- [ ] **Step 7: Commit**

```bash
git add src/services/platform/webviewDirection.ts src/tests/webviewDirection.test.ts src/components/ConnectionShell.vue
git commit -m "feat(webview): apply direction and RTL layout to injected UI"
```

---

### Task 6: RTL shell layout, icons, LTR islands, Arabic font

**Files:**
- Modify: `src/styles/base.css`
- Modify: `src/components/ServerList.vue`
- Modify: `src/components/ServerProfileForm.vue`
- Modify: `src/components/SettingsScreen.vue`
- Modify: `src/components/HelpScreen.vue`
- Modify: `src/components/DemoSessionMock.vue`
- Modify: `src/components/TopPullMenu.vue`
- Modify: `src/components/ui/alert/AlertAction.vue`
- Modify: `src/components/ui/dialog/DialogContent.vue`
- Modify: `src/components/ui/dialog/DialogScrollContent.vue`
- Modify: `src/components/ui/sheet/SheetContent.vue`

**Interfaces:**
- Consumes: `document.documentElement.dir` from Task 2.
- Produces: no runtime API; layout and typography only.

- [ ] **Step 1: Convert physical utilities to logical ones**

| File | Replace |
|---|---|
| `DemoSessionMock.vue` | `ml-8` → `ms-8`, `mr-8` → `me-8` |
| `ServerList.vue` | `ml-1` → `ms-1`, `-ml-1` → `-ms-1`, `ml-auto` → `ms-auto` |
| `AlertAction.vue` | `absolute top-2 right-2` → `absolute top-2 end-2` |
| `DialogContent.vue` | both `absolute top-2 right-2` → `absolute top-2 end-2` |
| `DialogScrollContent.vue` | `absolute top-4 right-4` → `absolute top-4 end-4` |
| `SheetContent.vue` | `absolute top-3 right-3` → `absolute top-3 end-3` |

- [ ] **Step 2: Mirror directional icons and isolate LTR content**

- Add `class="h-4 w-4 rtl:rotate-180"` to the back `ArrowLeft` in `ServerList.vue`, `ServerProfileForm.vue`, `SettingsScreen.vue`, and `HelpScreen.vue`.
- Add `dir="ltr"` to: the URL, username, and password inputs in `ServerProfileForm.vue`; the URL `CardDescription` in `ServerList.vue` and `LandingScreen.vue`; the `SheetDescription` showing `sanitizedUrl` in `TopPullMenu.vue`.
- In `base.css`, add:

```css
code, kbd, samp {
  direction: ltr;
  unicode-bidi: isolate;
}
```

- [ ] **Step 3: Add the Arabic font**

In `base.css`:

- Extend the Google Fonts import URL with `family=Noto+Sans+Arabic:wght@400;500;600;700`.
- Set `--font-sans: 'Geist', 'Noto Sans Arabic', ui-sans-serif, system-ui, Tahoma, sans-serif;`.
- Add:

```css
html[lang="ar"] body {
  line-height: 1.65;
  letter-spacing: 0;
}
```

- [ ] **Step 4: Verify no physical spacing utilities remain in shell components**

```bash
git grep -nE "(ml|mr|pl|pr)-[0-9]" -- 'src/components/*.vue' ':(exclude)src/components/ui/**'
git grep -nE "(^|[^a-z-])right-[0-9]" -- 'src/components/*.vue' 'src/components/ui/**/*.vue'
```

Expected: no `ml-/mr-/pl-/pr-` matches; `right-*` matches only where symmetric centering requires it (none expected after Step 1).

- [ ] **Step 5: Build and run the full test suite**

Run: `npm run lint && npm test && npm run build`

Expected: all pass; Vite build completes.

- [ ] **Step 6: Manual verification checklist**

On an Arabic device or by forcing `localStorage['opencode-mobile.locale']='ar'`:

- Landing, Servers, Add/Edit Server, Settings, Help: text is Arabic, aligned right, back arrows point right.
- URL, username, and password fields keep Latin input order left-to-right.
- Server URL in the pull menu stays left-to-right.
- Dialogs and the pull menu are not clipped; long Arabic labels wrap.
- Arabic font renders; disabling network still falls back to a readable system font.
- Switch to English: layout returns to LTR immediately.

- [ ] **Step 7: Commit**

```bash
git add src/styles/base.css src/components
git commit -m "style(rtl): logical spacing, mirrored icons, and Arabic font"
```

---

### Task 7: Final verification and fork notes

**Files:**
- Modify: `docs/fork.md` (only if commands or paths changed during implementation)
- Modify: `docs/superpowers/specs/2026-11-08-opencode-mobile-ar-design.md` (only if implementation diverged; record the deviation)

**Interfaces:**
- Consumes: all previous tasks.
- Produces: green verification run and a clean tree.

- [ ] **Step 1: Run every gate**

```bash
cd /workspace/opencode-mobile-client
npm run lint
npm test
npm run build
node scripts/verify-store-readiness.mjs
git status --short
```

Expected: lint passes, all Vitest suites pass, build succeeds, store verification prints no `not ok`, and `git status` is clean.

- [ ] **Step 2: Confirm the acceptance criteria**

Walk the spec's section 7 and confirm each item. For anything that can only be checked on Android/iOS, record it in `docs/fork.md` under a "Manual verification pending" heading with the exact steps.

- [ ] **Step 3: Commit any final documentation fixes**

```bash
git status --short docs/
```

If that lists changes:

```bash
git add docs/fork.md docs/superpowers/specs/2026-11-08-opencode-mobile-ar-design.md
git commit -m "docs: record phase 0+1 verification notes"
```

If it lists nothing, skip this commit.

---

## Deviations from the plan (recorded during execution)

1. **Task 1 — extra identity files.** Changing `applicationId` also required moving
   `android/app/src/main/java/com/logicedge/opencodemobile/MainActivity.java` to
   `com/opencode/mobile/ar/`, updating the ProGuard keep rule, and updating the
   `APP_ID` constants in `scripts/screenshots-android.mjs` / `screenshots-ios.mjs`.
   The upstream store links in `README.md`, `docs/index.html`, and
   `src/components/StoreBadges.vue` intentionally keep pointing at the published
   upstream app; they are excluded from the identity grep and documented in
   `docs/fork.md`.
2. **Task 3 — key reuse.** The existing `demo.response` key covers the second demo
   bubble, so `demo.followupAssistant` was not added. `menu.enter` was dropped
   because the only `Enter` literal in the code is a keyboard `event.key` check.
   `app.continueHint` was added for the hardcoded store tagline that appeared in
   both `SettingsScreen.vue` and `HelpScreen.vue`.
3. **Task 5 — toolbar direction source.** The injected pull menu mirrors when the
   **WebView direction preference** is `rtl` (per spec 5.5), not when the app UI
   language is Arabic; the app locale only decides the toolbar *labels*.
   `buildToolbarScript` and `jsStringLiteral` moved to
   `src/services/platform/webviewToolbar.ts` so the generated script can be
   executed and asserted in jsdom (`src/tests/webviewToolbar.test.ts`).
4. **Task 6 — extra test.** `src/tests/rtlShell.test.ts` asserts the logical
   spacing classes, the mirrored back arrow, and the LTR islands.
