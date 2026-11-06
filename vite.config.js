import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: false,
      theme: { prefix: "tw" },
    }),
    federation({
      name: "products",
      filename: "remoteEntry.js",
      exposes: { "./mount": "./src/mount.js" },
      shared: ["vue"],
    }),
  ],
  build: { target: "esnext", minify: false, cssCodeSplit: false },
});
