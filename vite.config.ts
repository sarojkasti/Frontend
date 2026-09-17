import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import fs from 'fs';
// import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  base: "/",
  resolve: {
    alias: {
      "@": "/src",
      "@/components": "/src/components",
      "@/hooks": "/src/hooks",
      "@/utils": "/src/utils",
      "@/service": "/src/service",
      "@/pages": "/src/pages",
      "@/context": "/src/context",
      "@/types": "/src/types",
      "@/lib": "/src/lib",
    },
  },
  server: {
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'ssl/private.key')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certificate.crt')),
    // },
    host: '0.0.0.0',
    allowedHosts: ['artha.sarojkasti.com.np', 'task.artha.com.np', 'client.artha.com.np', 'localhost'],
  },
});
