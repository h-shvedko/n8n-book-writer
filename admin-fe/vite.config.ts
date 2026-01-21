import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api/mcp-standards': {
        target: 'http://mcp-standards:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp-standards/, '')
      },
      '/api/mcp-research': {
        target: 'http://mcp-research:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mcp-research/, '')
      },
      '/api/n8n': {
        target: 'http://n8n:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '/api/v1')
      }
    }
  }
})
