import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootPackageJsonPath = resolve("package.json");
const androidBuildGradlePath = resolve("android/app/build.gradle");
const iosXcodeProjectPath = resolve("ios/App/App.xcodeproj/project.pbxproj");

const packageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf8"));
const rawVersion = packageJson.version ?? "0.0.0";
const semverMatcher = rawVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u);

if (!semverMatcher) {
  console.error(`package.json version '${rawVersion}' is not valid semver`);
  process.exit(1);
}

const majorVersion = Number.parseInt(semverMatcher[1], 10);
const minorVersion = Number.parseInt(semverMatcher[2], 10);
const patchVersion = Number.parseInt(semverMatcher[3], 10);

if (minorVersion > 999 || patchVersion > 999) {
  console.error(
    `package.json version '${rawVersion}' exceeds the supported minor/patch range for generated native build numbers`
  );
  process.exit(1);
}

const marketingVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;
const nativeBuildNumber = Math.max(
  1,
  majorVersion * 1000000 + minorVersion * 1000 + patchVersion
);

syncAndroidBuildGradle(marketingVersion, nativeBuildNumber);
syncIosProject(marketingVersion, nativeBuildNumber);

console.log(
  `Synced native versions from package.json ${rawVersion}: marketing ${marketingVersion}, build ${nativeBuildNumber}`
);

function syncAndroidBuildGradle(versionName, versionCode) {
  const buildGradle = readFileSync(androidBuildGradlePath, "utf8");
  const updatedBuildGradle = buildGradle
    .replace(/versionCode\s+\d+/u, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/u, `versionName "${versionName}"`);

  if (updatedBuildGradle !== buildGradle) {
    writeFileSync(androidBuildGradlePath, updatedBuildGradle);
  }
}

function syncIosProject(versionName, versionCode) {
  const xcodeProject = readFileSync(iosXcodeProjectPath, "utf8");
  const updatedProject = xcodeProject
    .replace(/MARKETING_VERSION = [^;]+;/gu, `MARKETING_VERSION = ${versionName};`)
    .replace(/CURRENT_PROJECT_VERSION = [^;]+;/gu, `CURRENT_PROJECT_VERSION = ${versionCode};`);

  if (updatedProject !== xcodeProject) {
    writeFileSync(iosXcodeProjectPath, updatedProject);
  }
}
