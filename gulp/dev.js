// This file holds infrequent tasks
var gulp = require('gulp');
var concat = require('gulp-concat');
var inject = require('gulp-inject-string');
var slugify = require('speakingurl');
var jsonTransform = require('gulp-json-transform');


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
// 
// 

/**
 * Generate redirection config for S3 resources.
 * Old website version had a different routing. We need to support these routes.
 * S3 bucket can be configured for redirects. But we need to generae config for this.
 * We need to generate this config only once, then setup it via AWS web console to bucket.
 * https://docs.aws.amazon.com/AmazonS3/latest/dev/HowDoIWebsiteConfiguration.html
 * Bad news here is that there is only 50 such rules can be specified in config
 */
gulp.task('dev:generate:s3-bucket-redirect-config', done => {
	return gulp.src('data/songs/*.json')
	.pipe(jsonTransform(data => {
		var slug = slugify(`${data.Name}`);
		return `<RoutingRule><Condition><KeyPrefixEquals>Songs/Details/${data.ID}</KeyPrefixEquals></Condition><Redirect><ReplaceKeyPrefixWith>songs/${slug}.html</ReplaceKeyPrefixWith><HttpRedirectCode>301</HttpRedirectCode></Redirect></RoutingRule>`;
	}))
	.pipe(concat('s3-bucket-redirect-config.xml')) // NOTE: easiest way to concat multiple jsons to one json array
	.pipe(inject.prepend('<RoutingRules>'))
	.pipe(inject.append('</RoutingRules>'))
	.pipe(gulp.dest('.'))
});
















