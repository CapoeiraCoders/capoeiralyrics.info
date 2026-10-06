var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

/**
 * Builds sitemap file
 */
gulp.task('sitemap:build', () => {
	// here we go thru all generated html files and build one big sitemap for this
	return gulp.src([
			'public/songs/*.html',
			'public/tags/*.html',
			'public/artists/*.html'
		],
		{
			read: false, // no need to read content of files
			base: 'public' // we need to set cwd to make mappings.pages return 'songs/abc.html' insetad of 'abc.html' 
		}
	)
	.pipe(sitemap({
		fileName: 'sitemap.xml',
		verbose: true,
		mappings: [
			{
				pages: [ 'songs/*.html' ], // cwd(gulp.src.options.base) should be set to public
				changefreq: 'weekly',
				siteUrl: 'http://capoeiralyrics.info/songs/',
				lastmod: Date.now()
			},
			{
				pages: [ 'tags/*.html' ],
				changefreq: 'weekly',
				siteUrl: 'http://capoeiralyrics.info/tags/',
				lastmod: Date.now()
			},
			{
				pages: [ 'artists/*.html' ],
				changefreq: 'weekly',
				siteUrl: 'http://capoeiralyrics.info/artists/',
				lastmod: Date.now()
			},
		],
		siteUrl: 'http://capoeiralyrics.info/',
	}))
	.pipe(gulp.dest('./public'));
});







