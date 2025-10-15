import path from 'node:path'
import { defineConfig } from 'vite'

const rootDir = __dirname

export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'html', 'json', 'cobertura'],
      threshold: {
        functions: 90,
        lines: 90,
        perFile: true
      },
    },
  },
  root: rootDir,
  publicDir: false,
  base: './',
  build: {
    outDir: path.resolve(rootDir, 'dist'),
    emptyOutDir: true,
    copyPublicDir: false,
    assetsDir: '.',
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.resolve(rootDir, 'src/index.js'),
      name: 'mergetags',
      formats: ['iife'],
      fileName: () => 'plugin.min.js'
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
})
