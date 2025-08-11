import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  const baseConfig = {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    preview: {
      host: 'localhost',
      port: 4173 // explicit HTTP (no https key set)
    }
  }

  if (command === 'serve' && !isPreview) {
    return {
      ...baseConfig,
      server: {
        host: 'localhost',
        port: 5173,
        https: {
          key: readFileSync(resolve(__dirname, 'localhost+2-key.pem')),
            cert: readFileSync(resolve(__dirname, 'localhost+2.pem'))
        }
      }
    }
  }

  // build / preview (dist) – no HTTPS
  return baseConfig
})
