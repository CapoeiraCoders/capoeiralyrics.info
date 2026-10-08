/* jshint node:true, esversion:6 */
const gulp = require('gulp');
const songs = require('./songs.js');


const INDEX_TEMPLATE_PATH = './templates/index.mu';
/**
 * Make default index copy of songs index.html
 */
gulp.task('index:build', songs.chains.buildIndex.bind(songs.chains, {
	src: './data/songs/*.json',
	dest: './public/',
	template: INDEX_TEMPLATE_PATH
}));