// For any tasks in build procedure
var gulp = require('gulp');
var beautify = require('gulp-beautify');

gulp.task("default", function() {
	// place code for your default task here
});

gulp.task('beautify', function() {
  gulp.src('./src/*.js')
    .pipe(beautify({indentSize: 2}))
    .pipe(gulp.dest('./src/'))
});