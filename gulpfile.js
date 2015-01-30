var gulp    = require('gulp');
var plugins = require('gulp-load-plugins')();
var karma   = require('karma').server;
var webpack = require('webpack');
var argv    = require('yargs').argv;

var WebpackDevServer = require("webpack-dev-server");


var v;
function version () {
  var previous = require('./package.json').version;
  if (!v) v = require('semver').inc(previous, argv.type || 'patch');
  return v;
}

gulp.task('test',mochaTask);

gulp.task('watch-test',function(){
  gulp.watch(['test/**','index.js','src/**'],['test']);
  mochaTask();
});

gulp.task('karma', function(cb){
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false,
    autoWatch:true
  }, cb);
});

gulp.task("bundle", function() {
  return gulp.src('src/Entry.js')
    .pipe(plugins.webpack(require('./webpack.conf')()))
    .pipe(plugins.rename('journaling-firebase.js'))
    .pipe(gulp.dest('browser/'));
});

function mochaTask(){
  return gulp.src(['test/*.js'],{read:false})
    .pipe(plugins.mocha({
      growl:true
    }))
    .on('error',logMochaError);
}

function logMochaError(err){
  if(err && err.message){
    plugins.util.log(err.message);
  } else {
    plugins.util.log.apply(gutil,arguments);
  }
}

gulp.task("webpack-dev-server", function(callback) {
  // modify some webpack config options
  var myConfig = require('./webpack.conf')();
  myConfig.devtool = "eval";
  myConfig.debug = true;

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(myConfig), {
    //hot:true,
    publicPath: "/example",
    stats: {
      colors: true
    }
  }).listen(8080, "localhost", function(err) {
      if(err) throw new plugins.util.PluginError("webpack-dev-server", err);
      plugins.util.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
    });
});

var pkgs = ['./package.json', './bower.json'];
gulp.task('bump', function () {
  return gulp.src(pkgs)
    .pipe(plugins.bump({
      version: version()
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('release', ['bundle', 'bump'], function () {
  var versionString = 'v' + version();
  var message = 'Release ' + versionString;
  return plugins.shell.task([
    'git add -f ./browser/journaling-firebase.js',
    'git add ' + pkgs.join(' '),
    'git commit -m "' + message + '"',
    'git tag ' + versionString
  ])();
});
