# دفتر راز — ساخت APK

این پروژه با **Next.js** نوشته شده و با **Capacitor** داخل یک WebView اندروید بسته‌بندی می‌شود (بدون Flutter). کل اپ کلاینت‌محور است (IndexedDB + WebAuthn) پس خروجی استاتیک کامل کار می‌کند.

## پیش‌نیازها

- Node.js (نسخه‌ای که از Next 16 پشتیبانی کند)
- Android Studio (شامل Android SDK و Gradle)
- یک‌بار نصب وابستگی‌ها:
  ```bash
  npm install
  ```

## ۱. ساخت خروجی وب + همگام‌سازی با اندروید

```bash
npm run build:android
```

این دستور:
1. `next build` را اجرا می‌کند و خروجی استاتیک را در `out/` می‌ریزد.
2. `cap sync android` را اجرا می‌کند و `out/` را داخل `android/app/src/main/assets/public/` کپی می‌کند.

> نکته: چون `next.config.mjs` از `output: 'export'` استفاده می‌کند، اسکریپت `next start` دیگر کار نمی‌دهد؛ فقط خروجی استاتیک معتبر است.

## ۲. تولید آیکون‌ها (اختیاری، فقط هنگام تغییر آیکون)

```bash
npm run icons
```

از روی `public/icon.svg` آیکون و اسپلش ۱۰۲۴/۲۷۳۲ می‌سازد و سپس با `@capacitor/assets` نسخه‌های اندرویدی را داخل `android/app/src/main/res/` تولید می‌کند.

## ۳. باز کردن پروژه اندروید و ساخت APK

```bash
npm run cap:open:android
```

پروژه در Android Studio باز می‌شود. آنجا:

- برای **debug APK**: `Build → Build Bundle(s) / APK(s) → Build APK(s)`.
- فایل خروجی: `android/app/build/outputs/apk/debug/app-debug.apk`.

برای APK نهایی (signed/release)، در Android Studio به `Build → Generate Signed Bundle / APK` بروید و یک keystore بسازید.

### ساخت APK از خط فرمان (با Gradle)

```bash
cd android
./gradlew assembleDebug      # خروجی: app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease    # نیاز به امضای release دارد
```

## نکات مهم

- **analytics حذف شد**: `@vercel/analytics` با `output: 'export'` ناسازگار بود؛ در `app/layout.tsx` کامنت/حذف شده است. اپ آفلاین هم کار می‌کند.
- **فونت‌ها**: Vazirmatn و Noto Nastaliq از Google Fonts در زمان build گرفته می‌شوند و داخل خروجی استاتیک embed می‌شوند؛ Uthman از فایل محلی (`public/fonts/`) لود می‌شود.
- **appId / نام بسته**: `com.daftarraz.app` (در `capacitor.config.ts`). برای تغییر آن، هم فایل کانفیگ و هم `android/app/build.gradle` را به‌روزرسانی کن و دوباره `cap sync android` بزن.

## ساختار فایل‌های مرتبط

- `next.config.mjs` — فعال‌سازی `output: 'export'` و `trailingSlash`.
- `capacitor.config.ts` — پیکربندی Capacitor (appId، webDir = `out`).
- `android/` — پروژه بومی اندروید (ساخت‌شده با `cap add android`).
- `scripts/generate-icons.mjs` — ساخت آیکون/اسپلش از `public/icon.svg`.
- `public/manifest.json` — manifest برنامه.

## بیومتریک (اثر انگشت / چهره)

از افزونه [`@capgo/capacitor-native-biometric`](https://github.com/Cap-go/capacitor-native-biometric) استفاده می‌شود.

- درون APK، `lib/security.ts` از طریق `Capacitor.isNativePlatform()` پلاگین نیتیو را فعال می‌کند و درخواست BiometricPrompt اندروید را نشان می‌دهد (Android 6+ با BiometricPrompt، Android 10+ به بعد رفتار بهتری دارد).
- در مرورگر (PWA روی وب) همچنان به WebAuthn برمی‌گردد.
- مجوزهای `USE_BIOMETRIC` و `USE_FINGERPRINT` در `android/app/src/main/AndroidManifest.xml` اضافه شده‌اند.
- مدل داده: پرچم `biometric-enabled` در IndexedDB نشان‌دهنده فعال‌بودن است؛ در نسخه نیتیو نیازی به ذخیره credential-id نیست (احراز هویت در هر بار ورود از طریق BiometricPrompt انجام می‌شود).

اگر تغییرات در پلاگین اعمال شد، حتماً `npm run cap:sync` بزن تا `android/` به‌روز شود.

## ساخت خودکار APK (GitHub Actions)

ورک‌فلو `.github/workflows/build-apk.yml` در هر push به `main`/`master`، PR و اجرای دستی، APK دیباگ را می‌سازد:

1. Node 20 و JDK 17 (Temurin) را نصب می‌کند.
2. Android SDK (platform 36 + build-tools 36) را آماده می‌کند.
3. `npm ci` و سپس `npm run build:android` (build استاتیک + cap sync).
4. `./gradlew assembleDebug` در پوشه `android`.
5. فایل `app-debug.apk` را به‌عنوان artifact با نام `daftar-raz-debug-apk` آپلود می‌کند (۳۰ روز نگه داشته می‌شود).

برای دانلود: تب **Actions** در ریپو → اجر مورد نظر → بخش **Artifacts**.

> برای APK امضاشده (release) نیاز به keystore است؛ می‌توانی بعداً یک job جداگانه با امضای از طریق GitHub Secrets اضافه کنی.
