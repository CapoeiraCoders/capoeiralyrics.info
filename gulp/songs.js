var path = require('path');  
var fs = require('fs');  
var sugar = require('sugar');
var through = require('through2');
var gulp = require('gulp');  
var clean = require('gulp-clean');  
var concat = require('gulp-concat');   
var jsonTransform = require('gulp-json-transform');
var rename = require('gulp-rename');  
var mustache = require('mustache');  
var marked = require('marked');  
var foreach = require('gulp-foreach');
var sitemap = require('gulp-sitemap');
var slugify = require('speakingurl');
var jsonConcat = require('gulp-concat-json');
var gulpSequence = require('gulp-sequence');


var middlewares = {
	/**
	 * Process markdown texts to html
	 */
	markdown: () => {
		return jsonTransform(data => {
			if(data.Text) data.Text = marked(data.Text);
			if(data.EngText) data.EngText = marked(data.EngText);
			if(data.RusText) data.RusText = marked(data.RusText);
			return data;
		})
	},

	/**
	 * Generates youtube embed object based on video url
	 */
	youtube: () => {
		return jsonTransform(data => {
			if(data.VideoUrl){
				var youtubeId = data.VideoUrl.split('/').pop();
				data.youtubeEmbed = `<iframe id="ytplayer" type="text/html" width="100%" style:"max-width:640px" src="http://www.youtube.com/embed/${youtubeId}?autoplay=0" frameborder="0"></iframe>`
			}
			return data;
		})
	},

	/**
	 * Generates slugs based on song name
	 */
	slug: () => {
		return jsonTransform(	data => {
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
			data.meta.author = data.Artist;
			data.meta.description = data.Text.stripTags().compact().to(150);
			// data.meta.author = data.Artist;
			// data.meta.author = data.Artist;
			// data.meta.author = data.Artist;
			return data;
		})
	}
}


/**
 * Generate all songs + sitemaps from sources from ignored data folder
 */
gulp.task('songs:build', gulpSequence('songs:cleanup', 'songs:build:pages', 'songs:build:index', 'songs:build:sitemap'));

/**
 * Cleanup folder before new build
 */
gulp.task('songs:cleanup', done => {  
	return gulp.src('./public/songs', {read: false})
	.pipe(clean());
});

/**
 * Generates HTML files from template and json files
 */
gulp.task('songs:build:pages', done => {

	return gulp.src('./data/songs/*.json') // read all source files
	.pipe(middlewares.markdown()) // process markdown
	.pipe(middlewares.meta()) // process markdown
	.pipe(middlewares.youtube()) // generate youtube embed
	.pipe(middlewares.slug()) // make slug
	.pipe(middlewares.mustache('./templates/song.mustache')) // render via mustache
 	.pipe(rename({extname:'.html'}))
	.pipe(gulp.dest('./public/songs/'));
});

/**
 * Generates sitemap file for songs
 */
gulp.task('songs:build:index', done => {
	return gulp.src('./data/songs/*.json')
	.pipe(middlewares.slug())
	.pipe(jsonConcat('concated-songs.tmp.json')) // NOTE: easiest way to concat multiple jsons to one json array
	.pipe(middlewares.mustache('./templates/song.index.mustache'))
	.pipe(rename('index.html'))
	.pipe(gulp.dest('./public/songs/'))
});

/**
 * Builds songs sitemap file
 */
gulp.task('songs:build:sitemap', done => {
	return gulp.src('public/songs/*.html', {read: false})
	.pipe(sitemap({
		fileName: 'songs-sitemap.xml',
		siteUrl: 'http://capoeiralyrics.info/songs/',
		changefreq: 'weekly'
	}))
	.pipe(gulp.dest('./public/songs'));
});
