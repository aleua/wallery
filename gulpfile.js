var gulp      = require('gulp'),
  gulpImports = require('gulp-imports'),
  header      = require('gulp-header'),
  uglify      = require('gulp-uglify'),
  concat      = require('gulp-concat'),
  jshint      = require('gulp-jshint'),
  karma       = require('gulp-karma'),
  pkg         = require('./package.json'),
  banner      = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  '',
  ''].join('\n');

/**
 * distrib
 * Build the final scripts: `wallery.js` and `wallery.min.js`
 *
 */
gulp.task('distrib', function () {
  gulp.src('./src/_build.js')
    .pipe(header(banner, { pkg : pkg } ))
    .pipe(gulpImports())

    .pipe(concat('wallery.js'))
    .pipe(gulp.dest('./dist'))

    .pipe(concat('wallery.min.js'))
    .pipe(uglify({preserveComments: 'some'}))
    .pipe(gulp.dest('./dist'));

  gulp.src('./src/wallery.jQuery.js')
    .pipe(gulp.dest('./dist'));
});

/**
 * lint
 * run JShint on the scripts
 *
 */
gulp.task('lint', function () {
  return gulp.src('./src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

/**
 * develop
 * Task to develop, it run a watch which pass JShint and build
 * the final scripts.
 *
 */
gulp.task('develop', function () {
  gulp.watch('./src/*', function () {
    gulp.run('lint', 'test', 'distrib');
  });
  gulp.watch('./test/**/*.spec.js', function () {
    gulp.run('test');
  });
});
