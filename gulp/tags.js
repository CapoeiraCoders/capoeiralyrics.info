var path = require('path');  
var fs = require('fs');  
var sugar = require('sugar');
var through = require('through2');
var es = require('event-stream');
var File = require('vinyl');
var gulp = require('gulp');  
var clean = require('gulp-clean');  
var data = require('gulp-data');  
var concat = require('gulp-concat');   
var jsonTransform = require('gulp-json-transform');
var rename = require('gulp-rename');  
var merge = require('merge-stream');  
var mustache = require('mustache');  
var marked = require('marked');  
var foreach = require('gulp-foreach');
var sitemap = require('gulp-sitemap');
var slugify = require('speakingurl');
var jsonConcat = require('gulp-concat-json');
var gulpSequence = require('gulp-sequence');


var BASE_TEMPLATE_PATH = './templates/tags/tag.mustache';


var middlewares = {

	/**
	 * Generates slugs based on song name
	 */
	slug: () => {
		return jsonTransform(data => {
			data.slug = slugify(`${data.Name}`);
			return data;
		})
	},

	/**
	 * Rendering template middleware
	 */
	mustache: template => {
		return through.obj((file, enc, callback) => { // generate html from template
			var tpl = fs.readFileSync(template, "utf-8");
			var view = JSON.parse(file.contents.toString());
			file.contents = new Buffer(mustache.render(tpl, view));
			callback(null, file)
		})
	},

	/**
	 * Generates metas
	 */
	meta: () => {
		return jsonTransform(data => {
			data.meta = {};
			data.meta.title = `${data.Artist} — ${data.Name} | Capoeira Lyrics`;
			data.meta.description = data.Text.stripTags().compact().to(150);
			data.meta.author = data.Artist;

			return data;
		})
	}
}


/**
 * Generate all songs + sitemaps from sources from ignored data folder
 */
gulp.task('tags:build', gulpSequence('tags:cleanup', 'tags:build:pages', 'tags:build:sitemap'));

/**
 * Cleanup folder before new build
 */
gulp.task('tags:cleanup', done => {  
	return gulp.src('./public/tags', {read: false})
	.pipe(clean());
});

/**
 * Generates HTML files from template and json files
 */
gulp.task('tags:build:pages', done => {

	var tags = {}; // container for tags

	return gulp.src('./data/songs/*.json')
	// split songs by tag
	.pipe(
		jsonTransform(data => {
			if(data.tags) {
				data.tags.forEach(tag => {
					tags[tag] = tags[tag] || [];
					tags[tag].push(data);
				})
			}
			return data;
		})
	)
	// prepare for rendering
	.pipe(es.through(
		data => {},
		function() {
			for(var tag in tags){
				var songs = tags[tag];
				this.emit('data', new File({
					contents:new Buffer(JSON.stringify({
						name: tag,
						slug: slugify(tag),
						songs: songs.map(song => {
							return {
								name: song.Name,
								slug: slugify(song.Name),
								tags: song.tags.map(tag => {
									return {
										name: tag,
										slug: slugify(tag)
									}
								})
							}
						})
					})),
					path: './'+slugify(tag)+'.json'

				}));
			}
			this.emit('end');
		}
	))
	.pipe(middlewares.mustache(BASE_TEMPLATE_PATH)) // render via mustache
	.pipe(rename({extname:'.html'}))
	
	.pipe(gulp.dest('./public/tags/'));
});

/**
 * Builds songs sitemap file
 */
gulp.task('tags:build:sitemap', done => {
	// return gulp.src('public/songs/*.html', {read: false})
	// .pipe(sitemap({
	// 	fileName: 'songs-sitemap.xml',
	// 	siteUrl: 'http://capoeiralyrics.info/songs/',
	// 	changefreq: 'weekly'
	// }))
	// .pipe(gulp.dest('./public/songs'));
});