import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const elasticUrl = env.VITE_ELASTIC_URL || ''

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Proxy Kibana/Agent Builder API calls (Agent Builder lives on Kibana endpoint)
        '/kb-proxy': {
          target: env.VITE_KIBANA_URL || elasticUrl.replace('.es.', '.kb.').replace(':443', ''),
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/kb-proxy/, ''),
        },
        // Proxy direct ES data API calls
        '/es-proxy': {
          target: elasticUrl,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/es-proxy/, ''),
        },
      },
    },
  }
})
