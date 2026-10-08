/* jshint node:true, esversion:8 */
/**
 * Build one profile picture per artist.
 *
 * A portrait is used only when a Wikipedia article title (or "known as" line)
 * matches the artist, the article is about capoeira, and the lead image has a
 * free license. Everyone else gets a monogram. Photos are WebP: 96px for lists
 * (32px at 3x) and 384px for the profile (128px at 3x). Monograms stay SVG.
 *
 *   node scripts/build-artist-avatars.js --dry-run
 *   node scripts/build-artist-avatars.js
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const slugify = require('speakingurl');

const UA = 'CapoeiraLyrics/1.0 (https://capoeiralyrics.info; artist profile pictures)';
const ROOT = path.resolve(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'data', 'songs');
const OUT_DIR = path.join(ROOT, 'public', 'img', 'artists');
const CACHE_DIR = path.join(os.tmpdir(), 'capoeiralyrics-avatar-cache');
const DRY_RUN = process.argv.includes('--dry-run');
const LIST_SIZE = 96;
const PROFILE_SIZE = 384;
const LANGS = ['pt', 'en'];

const ROLE_PREFIX = /^(?:contra[-\s]?mestre|mestres?|mestras?|mestrandos?|maestrinha|professora?|instrutora?|instructor|graduad[oa]|cm)\s+/i;
const ROLES = new Set([
	'mestre', 'mestres', 'mestra', 'mestras', 'mestrando', 'mestrandos', 'maestrinha',
	'professor', 'professora', 'instrutor', 'instrutora', 'instructor',
	'graduado', 'graduada', 'cm', 'contra', 'contramestre'
]);
const CONNECTORS = new Set(['e', 'y', 'and', 'de', 'da', 'do', 'dos', 'das', 'com', 'with']);
const PALETTE = [
	'#0f5132', '#1b4332', '#2d6a4f', '#1d3557', '#1a535c', '#005f73',
	'#6b3f2a', '#7f4f24', '#9c6644', '#3d405b', '#344e41', '#283618',
	'#606c38', '#3a5a40', '#40916c', '#264653'
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

function plain(html) {
	return String(html || '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

function xml(value) {
	return String(value).replace(/[&<>"]/g, char => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;'
	}[char]));
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

function titleMatches(name, pageTitle) {
	const title = fold(pageTitle);
	return displayLabels(name).some(label => fold(label) === title);
}

function boundedPhrase(text, phrase, allowedNext) {
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
		if (beforeOk && (!next || allowedNext(next))) return true;
		from = index + needle.length;
	}
	return false;
}

function knownAs(name, extract) {
	const label = fold(displayLabels(name)[0]);
	if (label.length < 8) return false;
	const allowed = word => word.length < 3 || /^(que|com|para|the|and|who|was|foi|em|nasceu|born|capoeira|angola|regional|abada)$/.test(word);
	return [
		'conhecido como ' + label,
		'conhecido por ' + label,
		'tambem conhecido como ' + label,
		'known as ' + label,
		'better known as ' + label,
		'also known as ' + label
	].some(phrase => boundedPhrase(extract, phrase, allowed));
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
	return /^(lista|list|historia|history|capoeira|capoeira angola)$/.test(folded)
		|| folded.startsWith('lista ')
		|| folded.startsWith('list ');
}

function identityMatch(name, page) {
	if (!page || page.missing !== undefined) return false;
	if (isDisambiguation(page) || isGenericTitle(page.title)) return false;
	if (!mentionsCapoeira(page.extract) && !mentionsCapoeira(page.title)) return false;
	return titleMatches(name, page.title) || knownAs(name, page.extract);
}

function goodFrame(width, height) {
	if (!width || !height) return false;
	if (Math.min(width, height) < 160) return false;
	const ratio = width / height;
	return ratio <= 1.5 && ratio >= 0.55;
}

function fileLooksGeneric(fileName) {
	return /bandeira|flag of|karate|sports icon|wikidata|crystal clear|disambig|question book|commons logo|ambox|rugendas|logo|jazigo|igreja|agreement|documento|brasao|silhouette|berimbau|pandeiro|atabaque|agogo|museu da pessoa/.test(fold(fileName));
}

function cleanCredit(credit) {
	const text = plain(credit);
	const words = text.split(' ').filter(Boolean);
	const half = Math.floor(words.length / 2);
	const collapsed = half > 0 && words.slice(0, half).join(' ') === words.slice(half).join(' ')
		? words.slice(0, half).join(' ')
		: text;
	if (!collapsed || /unknown author|autor desconhecido/i.test(collapsed)) return 'Wikimedia Commons';
	return collapsed.slice(0, 140);
}

function nameInFile(fileName, name) {
	const label = fold(displayLabels(name)[0]);
	const file = fold(fileName);
	if (label.length < 8) return false;
	const compactLabel = label.replace(/ /g, '');
	const compactFile = file.replace(/ /g, '');
	if (compactFile.startsWith(compactLabel) && !file.startsWith(label)) return true;
	if (!file.startsWith(label)) return false;
	const rawTokens = fileName.split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean);
	const labelTokens = displayLabels(name)[0].split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean);
	const nextRaw = rawTokens[labelTokens.length] || '';
	if (!nextRaw) return true;
	if (/^(jpe?g|png|gif|webp|svg|pdf|bw)$/i.test(nextRaw)) return true;
	// "teaching" continues a caption. "Mansa" continues a different person's name.
	return nextRaw[0] === nextRaw[0].toLowerCase();
}

function fileNameFromThumb(url) {
	const parts = new URL(url).pathname.split('/');
	const leaf = parts[parts.length - 1];
	const parent = parts[parts.length - 2];
	if (/^\d+px-/i.test(decodeURIComponent(leaf))) return decodeURIComponent(parent);
	return decodeURIComponent(leaf);
}

function isFreeLicense(license) {
	const name = fold(license);
	if (!name) return false;
	if (/fair use|non free|nonfree|all rights reserved|copyrighted/.test(name)) return false;
	return /public domain| pd |^pd |cc0|cc by|creative commons|gfdl|no restrictions/.test(' ' + name + ' ');
}

function artistNames() {
	const names = new Set();
	fs.readdirSync(SONGS_DIR).forEach(file => {
		if (!file.endsWith('.json')) return;
		const song = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, file), 'utf8'));
		names.add(song.Artist || 'Unknown artist');
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
	prop: 'pageimages|extracts|info|pageprops',
	exintro: '1',
	explaintext: '1',
	exchars: '600',
	piprop: 'thumbnail',
	pithumbsize: '512',
	inprop: 'url'
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

async function licenseFor(fileName) {
	for (const host of ['commons.wikimedia.org', 'pt.wikipedia.org', 'en.wikipedia.org']) {
		const json = await wiki(host, {
			action: 'query',
			titles: 'File:' + fileName.replace(/^Ficheiro:/, ''),
			prop: 'imageinfo',
			iiprop: 'url|extmetadata|mime|size',
			iiurlwidth: '512'
		});
		const page = firstPage(json);
		const info = page && page.imageinfo && page.imageinfo[0];
		if (!info) continue;
		const license = plain(info.extmetadata && info.extmetadata.LicenseShortName && info.extmetadata.LicenseShortName.value);
		return {
			license: license,
			credit: cleanCredit(info.extmetadata && info.extmetadata.Artist && info.extmetadata.Artist.value),
			source: info.descriptionurl || info.descriptionshorturl || '',
			mime: info.mime || '',
			url: info.thumburl || info.url,
			width: info.thumbwidth || info.width,
			height: info.thumbheight || info.height
		};
	}
	return null;
}

async function usableFile(fileName, name, allowLead) {
	const cleaned = fileName.replace(/^Ficheiro:/, '');
	if (!cleaned || fileLooksGeneric(cleaned)) return null;
	const named = nameInFile(cleaned, name);
	if (!named && !allowLead) return null;
	const rights = await licenseFor(cleaned);
	if (!rights || !isFreeLicense(rights.license)) return null;
	if (!/^image\/(jpeg|png|webp|gif)$/.test(rights.mime)) return null;
	if (!goodFrame(rights.width, rights.height)) return null;
	// A wide lead image is usually an action shot. The square crop cuts the players off.
	if (!named && rights.width / rights.height > 1.15) return null;
	return {
		fileName: cleaned,
		url: rights.url,
		license: rights.license,
		credit: rights.credit,
		source: rights.source
	};
}

async function imagesOnPage(lang, title) {
	const json = await wiki(lang + '.wikipedia.org', {
		action: 'query',
		redirects: '1',
		titles: title,
		prop: 'images',
		imlimit: '20'
	});
	const page = firstPage(json);
	return ((page && page.images) || []).map(image => image.title.replace(/^.*?:/, ''));
}

async function commonsFiles(label) {
	const json = await wiki('commons.wikimedia.org', {
		action: 'query',
		list: 'search',
		srsearch: label,
		srnamespace: '6',
		srlimit: '8'
	});
	return (json.query.search || []).map(hit => hit.title.replace(/^File:/, ''));
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

async function findPortrait(name) {
	const matched = await matchingPage(name);
	if (!matched) return null;
	const page = matched.page;
	const leadName = page.thumbnail && page.thumbnail.source ? fileNameFromThumb(page.thumbnail.source) : '';
	if (leadName) {
		const lead = await usableFile(leadName, name, true);
		if (lead) return { page: page, image: lead };
	}
	const files = await imagesOnPage(matched.lang, page.title);
	for (const fileName of files) {
		const image = await usableFile(fileName, name, false);
		if (image) return { page: page, image: image };
	}
	const commons = await commonsFiles(displayLabels(name)[0]);
	for (const fileName of commons) {
		const image = await usableFile(fileName, name, false);
		if (image) return { page: page, image: image };
	}
	return { page: page, image: null };
}

function selfCheck() {
	const cobra = 'conhecido como Mestre Cobra Mansa, mestre de capoeira';
	if (knownAs('Mestre Cobra (ABADA Capoeira)', cobra)) throw new Error('known-as matched a longer name');
	if (!knownAs('Mestre Leopoldina', 'mais conhecido como Mestre Leopoldina.')) throw new Error('known-as missed Leopoldina');
	if (nameInFile('Mestre Cobra Mansa.jpg', 'Mestre Cobra (ABADA Capoeira)')) throw new Error('file matched a longer name');
	if (!nameInFile('Mestre Pastinha bw.jpg', 'Mestre Pastinha')) throw new Error('file missed Pastinha');
	if (!nameInFile('MestraJanja.jpg', 'Mestra Janja (Grupo Nzinga)')) throw new Error('file missed Janja');
	if (!nameInFile('Mestre_Acordeon_teaching_at_Capoeira_Arts_Cafe_2005.jpg', 'Mestre Acordeon')) throw new Error('file missed Acordeon');
	if (nameInFile('Headstand-Abada Capoeira.jpg', 'ABADA Capoeira')) throw new Error('action shot matched ABADA');
}

function initials(name) {
	const words = name.replace(/\s*\([^)]*\)/g, ' ').split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean);
	const withoutRoles = words.filter(word => !ROLES.has(fold(word)));
	const source = withoutRoles.length ? withoutRoles : words;
	const core = source.filter((word, index) => index === 0 || !CONNECTORS.has(fold(word)));
	const picked = core.length ? core : source;
	const first = picked[0] || '';
	if (first.length >= 2 && first.length <= 6 && first === first.toUpperCase() && /[A-Z]/.test(first)) {
		return first;
	}
	return picked.slice(0, 2).map(word => {
		const char = [...word][0] || '';
		return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
	}).join('') || '?';
}

function monogramSvg(name, slug) {
	const letters = initials(name);
	let hash = 0;
	for (const char of slug) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
	const background = PALETTE[hash % PALETTE.length];
	const size = letters.length >= 5 ? 13 : letters.length === 4 ? 16 : letters.length === 3 ? 20 : letters.length === 2 ? 26 : 32;
	return [
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
		'<circle cx="32" cy="32" r="32" fill="' + background + '"/>',
		'<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="' + size + '" font-weight="700" fill="#f4f7f5">' + xml(letters) + '</text>',
		'</svg>',
		''
	].join('\n');
}

async function download(url, dest) {
	const response = await fetch(url, { headers: { 'User-Agent': UA } });
	if (!response.ok) throw new Error(response.status + ' ' + url);
	fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
}

function toWebp(input, output, size) {
	execFileSync('magick', [
		input,
		'-auto-orient',
		'-resize', size + 'x' + size + '^',
		'-gravity', 'center',
		'-extent', size + 'x' + size,
		'-strip',
		'-quality', '78',
		'-define', 'webp:method=6',
		output
	], { stdio: 'pipe' });
}

function writeManifest(manifest) {
	const ordered = {};
	Object.keys(manifest).sort().forEach(slug => {
		ordered[slug] = manifest[slug];
	});
	fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(ordered, null, '\t') + '\n');
}

function removeOrphans(manifest) {
	const keep = new Set(['placeholder.svg', 'manifest.json']);
	Object.keys(manifest).forEach(slug => {
		keep.add(path.basename(manifest[slug].avatar));
		keep.add(path.basename(manifest[slug].portrait));
	});
	fs.readdirSync(OUT_DIR).forEach(file => {
		if (!keep.has(file)) fs.unlinkSync(path.join(OUT_DIR, file));
	});
}

async function main() {
	if (!fs.existsSync(SONGS_DIR)) {
		console.error('Missing data/songs. Artist names come from the local song JSON.');
		process.exit(1);
	}
	fs.mkdirSync(OUT_DIR, { recursive: true });
	selfCheck();
	const names = artistNames().filter(name => fold(name) !== 'unknown artist');
	const manifest = {};
	let photos = 0;

	for (const name of names) {
		const slug = slugify(name);
		const found = await findPortrait(name);
		const image = found && found.image;
		if (!image) {
			manifest[slug] = {
				kind: 'mark',
				avatar: '/img/artists/' + slug + '.svg',
				portrait: '/img/artists/' + slug + '.svg'
			};
			if (!DRY_RUN) fs.writeFileSync(path.join(OUT_DIR, slug + '.svg'), monogramSvg(name, slug));
			if (found && found.page) console.log('mark\t' + name + '\t(no free portrait: ' + found.page.title + ')');
			continue;
		}

		manifest[slug] = {
			kind: 'photo',
			avatar: '/img/artists/' + slug + '.webp',
			portrait: '/img/artists/' + slug + '-384.webp',
			credit: image.credit || 'Wikimedia Commons',
			license: image.license,
			source: image.source,
			page: found.page.fullurl || ''
		};
		photos += 1;
		console.log('photo\t' + name + '\t' + image.fileName + '\t' + image.license);

		if (DRY_RUN) continue;
		const temp = path.join(os.tmpdir(), 'capoeira-avatar-' + slug + path.extname(image.fileName).slice(0, 8));
		await download(image.url, temp);
		toWebp(temp, path.join(OUT_DIR, slug + '.webp'), LIST_SIZE);
		toWebp(temp, path.join(OUT_DIR, slug + '-384.webp'), PROFILE_SIZE);
		fs.unlinkSync(temp);
	}

	if (!DRY_RUN) {
		writeManifest(manifest);
		removeOrphans(manifest);
	}
	console.log('\n' + names.length + ' artists, ' + photos + ' photos, ' + (names.length - photos) + ' monograms');
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
