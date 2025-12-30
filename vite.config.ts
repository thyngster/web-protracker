import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Library build mode
  if (mode === 'lib') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          name: 'ChipPlayer',
          fileName: (format) => `chip-player.${format}.js`,
          formats: ['es', 'umd'],
        },
        outDir: 'dist-lib',
        rollupOptions: {
          // No external dependencies - pure standalone library
          external: [],
        },
      },
    };
  }

  // Default: Vue app build
  return {
    plugins: [vue()],
  };
});
