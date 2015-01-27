var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var karma = require('karma').server;
var webpack = require('webpack');


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
    .pipe(plugins.webpack({
     /* webpack configuration */
      externals: {
        'firebase':'Firebase'
      }
    }))
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


var pkgs = ['./package.json'/*, './bower.json'*/];
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
