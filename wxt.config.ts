import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['clipboardWrite'],
  },
  webExt: {
    startUrls: ['https://jsonplaceholder.typicode.com/todos'],
  },
});
