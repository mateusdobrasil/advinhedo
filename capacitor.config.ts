import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ibv.portal',
  appName: 'IBV APP',
  webDir: 'dist',
  server: {
    url: 'http://192.168.15.40:3000',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
};

export default config;
