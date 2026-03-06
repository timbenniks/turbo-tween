import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'fixtures'),
  server: {
    port: 4174,
  },
});
