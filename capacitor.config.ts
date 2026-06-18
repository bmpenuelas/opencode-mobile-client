import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.logicedge.opencodemobile',
  appName: 'OpenCode Mobile',
  webDir: 'dist',
  server: {
    allowNavigation: [
      '*://*:*'
    ],
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
