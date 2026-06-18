import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";

const gradleTasks = process.argv.slice(2);

if (gradleTasks.length === 0) {
  console.error("Usage: node scripts/android-release.mjs <gradle tasks...>");
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function getJavaExecutablePath(javaHome) {
  return platform() === "win32"
    ? join(javaHome, "bin", "java.exe")
    : join(javaHome, "bin", "java");
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME && existsSync(getJavaExecutablePath(process.env.JAVA_HOME))) {
    return process.env.JAVA_HOME;
  }

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const candidateJavaHomes = [
    process.env.STUDIO_JDK,
    platform() === "win32" ? join(programFiles, "Android", "Android Studio", "jbr") : null,
    platform() === "darwin" ? "/Applications/Android Studio.app/Contents/jbr/Contents/Home" : null,
    platform() === "linux" ? "/opt/android-studio/jbr" : null,
  ].filter(Boolean);

  return candidateJavaHomes.find((candidate) => existsSync(getJavaExecutablePath(candidate))) ?? null;
}

function buildProcessEnv() {
  const javaHome = resolveJavaHome();

  if (!javaHome) {
    return process.env;
  }

  const javaBinPath = join(javaHome, "bin");

  return {
    ...process.env,
    JAVA_HOME: javaHome,
    PATH: process.env.PATH ? `${javaBinPath}${delimiter}${process.env.PATH}` : javaBinPath,
  };
}

function logArtifactIfExists(label, filePath) {
  if (existsSync(filePath)) {
    console.log(`${label}: ${filePath}`);
    return filePath;
  }

  return undefined;
}

function revealArtifact(filePath) {
  const os = platform();
  const command =
    os === "win32"
      ? "cmd.exe"
      : os === "darwin"
        ? "open"
        : os === "linux"
          ? "xdg-open"
          : undefined;
  const args =
    os === "win32"
      ? ["/c", "start", "", dirname(filePath)]
      : os === "darwin"
        ? ["-R", filePath]
        : os === "linux"
          ? [dirname(filePath)]
          : [];

  if (!command) {
    return;
  }

  const result = spawnSync(command, args, {
    stdio: "ignore",
    shell: false,
    windowsHide: true,
  });

  if (result.error) {
    console.warn(`Built artifact, but could not open destination folder: ${result.error.message}`);
  } else if (typeof result.status === "number" && result.status !== 0) {
    console.warn(`Built artifact, but could not open destination folder. Exit code: ${result.status}`);
  }
}

function taskMatchesArtifact(task, artifactTaskName) {
  return task.toLowerCase().includes(artifactTaskName.toLowerCase());
}

function artifactsForTasks(artifacts) {
  const requestedArtifacts = [];

  if (
    gradleTasks.some((task) => taskMatchesArtifact(task, "bundleRelease")) &&
    artifacts.appBundle
  ) {
    requestedArtifacts.push(artifacts.appBundle);
  }

  if (
    gradleTasks.some((task) => taskMatchesArtifact(task, "assembleRelease")) &&
    artifacts.apk
  ) {
    requestedArtifacts.push(artifacts.apk);
  }

  return requestedArtifacts.length > 0
    ? requestedArtifacts
    : Object.values(artifacts).filter(Boolean);
}

const androidDirectory = resolve("android");
const processEnv = buildProcessEnv();

if (platform() === "win32") {
  run("cmd.exe", ["/c", "gradlew.bat", ...gradleTasks], { cwd: androidDirectory, env: processEnv });
} else {
  run("./gradlew", gradleTasks, { cwd: androidDirectory, env: processEnv });
}

const appBundle = logArtifactIfExists(
  "Android App Bundle",
  resolve("android/app/build/outputs/bundle/release/app-release.aab")
);
const apk = logArtifactIfExists(
  "Android APK",
  resolve("android/app/build/outputs/apk/release/app-release.apk")
);
logArtifactIfExists(
  "R8 mapping file",
  resolve("android/app/build/outputs/mapping/release/mapping.txt")
);
logArtifactIfExists(
  "Native debug symbols",
  resolve("android/app/build/outputs/native-debug-symbols/release/native-debug-symbols.zip")
);

for (const artifact of artifactsForTasks({ appBundle, apk })) {
  if (artifact) {
    revealArtifact(artifact);
  }
}
