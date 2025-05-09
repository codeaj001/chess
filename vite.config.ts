import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@solana/spl-token'],
  },
  esbuildOptions: {
    plugins: [
      {
        name: 'bn.js-fix',
        setup(build) {
          build.onLoad({ filter: /bn.js\/lib\/bn\.js/ }, async (args) => {
            const contents = await require('fs').promises.readFile(args.path, 'utf8');
            return { contents: contents.replace('module.exports = BN;', 'export default BN;'), loader: 'js' };
          });
        },
      },
    ],
  },
});
