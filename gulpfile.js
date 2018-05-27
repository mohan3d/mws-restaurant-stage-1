const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify-es').default;
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const webp = require('gulp-webp');

gulp.task('scripts', () => {
    return gulp.src('js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('images', () => {
    return gulp.src('img/*.jpg')
        .pipe(imagemin([imagemin.jpegtran({progressive: true})]))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('webp', () => {
    return gulp.src('img/*')
        .pipe(webp({ method: 6 }))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('css', () => {
    return gulp.src('css/*.css')
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('html', () => {
    return gulp.src('*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('idb', () => {
    return gulp.src('node_modules/idb/lib/idb.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('copy', () => {
    return gulp.src([
        'sw.js',
        'manifest.json'
    ])
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
    gulp.watch('js/*.js', ['scripts']);
    gulp.watch('css/*.css', ['css']);
    gulp.watch('*.html', ['html']);
    gulp.watch('images/*', ['images', 'webp']);
});


gulp.task('build', ['scripts', 'images', 'webp', 'css', 'html', 'idb', 'copy']);
gulp.task('default', ['scripts', 'images', 'webp', 'css', 'html', 'idb', 'copy', 'watch']);