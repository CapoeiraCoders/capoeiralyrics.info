/* jshint node:true, esversion:6 */
const path = require('path');
const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const through = require('through2');
const jsonTransform = require('gulp-json-transform');
const rename = require('gulp-rename');
const mustache = require('mustache');
const slugify = require('speakingurl');
const compareSongTitles = require('./compare-song-titles');
const { skipHidden } = require('./song-visibility');
const artistAvatar = require('./artist-avatar');
const artistProfile = require('./artist-profile');
const { withLanguageMarks } = require('./song-languages');

const TEMPLATE_PATH = './templates/artists/artist.mu';

function songView(song) {
	const artistName = song.Artist || 'Unknown artist';
	const tagNames = Array.isArray(song.tags) ? song.tags : [];

	return Object.assign({
		name: song.Name,
		slug: slugify(song.Name),
		artistName: artistName,
		artistSlug: slugify(artistName),
		tags: tagNames.map(tagName => ({
			name: tagName,
			slug: slugify(tagName)
		}))
	}, withLanguageMarks(song));
}

gulp.task('artists:cleanup', () => del(['public/artists']));

gulp.task('artists:build:pages', () => {
	const artists = {};

	return gulp.src('./data/songs/*.json')
		.pipe(skipHidden())
		.pipe(jsonTransform(data => {
			const name = data.Artist || 'Unknown artist';
			artists[name] = artists[name] || [];
			artists[name].push(data);
			return data;
		}))
		.pipe(through.obj(function (file, enc, callback) {
			if (!this.sampleFile) this.sampleFile = file;
			callback();
		}, function (callback) {
			if (!this.sampleFile) {
				callback();
				return;
			}

			Object.keys(artists).forEach(name => {
				if (!artists[name].length) return;
				const page = this.sampleFile.clone({ contents: false });
				const slug = slugify(name);
				page.contents = Buffer.from(JSON.stringify(Object.assign({
					name: name,
					slug: slug,
					songs: artists[name].slice().sort(compareSongTitles).map(songView)
				}, artistAvatar.forSlug(slug), artistProfile.forSlug(slug))));
				page.path = path.join(this.sampleFile.base, slugify(name) + '.json');
				this.push(page);
			});
			callback();
		}))
		.pipe(through.obj((file, enc, callback) => {
			const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
			const view = JSON.parse(file.contents.toString());
			file.contents = Buffer.from(mustache.render(tpl, view));
			callback(null, file);
		}))
		.pipe(rename({ extname: '.html' }))
		.pipe(gulp.dest('./public/artists/'));
});

gulp.task('artists:build:index', () => {
	const artists = {};

	return gulp.src('./data/songs/*.json')
		.pipe(skipHidden())
		.pipe(jsonTransform(data => {
			const name = data.Artist || 'Unknown artist';
			artists[name] = (artists[name] || 0) + 1;
			return data;
		}))
		.pipe(through.obj(function (file, enc, callback) {
			if (!this.sampleFile) this.sampleFile = file;
			callback();
		}, function (callback) {
			if (!this.sampleFile) {
				callback();
				return;
			}

			const list = Object.keys(artists).map(name => {
				const slug = slugify(name);
				return Object.assign({
					name: name,
					slug: slug,
					count: artists[name]
				}, artistAvatar.forSlug(slug));
			}).sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
			const tpl = fs.readFileSync('./templates/artists/index.mu', 'utf8');
			const page = this.sampleFile.clone({ contents: false });
			page.contents = Buffer.from(mustache.render(tpl, { artists: list }));
			page.path = path.join(this.sampleFile.base, 'index.html');
			this.push(page);
			callback();
		}))
		.pipe(gulp.dest('./public/artists/'));
});

gulp.task('artists:build', gulp.series('artists:cleanup', 'artists:build:pages', 'artists:build:index'));
