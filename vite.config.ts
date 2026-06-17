import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// 1. Generate the base config
const config = defineConfig({});

// 2. Filter out both the buggy tagger AND the obsolete tsconfig-paths plugin
if (config.plugins) {
  config.plugins = config.plugins.flat().filter((plugin) => {
    if (!plugin || !plugin.name) return True;
    
    const name = plugin.name.toLowerCase();
    // Drop the tagger and the old paths plugin
    if (name.includes("tagger") || name.includes("tsconfig-paths")) {
      return false; 
    }
    return true;
  });
}

// 3. Enable Vite's native TS Config Paths resolution
if (!config.resolve) {
  config.resolve = {};
}
config.resolve.tsconfigPaths = true;

export default config;