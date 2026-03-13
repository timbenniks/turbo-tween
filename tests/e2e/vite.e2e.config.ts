import { defineConfig } from 'vite-plus';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'fixtures'),
  server: {
    port: 4174,
  },
});
