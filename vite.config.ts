import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  // Required for GitHub Pages project URL: https://zendesk.github.io/<repo>/
  base: '/ai-supervisor-prototype/',
  plugins: [react(), svgr()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
