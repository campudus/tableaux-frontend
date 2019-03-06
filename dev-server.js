const { createServer } = require("http");
const { createProxyServer } = require("http-proxy");
const Path = require("path");
const Bundler = require("parcel-bundler");

// parcel options
const options = {
  //  publicUrl: ".",
  watch: true,
  sourceMaps: true
};

// point parcel at its "input"
const entryFiles = [
  Path.join(__dirname, "src", "index.html"),
  Path.join(__dirname, "src", "worker.js")
];

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

// serve
const server = createServer((req, res) => {
  if (req.url.includes("/api")) {
    proxy.web(req, res, {
      target: "http://127.0.0.1:8080",
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

console.log("dev proxy server operating at: http://localhost:3000/");
server.listen(3000);
