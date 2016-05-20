var gulp = require('gulp');
var songs = require('./gulp/songs.js');
var songs = require('./gulp/dev.js');

var concat = require('gulp-concat');
var jsonConcat = require('gulp-concat-json');
var gulpSequence = require('gulp-sequence');

/**
 * Build all
 */
gulp.task('build', gulpSequence('songs:build', 'build:index', 'build:sitemap'));

/**
 * Cleanup
 */
gulp.task('cleanup', gulpSequence('songs:cleanup'));

/**
 * Make default index copy of songs index.html
 */
gulp.task('build:index', () => {
	return gulp.src('./public/songs/index.html')
		.pipe(gulp.dest('./public'));
});


/**
 * Builds global sitemap file
 */
gulp.task('build:sitemap', () => {
	return gulp.src(['./public/songs/songs-sitemap.xml'])
	.pipe(concat('sitemap.xml'))
	.pipe(gulp.dest('./public'));
});







