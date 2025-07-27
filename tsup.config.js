import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'try-result': 'src/index.ts',
  },
  globalName: 'DoTryTuple',
  format: ['iife'],
  outExtension() {
    return {
      js: '.min.js',
    };
  },
  dts: false,
  minify: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist/build',
});
