import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import zlib from 'zlib'
import path from 'path'

// Pre-decompress .br files on startup
function decompressBrFiles() {
  const buildDir = path.join(process.cwd(), 'src/assets/Web/Build');
  if (fs.existsSync(buildDir)) {
    const files = fs.readdirSync(buildDir);
    files.forEach(file => {
      if (file.endsWith('.br')) {
        const brPath = path.join(buildDir, file);
        const decompPath = brPath.slice(0, -3); // Remove .br extension

        // Skip if already decompressed
        if (fs.existsSync(decompPath)) {
          return;
        }

        try {
          const compressed = fs.readFileSync(brPath);
          const decompressed = zlib.brotliDecompressSync(compressed);
          fs.writeFileSync(decompPath, decompressed);
          console.log(`[Brotli] Decompressed ${file} -> ${path.basename(decompPath)}`);
        } catch (err) {
          console.error(`[Brotli] Failed to decompress ${file}:`, err);
        }
      }
    });
  }
}

// Run decompression on startup
decompressBrFiles();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  assetsInclude: ['**/*.br', '**/*.data', '**/*.wasm'],
  server: {
    proxy: {
      '/WebGL/': {
        target: 'https://d2d4gyq8b7qwvw.cloudfront.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/WebGL/, ''),
      },
    },
  },
})
