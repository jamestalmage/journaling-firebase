var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

gulp.task('test',mochaTask);

gulp.task('watch-test',function(){
  gulp.watch(['test/**','index.js','src/**'],['test']);
  mochaTask();
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