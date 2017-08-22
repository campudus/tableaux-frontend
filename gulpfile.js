const gulp = require("gulp");
const gutil = require("gulp-util");
const del = require("del");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("./webpack.config");

gulp.task("clean", clean);

gulp.task("build", ["build:assets", "build:webpack"]);
gulp.task("build:assets", copyAssets);
gulp.task("build:webpack", runWebpack);

gulp.task("dev", ["watch:assets", "serve:webpack"]);
gulp.task("watch:assets", ["build:assets"], watchAssets);
gulp.task("serve:webpack", runWebpackServer);

gulp.task("default", ["build"]);

var config = {
  "outDir": "out",
  "host": "localhost",
  "apiPort": 8080,
  "serverPort": 3000
};

try {
  config = require("./config.json");
  if (!config.host || !config.apiPort || !config.serverPort || !config.outDir) {
    console.error("Please adapt your config.json to contain\n" +
      "{\n" +
      "  outDir:     $dir                = out,\n" +
      "  host:       $hostname           = localhost,\n" +
      "  apiPort:    $apiRedirectionPort = 8080,\n" +
      "  serverPort: $webServerPort      = 3000\n" +
      "}"
    );
  }
} catch (e) {
  // ignore
}

var tableauxUrl = `http://${config.host}:${config.apiPort}`;

function copyAssets() {
  return gulp.src(["src/main/@(img|locales)/**"])
             .pipe(gulp.dest(config.outDir));
}

function watchAssets() {
  gulp.watch(["src/main/@(img|locales)/**"], {}, ["build:assets"]);
}

function runWebpack(callback) {
  const compiler = webpack(webpackConfig);
  compiler.run(function (err, stats) {
    if (err) {
      throw new gutil.PluginError("webpack", err);
    }
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
    callback();
  });
}

function runWebpackServer(callback) {
  const conf = webpackConfig;

  conf.devtool = "source-maps";
  // enable development mode
  conf.entry.app.unshift("webpack/hot/only-dev-server");
  conf.entry.app.unshift(`webpack-dev-server/client?http://${config.host}:${config.serverPort}`);

  const compiler = webpack(conf);

  const server = new WebpackDevServer(compiler, {
    contentBase: config.outDir,
    publicPath: webpackConfig.output.publicPath,
    hot: true,
    historyApiFallback: true,
    compress: true,

    proxy: {
      "/api/*": {
        target: tableauxUrl,
        pathRewrite: {"^/api": ""},
        xfwd: true,
        onProxyReq: function (proxyReq, req) {
          proxyReq.setHeader("X-Forwarded-Url", req.originalUrl);
        }
      }
    },

    stats: {colors: true}
  });
  server.listen(config.serverPort, config.host, callback);
}

function clean(cb) {
  del([config.outDir], cb);
}
