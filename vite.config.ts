import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import zlib from 'zlib'
import path from 'path'

// Pre-decompress .br files on startup
function decompressBrFiles() {
  const buildDir = path.join(process.cwd(), 'src/assets/Addressables_web/Build');
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

function brotliServePlugin(): Plugin {
  return {
    name: 'brotli-serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url?.split('?')[0] ?? '';
        if (!urlPath.endsWith('.br')) {
          return next();
        }

        const filePath = path.join(process.cwd(), urlPath);
        if (!fs.existsSync(filePath)) {
          return next();
        }

        const lower = urlPath.toLowerCase();
        if (lower.endsWith('.js.br')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (lower.endsWith('.wasm.br')) {
          res.setHeader('Content-Type', 'application/wasm');
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Cache-Control', 'no-cache');

        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    brotliServePlugin(),
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
