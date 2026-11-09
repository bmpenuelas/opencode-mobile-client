# OpenCode Mobile AR — تصميم المرحلة 0+1 (الفورك + العربية/RTL)

- **التاريخ:** 2026-11-08
- **الحالة:** معتمد للتنفيذ
- **النطاق:** المرحلة 0 (تجهيز الفورك والهوية) والمرحلة 1 (العربية وRTL)
- **المستودع الأصلي:** <https://github.com/bmpenuelas/opencode-mobile-client> (ترخيص MIT)
- **النسخة المستهدفة:** `1.2.5-ar.1`

## 1. السياق

التطبيق الحالي غلاف Vue 3 + Capacitor 8 يعرض واجهة OpenCode Web داخل WebView. واجهة التطبيق تدعم ثماني لغات ولا تدعم العربية أو RTL. المطلوب نسخة خاصة باسم **OpenCode Mobile AR** تدعم العربية كلغة واجهة كاملة، مع تحكم في اتجاه واجهة OpenCode المضمّنة دون ترجمتها.

هذا التصميم يغطي مرحلتين فقط. واجهة الدردشة الأصلية (المرحلة 2) والمزايا/الموثوقية (المرحلة 3) لهما مواصفتان منفصلتان لاحقاً.

## 2. الأهداف

1. إنشاء نسخة محلية قابلة للتطوير ومستقلة عن المستودع الأصلي، مع إمكانية ربطها لاحقاً بمستودع GitHub خاص.
2. تغيير هوية التطبيق (الاسم ومعرّف الحزمة) لتفادي التعارض مع نسخة المتجر.
3. تعريب كامل لواجهة التطبيق (الغلاف) بأسلوب فصحى مبسّطة.
4. دعم RTL صحيحاً في كل شاشات الغلاف والقوائم والحوارات والشريط المحقون.
5. إتاحة خيار اتجاه واجهة OpenCode المضمّنة (`ltr`/`rtl`) دون ترجمة محتواها.

## 3. خارج النطاق

- ترجمة نصوص واجهة OpenCode Web أو حقن ترجمات فيها.
- واجهة دردشة أصلية بديلة عن WebView.
- الإشعارات الخلفية وإدارة الجلسات وإعادة الاتصال (المرحلة 3).
- تغيير أيقونة التطبيق أو أصول المتجر (يمكن طلبه منفصلاً).
- ترحيل بيانات النسخة الأصلية عند تغيير `appId`.

## 4. المرحلة 0 — الفورك والهوية

### 4.1 Git

- إعادة تسمية الـ remote الحالي: `origin` ← `upstream`.
- إبقاء الفرع `main` متتبعاً لـ `upstream/main`.
- إنشاء فرع العمل `feat/arabic-rtl`.
- إضافة `docs/fork.md` يوثّق:
  - مصدر النسخة وترخيص MIT.
  - كيفية مزامنة التحديثات من `upstream`.
  - خطوات إضافة `origin` الخاص بالمستخدم بعد توفير التوكن.
- لا يُضاف remote خاص قبل توفير صلاحية GitHub.

### 4.2 الهوية

| العنصر | القيمة |
|---|---|
| `appName` | `OpenCode Mobile AR` |
| `appId` | `com.opencode.mobile.ar` |
| اسم حزمة npm | `opencode-mobile-client-ar` |
| الإصدار | `1.2.5-ar.1` |

الملفات المتأثرة:

1. `capacitor.config.ts` — `appId`, `appName`.
2. `package.json` — `name`, `version`.
3. `android/app/src/main/res/values/strings.xml` — `app_name`, `title_activity_main`, `package_name`, `custom_url_scheme`.
4. `android/app/build.gradle` — `namespace`, `applicationId`.
5. `ios/App/App.xcodeproj/project.pbxproj` — `PRODUCT_BUNDLE_IDENTIFIER` (موضعان).
6. `ios/App/App/Info.plist` — `CFBundleDisplayName`.
7. جميع ملفات `android/app/src/main/res/values-*/strings.xml` — `app_name` و`title_activity_main`.
8. جميع ملفات `ios/App/App/*.lproj/InfoPlist.strings` — `CFBundleDisplayName` و`CFBundleName`.
9. `index.html` — عنوان الصفحة.

### 4.3 تسجيل اللغة على المنصات

- `android/app/src/main/res/xml/locales_config.xml`: إضافة `<locale android:name="ar" />`.
- `ios/App/App/Info.plist`: إضافة `CFBundleLocalizations` باللغات الحالية + `ar`.

