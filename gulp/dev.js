// This file holds infrequent tasks
var fs = require('fs');
var gulp = require('gulp');
var slugify = require('speakingurl');
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

gulp.task('tts', done => {
	// read all songs
	// read all tags
	var tags = require('../data/tags.json');
	var songs = require('../data/songs.json');

	songs.forEach(s => {
		var tt = tags.filter(t => t.Song_ID === s.ID).map(t => t.Tagline).exclude('realcapoeira.ru');
		if(tt.length){
			var filename = slugify(`${s.Name}`)+ '.json';
			console.log(filename, ':', tt)

			var content = require(`../data/songs/${filename}`);
			content.tags = tt.unique();
			fs.writeFileSync(`./data/songs/${filename}`, JSON.stringify(content, null, 4));
		}

	})

	// console.log(tags)
});













