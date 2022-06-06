import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  splitting: true,
  treeshake: true,
  outDir: 'dist',
  esbuildOptions: (options) => {
    options.footer = {
      // This will ensure we can continue writing this plugin
      // as a modern ECMA module, while still publishing this as a CommonJS
      // library with a default export, as that's how ESLint expects plugins to look.
      // @see https://github.com/evanw/esbuild/issues/1182#issuecomment-1011414271
      js: 'module.exports = module.exports.default;',
    };
  },
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  external: ['vite'],
});