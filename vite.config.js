import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({build:{rollupOptions:{input:{
  studio:fileURLToPath(new URL('./index.html',import.meta.url)),
  handStudy:fileURLToPath(new URL('./hand-study.html',import.meta.url)),
}}}});
