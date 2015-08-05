var gulp = require('gulp');

var Path = require('path');
var compass = require('gulp-compass');
var minifyCss = require('gulp-minify-css');
var del = require('del');
var browserSync = require('browser-sync');
var spa = require("browser-sync-spa");
var reload = browserSync.reload;
var plumber = require('gulp-plumber');
var karma = require('karma').server;
var browserify = require('browserify');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var url = require('url');
var proxy = require('proxy-middleware');

gulp.task('sass', sassCompile);
gulp.task('assets', assetCopy);
gulp.task('appScript', scriptCompileApp);
gulp.task('clean', clean);

gulp.task('reload:scripts', ['appScript'], reload);
gulp.task('reload:assets', ['assets'], reload);
gulp.task('reload:sass', ['sass'], reload);
gulp.task('dev', ['build'], server);
gulp.task('test', ['build'], test);
gulp.task('testWatch', ['build'], testWatch);

gulp.task('build', ['sass', 'assets', 'appScript']);
gulp.task('default', ['build']);


function sassCompile() {
  return gulp.src('src/main/scss/main.scss')
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
    //for speed now disabled .pipe(minifyCss())
    .pipe(gulp.dest('out/css'))
    .pipe(browserSync.reload({stream : true}));
}

function scriptCompileApp() {
  return browserify()
    .transform(reactify)
    .add('./src/main/js/app.js')
    .bundle()
    .on('error', function (err) {
      console.log('error', err);
      this.emit('end');
    })
    .pipe(source('app.js'))
    .pipe(gulp.dest('out/js/'));
}

function assetCopy() {
  return gulp.src(['src/main/**', '!src/main/js/**', '!src/main/scss', '!src/main/scss/**'])
    .pipe(gulp.dest('out/'));
}

function test(done) {
  karma.start({
    configFile : __dirname + '/karma.conf.js',
    action : 'run',
    proxies : {
      '/api' : 'http://localhost:8181'
    }
  }, done);
}

function testWatch(done) {
  karma.start({
    configFile : __dirname + '/karma.conf.js',
    action : 'watch',
    proxies : {
      '/api' : 'http://localhost:8181'
    }
  }, done);
}

function server() {
  //var proxyOptions = url.parse('http://10.10.2.36:8181/');
  var proxyOptions = url.parse('http://localhost:8080/');
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

  //gulp.src('src/test/**/*Spec.js').pipe(karma({
  //  configFile : 'karma.conf.js',
  //  action : 'watch'
  //}));
}

function clean(cb) {
  del(['out/'], cb);
}
