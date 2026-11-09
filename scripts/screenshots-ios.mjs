import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const outDir = join(repoRoot, "docs", "screenshots", "ios");
const APP_ID = "com.opencode.mobile.ar";

function run(description, cmd, args = []) {
  console.log(`\n[${description}]`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: repoRoot,
  });
  if (result.error) {
    console.error(`Failed: ${result.error.message}`);
    process.exit(1);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function simctl(args) {
  const result = spawnSync("xcrun", ["simctl", ...args], {
    encoding: "utf-8",
    cwd: repoRoot,
  });
  if (result.error) {
    console.error(`simctl failed: ${result.error.message}`);
    process.exit(1);
  }
  return result.stdout.trim();
}

function getBootedSimulator() {
  const output = simctl(["list", "devices", "booted", "--json"]);
  let data;
  try {
    data = JSON.parse(output);
  } catch {
    console.error("Failed to parse simctl output.");
    process.exit(1);
  }
  for (const runtime of Object.values(data.devices)) {
    for (const device of runtime) {
      if (device.state === "Booted") {
        return device.udid;
      }
    }
  }
  console.error("No booted iOS simulator found.");
  console.error("Boot one first: xcrun simctl boot <udid>");
  process.exit(1);
}

function openApp() {
  const udid = getBootedSimulator();
  run("Launching app", "xcrun", [
    "simctl", "launch", udid, APP_ID,
  ]);
  console.log("\nApp launched in the simulator.");
}

function capture(name) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const filePath = join(outDir, `${name}.png`);
  const udid = getBootedSimulator();
  console.log(`Capturing screenshot → ${filePath}`);
  const result = spawnSync("xcrun", ["simctl", "screenshot", udid, filePath], {
    encoding: "utf-8",
    cwd: repoRoot,
  });
  if (result.error || typeof result.status !== "number" || result.status !== 0) {
    console.error("Screenshot capture failed.");
    process.exit(1);
  }
  console.log(`Saved → ${filePath}`);
}

function help() {
  console.log(`
Usage:
  node scripts/screenshots-ios.mjs open
      Build app, sync to iOS, launch on booted simulator.

  node scripts/screenshots-ios.mjs capture <name>
      Capture current screen to docs/screenshots/ios/<name>.png

  node scripts/screenshots-ios.mjs guided
      Build + launch, then walk through all screenshots one by one.

Examples:
  node scripts/screenshots-ios.mjs open
  node scripts/screenshots-ios.mjs capture landing-screen
  node scripts/screenshots-ios.mjs capture server-list
`);
}

const mode = process.argv[2];

if (!mode || mode === "help") {
  help();
  process.exit(0);
}

if (mode === "open") {
  getBootedSimulator();
  run("Building and syncing", "npm", ["run", "cap:sync:ios"]);
  run("Installing on simulator", "npx", ["cap", "run", "ios", "--target", getBootedSimulator()]);
  openApp();
  console.log("\nReady. Run capture commands for each screen you want.");
  process.exit(0);
}

if (mode === "guided") {
  const screens = [
    { name: "app-store-01-landing", desc: "Landing screen" },
    { name: "app-store-02-server-list", desc: "Server list" },
    { name: "app-store-03-add-server", desc: "Add server form" },
    { name: "app-store-04-connected", desc: "Active connection" },
    { name: "app-store-05-pull-menu", desc: "TopPullMenu open" },
    { name: "app-store-06-settings", desc: "Settings screen" },
    { name: "app-store-07-help", desc: "Help screen" },
  ];
  getBootedSimulator();
  run("Building and syncing", "npm", ["run", "cap:sync:ios"]);
  run("Installing on simulator", "npx", ["cap", "run", "ios", "--target", getBootedSimulator()]);
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
    capture(screen.name);
  }
  console.log("\nAll screenshots captured!");
  process.exit(0);
}

if (mode === "capture") {
  const name = process.argv[3];
  if (!name) {
    console.error("Usage: node scripts/screenshots-ios.mjs capture <name>");
    process.exit(1);
  }
  capture(name);
  process.exit(0);
}

console.error(`Unknown mode: ${mode}`);
help();
process.exit(1);
