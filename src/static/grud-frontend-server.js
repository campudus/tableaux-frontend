const serveStatic = require("serve-static");
const finalhandler = require("finalhandler");
const path = require("path");
const ServerConfigTool = require("./ServerConfigTool");

/**
 * Usage `node grud-frontend-server.js [--config=<path-to-config-file.json>]`
 * Accepted env Variables APIHOST, OUTDIR, APIPORT, PORT, HOST override config file
 */

// Apply settings --------------------------------------------------------------

const config = ServerConfigTool.enrichConfig({
  outDir: __dirname // path to serve static files from
});

const proxyDestinations = [
  {
    prefix: "/api",
    handler: {
      target: `http://${config.apiHost}:${config.apiPort}`,
      prependPath: true
    }
  }
];

// Init server -----------------------------------------------------------------

const serveStaticFile = serveStatic(config.outDir);

const proxyHandler = ServerConfigTool.configProxy(proxyDestinations);

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

ServerConfigTool.startServer(config, [
  proxyHandler,
  resourceHandler,
  appHandler
]);
