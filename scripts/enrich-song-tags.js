#!/usr/bin/env node
/**
 * Adds thematic tags to local song JSON from the Portuguese lyric and title.
 *
 * Existing tags stay. A tag is added only when the lyric names that subject,
 * not when a word happens to share letters with it. Run with no flags to
 * preview. Pass --write to update data/songs.
 *
 * Descriptions and groups live in data/tag-profiles.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SONGS_DIR = path.join(__dirname, '..', 'data', 'songs');
const WRITE = process.argv.indexOf('--write') !== -1;

const APPEND_ORDER = [
	'bimba',
	'pastinha',
	'besouro',
	'zumbi',
	'waldemar',
	'aberrê',
	'traíra',
	'canjiquinha',
	'caiçara',
	'joão grande',
	'joão pequeno',
	'suassuna',
	'nagô',
	'mestres',
	'escravidão',
	'liberdade',
	'quilombo',
	'history',
	'orixá',
	'axé',
	'religion',
	'bahia',
	'salvador',
	'mar',
	'africa',
	'places',
	'berimbau',
	'instruments',
	'ginga',
	'mandinga',
	'malícia',
	'navalha',
	'jogo de dentro',
	'volta ao mundo',
	'iuna',
	'cavalaria',
	'Santa Maria',
	'dendê',
	'areia',
	'saudade',
	'dinheiro',
	'amizade',
	'mulher',
	'menino',
	'Paraná',
	'sereia',
	'saci',
	'cobra',
	'boi',
	'folklore',
	'legends',
	'maculele',
	'samba de roda',
	'afoxe'
];

const ORIXA_NAMES = [
	'orixa',
	'orixas',
	'oxala',
	'ogum',
	'ogun',
	'iemanja',
	'yemanja',
	'janaina',
	'xango',
	'sango',
	'oxossi',
	'oxumare',
	'oxum',
	'iansa',
	'yansa',
	'exu',
	'obaluaie',
	'obaluaye',
	'omolu',
	'omulu',
	'ossaim',
	'ossanhe',
	'logunede',
	'ibeji'
];

function fold(value) {
	return String(value || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function countTerm(folded, term) {
	const source = ' ' + folded + ' ';
	const needle = ' ' + fold(term) + ' ';
	if (needle === '  ') return 0;
	let count = 0;
	let from = 0;
	while (from < source.length) {
		const at = source.indexOf(needle, from);
		if (at === -1) break;
		count += 1;
		from = at + 1;
	}
	return count;
}

function has(folded, term) {
	return countTerm(folded, term) > 0;
}

function lyricLines(song) {
	return String(song.Text || '')
		.split(/\r?\n/)
		.map(line => line.replace(/^_+|_+$/g, '').trim())
		.filter(Boolean);
}

function evidenceLine(song, terms) {
	const foldedTerms = terms.map(fold).filter(Boolean);
	const lines = [song.Name].concat(lyricLines(song));
	for (let i = 0; i < lines.length; i++) {
		const folded = fold(lines[i]);
		for (let t = 0; t < foldedTerms.length; t++) {
			if (has(folded, foldedTerms[t])) return lines[i];
		}
	}
	return '';
}

function cleanTitle(name) {
	return fold(String(name || '').replace(/\([^)]*\)/g, ' '));
}

function withoutNeighborhood(folded) {
	return folded
		.replace(/\bbairro da liberdade\b/g, ' ')
		.replace(/\bwaldemar da liberdade\b/g, ' ')
		.replace(/\bvaldemar da liberdade\b/g, ' ')
		.replace(/\bcantando na liberdade\b/g, ' ')
		.replace(/\bvai na liberdade\b/g, ' ')
		.replace(/\bla da liberdade\b/g, ' ');
}

function suggest(song) {
	const title = cleanTitle(song.Name);
	const body = fold(song.Text);
	const all = (title + ' ' + body).trim();
	const freedom = withoutNeighborhood(all);
	const add = new Set();

	function tag(name, yes) {
		if (yes) add.add(name);
	}

	tag('bimba', has(all, 'bimba'));
	tag('pastinha', has(all, 'pastinha'));
	tag('besouro', has(all, 'besouro'));
	tag('zumbi', has(all, 'zumbi'));
	tag('waldemar', has(all, 'waldemar') || has(all, 'valdemar'));
	tag('aberrê', has(all, 'aberre'));
	tag('traíra', has(all, 'traira'));
	tag('canjiquinha', has(all, 'canjiquinha'));
	tag('caiçara', has(all, 'caicara'));
	tag('joão grande', has(all, 'joao grande'));
	tag('joão pequeno', has(all, 'joao pequeno'));
	tag('suassuna', has(body, 'suassuna'));
	tag('nagô', has(all, 'nago'));

	const slavery = has(all, 'senzala') || has(all, 'cativeiro') || has(all, 'escravo')
		|| has(all, 'escrava') || has(all, 'escravidao') || has(all, 'alforria')
		|| has(all, 'alforriado') || has(all, 'feitor') || has(all, 'chicote')
		|| has(all, 'grilhao') || has(all, 'grilhoes');
	tag('escravidão', slavery);

	const quilombo = has(all, 'quilombo') || has(all, 'quilombola') || has(all, 'palmares');
	tag('quilombo', quilombo);
	tag('liberdade', has(freedom, 'liberdade'));

	tag('history', slavery || quilombo || has(all, 'zumbi') || has(withoutNeighborhood(title), 'liberdade'));

	const orixa = ORIXA_NAMES.some(name => has(all, name));
	tag('orixá', orixa);
	tag('religion', orixa);
	tag('axé', has(all, 'axe'));

	tag('bahia', has(title, 'bahia') || countTerm(all, 'bahia') >= 2);
	tag('salvador', has(title, 'salvador') || countTerm(all, 'salvador') >= 2);
	tag('africa', has(all, 'africa'));

	const sea = has(title, 'mar') || has(title, 'mare') || has(title, 'marinheiro')
		|| has(title, 'beira mar') || countTerm(all, 'mar') >= 2 || has(all, 'mare')
		|| has(all, 'marinheiro') || has(all, 'beira mar');
	tag('mar', sea);
	tag('places', add.has('bahia') || add.has('salvador') || add.has('africa') || add.has('mar'));

	tag('berimbau', has(title, 'berimbau'));
	const orchestra = ['pandeiro', 'atabaque', 'agogo', 'reco reco', 'gunga', 'berimbau'].filter(name => has(all, name));
	const instrumentTitle = ['pandeiro', 'atabaque', 'agogo', 'reco reco', 'gunga', 'berimbau'].some(name => has(title, name));
	tag('instruments', instrumentTitle || orchestra.length >= 3);

	const gingaCount = countTerm(all, 'ginga') + countTerm(all, 'gingado');
	tag('ginga', has(title, 'ginga') || has(title, 'gingado') || gingaCount >= 2);
	tag('mandinga', has(all, 'mandinga') || has(all, 'mandingueiro'));
	tag('malícia', has(all, 'malicia'));
	tag('navalha', has(all, 'navalha') || has(title, 'faca') || has(all, 'faca amolada'));
	tag('jogo de dentro', has(all, 'jogo de dentro'));
	tag('volta ao mundo', has(all, 'volta ao mundo') || has(all, 'volta do mundo'));

	tag('iuna', has(title, 'iuna'));
	tag('cavalaria', has(title, 'cavalaria')
		|| (has(all, 'cavalaria') && (has(all, 'toque de cavalaria') || has(all, 'toque cavalaria')
			|| has(all, 'alerta a cavalaria') || has(all, 'policia'))));
	tag('Santa Maria', has(all, 'santa maria'));

	tag('dendê', has(all, 'dende'));
	tag('areia', has(title, 'areia') || has(all, 'apanhar areia') || has(all, 'apanha areia'));
	tag('saudade', has(title, 'saudade') || countTerm(all, 'saudade') >= 2);
	tag('dinheiro', has(all, 'dinheiro') || has(all, 'vintem'));
	tag('amizade', has(all, 'amizade') || has(title, 'amigo') || has(title, 'amizade'));
	tag('mulher', has(title, 'mulher') || has(title, 'iaia') || has(title, 'sinha')
		|| has(title, 'morena') || countTerm(all, 'mulher') >= 2);
	tag('menino', has(title, 'menino') || has(title, 'menina'));
	tag('Paraná', has(title, 'parana') && !has(title, 'mestre'));

	tag('sereia', has(all, 'sereia'));
	tag('saci', has(all, 'saci'));
	tag('cobra', has(title, 'cobra') || countTerm(all, 'cobra') >= 2);
	const boiText = all.replace(/\bpeixe boi\b/g, ' ').replace(/\bsapo boi\b/g, ' ');
	tag('boi', has(title, 'boi') || countTerm(boiText, 'boi') >= 2);
	tag('folklore', add.has('sereia') || add.has('saci') || add.has('cobra') || add.has('boi'));
	tag('legends', add.has('besouro') || add.has('sereia') || add.has('saci'));

	tag('maculele', has(title, 'maculele') || countTerm(all, 'maculele') >= 2);
	tag('samba de roda', has(title, 'samba de roda') || countTerm(all, 'samba de roda') >= 2);
	tag('afoxe', has(title, 'afoxe'));

	const people = ['bimba', 'pastinha', 'besouro', 'waldemar', 'aberrê', 'traíra', 'canjiquinha', 'caiçara', 'joão grande', 'joão pequeno', 'suassuna'];
	tag('mestres', people.some(name => add.has(name)));

	return add;
}

function sameTag(left, right) {
	return fold(left) === fold(right);
}

function mergeTags(existing, additions) {
	const current = Array.isArray(existing) ? existing.slice() : [];
	const extras = [];
	additions.forEach(name => {
		if (current.some(tag => sameTag(tag, name)) || extras.some(tag => sameTag(tag, name))) return;
		extras.push(name);
	});
	extras.sort((a, b) => {
		const ai = APPEND_ORDER.findIndex(item => sameTag(item, a));
		const bi = APPEND_ORDER.findIndex(item => sameTag(item, b));
		if (ai === -1 && bi === -1) return a.localeCompare(b, 'pt');
		if (ai === -1) return 1;
		if (bi === -1) return -1;
		return ai - bi;
	});
	return current.concat(extras);
}

function loadSongs() {
	return fs.readdirSync(SONGS_DIR)
		.filter(name => name.endsWith('.json'))
		.sort()
		.map(name => {
			const file = path.join(SONGS_DIR, name);
			const raw = fs.readFileSync(file, 'utf8');
			return {
				file: file,
				name: name,
				raw: raw,
				song: JSON.parse(raw)
			};
		});
}

function orixaBreakdown(entries) {
	const counts = {};
	ORIXA_NAMES.forEach(name => { counts[name] = []; });
	entries.forEach(entry => {
		const all = fold(entry.song.Name + ' ' + entry.song.Text);
		ORIXA_NAMES.forEach(name => {
			if (has(all, name)) counts[name].push(entry.song.Name);
		});
	});
	return counts;
}

function main() {
	const entries = loadSongs();
	const added = {};
	let changedFiles = 0;
	let publishedUntagged = 0;
	let published = 0;
	const perSong = [];

	entries.forEach(entry => {
		const next = mergeTags(entry.song.tags, suggest(entry.song));
		const before = Array.isArray(entry.song.tags) ? entry.song.tags : [];
		const gained = next.filter(tag => !before.some(old => sameTag(old, tag)));
		gained.forEach(tag => {
			added[tag] = added[tag] || [];
			added[tag].push(entry.song.Name);
		});
		perSong.push(gained.length);
		const hidden = entry.song.hidden === true;
		if (!hidden) {
			published += 1;
			if (!next.length) publishedUntagged += 1;
		}
		if (!gained.length) return;
		changedFiles += 1;
		if (!WRITE) return;
		entry.song.tags = next;
		const hadNewline = entry.raw.endsWith('\n');
		const text = JSON.stringify(entry.song, null, 4) + (hadNewline ? '\n' : '');
		fs.writeFileSync(entry.file, text);
	});

	const tags = Object.keys(added).sort((a, b) => added[b].length - added[a].length);
	console.log(WRITE ? 'Wrote tags.' : 'Dry run. Pass --write to update song JSON.');
	console.log('Songs updated:', changedFiles, 'of', entries.length);
	console.log('Published songs still without tags:', publishedUntagged, 'of', published);
	const sortedGains = perSong.slice().sort((a, b) => a - b);
	const mid = sortedGains[Math.floor(sortedGains.length / 2)] || 0;
	console.log('New tags per song: median', mid, 'max', sortedGains[sortedGains.length - 1] || 0);

	tags.forEach(tag => {
		console.log('\n+' + added[tag].length + '  ' + tag);
		added[tag].slice(0, 4).forEach(name => {
			const entry = entries.find(item => item.song.Name === name);
			const line = entry ? evidenceLine(entry.song, [tag, fold(tag)]) : '';
			console.log('  - ' + name + (line ? ' | ' + line.replace(/\s+/g, ' ').slice(0, 110) : ''));
		});
	});

	if (process.argv.indexOf('--orixa') !== -1) {
		console.log('\nORIXA NAMES');
		const counts = orixaBreakdown(entries);
		Object.keys(counts).forEach(name => {
			if (!counts[name].length) return;
			console.log(String(counts[name].length).padStart(4), name, '=>', counts[name].slice(0, 3).join(' | '));
		});
	}
}

main();
