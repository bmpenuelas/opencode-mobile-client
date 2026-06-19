import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

function getJavaExecutablePath(javaHome) {
  return platform() === "win32"
    ? join(javaHome, "bin", "java.exe")
    : join(javaHome, "bin", "java");
}

function resolveJavaHome() {
  if (
    process.env.JAVA_HOME &&
    existsSync(getJavaExecutablePath(process.env.JAVA_HOME))
  ) {
    return process.env.JAVA_HOME;
  }

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const candidates = [
    process.env.STUDIO_JDK,
    platform() === "win32"
      ? join(programFiles, "Android", "Android Studio", "jbr")
      : null,
    platform() === "darwin"
      ? "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
      : null,
    platform() === "linux" ? "/opt/android-studio/jbr" : null,
  ].filter(Boolean);

  return (
    candidates.find((c) => existsSync(getJavaExecutablePath(c))) ?? null
  );
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
    PATH: process.env.PATH
      ? `${javaBinPath}${delimiter}${process.env.PATH}`
      : javaBinPath,
  };
}

const processEnv = buildProcessEnv();

function run(description, cmd, args = []) {
  console.log(`\n[${description}]`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: repoRoot,
    env: processEnv,
  });

  if (result.error) {
    console.error(`Failed to run ${cmd}: ${result.error.message}`);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function checkAdbDevices() {
  let result;

  try {
    result = spawnSync("adb", ["devices"], {
      encoding: "utf-8",
      cwd: repoRoot,
      env: processEnv,
    });
  } catch {
    console.error(
      "adb not found. Ensure the Android SDK platform-tools are in your PATH."
    );
    process.exit(1);
  }

  if (result.error) {
    console.error(
      "adb not found. Ensure the Android SDK platform-tools are in your PATH."
    );
    process.exit(1);
  }

  const lines = result.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("List") && !l.startsWith("*"));

  const deviceLines = lines.filter(
    (l) => l.includes("\tdevice") || l.includes(" device")
  );

  if (deviceLines.length === 0) {
    console.error(
      "No Android devices or emulators found.\n" +
        "Connect a device via USB or wireless ADB and try again."
    );
    process.exit(1);
  }

  const physical = deviceLines.filter((l) => !l.startsWith("emulator-"));
  const emulators = deviceLines.filter((l) => l.startsWith("emulator-"));

  if (physical.length === 0) {
    console.error(
      `Only ${emulators.length} emulator(s) found, no physical device detected.\n` +
        "Connect a physical Android device and try again."
    );
    process.exit(1);
  }

  const targetSerial = physical[0].split(/\s+/u)[0];
  console.log(
    `\nFound ${physical.length} physical device(s), ${emulators.length} emulator(s).\nUsing: ${targetSerial}`
  );

  return targetSerial;
}

run("1/3", "npm", ["run", "cap:sync"]);
run("2/3", "npx", ["cap", "copy", "android"]);

const targetSerial = checkAdbDevices();

run("3/3", "npx", ["cap", "run", "android", "--target", targetSerial]);
