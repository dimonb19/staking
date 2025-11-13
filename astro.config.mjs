// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [react(), svelte()],
  vite: {
    resolve: {
      alias: {
        '@': srcDir,
        '@stores': `${srcDir}/stores`,
        '@constants': `${srcDir}/constants`,
        '@lib': `${srcDir}/lib`,
        '@components': `${srcDir}/components`,
      },
    },
  },
});
