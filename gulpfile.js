var gulp = require('gulp');
var compass = require('gulp-compass');
var importCss = require('gulp-import-css');
var plumber = require('gulp-plumber');
var minifyCss = require('gulp-minify-css');
var del = require('del');
var url = require('url');
var Path = require('path');
var babelify = require('babelify');
var spa = require("browser-sync-spa");
var browserify = require('browserify');
var proxy = require('proxy-middleware');
var browserSync = require('browser-sync');
var source = require('vinyl-source-stream');

var config = {"tableauxUrl" : "http://localhost:8080"};
try {
  config = require('./config.json');
} catch (e) {
  // ignore
}

gulp.task('sass', sassCompile);
gulp.task('assets', assetCopy);
gulp.task('appScript', scriptCompileApp);
gulp.task('clean', clean);

gulp.task('reload:scripts', ['appScript'], browserSync.reload);
gulp.task('reload:assets', ['assets'], browserSync.reload);
gulp.task('reload:sass', ['sass'], browserSync.reload);

gulp.task('build', ['sass', 'assets', 'appScript']);

gulp.task('dev', ['build'], server);

gulp.task('default', ['build']);

var errorHandler = function (err) {
  console.log('[error] ', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    this.emit('end');
  }
};

function sassCompile() {
  return gulp.src('src/main/scss/main.scss')
    .pipe(plumber({errorHandler : errorHandler}))
    .pipe(compass({
      project : Path.join(__dirname),
      css : 'out/css',
      sass : 'src/main/scss',
      image : 'src/main/img'
    }))
    .pipe(importCss())
    //for speed now disabled
    //.pipe(minifyCss())
    .pipe(gulp.dest('out/css'))
    .pipe(browserSync.reload({stream : true}));
}

function scriptCompileApp() {
  return browserify()
    .transform(babelify, {presets: ['es2015', 'react', 'stage-2']})
    .add('./src/main/js/app.js')
    .bundle()
    .on('error', errorHandler)
    .pipe(source('app.js'))
    .pipe(gulp.dest('out/js/'));
}

function assetCopy() {
  return gulp.src(['src/main/**', '!src/main/js/**', '!src/main/scss', '!src/main/scss/**'])
    .pipe(gulp.dest('out/'));
}

function server() {
  var proxyOptions = url.parse(config.tableauxUrl);
  proxyOptions.route = '/api';

  browserSync.use(spa());

  browserSync({
    open : false,
    files : 'out/*',
    server : {
      baseDir : 'out',
      middleware : [proxy(proxyOptions)]
    }
  });

  gulp.watch(['src/main/**', '!src/main/js/**', '!src/main/scss/**/*.scss'], {}, ['reload:assets']);
  gulp.watch(['src/main/js/**'], {}, ['reload:scripts']);
  gulp.watch(['src/main/scss/**/*.scss'], {}, ['sass']);
}

function clean(cb) {
  del(['out/'], cb);
}