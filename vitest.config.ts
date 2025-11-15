import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@components/*': path.resolve(__dirname, 'src/components/*'),
      '@errors': path.resolve(__dirname, 'src/errors'),
      '@errors/*': path.resolve(__dirname, 'src/errors/*'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@layouts/*': path.resolve(__dirname, 'src/layouts/*'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@lib/*': path.resolve(__dirname, 'src/lib/*'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@constants/*': path.resolve(__dirname, 'src/constants/*'),
      '@service': path.resolve(__dirname, 'src/service'),
      '@service/*': path.resolve(__dirname, 'src/service/*'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@stores/*': path.resolve(__dirname, 'src/stores/*'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@styles/*': path.resolve(__dirname, 'src/styles/*'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@utils/*': path.resolve(__dirname, 'src/utils/*'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