## 5. المرحلة 1 — العربية وRTL

### 5.1 نموذج i18n

نُوسّع `src/i18n/index.ts` الحالي ولا نضيف مكتبة جديدة.

- إضافة `{ code: 'ar', label: 'العربية' }` إلى `supportedLocales`.
- إضافة كتالوج `ar` يغطي كل مفاتيح `en` (110 مفاتيح حالياً) بالفصحى المبسّطة.
- إضافة اكتشاف `ar` في `detectedLocale()` عبر `language.startsWith('ar')`.
- إضافة `isRtl(locale: Locale): boolean` وتعيد `true` للعربية فقط.
- إضافة `applyDocumentLocale(locale)`:
  - `document.documentElement.lang = locale`
  - `document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'`
- استدعاء `applyDocumentLocale` مرة قبل `app.mount()` في `src/main.ts`، وداخل `setLocale()` عند كل تغيير.

### 5.2 تفضيل اتجاه WebView

- وحدة جديدة `src/services/storage/uiPreferences.ts`:
  - نوع `WebviewDirection = 'ltr' | 'rtl'`.
  - مفتاح `opencode-mobile.webviewDirection`.
  - `getWebviewDirection()` تعيد `ltr` افتراضياً عند غياب القيمة أو خطئها.
  - `setWebviewDirection(value)` تحفظ في `localStorage`.
- `SettingsScreen.vue`: قسم جديد «اتجاه واجهة OpenCode» بقائمة اختيار (LTR/RTL) مع نص توضيحي بأن المحتوى يبقى بلغته الأصلية.
- `ConnectionShell.vue`:
  - سكربت `buildDirectionScript()` يعيد `document.documentElement.dir = "<value>"`.
  - يُدمج مع `buildNotificationBridgeScript()` في `preShowScript` عند `documentStart`.
  - يُعاد تنفيذه في `browserPageLoaded` احتياطاً.
- الافتراضي `ltr` حفاظاً على استقرار تخطيط واجهة OpenCode.

### 5.3 الخط العربي

- إضافة `Noto Sans Arabic` إلى استيراد Google Fonts في `src/styles/base.css`.
- سلسلة الخط: `'Geist', 'Noto Sans Arabic', ui-sans-serif, system-ui, Tahoma, sans-serif`.
- `html[lang="ar"]`: `line-height` مناسب (1.6–1.7) و`letter-spacing: 0`.
- عند فشل تحميل الخط الخارجي تبقى البدائل النظامية صالحة.

### 5.4 تحويلات RTL في الغلاف

| الملف | التغيير |
|---|---|
| `src/components/DemoSessionMock.vue` | `ml-8/mr-8` ← `ms-8/me-8` |
| `src/components/ServerList.vue` | `ml-1`, `-ml-1`, `ml-auto` ← `ms-1`, `-ms-1`, `ms-auto` |
| `src/components/ui/alert/AlertAction.vue` | `right-2` ← `end-2` |
| `src/components/ui/dialog/DialogContent.vue` | `right-2` ← `end-2` |
| `src/components/ui/dialog/DialogScrollContent.vue` | `right-4` ← `end-4` |
| `src/components/ui/sheet/SheetContent.vue` | `right-3` ← `end-3` |

- أيقونات الرجوع `ArrowLeft` في `ServerList`/`ServerProfileForm`/`SettingsScreen`/`HelpScreen` تأخذ `rtl:rotate-180`.
- `left-1/2 -translate-x-1/2` مت symmetric ولا يتغير.
- عزل LTR: حقول URL، عنوان السيرفر المعروض، وأوامر المساعدة تأخذ `dir="ltr"` و`text-align:left`.

### 5.5 الشريط المحقون داخل WebView

عند تفعيل RTL للـ WebView:

- `#oc-panel` يأخذ `dir="rtl"` و`text-align:right`.
- `#oc-panel-url` يتحول من `margin-left:auto` إلى `margin-right:auto`.
- `.oc-lbl` يتحول من `padding-left` إلى `padding-right`.
- حركة مفتاح التبديل `.oc-knob` تنعكس (`translateX(-8px)` عند التفعيل).
- سهمَا «رجوع/تقدّم» يتبادلان بصرياً.
- تعريب النصوص الصلبة في السكربت:
  - `Options ⋮`
  - `Enter`
  - تلميحات تمرير صندوق الإدخال
  - نص إذن الإشعارات وعنوانه

