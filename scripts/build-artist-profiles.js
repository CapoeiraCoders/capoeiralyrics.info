/* jshint node:true, esversion:8 */
/**
 * Find a short public description and profile links for each artist.
 *
 * A page is used only when the Wikipedia title (or a "known as" line) matches
 * the artist and the article is about capoeira. The description is the first
 * sentences of that article (CC BY-SA) or, failing that, the Wikidata label
 * (CC0). Links come from the article and from Wikidata. Nothing is invented.
 *
 *   node scripts/build-artist-profiles.js
 *
 * Writes data/artists.json. Entries with "locked": true are left as they are.
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const slugify = require('speakingurl');

const UA = 'CapoeiraLyrics/1.0 (https://capoeiralyrics.info; artist profiles)';
const ROOT = path.resolve(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'data', 'songs');
const OUT_FILE = path.join(ROOT, 'data', 'artists.json');
const CACHE_DIR = path.join(os.tmpdir(), 'capoeiralyrics-profile-cache');
const LANGS = ['pt', 'en'];

const ROLE_PREFIX = /^(?:contra[-\s]?mestre|mestres?|mestras?|mestrandos?|maestrinha|professora?|instrutora?|instructor|graduad[oa]|cm)\s+/i;

const STYLE_TITLES = new Set([
	'jogo de dentro', 'jogo de fora', 'capoeira angola', 'capoeira regional',
	'capoeira contemporanea', 'benguela', 'sao bento grande', 'angola'
]);

const LINK_ORDER = [
	'Website', 'Wikipedia', 'Instagram', 'YouTube', 'Facebook', 'X', 'TikTok',
	'SoundCloud', 'Spotify', 'Apple Music', 'MusicBrainz', 'Discogs', 'LinkedIn'
];

function fold(value) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/&amp;/g, ' ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.replace(/\s+/g, ' ');
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function displayLabels(name) {
	const noParen = name.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
	const labels = [noParen];
	const stripped = noParen.replace(ROLE_PREFIX, '').trim();
	if (stripped && fold(stripped) !== fold(noParen)) labels.push(stripped);
	return labels;
}

function bareTitle(title) {
	return String(title || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function titleMatches(name, pageTitle) {
	const title = fold(pageTitle);
	const bare = fold(bareTitle(pageTitle));
	return displayLabels(name).some((label, index) => {
		const folded = fold(label);
		if (folded !== title && folded !== bare) return false;
		// "Jogo de Dentro" without "Mestre" is the style, not the person.
		if (index > 0 && !/\b(mestre|mestra|professor|instrutor)\b/.test(title)) return false;
		return true;
	});
}

function boundedPhrase(text, phrase) {
	const source = fold(text);
	const needle = fold(phrase);
	if (!needle) return false;
	let from = 0;
	while (from < source.length) {
		const index = source.indexOf(needle, from);
		if (index === -1) return false;
		const beforeOk = index === 0 || source[index - 1] === ' ';
		const rest = source.slice(index + needle.length).trim();
		const next = rest.split(' ')[0] || '';
		const nextOk = !next || next.length < 3 || /^(que|com|para|the|and|who|was|foi|em|nasceu|born|capoeira|angola|regional)$/.test(next);
		if (beforeOk && nextOk) return true;
		from = index + needle.length;
	}
	return false;
}

function knownAs(name, extract) {
	const label = fold(displayLabels(name)[0]);
	if (label.length < 8) return false;
	return [
		'conhecido como ' + label,
		'conhecido por ' + label,
		'tambem conhecido como ' + label,
		'known as ' + label,
		'better known as ' + label,
		'also known as ' + label
	].some(phrase => boundedPhrase(extract, phrase));
}

function mentionsCapoeira(text) {
	return /capoeir/i.test(text || '');
}

function isDisambiguation(page) {
	const props = page.pageprops || {};
	if (Object.prototype.hasOwnProperty.call(props, 'disambiguation')) return true;
	const title = fold(page.title);
	if (title.endsWith('desambiguacao') || title.endsWith('disambiguation')) return true;
	return /pode referir-se|may refer to/i.test((page.extract || '').slice(0, 280));
}

function isGenericTitle(title) {
	const folded = fold(title);
	const bare = fold(bareTitle(title));
	if (STYLE_TITLES.has(folded) || STYLE_TITLES.has(bare)) return true;
	return /^(lista|list|historia|history|capoeira|capoeira angola)$/.test(folded)
		|| folded.startsWith('lista ')
		|| folded.startsWith('list ')
		|| folded.startsWith('categoria ')
		|| folded.startsWith('category ');
}

function identityMatch(name, page) {
	if (!page || page.missing !== undefined) return false;
	if (isDisambiguation(page) || isGenericTitle(page.title)) return false;
	if (!mentionsCapoeira(page.extract) && !mentionsCapoeira(page.title)) return false;
	return titleMatches(name, page.title) || knownAs(name, page.extract);
}

function artistNames() {
	const names = new Set();
	fs.readdirSync(SONGS_DIR).forEach(file => {
		if (!file.endsWith('.json')) return;
		const song = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, file), 'utf8'));
		const name = song.Artist || 'Unknown artist';
		if (fold(name) === 'unknown artist') return;
		names.add(name);
	});
	return [...names].sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));
}

async function wiki(host, params) {
	const url = new URL('https://' + host + '/w/api.php');
	Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));
	url.searchParams.set('format', 'json');
	const cacheFile = path.join(CACHE_DIR, crypto.createHash('sha1').update(url.toString()).digest('hex') + '.json');
	if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

	let lastError = null;
	for (let attempt = 0; attempt < 4; attempt++) {
		await sleep(150 + attempt * 400);
		try {
			const response = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
			if (response.status === 429 || response.status >= 500) {
				lastError = new Error(response.status + ' ' + host);
				continue;
			}
			if (!response.ok) throw new Error(response.status + ' ' + url);
			const json = await response.json();
			fs.mkdirSync(CACHE_DIR, { recursive: true });
			fs.writeFileSync(cacheFile, JSON.stringify(json));
			return json;
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

function firstPage(json) {
	const pages = json.query && json.query.pages;
	if (!pages) return null;
	return Object.values(pages)[0];
}

const PAGE_PARAMS = {
	prop: 'extracts|info|pageprops|extlinks',
	exintro: '1',
	explaintext: '1',
	exchars: '900',
	inprop: 'url',
	ellimit: '40'
};

async function lookupTitle(lang, title) {
	const json = await wiki(lang + '.wikipedia.org', Object.assign({
		action: 'query',
		redirects: '1',
		titles: title
	}, PAGE_PARAMS));
	return firstPage(json);
}

async function searchPages(lang, query) {
	const json = await wiki(lang + '.wikipedia.org', Object.assign({
		action: 'query',
		generator: 'search',
		gsrsearch: query,
		gsrlimit: '5',
		redirects: '1'
	}, PAGE_PARAMS));
	const pages = json.query && json.query.pages ? Object.values(json.query.pages) : [];
	return pages;
}

async function matchingPage(name) {
	const labels = displayLabels(name);
	for (const lang of LANGS) {
		for (const label of labels) {
			const page = await lookupTitle(lang, label);
			if (identityMatch(name, page)) return { page: page, lang: lang };
		}
	}
	for (const lang of LANGS) {
		const pages = await searchPages(lang, labels[0] + ' capoeira');
		for (const page of pages) {
			if (identityMatch(name, page)) return { page: page, lang: lang };
		}
	}
	return null;
}

function httpsUrl(value) {
	try {
		const url = new URL(String(value || '').trim());
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
		url.protocol = 'https:';
		return url.toString();
	} catch (error) {
		return '';
	}
}

function userUrl(prefix, value) {
	const user = String(value || '').trim().replace(/^@/, '').split(/[/?#]/)[0];
	if (!user || /\s/.test(user) || user.length > 80) return '';
	return prefix + encodeURIComponent(user);
}

function youtubeChannel(value) {
	const raw = String(value || '').trim();
	if (/^https?:/i.test(raw)) {
		const parsed = profileFromUrl(raw);
		return parsed && parsed.label === 'YouTube' ? parsed.url : '';
	}
	if (raw.startsWith('@')) return 'https://www.youtube.com/@' + encodeURIComponent(raw.slice(1));
	if (/^[A-Za-z0-9_-]{8,}$/.test(raw)) return 'https://www.youtube.com/channel/' + raw;
	return '';
}

function profileFromUrl(raw) {
	const absolute = httpsUrl(raw);
	if (!absolute) return null;
	const url = new URL(absolute);
	const host = url.hostname.replace(/^www\./, '');
	const parts = url.pathname.split('/').filter(Boolean);
	const first = parts[0] || '';

	if (host === 'instagram.com') {
		if (!first || /^(p|reel|reels|stories|explore|accounts)$/i.test(first)) return null;
		return { label: 'Instagram', url: 'https://www.instagram.com/' + encodeURIComponent(first) + '/' };
	}
	if (host === 'youtube.com' || host === 'm.youtube.com') {
		if (first === 'channel' && parts[1]) return { label: 'YouTube', url: 'https://www.youtube.com/channel/' + parts[1] };
		if ((first === 'user' || first === 'c') && parts[1]) return { label: 'YouTube', url: 'https://www.youtube.com/' + first + '/' + parts[1] };
		if (first.startsWith('@')) return { label: 'YouTube', url: 'https://www.youtube.com/' + first };
		return null;
	}
	if (host === 'facebook.com' || host === 'fb.com') {
		if (!first || /^(sharer|share|dialog|plugins|watch|photo|story|groups)$/i.test(first)) return null;
		return { label: 'Facebook', url: 'https://www.facebook.com/' + encodeURIComponent(first) };
	}
	if (host === 'twitter.com' || host === 'x.com') {
		if (!first || /^(share|intent|home|search)$/i.test(first)) return null;
		return { label: 'X', url: 'https://x.com/' + encodeURIComponent(first) };
	}
	if (host === 'soundcloud.com') {
		if (!first) return null;
		return { label: 'SoundCloud', url: 'https://soundcloud.com/' + encodeURIComponent(first) };
	}
	if (host === 'open.spotify.com' && first === 'artist' && parts[1]) {
		return { label: 'Spotify', url: 'https://open.spotify.com/artist/' + parts[1] };
	}
	if (host === 'tiktok.com' && first.startsWith('@')) {
		return { label: 'TikTok', url: 'https://www.tiktok.com/' + first };
	}
	if (host === 'musicbrainz.org' && first === 'artist' && parts[1]) {
		return { label: 'MusicBrainz', url: 'https://musicbrainz.org/artist/' + parts[1] };
	}
	if (host === 'discogs.com' && first === 'artist' && parts[1]) {
		return { label: 'Discogs', url: 'https://www.discogs.com/artist/' + parts[1] };
	}
	if (host === 'linkedin.com' && (first === 'in' || first === 'company') && parts[1]) {
		return { label: 'LinkedIn', url: 'https://www.linkedin.com/' + first + '/' + parts[1] };
	}
	return null;
}

const CLAIM_LINKS = [
	{ prop: 'P856', label: 'Website', build: value => {
		const url = httpsUrl(value);
		if (!url) return '';
		const host = new URL(url).hostname;
		if (/wikipedia\.org$|wikidata\.org$|wikimedia\.org$/.test(host)) return '';
		return url;
	} },
	{ prop: 'P2003', label: 'Instagram', build: value => userUrl('https://www.instagram.com/', value) },
	{ prop: 'P2397', label: 'YouTube', build: youtubeChannel },
	{ prop: 'P2013', label: 'Facebook', build: value => userUrl('https://www.facebook.com/', value) },
	{ prop: 'P2002', label: 'X', build: value => userUrl('https://x.com/', value) },
	{ prop: 'P7085', label: 'TikTok', build: value => userUrl('https://www.tiktok.com/@', value.replace(/^@/, '')) },
	{ prop: 'P3040', label: 'SoundCloud', build: value => userUrl('https://soundcloud.com/', value) },
	{ prop: 'P1902', label: 'Spotify', build: value => userUrl('https://open.spotify.com/artist/', value) },
	{ prop: 'P2850', label: 'Apple Music', build: value => userUrl('https://music.apple.com/artist/', value) },
	{ prop: 'P434', label: 'MusicBrainz', build: value => userUrl('https://musicbrainz.org/artist/', value) },
	{ prop: 'P1953', label: 'Discogs', build: value => userUrl('https://www.discogs.com/artist/', value) },
	{ prop: 'P6634', label: 'LinkedIn', build: value => userUrl('https://www.linkedin.com/in/', value) }
];

function claimValues(entity, prop) {
	const claims = (entity && entity.claims && entity.claims[prop]) || [];
	const active = claims.filter(claim => claim.rank !== 'deprecated' && claim.mainsnak && claim.mainsnak.snaktype === 'value');
	const preferred = active.filter(claim => claim.rank === 'preferred');
	const chosen = preferred.length ? preferred : active;
	return chosen.map(claim => claim.mainsnak.datavalue && claim.mainsnak.datavalue.value).filter(value => typeof value === 'string');
}

function addLink(links, label, url) {
	const safe = httpsUrl(url);
	if (!label || !safe) return;
	if (links.some(link => link.url === safe || link.label === label)) return;
	links.push({ label: label, url: safe });
}

function collectLinks(page, entity) {
	const links = [];
	if (page && page.fullurl) addLink(links, 'Wikipedia', page.fullurl);
	CLAIM_LINKS.forEach(spec => {
		claimValues(entity, spec.prop).forEach(value => {
			const built = spec.build(value);
			if (built) addLink(links, spec.label, built);
		});
	});
	const extlinks = (page && page.extlinks) || [];
	extlinks.forEach(link => {
		const parsed = profileFromUrl(link.url || link['*']);
		if (parsed) addLink(links, parsed.label, parsed.url);
	});
	return links.sort((a, b) => LINK_ORDER.indexOf(a.label) - LINK_ORDER.indexOf(b.label));
}

function intro(extract) {
	const text = String(extract || '')
		.replace(/\s*\[[^\]]*\]/g, '')
		.replace(/\{\{|\}\}/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text) return '';
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
	let out = '';
	for (let i = 0; i < sentences.length; i++) {
		const sentence = sentences[i].trim();
		const next = out ? out + ' ' + sentence : sentence;
		if (next.length > 420 && out) break;
		out = next;
		if (i >= 1 && out.length >= 180) break;
	}
	if (out.length <= 420) return out;
	return out.slice(0, 420).replace(/\s+\S*$/, '').replace(/[,:;]\s*$/, '') + '…';
}

function wikidataBlurb(entity) {
	const descriptions = (entity && entity.descriptions) || {};
	const text = (descriptions.pt && descriptions.pt.value) || (descriptions.en && descriptions.en.value) || '';
	if (!mentionsCapoeira(text)) return '';
	const sentence = text.charAt(0).toUpperCase() + text.slice(1);
	return /[.!?]$/.test(sentence) ? sentence : sentence + '.';
}

async function wikidataEntity(id) {
	if (!/^Q\d+$/.test(id || '')) return null;
	const json = await wiki('www.wikidata.org', {
		action: 'wbgetentities',
		ids: id,
		props: 'claims|descriptions|sitelinks',
		languages: 'pt|en'
	});
	const entity = json.entities && json.entities[id];
	if (!entity || entity.missing !== undefined) return null;
	return entity;
}

function entityMatches(name, hit) {
	if (!hit) return false;
	const description = hit.description || '';
	if (!mentionsCapoeira(description) && !mentionsCapoeira(hit.label)) return false;
	if (/style of|estilo de|movimento de|gênero de|genero de/i.test(description)) return false;
	const label = fold(hit.label);
	return displayLabels(name).some((candidate, index) => {
		if (fold(candidate) !== label) return false;
		// A nickname with the role removed can be a style or a place.
		if (index > 0 && !/\b(mestre|mestra|professor|instrutor)\b/.test(label)) return false;
		return true;
	});
}

async function matchingEntity(name) {
	for (const label of displayLabels(name)) {
		const json = await wiki('www.wikidata.org', {
			action: 'wbsearchentities',
			search: label,
			language: 'pt',
			uselang: 'pt',
			type: 'item',
			limit: '6'
		});
		const hit = (json.search || []).find(item => entityMatches(name, item));
		if (hit) return hit.id;
	}
	return '';
}

async function profileFor(name) {
	const matched = await matchingPage(name);
	let page = matched && matched.page;
	let entityId = page && page.pageprops && page.pageprops.wikibase_item;
	if (!entityId) entityId = await matchingEntity(name);
	const entity = await wikidataEntity(entityId);

	if (!page && entity && entity.sitelinks) {
		const site = entity.sitelinks.ptwiki || entity.sitelinks.enwiki;
		const lang = entity.sitelinks.ptwiki ? 'pt' : 'en';
		if (site && site.title) {
			const candidate = await lookupTitle(lang, site.title);
			if (identityMatch(name, candidate)) page = candidate;
		}
	}

	const fromArticle = page ? intro(page.extract) : '';
	const description = fromArticle || wikidataBlurb(entity);
	const links = collectLinks(page, entity).filter(link => {
		if (!fromArticle && link.label === 'Wikipedia' && !page) return false;
		return true;
	});
	if (!description && !links.length) return null;

	const profile = {
		description: description,
		links: links
	};
	if (description && fromArticle && page && page.fullurl) {
		profile.sourceName = 'Wikipedia';
		profile.sourceUrl = httpsUrl(page.fullurl);
		profile.sourceLicense = 'CC BY-SA';
		profile.pageTitle = page.title;
	} else if (description && entityId) {
		profile.sourceName = 'Wikidata';
		profile.sourceUrl = 'https://www.wikidata.org/wiki/' + entityId;
		profile.sourceLicense = 'CC0';
	}
	return profile;
}

function selfCheck(profiles) {
	const bimba = profiles['mestre-bimba'];
	if (!bimba || !/capoeir/i.test(bimba.description)) throw new Error('Mestre Bimba has no capoeira description');
	if (!/Bimba/i.test((bimba.sourceUrl || '') + (bimba.pageTitle || ''))) throw new Error('Mestre Bimba source is not his article');

	const gil = profiles['mestre-gil'];
	if (gil && /cardeal|cardinal|arcebispo|archbishop/i.test((gil.description || '') + (gil.pageTitle || '') + (gil.sourceUrl || ''))) {
		throw new Error('Mestre Gil matched a church page');
	}

	const jogo = profiles['mestre-jogo-de-dentro-capoeira-angola'];
	if (jogo && /style of capoeira|estilo de capoeira|jogo de dentro/i.test((jogo.description || '') + ' ' + (jogo.pageTitle || ''))) {
		throw new Error('Mestre Jogo de Dentro matched the style, not a person');
	}
	Object.keys(profiles).forEach(slug => {
		const description = profiles[slug].description || '';
		if (/^(style of |estilo de )/i.test(description)) throw new Error(slug + ' matched a style, not a person');
	});
}

async function main() {
	const names = artistNames();
	const previous = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};
	const profiles = {};

	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const slug = slugify(name);
		if (previous[slug] && previous[slug].locked) {
			profiles[slug] = previous[slug];
			console.log((i + 1) + '/' + names.length + ' ' + name + ' -> locked');
			continue;
		}
		try {
			const profile = await profileFor(name);
			if (profile) {
				profiles[slug] = profile;
				const labels = profile.links.map(link => link.label).join(', ') || 'no links';
				console.log((i + 1) + '/' + names.length + ' ' + name + ' -> ' + (profile.pageTitle || profile.sourceName || 'links') + ' [' + labels + ']');
			} else {
				console.log((i + 1) + '/' + names.length + ' ' + name + ' -> no public page');
			}
		} catch (error) {
			console.error((i + 1) + '/' + names.length + ' ' + name + ' failed: ' + error.message);
		}
	}

	selfCheck(profiles);
	const ordered = {};
	Object.keys(profiles).sort().forEach(slug => {
		ordered[slug] = profiles[slug];
	});
	fs.writeFileSync(OUT_FILE, JSON.stringify(ordered, null, '\t') + '\n');
	const withLinks = Object.values(ordered).filter(profile => profile.links && profile.links.length).length;
	console.log('Wrote ' + Object.keys(ordered).length + ' profiles (' + withLinks + ' with links) of ' + names.length + ' artists.');
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
