var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var url = require('url');
var Path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config');

gulp.task('clean', clean);

gulp.task('build', ['build:assets', 'build:webpack']);
gulp.task('build:assets', copyAssets);
gulp.task('build:webpack', runWebpack);

gulp.task('dev', ['watch:assets', 'serve:webpack']);
gulp.task('watch:assets', ['build:assets'], watchAssets);
gulp.task('serve:webpack', runWebpackServer);

gulp.task('default', ['build']);

var isProd = process.env.NODE_ENV === 'production';
var config = {
  "outDir" : "out",
  "tableauxUrl" : "http://localhost:8080/"
};
try {
  config = require('./config.json');
} catch (e) {
  // ignore
}

function copyAssets() {
  return gulp.src(['src/main/@(img|locales)/**'])
    .pipe(gulp.dest(config.outDir));
}

function watchAssets() {
  gulp.watch(['src/main/@(img|locales)/**'], {}, ['build:assets']);
}

function runWebpack(callback) {
  var compiler = webpack(webpackConfig);
  compiler.run(function (err, stats) {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
    callback();
  });
}

function runWebpackServer(callback) {
  var conf = webpackConfig;
  conf.devtool = 'source-maps';
  // enable development mode
  conf.entry.app.unshift('webpack/hot/only-dev-server');
  conf.entry.app.unshift('webpack-dev-server/client?http://localhost:3000');
  var compiler = webpack(conf);
  var server = new WebpackDevServer(compiler, {
    contentBase : config.outDir,
    publicPath : webpackConfig.output.publicPath,
    hot : true,
    historyApiFallback : true,

    proxy : [{
      path : '/api/*',
      target : config.tableauxUrl,
      rewrite : function (req) {
        req.url = req.url.replace(/^\/api/, '');
      }
    }],

    stats : {colors : true}
  });
  server.listen(3000, 'localhost', callback);
}

function clean(cb) {
  del(['out/'], cb);
}