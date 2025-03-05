import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

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
  define: {
    "import.meta.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "import.meta.env.BUILD_ID": JSON.stringify(process.env.BUILD_ID),
    "import.meta.env.REDUX_DEVTOOLS": JSON.stringify(process.env.REDUX_DEVTOOLS)
  },
  clearScreen: false,
  build: {
    outDir: "out",
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      maxParallelFileOps: 100,
      onLog(level, log, handler) {
        if (log.code === "EMPTY_BUNDLE") {
          return;
        } else {
          handler(level, log);
        }
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // DEBUG: split dependencies into separate files
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
  },
  test: {
    globals: true,
    environment: "happy-dom",
    reporters: [
      [
        "junit",
        {
          suiteName: "grud-frontend",
          outputFile: "./output/coverage/junit.xml"
        }
      ],
      [
        "default",
        {
          summary: false
        }
      ]
    ],
    coverage: {
      provider: "v8",
      reporter: ["cobertura", "html", "text-summary"],
      reportsDirectory: "./output/coverage",
      include: ["/(src|tests)/**/*.(j|t)sx?"]
    }
  }
});
