import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
      port: 4173 // HTTP only
    }
  }

  if (command === 'serve' && !isPreview) {
    return {
      ...baseConfig,
      server: {
        host: 'localhost',
        port: 5173
        // HTTP only - no HTTPS configuration
      }
    }
  }

  // build / preview (dist) – HTTP only
  return baseConfig
})
