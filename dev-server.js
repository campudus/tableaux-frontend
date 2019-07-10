const { createServer } = require("http");
const Path = require("path");
const Bundler = require("parcel-bundler");
const GRUDServer = require("./src/static/ServerConfigTool.js");

const config = GRUDServer.enrichConfig({
  outDir: "out",
  host: "localhost",
  port: 3000,
  apiHost: "localhost",
  apiPort: 8080
});

const proxyHandlers = [
  {
    prefix: "/api",
    handler: {
      target: `http://${config.apiHost}:${config.apiPort}`,
      prependPath: true
    }
  },
  {
    prefix: "/auth",
    handler: {
      target: config.authServerUrl
    }
  }
];

const defaultHandler = {
  target: "http://127.0.0.1:1234", // parcel dev server
  ws: true
};

// parcel options
const options = {
  sourceMaps: true,
  outDir: config.outDir
};

switch (process.env.NODE_ENV) {
  case "production":
    console.log("Production mode");
    break;
  case "development":
    console.log("Development mode");
    break;
  default:
    console.log("NODE_ENV:", process.env.NODE_ENV);
}
console.log("Build id:", process.env.BUILD_ID);

console.log("using config:", config);

// point parcel at its input
const entryFiles = [
  Path.join(__dirname, "src", "index.html"),
  Path.join(__dirname, "src", "worker.js")
];

// init the bundler
const bundler = new Bundler(entryFiles, options);

bundler.serve();

// serve

const server = createServer(
  GRUDServer.configProxy(proxyHandlers, defaultHandler)
);

server.listen(config.port, config.host, () => {
  console.info(`dev proxy server operating at ${config.host}:${config.port}.`);
});
