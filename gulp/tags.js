var path = require('path');  
var fs = require('fs');  
var sugar = require('sugar');
var through = require('through2');
var del = require('del');
var gulp = require('gulp');  
var data = require('gulp-data');  
var concat = require('gulp-concat');   
var jsonTransform = require('gulp-json-transform');
var rename = require('gulp-rename');  
var merge = require('merge-stream');  
var mustache = require('mustache');  
var marked = require('marked');  
var foreach = require('gulp-foreach');
var slugify = require('speakingurl');
var compareSongTitles = require('./compare-song-titles');
var jsonConcat = require('gulp-concat-json');


var BASE_TEMPLATE_PATH = './templates/tags/tag.mu';


var middlewares = {

	// /**
	//  * Generates slugs based on song name
	//  */
	// slug: () => {
	// 	return jsonTransform(data => {
	// 		data.slug = slugify(`${data.name}`);
	// 		return data;
	// 	})
	// },

	/**
	 * Rendering template middleware
	 */
	mustache: () => {
		return through.obj((file, enc, callback) => {
			// we will use overrided template file if exists
			// if there is file with ${tagname}.mu use it instead of base template
			var basename = path.basename(file.path, '.json');
			var template = `./templates/tags/${basename}.mu`;
			template = fs.existsSync(template) ?template :BASE_TEMPLATE_PATH;
			var tpl = fs.readFileSync(template, "utf-8");
			var view = JSON.parse(file.contents.toString());
			file.contents = Buffer.from(mustache.render(tpl, view));
			callback(null, file)
		})
	},

	// /**
	//  * Generates metas
	//  */
	// meta: () => {
	// 	return jsonTransform(data => {
	// 		data.meta = {};
	// 		data.meta.title = `${data.Name} songs | Capoeira Lyrics`;
	// 		data.meta.description = data.Text.stripTags().compact().to(150);
	// 		data.meta.author = data.Artist;

	// 		return data;
	// 	})
	// }
}


/**
 * Cleanup folder before new build
 */
gulp.task('tags:cleanup', () => del(['public/tags']));

/**
 * Generates HTML files from template and json files
 */
gulp.task('tags:build:pages', () => {

	var tags = {}; // container for tags

	return gulp.src('./data/songs/*.json')
	// group songs by tag
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
	.pipe(through.obj(function (file, enc, callback) {
		if (!this.sampleFile) this.sampleFile = file;
		callback();
	}, function (callback) {
		if (!this.sampleFile) {
			callback();
			return;
		}

		for (var tag in tags) {
			var songs = tags[tag].slice().sort(compareSongTitles);
			var page = this.sampleFile.clone({ contents: false });
			page.contents = Buffer.from(JSON.stringify({
				name: tag,
				slug: slugify(tag),
				songs: songs.map(song => {
					var artistName = song.Artist || 'Unknown artist';
					var tagNames = Array.isArray(song.tags) ? song.tags : [];
					return {
						name: song.Name,
						slug: slugify(song.Name),
						artistName: artistName,
						artistSlug: slugify(artistName),
						tags: tagNames.map(tagName => {
							return {
								name: tagName,
								slug: slugify(tagName)
							}
						})
					}
				})
			}));
			page.path = path.join(this.sampleFile.base, slugify(tag) + '.json');
			this.push(page);
		}
		callback();
	}))
	.pipe(middlewares.mustache()) // render via mustache
	.pipe(rename({extname:'.html'}))
	.pipe(gulp.dest('./public/tags/'));
});

/**
 * Generate tag pages from song JSON in the local data folder
 */
/**
 * One page listing every tag.
 */
gulp.task('tags:build:index', () => {
	var tags = {};

	return gulp.src('./data/songs/*.json')
		.pipe(jsonTransform(data => {
			if (Array.isArray(data.tags)) {
				data.tags.forEach(tag => {
					tags[tag] = (tags[tag] || 0) + 1;
				});
			}
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

			var list = Object.keys(tags).map(name => ({
				name: name,
				slug: slugify(name),
				count: tags[name]
			})).sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
			var tpl = fs.readFileSync('./templates/tags/index.mu', 'utf8');
			var page = this.sampleFile.clone({ contents: false });
			page.contents = Buffer.from(mustache.render(tpl, { tags: list }));
			page.path = path.join(this.sampleFile.base, 'index.html');
			this.push(page);
			callback();
		}))
		.pipe(gulp.dest('./public/tags/'));
});

gulp.task('tags:build', gulp.series('tags:cleanup', 'tags:build:pages', 'tags:build:index'));
