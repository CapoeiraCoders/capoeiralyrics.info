/* jshint node:true, esversion:6 */
const gulp = require('gulp');
const songs = require('./gulp/songs.js');
const tags = require('./gulp/tags.js');
const artists = require('./gulp/artists.js');
const sitemap = require('./gulp/sitemap.js');
const index = require('./gulp/index.js');
const concat = require('gulp-concat');
const jsonConcat = require('gulp-concat-json');

/**
 * Build all
 */
gulp.task('build', gulp.series('songs:build', 'tags:build', 'artists:build', 'index:build', 'sitemap:build'));
/**
 * Cleanup
 */
gulp.task('cleanup', gulp.series('songs:cleanup', 'tags:cleanup', 'artists:cleanup'));