### 5.6 وضع العرض التجريبي

`DemoSessionMock.vue` معرّب جزئياً: العناوين والتلميحات تستخدم `t()`، لكن محتوى المحادثة وردودها مكتوبة بالإنجليزية داخل المكوّن.

- إضافة مفاتيح جديدة لبقية رسائل المحادثة (رسالتان من المستخدم وردّان للمساعد) وردود الحالات الخمس.
- إعادة بناء الرسائل عند تغيير اللغة (`watch(locale)`) بدل تثبيتها عند التركيب.
- اكتشاف النية يظل بالإنجليزية، ويُستخدم الرد العربي الافتراضي عند عدم التطابق.

### 5.7 تعريب النصوص الصلبة المتبقية

جرد المكوّنات كشف نصوصاً إنجليزية لا تمر عبر `t()`:

| الموضع | النص | المعالجة |
|---|---|---|
| `StatusDot.vue` | خريطة `statusLabel` | استخدام مفاتيح `status.*` الموجودة |
| `connectionStore.ts` | `Server profile not found` | `connection.profileNotFound` |
| `connectionStore.ts` | `The username or password is incorrect.` | `connection.wrongCredentialsMessage` |
| `connectionStore.ts` | `Server at {url} is not reachable.` | `connection.serverUnreachable` مع `{url}` |
| `ServerProfileForm.vue` | `placeholder="username"` و`"password"` | `form.usernamePlaceholder` و`form.passwordPlaceholder` |
| `StoreBadges.vue` | `aria-label` الإنجليزية | مفاتيح `store.*` |
| `ConnectionShell.vue` | `Options ⋮`, `Enter`, `Scroll prompt controls`, `OpenCode notification` | مفاتيح `menu.*` و`connection.notificationFallback` |

## 6. تدفّق البيانات

```
الإقلاع
  └─ detectedLocale(): localStorage → navigator.language → en-US
       └─ applyDocumentLocale(locale)
            ├─ html.lang = locale
            └─ html.dir = rtl | ltr
                 └─ app.mount()

تغيير اللغة من الإعدادات
  └─ setLocale(locale)
       ├─ currentLocale.value = locale
       ├─ localStorage['opencode-mobile.locale'] = locale
       └─ applyDocumentLocale(locale)

فتح WebView
  └─ getWebviewDirection()
       └─ preShowScript = notificationBridge + directionScript
            └─ document.documentElement.dir = ltr | rtl
```

اتجاه WebView مستقل تماماً عن لغة التطبيق: يمكن واجهة عربية مع OpenCode LTR، والعكس.

## 7. معايير القبول

1. تظهر العربية في قائمة اللغات، وتُكتشف تلقائياً على جهاز عربي، وتُحفظ بعد إعادة التشغيل.
2. كل شاشات الغلاف معرّبة بالكامل: الرئيسية، السيرفرات، النموذج، الإعدادات، المساعدة، الحوارات، قائمة السحب، وحالات الخطأ.
3. اتجاه الصفحة `rtl` بالعربية و`ltr` في بقية اللغات، دون وميض عند الإقلاع.
4. لا تنقلب حقول URL ولا عنوان السيرفر ولا أوامر المساعدة.
5. أيقونات الرجوع تشير إلى اليمين في RTL.
6. خيار اتجاه WebView يعمل ويُحفظ، والافتراضي LTR.
7. الشريط المحقون تظهر نصوصه بلغة التطبيق (معرّبة بالعربية)، ويتحول إلى محاذاة يمينية منعكسة عند اختيار RTL في إعداد اتجاه WebView.
8. وضع العرض التجريبي يظهر بالعربية كاملاً، ورسائله تتحدث عند تغيير اللغة.
9. الخط العربي يظهر دون تشويه حتى مع فشل تحميل الخط الخارجي.
10. نجاح `npm run lint` و`npm test` و`npm run build` و`npm run store:verify`.

## 8. الاختبارات

### اختبارات آلية — `src/tests/i18n.test.ts`

- `ar` يطابق مفاتيح `en` تماماً (لا ناقص ولا زائد).
- بقية اللغات مجموعات فرعية مسموحة من `en` (fallback إلى الإنجليزية) ولا تحتوي مفاتيح غير معروفة.
- `isRtl('ar') === true` وبقية اللغات `false`.
- اكتشاف `ar-EG` من `navigator.language`.
- احترام اللغة المحفوظة في `localStorage`.
- `setLocale('ar')` يضبط `lang="ar"` و`dir="rtl"`.
- `setLocale('en-US')` يعيد `lang="en-US"` و`dir="ltr"`.
- `getWebviewDirection()` تعيد `ltr` افتراضياً وتقرأ القيمة المحفوظة.

