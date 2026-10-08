/* jshint node:true, esversion:6 */
const path = require('path');
const del = require('del');
const fs = require('fs');
const defaults = require('defaults');
const sugar = require('sugar');
const through = require('through2');
const gulp = require('gulp');
const {series, parallel} = require('gulp');
const { src, dest } = require('gulp');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const jsonTransform = require('gulp-json-transform');
const jsonModifier = require('gulp-json-modifier');
const rename = require('gulp-rename');
const mustache = require('mustache');
const marked = require('marked');
const foreach = require('gulp-foreach');
const sitemap = require('gulp-sitemap');
const slugify = require('speakingurl');
const compareSongTitles = require('./compare-song-titles');
const { skipHidden } = require('./song-visibility');
const { songIssueLinks } = require('./rights-contact');
const artistAvatar = require('./artist-avatar');
const { withLanguageMarks } = require('./song-languages');


const SONG_TEMPLATE_PATH = './templates/songs/song.mu';
const INDEX_TEMPLATE_PATH = './templates/songs/index.mu';

function youtubeIdFromUrl(url) {
	try {
		var parsed = new URL(url);
		var fromQuery = parsed.searchParams.get('v');
		if (fromQuery) return fromQuery;
		var parts = parsed.pathname.split('/').filter(Boolean);
		return parts.pop();
	} catch (error) {
		var bits = String(url).split('/').filter(Boolean);
		return bits.pop();
	}
}


const middlewares = {

	/**
	 * Process markdown texts to html
	 */
	markdown: () => {
		return jsonModifier(data => {
			if (data.Text) data.Text = marked(data.Text);
			if (data.EngText) data.EngText = marked(data.EngText);
			if (data.RusText) data.RusText = marked(data.RusText);
			return data;
		});
	},

	/**
	 * Generates youtube embed object based on video url
	 */
	youtube: () => {
		return jsonModifier(data => {
			if (!data.VideoUrl) return data;

			var youtubeId = youtubeIdFromUrl(data.VideoUrl);
			if (!youtubeId) return data;

			var title = String(data.Name || 'Song video').replace(/"/g, '&quot;');
			data.youtubeEmbed = `<iframe title="${title}" src="https://www.youtube.com/embed/${youtubeId}" allow="fullscreen" allowfullscreen loading="lazy"></iframe>`;
			return data;
		});
	},

	/**
	 * Generates slugs based on song name
	 */
	slug: () => {
		return jsonModifier(data => {
			data.slug = slugify(`${data.Name}`);
			data.artistName = data.Artist || 'Unknown artist';
			data.artistSlug = slugify(data.artistName);
			Object.assign(data, artistAvatar.forSlug(data.artistSlug), songIssueLinks(data), withLanguageMarks(data));
			return data;
		});
	},

	/**
	 * Generates tags name + slug
	 */
	tags: () => {
		return jsonModifier(data => {
			if (!Array.isArray(data.tags)) {
				data.hasTags = false;
				return data;
			}

			data.tags = data.tags.map(t => ({
				slug: slugify(t),
				name: t
			}));
			data.hasTags = data.tags.length > 0;
			return data;
		});
	},

	/**
	 * One tab per language that has lyrics. Portuguese stays first.
	 */
	languages: () => {
		return jsonModifier(data => {
			var marks = withLanguageMarks(data);
			var htmlFor = { pt: data.Text, en: data.EngText, ru: data.RusText };
			var languages = marks.languageMarks.map((mark, index) => ({
				id: mark.code,
				lang: mark.code,
				label: mark.label,
				html: htmlFor[mark.code],
				active: index === 0
			}));

			Object.assign(data, marks);
			data.languages = languages;
			data.showLanguageTabs = languages.length > 1;
			data.noLyrics = languages.length === 0;
			return data;
		});
	},

	/**
	 * Rendering template middleware
	 */
	mustache: (template) => {
		return through.obj((file, enc, callback) => { // generate html from template
			var tpl = fs.readFileSync(template, "utf-8");
			var view = JSON.parse(file.contents.toString());
			file.contents = Buffer.from(mustache.render(tpl, view));
			callback(null, file);
		});
	},

	/**
	 * Generates metas
	 */
	meta: () => {
		return jsonModifier(data => {
			data.meta = {};
			data.meta.title = `${data.Artist} — ${data.Name} | Capoeira Lyrics`;
			data.meta.description = data.Text.stripTags().compact().to(150);
			data.meta.author = data.Artist;

			return data;
		});
	}
};

/**
 * Join song JSON files into one Vinyl file. gulp-concat-json uses an old
 * stream implementation that Gulp 4 closes early.
 */
const concatSongJson = (fileName) => {
	const songs = [];
	let firstFile = null;

	return through.obj(function (file, enc, callback) {
		if (!firstFile) firstFile = file;
		if (!file.isNull()) {
			songs.push(JSON.parse(file.contents.toString()));
		}
		callback();
	}, function (callback) {
		if (!firstFile) {
			callback();
			return;
		}

		songs.sort(compareSongTitles);

		const joined = firstFile.clone({ contents: false });
		joined.path = path.join(firstFile.base, fileName);
		joined.contents = Buffer.from(JSON.stringify(songs));
		this.push(joined);
		callback();
	});
};

const chains = {
	buildPages: () => {
		return src('data/songs/*.json') // read all source files
			.pipe(skipHidden())
			.pipe(middlewares.markdown()) // process markdown
			.pipe(middlewares.meta()) // process markdown
			.pipe(middlewares.youtube()) // generate youtube embed
			.pipe(middlewares.slug())
			.pipe(middlewares.tags())
			.pipe(middlewares.languages())
			.pipe(middlewares.mustache(SONG_TEMPLATE_PATH))
			.pipe(rename({
				extname: '.html'
			}))
			.pipe(dest('public/songs/'));
	},

	buildIndex: (options) => {

		options = defaults(options, {
			src: './data/songs/*.json',
			dest: './public/songs/',
			template: INDEX_TEMPLATE_PATH
		});

		return gulp.src(options.src)
			.pipe(skipHidden())
			.pipe(middlewares.slug())
			.pipe(middlewares.tags())
			.pipe(concatSongJson('concated-songs.tmp.json'))
			.pipe(middlewares.mustache(options.template))
			.pipe(rename('index.html'))
			.pipe(gulp.dest(options.dest));
	},

	cleanup: () => {
		return del([
			'public/songs/**/*'
		]);
	}
};


module.exports = {
	middlewares,
	chains
};

/**
 * Cleanup folder before new build
 */
gulp.task('songs:cleanup', chains.cleanup);
/**
 * Generates HTML files from template and json files
 */
gulp.task('songs:build:pages', chains.buildPages);
/**
 * Generates sitemap file for songs
 */
gulp.task('songs:build:index', () => chains.buildIndex());
/**
 * Generate all songs + sitemaps from sources from ignored data folder
 */
gulp.task('songs:build', gulp.series('songs:cleanup', 'songs:build:pages', 'songs:build:index'));