import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  const authToken = env.VITE_MCP_AUTH_TOKEN || env.MCP_AUTH_TOKEN || ''

  return {
    plugins: [react()],
    server: {
      port: 3001,
      host: '0.0.0.0',
      proxy: {
        '/api/mcp-standards': {
          target: 'http://mcp-standards:3002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mcp-standards/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (authToken) {
                proxyReq.setHeader('Authorization', `Bearer ${authToken}`)
              }
            })
          }
        },
        '/api/mcp-research': {
          target: 'http://mcp-research:3003',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mcp-research/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (authToken) {
                proxyReq.setHeader('Authorization', `Bearer ${authToken}`)
              }
            })
          }
        },
        '/api/n8n': {
          target: 'http://n8n:5678',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/n8n/, '/api/v1')
        }
      }
    }
  }
})
