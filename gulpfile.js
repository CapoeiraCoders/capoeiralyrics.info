var path = require('path');  
var fs = require('fs');  
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



gulp.task('default', () => {
	// place code for your default task here
	console.log('Start build: json -> html');
});


// /**
//  * Splits one JSON file with N-length array to N separate JSON files 
//  */
// gulp.task('songs:dev:split-json', done => {
//     var data = require('./data/songs.json');
//     console.log('about to write files...')
//     data.forEach(function(item) {
//     	var slug = slugify(`${item.Name}`);
//         var fileName = `./data/songs/${slug}.json`;
//         var fileContents = JSON.stringify(item, null, 4);
//         fs.writeFileSync(fileName, fileContents);
//         console.log(` -> save file ${fileName}`);
//     });

//     done();
// });


/**
 * Build all
 */
gulp.task('build', gulpSequence('songs:build', 'build:index', 'build:sitemap'));


/**
 * Make default index copy of songs index.html
 * @param  {[type]} 'build:index' [description]
 * @param  {[type]} (             [description]
 * @return {[type]}               [description]
 */
gulp.task('build:index', () => {
	return gulp.src('./public/songs/index.html')
		.pipe(gulp.dest('./public'));
});


/**
 * Builds пдщифд sitemap file
 */
gulp.task('build:sitemap', done => {
	return gulp.src(['./public/songs/songs-sitemap.xml'])
	.pipe(concat('sitemap.xml'))
	.pipe(gulp.dest('./public'));
});



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

	return gulp.src('./data/songs/*.json')
	// process markdown
	.pipe(jsonTransform(function(data) {
		data.Text = marked(data.Text);
		return data;
	}))
	// generate youtube embed
	.pipe(jsonTransform(function(data) {
		if(data.VideoUrl){
			var youtubeId = data.VideoUrl.split('/').pop();
			data.youtubeEmbed = `<iframe id="ytplayer" type="text/html" width="360" height="240" src="http://www.youtube.com/embed/${youtubeId}?autoplay=0" frameborder="0"></iframe>`
		}	
		return data;
	}))
	.pipe(through.obj(function (file, enc, cb) {
		var tpl = fs.readFileSync('./templates/song.mustache', "utf-8");
		var view = JSON.parse(file.contents.toString());
		file.contents = new Buffer(mustache.render(tpl, view));
		cb(null, file)
	}))
 	.pipe(rename({extname:'.html'}))
	.pipe(gulp.dest('./public/songs/'));
});


/**
 * Generates sitemap file for songs
 */
gulp.task('songs:build:index', done => {
	return gulp.src('./data/songs/*.json')
	.pipe(jsonTransform(function(data) {
		var slug = slugify(`${data.Name}`);
		return {
			slug: `${slug}`,
			name: `${data.Name}`
		}; 
	}))
	.pipe(jsonConcat('concated-songs.tmp.json'))
	.pipe(through.obj(function (file, enc, cb) {
		var tpl = fs.readFileSync('./templates/song.index.mustache', "utf-8");
		var view = JSON.parse(file.contents.toString());
		file.contents = new Buffer(mustache.render(tpl, view));
		cb(null, file)
	}))
	.pipe(rename('index.html'))
	.pipe(gulp.dest('./public/songs/'))
});

/**
 * Builds songs sitemap file
 */
gulp.task('songs:build:sitemap', done => {
	return gulp.src('public/songs/*.html', {
		read: false
	})
	.pipe(sitemap({
		fileName: 'songs-sitemap.xml',
		siteUrl: 'http://capoeiralyrics.info/songs/',
		changefreq: 'weekly'
	}))
	.pipe(gulp.dest('./public/songs'));
});





