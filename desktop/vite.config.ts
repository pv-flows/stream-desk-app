import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@hello-pangea/dnd")) {
              return "vendor-dnd";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (
              id.includes("react-dom") ||
              id.includes("react") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }
            if (id.includes("@tauri-apps")) {
              return "vendor-tauri";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            return "vendor";
          }
        },
      },
    },
  },
}));
