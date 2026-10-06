/**
 * Alphabetical song order, ignoring accents so "Água" stays with "A".
 */
function songTitle(song) {
	if (!song) return '';
	if (song.Name) return String(song.Name);
	if (song.name) return String(song.name);
	return '';
}

function compareSongTitles(a, b) {
	return songTitle(a).localeCompare(songTitle(b), 'pt', {
		sensitivity: 'base',
		numeric: true
	});
}

module.exports = compareSongTitles;
