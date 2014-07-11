var gulp = require('gulp');
var uglify = require('gulp-uglify'); 
var concat = require('gulp-concat');
var qunit = require('gulp-qunit');
var insert = require('gulp-insert');

gulp.task('build', function() {
  gulp.src(["src/polyfills.js", "src/core.js", "src/router.js"])
  .pipe(concat("unite.js"))
  .pipe(insert.prepend("/* Built at" + (new Date()).toString() + " */\n"))
  .pipe(insert.append(';unite.addEvent(window, \"load\", function() { unite.init(); if(unite.onload) unite.onload(); }, false);\n'))
  .pipe(gulp.dest("."))
  .pipe(uglify())
  .pipe(concat("unite.min.js"))
  .pipe(gulp.dest("."))
});

gulp.task('test', function() {
  return gulp.src("test/index.html")
  .pipe(qunit())
});
