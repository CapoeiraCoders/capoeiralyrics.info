var gulp = require('gulp');
var songs = require('./gulp/songs.js');
var tags = require('./gulp/tags.js');
var tags = require('./gulp/tags.js');
var sitemap = require('./gulp/sitemap.js');
var concat = require('gulp-concat');
var jsonConcat = require('gulp-concat-json');
var gulpSequence = require('gulp-sequence');

/**
 * Build all
 */
gulp.task('build', gulpSequence(['songs:build', 'tags:build'], 'index:build', 'sitemap:build'));
/**
 * Cleanup
 */
gulp.task('cleanup', gulpSequence('songs:cleanup', 'tags:cleanup'));

/**
 * Make default index copy of songs index.html
 */
gulp.task('index:build', () => {
	return gulp.src('./public/songs/index.html')
	.pipe(gulp.dest('./public'));
});