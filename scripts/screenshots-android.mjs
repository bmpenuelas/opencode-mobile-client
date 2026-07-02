import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const outDir = join(repoRoot, "docs", "screenshots", "android");
const APP_ID = "com.logicedge.opencodemobile";

const delimiter = platform() === "win32" ? ";" : ":";

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
    console.error(`Failed: ${result.error.message}`);
    process.exit(1);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function adb(args) {
  const result = spawnSync("adb", args, {
    encoding: "utf-8",
    cwd: repoRoot,
  });
  if (result.error) {
    console.error(`adb failed: ${result.error.message}`);
    process.exit(1);
  }
  return result.stdout.trim();
}

function getSerial() {
  const output = adb(["devices"]);
  const lines = output.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("List") && !l.startsWith("*"));
  const deviceLine = lines.find(l => l.includes("\tdevice") || l.includes(" device"));
  if (!deviceLine) {
    console.error("No Android device or emulator found.");
    console.error("Start one with: emulator -avd <name>  or connect a device via USB.");
    process.exit(1);
  }
  return deviceLine.split(/\s+/u)[0];
}

function openApp() {
  const serial = getSerial();
  run("Launching app", "adb", [
    "-s", serial,
    "shell", "am", "start",
    "-n", `${APP_ID}/.MainActivity`,
  ]);
  console.log("\nApp launched. Navigate to the desired screen on the device.");
}

async function capture(name) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const filePath = join(outDir, `${name}.png`);
  const serial = getSerial();
  console.log(`Capturing screenshot → ${filePath}`);
  const result = spawnSync("adb", ["-s", serial, "exec-out", "screencap", "-p"], {
    cwd: repoRoot,
  });
  if (result.error || typeof result.status !== "number" || result.status !== 0) {
    console.error("Screenshot capture failed.");
    process.exit(1);
  }
  const img = sharp(result.stdout);
  const meta = await img.metadata();
  await img
    .extract({ left: 0, top: 100, width: meta.width, height: meta.height - 100 })
    .png()
    .toFile(filePath);
  console.log(`Saved → ${filePath}`);
}

function help() {
  console.log(`
Usage:
  node scripts/screenshots-android.mjs open
      Build app, sync to Android, launch on device/emulator.

  node scripts/screenshots-android.mjs capture <name>
      Capture current screen to docs/screenshots/android/<name>.png

  node scripts/screenshots-android.mjs guided
      Build + launch, then walk through all screenshots one by one.

Examples:
  node scripts/screenshots-android.mjs open
  node scripts/screenshots-android.mjs capture landing-screen
  node scripts/screenshots-android.mjs capture server-list
`);
}

const mode = process.argv[2];

if (!mode || mode === "help") {
  help();
  process.exit(0);
}

if (mode === "open") {
  run("Building and syncing", "npm", ["run", "cap:sync:android"]);
  run("Installing on device", "npx", ["cap", "run", "android", "--target", getSerial()]);
  openApp();
  console.log("\nReady. Run capture commands for each screen you want.");
  process.exit(0);
}

if (mode === "guided") {
  const screens = [
    { name: "play-store-01-landing", desc: "Landing screen" },
    { name: "play-store-02-server-list", desc: "Server list" },
    { name: "play-store-03-add-server", desc: "Add server form" },
    { name: "play-store-04-connected", desc: "Active connection" },
    { name: "play-store-05-pull-menu", desc: "TopPullMenu open" },
    { name: "play-store-06-settings", desc: "Settings screen" },
    { name: "play-store-07-help", desc: "Help screen" },
  ];
  run("Building and syncing", "npm", ["run", "cap:sync:android"]);
  run("Installing on device", "npx", ["cap", "run", "android", "--target", getSerial()]);
  openApp();
  const { createInterface } = await import("node:readline");
  for (const screen of screens) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await new Promise((resolve) => {
      rl.question(`\nNavigate to "${screen.desc}" then press Enter → `, () => {
        rl.close();
        resolve();
      });
    });
    await capture(screen.name);
  }
  console.log("\nAll screenshots captured!");
  process.exit(0);
}

if (mode === "capture") {
  const name = process.argv[3];
  if (!name) {
    console.error("Usage: node scripts/screenshots-android.mjs capture <name>");
    process.exit(1);
  }
  await capture(name);
  process.exit(0);
}

console.error(`Unknown mode: ${mode}`);
help();
process.exit(1);
