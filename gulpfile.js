var gulp = require('gulp');

var Path = require('path');
var compass = require('gulp-compass');
var minifyCss = require('gulp-minify-css');
var del = require('del');
var browserify = require('gulp-browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var plumber = require('gulp-plumber');
var replace = require('gulp-replace');
var karma = require('gulp-karma');
var shell = require('gulp-shell');
var reactify = require('reactify');


gulp.task('sass', sassCompile);
gulp.task('assets', assetCopy);
gulp.task('scripts', scriptCompile);
gulp.task('clean', clean);

gulp.task('reloader', ['build'], reload);
gulp.task('dev', ['build'], server);
gulp.task('test', ['build'], test);

gulp.task('build', ['sass', 'assets', 'scripts']);
gulp.task('default', ['build']);


function sassCompile() {
  return gulp.src('src/main/scss/style.scss')
    .pipe(plumber({
      errorHandler : function (error) {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(compass({
      project : Path.join(__dirname),
      css : 'out/css',
      sass : 'src/main/scss',
      image : 'src/main/img'
    }))
    .pipe(minifyCss())
    .pipe(gulp.dest('out/css'));
}

function scriptCompile() {
  return gulp.src(['src/main/js/app.js'])
    .pipe(plumber())
    .pipe(browserify({
      transform : [reactify],
      shim : {
        'jQuery' : {
          'path' : './src/vendor/jquery-1.11.0.js',
          'exports' : '$'
        }
      }
    }))
    .pipe(gulp.dest('out/js/'));
}

function assetCopy() {
  return gulp.src(['src/main/**', '!src/main/js/**', '!src/main/scss', '!src/main/scss/**'])
    .pipe(gulp.dest('out/'));
}

function test() {
  return gulp.src('src/test/**/*Spec.js')
    .pipe(karma({
      configFile : 'karma.conf.js',
      action : 'run'
    }))
    .on('error', function (err) {
      throw err;
    });
}

function server() {
  browserSync({
    server : {
      baseDir : 'out'
    }
  });

  gulp.watch(['src/main/**', 'src/main/js/**', 'src/main/scss/**/*.scss'], {}, ['reloader']);
  gulp.watch(['src/flash/**'], {}, ['reloadFlash']);

  gulp.src('src/test/**/*Spec.js').pipe(karma({
    configFile : 'karma.conf.js',
    action : 'watch'
  }));
}

function clean(cb) {
  del(['out/'], cb);
}
