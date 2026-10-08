/* jshint node:true, esversion:6 */
'use strict';

const MARKS = [
	{ field: 'Text', code: 'pt', label: 'Português' },
	{ field: 'EngText', code: 'en', label: 'English' },
	{ field: 'RusText', code: 'ru', label: 'Русский' }
];

function hasLyrics(value) {
	return Boolean(value && String(value).trim());
}

function languageMarks(song) {
	const source = song || {};
	return MARKS.filter(mark => hasLyrics(source[mark.field])).map(mark => ({
		code: mark.code,
		label: mark.label
	}));
}

function withLanguageMarks(song) {
	const marks = languageMarks(song);
	return {
		languageMarks: marks,
		hasLanguageMarks: marks.length > 0
	};
}

module.exports = {
	hasLyrics,
	languageMarks,
	withLanguageMarks
};
