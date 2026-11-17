import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * Production builds never run the WebXR emulator, but @pmndrs/xr references it through a dynamic
 * import, which would ship IWER + multi-MB synthetic rooms. Swap it for a stub in `vite build`.
 */
function stripXREmulator(): Plugin {
  const STUB = '\0ww-xr-emulator-stub'
  return {
    name: 'ww-strip-xr-emulator',
    apply: 'build',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './emulate.js' && importer?.includes('@pmndrs/xr')) return STUB
      return null
    },
    load(id) {
      if (id === STUB) return 'export function emulate() { throw new Error("WebXR emulator is not available in production builds") }'
      return null
    },
  }
}

export default defineConfig({
  plugins: [stripXREmulator(), react(), tailwindcss()],
  resolve: { dedupe: ['three'], alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5193, host: true },
  preview: { port: 5193 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three') || id.includes('@pmndrs') || id.includes('troika')) return 'r3f'
          return undefined
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
  },
})
