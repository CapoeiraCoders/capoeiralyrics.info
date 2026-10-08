/* jshint node:true, esversion:6 */
const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '../public/img/artists/manifest.json');
const FALLBACK = {
	avatar: '/img/artists/placeholder.svg',
	portrait: '/img/artists/placeholder.svg',
	hasAvatarCredit: false,
	hasPhoto: false,
	avatarCredit: '',
	avatarLicense: '',
	avatarSource: ''
};

let manifest;

function loadManifest() {
	if (!manifest) {
		manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) : {};
	}
	return manifest;
}

function forSlug(slug) {
	const entry = loadManifest()[slug];
	if (!entry) return Object.assign({}, FALLBACK);
	return {
		avatar: entry.avatar,
		portrait: entry.portrait || entry.avatar,
		hasAvatarCredit: Boolean(entry.credit && entry.source),
		hasPhoto: entry.kind === 'photo',
		avatarCredit: entry.credit || '',
		avatarLicense: entry.license || '',
		avatarSource: entry.source || ''
	};
}

module.exports = { forSlug };
