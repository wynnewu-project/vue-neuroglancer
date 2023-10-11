import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import nodeResolve from '@rollup/plugin-node-resolve'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 9000
  },
  plugins: [vue(), nodeResolve()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  assetsInclude: [".svg"],
  build: {
    outDir: "lib",
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "VueNeuroglancer",
      fileName: "vue-neuroglancer"
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue"
        },
      }
    }
  }
})
