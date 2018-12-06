const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const proxy = require("http-proxy-middleware");


app.use(express.static(path.resolve(__dirname, "../../dist")));
app.use(
  "/api",
  proxy({
    target: "http://localhost:8080",
    pathRewrite: oldPath => oldPath.replace("/api", "")
  })
);

app.use(function(req, res, next) {
  res.sendFile(path.resolve(__dirname, "../../dist/index.html"));
});

app.listen(port, function() {
  console.log("app started");
});
