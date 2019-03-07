const { createServer } = require("http");
const { createProxyServer } = require("http-proxy");
const Path = require("path");
const Bundler = require("parcel-bundler");

let config = {
  outDir: "out",
  host: "localhost",
  apiPort: 8080,
  serverPort: 3000
};

try {
  const localConfig = require("../config.json");
  config = { ...config, ...localConfig };
} catch (err) {
  // pass
}

const overrideConfigWithEnv = envVar => {
  const envValue = process.env[envVar.toUpperCase()];
  envValue && (config[envVar] = envValue);
};

overrideConfigWithEnv("host");
overrideConfigWithEnv("outDir");
overrideConfigWithEnv("apiPort");
overrideConfigWithEnv("serverPort");

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

// parcel options
const options = {
  sourceMaps: true,
  outDir: config.outDir
};

// init the bundler
const bundler = new Bundler(entryFiles, options);

bundler.serve();

// create a proxy server instance
const proxy = createProxyServer();
proxy.on("proxyReq", proxyReq => {
  // prevent proxy tunneling to /api/api
  if (proxyReq.path.startsWith("/api")) {
    proxyReq.path = proxyReq.path.replace(/\/api/, "");
  }
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  res
    .writeHead(500, {
      "Content-Type": "text/plain"
    })
    .end(JSON.stringify(err));
});

// serve
const server = createServer((req, res) => {
  if (req.url.includes("/api")) {
    proxy.web(req, res, {
      target: `http://${config.host}:${config.apiPort}`,
      prependPath: true
    });
  } else {
    // parcel's dev server
    proxy.web(req, res, {
      target: "http://127.0.0.1:1234",
      ws: true
    });
  }
});

console.log(
  "dev proxy server operating at: http://localhost:" + config.serverPort
);
server.listen(config.serverPort);
