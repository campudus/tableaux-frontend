const express = require("express");
const { createProxyServer } = require("http-proxy");
const serveStatic = require("serve-static");
const finalhandler = require("finalhandler");
const path = require("path");

/**
 * Usage `node grud-frontend-server.js [--config=<path-to-config-file.json>]`
 * Accepted env Variables APIHOST, OUTDIR, APIPORT, PORT, HOST override config file
 */

// Apply settings --------------------------------------------------------------

let config = {
  // Default config, overriden by config file
  outDir: __dirname, // path to serve static files from
  apiHost: "localhost", // api host
  apiPort: 8080,
  port: 3000,
  host: "localhost"
};

try {
  const configPrefix = "--config=";
  const configFile =
    process.argv
      .filter(arg => arg.startsWith(configPrefix))
      .map(arg => arg.replace(configPrefix, ""))[0] || "../config.json";
  console.log("Config file path", configFile);
  const localConfig = require(configFile);
  config = { ...config, ...localConfig };
} catch (err) {
  console.log("Warning: Could not read config file, using defaults");
}

const overrideConfigWithEnv = envVar => {
  const envValue = process.env[envVar.toUpperCase()];
  if (envValue) {
    console.log("Overriding", envVar, "with", envValue, "from environment");
    config[envVar] = envValue;
  }
};

overrideConfigWithEnv("outDir");
overrideConfigWithEnv("apiHost");
overrideConfigWithEnv("apiPort");
overrideConfigWithEnv("port");
overrideConfigWithEnv("host");

console.log("GRUD frontend server with settings:\n", config);

// Init server -----------------------------------------------------------------

const app = express();
const serveStaticFile = serveStatic(config.outDir);

const proxy = createProxyServer();
// event handler to prevent that /api gets proxied to <api>/api
proxy.on("proxyReq", proxyReq => {
  proxyReq.path = proxyReq.path.replace(/^\/api/, "");
});

proxy.on("error", (err, req, res) => {
  console.error("Could not proxy API request to", req.url, err);
  res.status(500).send(err);
});

const proxyHandler = (req, res) => {
  return proxy.web(req, res, {
    target: `http://${config.apiHost}:${config.apiPort}`,
    prependPath: true
  });
};

// serve index.html of webapp
const appHandler = (req, res) => {
  return res.sendFile(path.normalize(config.outDir + "/index.html"));
};

// The resource handler will intercept all requests to files.
// A request is considered a file request, if it ends with "/<filename>.<extension>"
const resourceHandler = (req, res, next) => {
  const resourceRegex = /\/[^/]+\.[^/]+$/;
  if (resourceRegex.test(req.url)) {
    const final = finalhandler(req, res); // callback for mime types and error handling
    return serveStaticFile(req, res, final);
  } else {
    return next();
  }
};

// Serve -----------------------------------------------------------------------

// app.use((req, res, next) => {
//   console.log(req.url);
//   next();
// });
app.use("/api", proxyHandler); // if api request, proxy it, else...
app.use(resourceHandler); // if a file was requested, try to serve it, else...
app.use(appHandler); // serve the single page app

app.listen(config.port, config.host, () =>{
  console.info(`Server listening on http://${config.host}:${config.port}.`);
});
