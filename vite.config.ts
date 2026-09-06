import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function expoWebResolverPlugin(): Plugin {
  return {
    name: 'expo-web-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null;

      // Handle directory import of polyfill in expo-modules-core
      if (source === './polyfill' || source.endsWith('/polyfill')) {
        const candidate = path.resolve(path.dirname(importer), source, 'index.web.ts');
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }

      // Handle ExponentImagePicker resolution to .web.js
      if (source === './ExponentImagePicker' || source.endsWith('/ExponentImagePicker')) {
        const webCandidate = path.resolve(path.dirname(importer), 'ExponentImagePicker.web.js');
        if (fs.existsSync(webCandidate)) {
          return webCandidate;
        }
      }

      // Handle .web.* variants taking priority over native files
      if (source.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(importer), source);
        for (const ext of ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']) {
          if (fs.existsSync(resolvedPath + ext)) {
            return resolvedPath + ext;
          }
          if (fs.existsSync(path.join(resolvedPath, 'index' + ext))) {
            return path.join(resolvedPath, 'index' + ext);
          }
        }
      }

      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [expoWebResolverPlugin(), react(), tailwindcss()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    'global.__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.EXPO_OS': JSON.stringify('web'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
    },
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
    alias: [
      { find: 'react-native', replacement: path.resolve(__dirname, 'src/shims/react-native.ts') },
      {
        find: /.*expo-image-picker\/.*ExponentImagePicker(\.js)?$/,
        replacement: path.resolve(__dirname, 'node_modules/expo-image-picker/build/ExponentImagePicker.web.js'),
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all'
  }
});
