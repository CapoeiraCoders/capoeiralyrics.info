#!/usr/bin/env node
'use strict';

/**
 * Set hidden on every song JSON file.
 *
 * A song is hidden when it names an artist other than "Unknown artist",
 * or when a tag is a commercial album. Re-running applies the same rule.
 * A hand-set hidden value is left alone unless --reset is passed.
 *
 * Prints counts only. Never prints lyric text.
 */

const fs = require('fs');
const path = require('path');
const { shouldHide } = require('../gulp/song-visibility');

const ROOT = path.resolve(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'data', 'songs');

const reset = process.argv.includes('--reset');

function hasHiddenFlag(song) {
	return typeof song.hidden === 'boolean';
}

const files = fs.readdirSync(SONGS_DIR).filter(name => name.endsWith('.json'));
let hidden = 0;
let visible = 0;
let written = 0;
let kept = 0;

for (const name of files) {
	const filePath = path.join(SONGS_DIR, name);
	const song = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	if (!reset && hasHiddenFlag(song)) {
		kept += 1;
		if (song.hidden) hidden += 1;
		else visible += 1;
		continue;
	}

	song.hidden = shouldHide(song);
	fs.writeFileSync(filePath, `${JSON.stringify(song, null, 4)}\n`);
	written += 1;
	if (song.hidden) hidden += 1;
	else visible += 1;
}

console.log(`songs: ${files.length}`);
console.log(`hidden: ${hidden}`);
console.log(`visible: ${visible}`);
console.log(`written: ${written}`);
console.log(`kept: ${kept}`);
