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
var artistAvatar = require('./artist-avatar');
var tagProfile = require('./tag-profile');
var compareSongTitles = require('./compare-song-titles');
var jsonConcat = require('gulp-concat-json');
var { skipHidden } = require('./song-visibility');
var { withLanguageMarks } = require('./song-languages');


var BASE_TEMPLATE_PATH = './templates/tags/tag.mu';

/**
 * Log scale so a tag with hundreds of songs is larger than a tag with one,
 * without making the small tags unreadably tiny.
 */
function cloudSize(count, minCount, maxCount) {
	var minRem = 0.82;
	var maxRem = 2.35;
	if (maxCount <= minCount || count <= 0) return minRem.toFixed(2);
	var span = Math.log(maxCount) - Math.log(minCount);
	var place = span === 0 ? 1 : (Math.log(count) - Math.log(minCount)) / span;
	return (minRem + place * (maxRem - minRem)).toFixed(2);
}


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
	.pipe(skipHidden())
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
			if (!songs.length) continue;
			var slug = slugify(tag);
			var page = this.sampleFile.clone({ contents: false });
			page.contents = Buffer.from(JSON.stringify(Object.assign({
				name: tag,
				slug: slug,
				songs: songs.map(song => {
					var artistName = song.Artist || 'Unknown artist';
					var tagNames = Array.isArray(song.tags) ? song.tags : [];
					var artistSlug = slugify(artistName);
					return Object.assign({
						name: song.Name,
						slug: slugify(song.Name),
						artistName: artistName,
						artistSlug: artistSlug,
						tags: tagNames.map(tagName => {
							return {
								name: tagName,
								slug: slugify(tagName)
							}
						})
					}, artistAvatar.forSlug(artistSlug), withLanguageMarks(song));
				})
			}, tagProfile.forSlug(slug))));
			page.path = path.join(this.sampleFile.base, slug + '.json');
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
		.pipe(skipHidden())
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

			var groupList = tagProfile.groups();
			var byId = {};
			groupList.forEach(group => {
				byId[group.id] = {
					id: group.id,
					name: group.name,
					description: group.description,
					tags: []
				};
			});
			var other = { id: 'other', name: 'Other', description: '', tags: [] };

			Object.keys(tags).forEach(name => {
				var slug = slugify(name);
				var about = tagProfile.forSlug(slug);
				var item = {
					name: name,
					slug: slug,
					count: tags[name],
					description: about.description,
					hasDescription: about.hasDescription,
					groupName: about.group || other.name
				};
				var bucket = (about.groupId && byId[about.groupId]) ? byId[about.groupId] : other;
				item.groupId = bucket.id;
				item.groupName = bucket.name;
				bucket.tags.push(item);
			});

			var byName = (a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' });
			var groups = groupList
				.map(group => byId[group.id])
				.filter(group => group.tags.length);
			if (other.tags.length) groups.push(other);

			var tagList = [];
			groups.forEach(group => {
				group.tags.forEach(tag => tagList.push(tag));
			});
			tagList.sort(byName);
			var counts = tagList.map(tag => tag.count);
			var minCount = counts.length ? Math.min.apply(null, counts) : 1;
			var maxCount = counts.length ? Math.max.apply(null, counts) : 1;
			tagList.forEach(tag => {
				tag.size = cloudSize(tag.count, minCount, maxCount);
				tag.countLabel = tag.count === 1 ? '1 song' : tag.count + ' songs';
			});

			var tpl = fs.readFileSync('./templates/tags/index.mu', 'utf8');
			var page = this.sampleFile.clone({ contents: false });
			page.contents = Buffer.from(mustache.render(tpl, {
				groups: groups.map(group => ({ id: group.id, name: group.name })),
				tags: tagList
			}));
			page.path = path.join(this.sampleFile.base, 'index.html');
			this.push(page);
			callback();
		}))
		.pipe(gulp.dest('./public/tags/'));
});

gulp.task('tags:build', gulp.series('tags:cleanup', 'tags:build:pages', 'tags:build:index'));
