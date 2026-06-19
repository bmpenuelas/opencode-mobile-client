import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [];
const warnings = [];

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

function check(name, condition, details) {
  checks.push({ name, ok: Boolean(condition), details });
}

function warn(name, condition, details) {
  if (!condition) {
    warnings.push({ name, details });
  }
}

const infoPlist = read("ios/App/App/Info.plist");
const pbxproj = read("ios/App/App.xcodeproj/project.pbxproj");
const androidBuildGradle = read("android/app/build.gradle");
const androidNetworkConfig = read("android/app/src/main/res/xml/network_security_config.xml");
const capacitorConfig = read("capacitor.config.ts");

check(
  "iOS privacy manifest exists",
  existsSync(resolve("ios/App/App/PrivacyInfo.xcprivacy")),
  "ios/App/App/PrivacyInfo.xcprivacy"
);
check(
  "iOS privacy manifest is included in Xcode resources",
  pbxproj.includes("PrivacyInfo.xcprivacy in Resources"),
  "PrivacyInfo.xcprivacy must be copied into the app bundle"
);
check(
  "iOS ATS is configured",
  infoPlist.includes("NSAppTransportSecurity") &&
    infoPlist.includes("NSAllowsLocalNetworking") &&
    infoPlist.includes("NSAllowsArbitraryLoadsInWebContent"),
  "ATS must preserve local/private HTTP and WebView server support"
);
check(
  "iOS arm64 device capability is set",
  infoPlist.includes("<string>arm64</string>") && !infoPlist.includes("<string>armv7</string>"),
  "UIRequiredDeviceCapabilities should require arm64"
);
check(
  "iOS release xcconfig exists and is wired",
  existsSync(resolve("ios/release.xcconfig")) && pbxproj.includes("release.xcconfig"),
  "Release builds should use ios/release.xcconfig"
);
check(
  "Android release signing config is present",
  androidBuildGradle.includes("signingConfigs") &&
    androidBuildGradle.includes("releaseSigningReady") &&
    androidBuildGradle.includes("ANDROID_KEYSTORE_FILE"),
  "Release signing should support android/keystore.properties or env vars"
);
check(
  "Android R8/ProGuard is enabled for release",
  androidBuildGradle.includes("minifyEnabled true") &&
    androidBuildGradle.includes("proguard-rules.pro"),
  "Release builds should shrink/obfuscate with project ProGuard rules"
);
check(
  "Android network config preserves user-provided HTTP support",
  androidNetworkConfig.includes("cleartextTrafficPermitted=\"true\"") &&
    androidNetworkConfig.includes("public/VPS servers should use HTTPS"),
  "Cleartext remains broad by design; public HTTP is warned in app policy, not blocked"
);
check(
  "Capacitor navigation policy is documented",
  capacitorConfig.includes("Intentionally broad") &&
    capacitorConfig.includes("Public/VPS servers should use") &&
    capacitorConfig.includes("cleartext: true"),
  "Broad allowNavigation/cleartext support should stay documented"
);

const hasSigningEnv =
  Boolean(process.env.ANDROID_KEYSTORE_FILE) &&
  Boolean(process.env.ANDROID_KEYSTORE_PASSWORD) &&
  Boolean(process.env.ANDROID_KEY_ALIAS) &&
  Boolean(process.env.ANDROID_KEY_PASSWORD);
const hasLocalKeystoreProps = existsSync(resolve("android/keystore.properties"));
warn(
  "Android release signing material",
  hasSigningEnv || hasLocalKeystoreProps,
  "No signing env vars or local android/keystore.properties detected; release AAB upload will fail until configured"
);

let failed = false;
for (const { name, ok, details } of checks) {
  if (ok) {
    console.log(`ok - ${name}`);
  } else {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(`  ${details}`);
  }
}

for (const { name, details } of warnings) {
  console.warn(`warn - ${name}`);
  console.warn(`  ${details}`);
}

if (failed) {
  process.exit(1);
}
