/* jshint node:true, esversion:6 */
'use strict';

const through = require('through2');

const UNKNOWN_ARTIST = 'unknown artist';
const ALBUM_TAGS = new Set([
	'Axe Capoeira Vol.1',
	'Axe Capoeira Vol.2',
	'Axe Capoeira Vol.3',
	'Axe Capoeira Vol.4',
	'Mestres Boca Rica e Bigodinho - Capoeira Angola',
	'Revelação de Liminha'
]);

function shouldHide(song) {
	const artist = String((song && song.Artist) || '').trim();
	if (artist && artist.toLowerCase() !== UNKNOWN_ARTIST) return true;

	const tags = song && Array.isArray(song.tags) ? song.tags : [];
	return tags.some(tag => ALBUM_TAGS.has(tag));
}

function isHidden(song) {
	if (song && song.hidden === false) return false;
	if (song && song.hidden === true) return true;
	return shouldHide(song);
}

function includeHiddenRequested() {
	return process.argv.indexOf('--include-hidden') !== -1;
}

let announcedIncludeHidden = false;

function skipHidden() {
	if (includeHiddenRequested()) {
		if (!announcedIncludeHidden) {
			announcedIncludeHidden = true;
			console.log('Including songs marked hidden.');
		}
		return through.obj();
	}

	return through.obj(function (file, enc, callback) {
		if (!file.isNull()) {
			const song = JSON.parse(file.contents.toString());
			if (!isHidden(song)) this.push(file);
		}
		callback();
	});
}

module.exports = {
	ALBUM_TAGS,
	shouldHide,
	isHidden,
	includeHiddenRequested,
	skipHidden
};
