// metro.config.js
//
// Rork / Expo sometimes starts Metro before dependencies are installed in node_modules.
// If node_modules is missing (or missing key packages like @supabase/supabase-js), Metro will crash.
//
// This lightweight bootstrap checks for a "sentinel" dependency and, if missing, runs an install
// once before proceeding. This makes the build far more resilient when dependencies get out of sync.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function ensureNodeModules() {
  const nm = path.join(__dirname, 'node_modules');

  // Sentinel dependency: the app cannot run without Supabase.
  const supabaseSentinel = path.join(nm, '@supabase', 'supabase-js', 'package.json');

  // If node_modules doesn't exist OR Supabase isn't installed, install deps.
  if (!exists(nm) || !exists(supabaseSentinel)) {
    console.log('[metro.config] node_modules missing/incomplete — installing dependencies…');

    // Prefer bun (this repo uses bun scripts), but fall back to npm.
    try {
      execSync('bun install', { stdio: 'inherit' });
      return;
    } catch (e) {
      console.warn('[metro.config] bun install failed. Trying npm install…');
      try {
        execSync('npm install', { stdio: 'inherit' });
        return;
      } catch (e2) {
        console.error('[metro.config] npm install also failed.');
        console.error('[metro.config] Please run bun install / npm install locally and push the lockfile.');
      }
    }
  }
}

ensureNodeModules();

const { getDefaultConfig } = require('expo/metro-config');
const { withRorkMetro } = require('@rork-ai/toolkit-sdk/metro');

const config = getDefaultConfig(__dirname);

module.exports = withRorkMetro(config);
