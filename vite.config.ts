// import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// export default defineConfig({});
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// 1. Generate the Lovable config (which contains React, your Router, AND the buggy tagger)
const config = defineConfig({});

// 2. Surgically remove the tagger plugin that is freezing your browser
if (config.plugins) {
  config.plugins = config.plugins.flat().filter((plugin) => {
    // Keep the plugin ONLY if its name does not contain "tagger"
    return plugin && plugin.name && !plugin.name.toLowerCase().includes("tagger");
  });
}

// 3. Export the clean, freeze-free config
export default config;