const path = require("path");
const { createProxyServer } = require("http-proxy");
const express = require("express");
const session = require("express-session");
const LokiStore = require("connect-loki")(session);
const uuid = require("uuid");

const SESSION_LIVE_TIME_SECONDS = 60; // in production, pings will keep the session alive
const lokiOptions = { autosave: false, ttl: SESSION_LIVE_TIME_SECONDS };
const sessionOptions = {
  store: new LokiStore(lokiOptions),
  secret: uuid(),
  resave: true,
  saveUninitialized: false,
  unset: "destroy",
  proxy: true
};

// These config params can be overwritten by env params
const envParams = [
  "outDir",
  "apiHost",
  "apiPort",
  "host",
  "port",
  "webhookUrl",
  "authClientId",
  "authServerUrl",
  "authRealm",
  "enableHistory",
  "showTableDropdown",
  "disableAuth"
];

const configDefaults = {
  enableHistory: true,
  showTableDropdown: true,
  outDir: "out",
  apiHost: "localhost",
  apiPort: 8080,
  host: "0.0.0.0",
  port: "3000"
};

const enrichConfig = config => {
  try {
    const configPrefix = "--config=";
    const projectBaseDir = __dirname.replace(/\/src\/static$|\/out$/, "");
    const configFile =
      process.argv
        .filter(arg => arg.startsWith(configPrefix))
        .map(arg => arg.replace(configPrefix, ""))[0] ||
      path.join(projectBaseDir, "config.json");
    console.error("Config file path", configFile);
    const localConfig = require(configFile);
    config = {
      ...config,
      ...localConfig
    };
  } catch (err) {
    console.error("Warning: Could not read config file, using defaults");
  }

  const overrideConfigWithEnv = envVar => {
    const envValue =
      process.env[envVar.replace(/([A-Z])/g, "_$1").toUpperCase()] ||
      process.env[envVar.toUpperCase()];
    if (envValue) {
      console.error("Overriding", envVar, "with", envValue, "from environment");
      config[envVar] = envValue === "false" ? false : envValue;
      try {
        config[envVar] = JSON.parse(envValue); // extract bools and numbers
      } catch (err) {
        config[envVar] = envValue;
      }
    }
  };

  envParams.forEach(overrideConfigWithEnv);
  return { ...configDefaults, ...config };
};

const upgradeAuthHeaders = req => {
  const authorizationToken = req.headers.authorization || "";
  if (authorizationToken) {
    // Despite the look, no session data leaks to the client, only a session id gets attached
    // (see https://github.com/expressjs/session#readme)
    req.session.token = authorizationToken;
  } else {
    const { token } = req.session;
    if (token) {
      req.headers.authorization = token;
    }
  }
};

const stripProxyPrefixes = prefixes => proxyReq => {
  prefixes.forEach(
    prefix => (proxyReq.path = proxyReq.path.replace(prefix, ""))
  );
};

const configProxy = (
  routes,
  defaultHandler = null,
  config = configDefaults
) => {
  const proxy = createProxyServer({
    changeOrigin: true,
    xfwd: true,
    // if keycloak's env PROXY_ADDRESS_FORWARDING=true then keycloak will set
    // the cookie for the given `X-Forwarded-Url`
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Forwarded-Url", req.originalUrl);
    }
  });
  const prefixRegexes = routes.map(({ prefix }) => new RegExp("^" + prefix));

  proxy.on("proxyReq", stripProxyPrefixes(prefixRegexes));

  proxy.on("error", (err, req, res) => {
    console.error("Proxy error:", err);
    res &&
      res.writeHead(500, {
        "Content-Type": "text/plain"
      });
    res && res.end(JSON.stringify(err));
  });

  return (req, res, next) => {
    if (req.url.includes("/api") && !config.disableAuth) {
      upgradeAuthHeaders(req);
    }

    const requestHandler = routes.reduce((_handler, { prefix, handler }) => {
      return _handler || (req.url.includes(prefix) ? handler : null);
    }, null);

    const proxyHandler = requestHandler || defaultHandler;
    return proxyHandler ? proxy.web(req, res, proxyHandler) : next();
  };
};

const app = express();

const startServer = (config, handlers) => {
  console.log("GRUD server options:", config);

  if (!config.disableAuth) {
    app.use(session(sessionOptions));
  }

  app.get("/config.json", (req, res) => res.json(config));
  handlers.forEach(handler => app.use(handler));
  app.listen(config.port, config.host, () => {
    console.log(`GRUD server listening at ${config.host}:${config.port}`);
  });
};

module.exports = { enrichConfig, configProxy, startServer };
