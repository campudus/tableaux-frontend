const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const proxy = require("http-proxy-middleware");
const cors = require("cors");

app.use(cors());
app.use(express.static(path.resolve(__dirname, "../../dist")));
app.use(
  "/api",
  proxy({
    target: "http://localhost:8080",
    pathRewrite: oldPath => oldPath.replace("/api", "")
  })
);

app.use("/worker.js", function(req, res) {
  res.sendFile(path.resolve(__dirname, "../../dist/worker.js"));
});

app.use(function(req, res, next) {
  res.sendFile(path.resolve(__dirname, "../../dist/index.html"));
});

app.listen(port, "0.0.0.0");
