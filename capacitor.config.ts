import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.logicedge.opencodemobile',
  appName: 'OpenCode Mobile',
  webDir: 'dist',
  server: {
    // Intentionally broad: users connect to self-managed OpenCode servers on
    // LAN, VPN/Tailscale, or public HTTPS VPS hosts. Do not narrow this without
    // preserving those supported flows and updating store review disclosures.
    allowNavigation: [
      '*://*:*'
    ],
    // Required for local/private HTTP servers. Public/VPS servers should use
    // HTTPS; public HTTP remains warned-but-not-blocked.
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SystemBars: {
      statusBar: {
        style: 'DARK',
        overlaysWebView: false,
      },
      navigationBar: {
        style: 'DARK',
      },
    },
  },
};

export default config;
