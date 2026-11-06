import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: "catalog",
      filename: "remoteEntry.js",
      exposes: { "./mount": "./src/mount.js" },
      shared: ["vue"],
    }),
  ],
  build: { target: "esnext", minify: false, cssCodeSplit: false },
});
