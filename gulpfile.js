var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');

gulp.task('test',mochaTask);

gulp.task('watch-test',function(){
  gulp.watch(['test/**','index.js','src/**'],['test']);
  mochaTask();
});

function mochaTask(){
  return gulp.src(['test/*.js'],{read:false})
    .pipe(mocha({
      growl:true
    }))
    .on('error',logMochaError);
}

function logMochaError(err){
  if(err && err.message){
    gutil.log(err.message);
  } else {
    gutil.log.apply(gutil,arguments);
  }
}