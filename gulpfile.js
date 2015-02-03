var gulp = require('gulp');
var traceur = require('gulp-traceur');

gulp.task('default', function() {
    return gulp.src('src/*.js')
        .pipe(traceur({
            modules: 'instantiate'
        }))
        .pipe(gulp.dest('dist'));
});