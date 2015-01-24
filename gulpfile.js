var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var karma = require('karma').server;

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