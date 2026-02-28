import type { ExpoConfig, ConfigContext } from '@expo/config';

// This config file is a "safe override" layer.
// It loads whatever is currently in app.json and ONLY removes the expo-sqlite
// config plugin (which can cause builds to fail if the plugin isn't resolvable).
//
// IMPORTANT: This does NOT remove the expo-sqlite package dependency.
// If you still use expo-sqlite in code, keep it installed.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('./app.json');

function filterPlugins(plugins: any[]): any[] {
  return (plugins ?? []).filter((p) => {
    if (typeof p === 'string') return p !== 'expo-sqlite';
    if (Array.isArray(p)) return p[0] !== 'expo-sqlite';
    return true;
  });
}

export default (_ctx: ConfigContext): ExpoConfig => {
  const expo: ExpoConfig = (appJson?.expo ?? {}) as ExpoConfig;

  return {
    ...expo,
    plugins: filterPlugins((expo as any).plugins ?? []),
  };
};