### اختبارات آلية إضافية

- `src/tests/localization.test.ts` — نصوص `StatusDot` والمحادثة التجريبية ورسائل
  الأخطاء تتغير عند تبديل اللغة.
- `src/tests/uiPreferences.test.ts` — حفظ اتجاه WebView والرجوع إلى `ltr` عند قيمة
  غير صالحة.
- `src/tests/webviewDirection.test.ts` — سكربت الاتجاه يبدّل `dir` فقط.
- `src/tests/webviewToolbar.test.ts` — الشريط المحقون ينعكس عند RTL (تبديل سهمي
  الرجوع/التقدّم، `dir="rtl"`، قواعد CSS المنطقية، وتسميات معرّبة).
- `src/tests/rtlShell.test.ts` — المسافات المنطقية، انعكاس أيقونة الرجوع، وجزر
  LTR في حقول النموذج وبطاقات الخوادم.

### فحص يدوي

على Android وiOS (أو محاكي):

- الشاشات الخمس + قائمة السحب + الحوارات.
- RTL: المحاذاة، الهوامش، الأيقونات.
- LTR islands: حقول URL، عنوان السيرفر، أوامر المساعدة.
- الخط العربي في الوضعين الفاتح والداكن.
- تبديل اتجاه WebView ومشاهدة الشريط المحقون.

## 9. المخاطر والتخفيف

| الخطر | التخفيف |
|---|---|
| تغيير `appId` يمنع الترقية من نسخة المتجر | تثبيت جديد مقصود؛ يوثّق في `docs/fork.md` |
| حجب Google Fonts | بدائل نظامية في سلسلة الخط |
| تغيّر DOM الخاص بـ OpenCode | الحقن يقتصر على `document.documentElement.dir`؛ تعديلات الشريط معزولة |
| نصوص محقونة صلبة تُنسى | جرد كامل في 5.5 + فحص يدوي |
| انحراف مستقبلي عن upstream | `docs/fork.md` يوضّح المزامنة الدورية |

## 10. خريطة الملفات

**جديدة**

- `docs/superpowers/specs/2026-11-08-opencode-mobile-ar-design.md`
- `docs/fork.md`
- `src/services/storage/uiPreferences.ts`
- `src/services/platform/webviewDirection.ts`
- `src/services/platform/webviewToolbar.ts`
- `src/tests/i18n.test.ts`
- `src/tests/localization.test.ts`
- `src/tests/uiPreferences.test.ts`
- `src/tests/webviewDirection.test.ts`
- `src/tests/webviewToolbar.test.ts`
- `src/tests/rtlShell.test.ts`

**معدّلة**

- `capacitor.config.ts`
- `package.json`
- `src/i18n/index.ts`
- `src/main.ts`
- `src/styles/base.css`
- `src/components/SettingsScreen.vue`
- `src/components/LandingScreen.vue`
- `src/components/ConnectionShell.vue`
- `src/components/ServerList.vue`
- `src/components/DemoSessionMock.vue`
- `src/components/HelpScreen.vue`
- `src/components/StatusDot.vue`
- `src/components/StoreBadges.vue`
- `src/components/ServerProfileForm.vue`
- `src/stores/connectionStore.ts`
- `src/services/storage/webDevSecretStorage.ts`
- `index.html`
- `src/components/ui/alert/AlertAction.vue`
- `src/components/ui/dialog/DialogContent.vue`
- `src/components/ui/dialog/DialogScrollContent.vue`
- `src/components/ui/sheet/SheetContent.vue`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values-*/strings.xml`
- `android/app/src/main/res/xml/locales_config.xml`
- `android/app/build.gradle`
- `ios/App/App/Info.plist`
- `ios/App/App/*.lproj/InfoPlist.strings`
- `ios/App/App.xcodeproj/project.pbxproj`

## 11. أسئلة مؤجلة

- الأيقونة والهوية البصرية: تُترك للأصل حتى طلب منفصل.
- ربط GitHub: يحتاج توكن بصلاحية `repo` (أو إنشاء الفورك يدوياً).
- دعم OpenCode 1.x للواجهة الأصلية: يُحسم في مواصفة المرحلة 2.
