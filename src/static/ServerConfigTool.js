const path = require("path");
const { createProxyServer } = require("http-proxy");

// These config params can be overwritten by env params
const envParams = [
  "outDir",
  "apiHost",
  "apiPort",
  "host",
  "port",
  "webhookUrl",
  "authServerUrl",
  "authRealm"
];

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
    config = { ...config, ...localConfig };
  } catch (err) {
    console.error("Warning: Could not read config file, using defaults");
  }

  const overrideConfigWithEnv = envVar => {
    const envValue =
      process.env[envVar.replace(/([A-Z])/g, "_$1").toUpperCase()] ||
      process.env[envVar.toUpperCase()];
    if (envValue) {
      console.error("Overriding", envVar, "with", envValue, "from environment");
      config[envVar] = envValue;
    }
  };

  envParams.forEach(overrideConfigWithEnv);
  return config;
};

const stripProxyPrefixes = prefixes => proxyReq => {
  prefixes.forEach(
    prefix => (proxyReq.path = proxyReq.path.replace(prefix, ""))
  );
};

const configProxy = (routes, defaultHandler = null) => {
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
    res.writeHead(500, {
      "Content-Type": "text/plain"
    });
    res && res.end(JSON.stringify(err));
  });

  return (req, res, next) => {
    const requestHandler = routes.reduce((_handler, { prefix, handler }) => {
      return _handler || (req.url.includes(prefix) ? handler : null);
    }, null);

    const proxyHandler = requestHandler || defaultHandler;
    return proxyHandler ? proxy.web(req, res, proxyHandler) : next();
  };
};

module.exports = { enrichConfig, configProxy };
