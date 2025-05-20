import connectLoki from "connect-loki";
import express from "express";
import session from "express-session";
import finalhandler from "finalhandler";
import httpProxy from "http-proxy";
import path from "path";
import serveStatic from "serve-static";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import uuid from "uuid";
import loadConfig from "./config.js";
import * as mockAuth from "./dev/mockAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "..");
const defaultConfigPath = path.join(baseDir, "config.json");

const { values: processArgs } = parseArgs({
  options: {
    config: {
      type: "string",
      default: defaultConfigPath
    },
    dev: {
      type: "boolean",
      default: false
    }
  }
});
const configPath = processArgs.config;
const dev = processArgs.dev;
const config = loadConfig(configPath);

console.log("GRUD server options:", config);

const LokiStore = connectLoki(session);
const app = express();

const ROUTES = {
  API: {
    prefix: "/api/", // with ending slash, otherwise resources starting with "api" won't work
    handler: {
      target: `http://${config.apiHost}:${config.apiPort}`,
      prependPath: true
    }
  }
};

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  xfwd: true
});

proxy.on("proxyReq", (proxyReq, req) => {
  // if keycloak's env PROXY_ADDRESS_FORWARDING=true then keycloak will set
  // the cookie for the given `X-Forwarded-Url`
  proxyReq.setHeader("X-Forwarded-Url", req.originalUrl);

  // rewrite path
  for (const route of Object.values(ROUTES)) {
    const prefixRegExp = new RegExp(`^${route.prefix}`);
    const cleanPath = proxyReq.path.replace(prefixRegExp, "/");
    proxyReq.path = cleanPath;
  }
});

if (dev && config.injectPermissions) {
  console.log(
    "Skipping auth and injecting permissions from",
    config.injectPermissions
  );
  const permissionConfig = await mockAuth.loadPermissionConfig(
    config.injectPermissions
  );
  if (permissionConfig.isRight()) {
    console.log("Valid permission config found");
    proxy.on(
      "proxyRes",
      mockAuth.injectPermissions(permissionConfig.getValue())
    );
  } else {
    console.error(permissionConfig.getReason());
  }
}

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  res?.writeHead(500, { "Content-Type": "text/plain" });
  res?.end(JSON.stringify(err));
});

if (!config.disableAuth) {
  app.use(
    session({
      store: new LokiStore({
        autosave: false,
        ttl: 60 // in production, pings will keep the session alive
      }),
      secret: uuid(),
      resave: true,
      saveUninitialized: false,
      unset: "destroy",
      proxy: true
    })
  );
}

app.get("/config.json", (req, res) => res.json(config));

app.use((req, res, next) => {
  if (req.url.includes(ROUTES.API.prefix)) {
    const withAuth = !config.disableAuth;

    // upgrade auth headers
    if (withAuth && req.headers.authorization) {
      // Despite the look, no session data leaks to the client, only a session id gets attached
      // (see https://github.com/expressjs/session#readme)
      req.session.token = req.headers.authorization;
    } else if (withAuth && req.session.token) {
      req.headers.authorization = req.session.token;
    }

    proxy.web(req, res, ROUTES.API.handler);
  } else {
    next();
  }
});

if (dev) {
  const { createServer: createDevServer } = await import("vite");
  const devServer = await createDevServer({
    root: baseDir,
    server: {
      middlewareMode: true
    }
  });

  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("BUILD_ID:", process.env.BUILD_ID);

  app.use(devServer.middlewares);
} else {
  app.use((req, res, next) => {
    const resourceRegex = /\/[^/]+\.[^/]+$/;

    if (resourceRegex.test(req.url)) {
      const final = finalhandler(req, res); // callback for mime types and error handling
      const serve = serveStatic(config.outDir);
      return serve(req, res, final);
    } else {
      return next();
    }
  });

  app.use((req, res) => {
    return res.sendFile("/index.html", { root: config.outDir });
  });
}

app.listen(config.port, config.host, () => {
  const url = `http://${config.host}:${config.port}`;
  console.log(`GRUD server listening at ${url}`);
});
