import { spawn } from "node:child_process";
import https from "node:https";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const DEFAULT_FRONTEND_PORT = 5173;

const host = process.env.ANDROID_LIVE_RELOAD_HOST || resolveLiveReloadHost();
const port = process.env.ANDROID_LIVE_RELOAD_PORT || String(DEFAULT_FRONTEND_PORT);
const explicitHttps = readExplicitHttpsPreference();
const detectedProtocol = await detectExistingFrontendProtocol(port);
const useHttps =
  explicitHttps != null ? explicitHttps : detectedProtocol === "https";
const localFrontendUrl = `${useHttps ? "https" : "http"}://127.0.0.1:${port}`;

let frontendChild = null;
let startedFrontend = false;
let stoppedByParent = false;

if (!detectedProtocol) {
  frontendChild = startFrontendDevServer();
  startedFrontend = true;
  await waitForFrontend(localFrontendUrl);
} else if (!(await isFrontendReachable(localFrontendUrl))) {
  throw new Error(
    `Detected an existing ${detectedProtocol.toUpperCase()} frontend dev server on port ${port}, but it was not reachable at ${localFrontendUrl}.`
  );
}

const args = [
  "run",
  "android",
  "--live-reload",
  "--host",
  host,
  "--port",
  port,
  ...process.argv.slice(2),
];

if (useHttps) {
  args.push("--https");
}

console.log(
  `Android live reload -> ${useHttps ? "https" : "http"}://${host}:${port}`
);
if (startedFrontend) {
  console.log("Started a local frontend dev server for Android live reload.");
} else {
  console.log("Reusing the existing frontend dev server.");
}

const command = process.execPath;
const child = spawn(command, [resolveCapacitorCliEntrypoint(), ...args], {
  cwd: repoRoot,
  env: process.env,
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  stopFrontendDevServer();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  stopFrontendDevServer();
});

process.on("SIGTERM", () => {
  stopFrontendDevServer();
});

function readExplicitHttpsPreference() {
  const explicit = process.env.ANDROID_LIVE_RELOAD_HTTPS;
  if (explicit != null && explicit !== "") {
    return /^(1|true|yes)$/iu.test(explicit);
  }

  return null;
}

function resolveCapacitorCliEntrypoint() {
  return join(repoRoot, "node_modules", "@capacitor", "cli", "bin", "capacitor");
}

function resolveLiveReloadHost() {
  const configuredHost = readConfiguredHost();
  if (configuredHost && !isPublicHostname(configuredHost)) {
    if (isLocalhostLikeHost(configuredHost)) {
      return detectPrivateIpv4() || configuredHost;
    }

    return configuredHost;
  }

  return detectPrivateIpv4() || "localhost";
}

function readConfiguredHost() {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    return "";
  }

  try {
    return new URL(appBaseUrl).hostname;
  } catch {
    return "";
  }
}

function detectPrivateIpv4() {
  const interfaces = networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family !== "IPv4" || address.internal) {
        continue;
      }

      if (isPrivateIpv4(address.address)) {
        return address.address;
      }
    }
  }

  return "";
}

function isLocalhostLikeHost(host) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  );
}

function isPublicHostname(host) {
  if (!host) {
    return false;
  }

  if (isLocalhostLikeHost(host) || isPrivateIpv4(host)) {
    return false;
  }

  return !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/iu.test(host)
    ? false
    : !host.endsWith(".local");
}

function isPrivateIpv4(ipAddress) {
  return (
    /^10\./u.test(ipAddress) ||
    /^192\.168\./u.test(ipAddress) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./u.test(ipAddress) ||
    /^169\.254\./u.test(ipAddress)
  );
}

function startFrontendDevServer() {
  const env = {
    ...process.env,
  };

  const command = process.execPath;
  const args = [join(repoRoot, "node_modules", "vite", "bin", "vite.js")];

  const child = spawn(command, args, {
    cwd: repoRoot,
    env,
    shell: false,
    stdio: ["ignore", "inherit", "inherit"],
  });

  child.on("exit", (code) => {
    if (!stoppedByParent && code !== 0) {
      console.error(`Frontend dev server exited early with code ${code ?? "unknown"}.`);
    }
  });

  return child;
}

function stopFrontendDevServer() {
  if (!startedFrontend || !frontendChild || frontendChild.killed) {
    return;
  }

  stoppedByParent = true;
  frontendChild.kill();
}

async function waitForFrontend(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isFrontendReachable(url)) {
      return;
    }

    await sleep(500);
  }

  throw new Error(`Frontend dev server did not become reachable at ${url} within ${timeoutMs}ms.`);
}

async function isFrontendReachable(url) {
  const { protocol } = new URL(url);

  if (protocol === "https:") {
    return isHttpsReachable(url);
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function detectExistingFrontendProtocol(port) {
  if (await isFrontendReachable(`http://127.0.0.1:${port}`)) {
    return "http";
  }

  if (await isHttpsReachable(`https://127.0.0.1:${port}`)) {
    return "https";
  }

  return "";
}

function isHttpsReachable(url) {
  return new Promise((resolve) => {
    const request = https.get(
      url,
      {
        rejectUnauthorized: false,
        timeout: 3000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode != null && response.statusCode >= 200 && response.statusCode < 300);
      }
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => {
      resolve(false);
    });
  });
}
