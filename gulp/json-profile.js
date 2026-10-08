/* jshint node:true, esversion:6 */
const fs = require('fs');

function safeUrl(value) {
	try {
		const url = new URL(String(value || ''));
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
		return url.toString();
	} catch (error) {
		return '';
	}
}

function createProfileLoader(file) {
	let cache = null;

	function load() {
		if (cache) return cache;
		if (!fs.existsSync(file)) {
			cache = {};
			return cache;
		}
		cache = JSON.parse(fs.readFileSync(file, 'utf8'));
		return cache;
	}

	function groups() {
		const data = load();
		const list = Array.isArray(data._groups) ? data._groups : [];
		return list.map(group => ({
			id: String(group && group.id || '').trim(),
			name: String(group && group.name || '').trim(),
			description: String(group && group.description || '').replace(/\s+/g, ' ').trim()
		})).filter(group => group.id && group.name);
	}

	function forSlug(slug) {
		const entry = load()[slug] || {};
		const description = String(entry.description || '').replace(/\s+/g, ' ').trim();
		const links = (Array.isArray(entry.links) ? entry.links : []).map(link => ({
			label: String(link && link.label || '').trim(),
			url: safeUrl(link && link.url)
		})).filter(link => link.label && link.url);
		const sourceUrl = safeUrl(entry.sourceUrl);
		const groupId = String(entry.group || '').trim();
		const group = groups().find(item => item.id === groupId);

		return {
			description: description,
			hasDescription: description.length > 0,
			sourceName: entry.sourceName || '',
			sourceUrl: sourceUrl,
			sourceLicense: entry.sourceLicense || '',
			hasSource: description.length > 0 && Boolean(entry.sourceName) && Boolean(sourceUrl),
			links: links,
			hasLinks: links.length > 0,
			hasAbout: description.length > 0 || links.length > 0,
			group: group ? group.name : '',
			groupId: group ? group.id : '',
			hasGroup: Boolean(group)
		};
	}

	return {
		forSlug: forSlug,
		groups: groups
	};
}

module.exports = createProfileLoader;
