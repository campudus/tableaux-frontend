import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        babelrc: true
      }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        // TODO: fix deprecations!
        silenceDeprecations: [
          "slash-div",
          "mixed-decls",
          "import",
          "color-functions",
          "global-builtin"
        ]
      }
    }
  },
  build: {
    // minify: false,
    outDir: "out",
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      maxParallelFileOps: 100,
      onLog(level, log, handler) {
        if (log.code === "EMPTY_BUNDLE") {
          return; // Ignore empty bundle warnings
        } else {
          handler(level, log); // otherwise, just print the log
        }
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // return id.match(/node_modules\/(.+?)\//).at(1);
            return "vendor";
          }

          return null;
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
