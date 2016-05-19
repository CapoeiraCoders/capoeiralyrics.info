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