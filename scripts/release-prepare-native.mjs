import { spawnSync } from "node:child_process";

const [platform, maybeOpenFlag] = process.argv.slice(2);
const shouldOpen = maybeOpenFlag === "--open";
const npmRunner = resolveNpmRunner();

if (!["ios", "android"].includes(platform)) {
  console.error("Usage: node scripts/release-prepare-native.mjs <ios|android> [--open]");
  process.exit(1);
}

run(npmRunner.command, [...npmRunner.args, "version", "patch", "--no-git-tag-version"]);
run(process.execPath, ["./scripts/sync-native-versions.mjs"]);
run(npmRunner.command, [...npmRunner.args, "run", `cap:sync:${platform}`]);

if (shouldOpen) {
  run(npmRunner.command, [...npmRunner.args, "run", `cap:open:${platform}`]);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error(`[release-prepare-native] Could not find executable: ${command}`);
    } else {
      console.error(result.error.message);
    }
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function resolveNpmRunner() {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath],
    };
  }

  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", "npm"],
    };
  }

  return {
    command: "npm",
    args: [],
  };
}
