#!/usr/bin/env node
'use strict';

/**
 * Fill EngText for songs that have Portuguese lyrics and no English yet.
 *
 * Line breaks and __ chorus markers stay aligned with Text, so the song page
 * can show an English tab on the next build.
 *
 *   GEMINI_API_KEY=... node scripts/translate-missing-english.js
 *   node scripts/translate-missing-english.js --limit 20
 *   node scripts/translate-missing-english.js --files a.json,b.json
 *
 * Already-filled EngText is left untouched. Progress is stored outside the
 * repo so a stopped run can continue.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'data', 'songs');
const STATE_PATH = '/tmp/capoeira-en-translate-state.json';

const CHAR_BUDGET = 4200;
const MAX_SONGS_PER_BATCH = 4;
const CONCURRENCY = 4;
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

const INSTRUCTIONS = `You translate capoeira song lyrics into English.

Input is JSON: {"songs":[{"id":"...","lines":["..."]}]}.
Return JSON with the same shape, the same ids, and the same order.
Each lines array must have exactly the same number of items as the input.

For every line:
- Translate that line only. Never merge, split, add, or drop lines.
- An empty input line stays an empty string.
- Keep "__" markers in the same places on the line.
- Keep "(bis)" as "(bis)". Keep a trailing "*" footnote mark.
- Keep personal names, city names, and orixá names unchanged (Bimba, Pastinha, Zumbi, Ogum, Oxum, Iemanjá, Xangô, Oxalá, Exu, and similar).
- Keep these capoeira words: berimbau, pandeiro, atabaque, agogô, reco-reco, caxixi, capoeira, capoeirista, mestre, mestra, axé, angola, regional, benguela, iúna, são bento, ladainha, corrido, roda, malícia, mandinga, ginga, rasteira, queixada, armada, bênção, martelo, esquiva.
- Read run-together words as the words they are ("criadorda" = "criador da").
- Lines that are already English stay in English. Vocables (ê, aê, iê, la la la) stay as sung.
- "Coro" as a label means "Chorus". Translate "jogo" as "game" when it means the capoeira game.
- "chamou pra jogar" means "called us to play". "para com isso" means "stop that". "corpo fechado" is the protected body. "dar um nó" means "to tie a knot". "dendê" is "palm oil". "camará" as a call can stay "camará".
- "nega", "nego", and "negão" are often forms of address: use "woman", "man", or "my dear" unless the verse is about race or slavery, then use "black woman" or "black man".
- Natural, singable English, close to the line's meaning. No notes and no commentary.`;

function parseArgs(argv) {
	const limitAt = argv.indexOf('--limit');
	const filesAt = argv.indexOf('--files');
	return {
		limit: limitAt >= 0 ? Number(argv[limitAt + 1]) : Infinity,
		files: filesAt >= 0 ? new Set(argv[filesAt + 1].split(',').map((name) => name.trim())) : null
	};
}

function loadState() {
	try {
		const parsed = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
		return {
			done: new Set(parsed.done || []),
			failed: parsed.failed || []
		};
	} catch (error) {
		return { done: new Set(), failed: [] };
	}
}

function saveState(state) {
	const body = JSON.stringify({
		done: Array.from(state.done),
		failed: state.failed
	});
	fs.writeFileSync(STATE_PATH, body);
}

function listSongs(options, state) {
	const names = fs.readdirSync(SONGS_DIR).filter((name) => name.endsWith('.json')).sort();
	const songs = [];

	for (const name of names) {
		if (options.files && !options.files.has(name)) continue;
		if (state.done.has(name)) continue;

		const filePath = path.join(SONGS_DIR, name);
		const raw = fs.readFileSync(filePath, 'utf8');
		const data = JSON.parse(raw);
		if (data.EngText && String(data.EngText).trim()) continue;
		if (!data.Text || !String(data.Text).trim()) continue;

		const sep = String(data.Text).includes('\r\n') ? '\r\n' : '\n';
		songs.push({
			file: name,
			filePath,
			raw,
			sep,
			lines: String(data.Text).split(sep)
		});
		if (songs.length >= options.limit) break;
	}

	return songs;
}

function makeBatches(songs) {
	const batches = [];
	let current = [];
	let chars = 0;

	for (const song of songs) {
		const weight = song.lines.join('\n').length;
		const overflow = current.length > 0 && (current.length >= MAX_SONGS_PER_BATCH || chars + weight > CHAR_BUDGET);
		if (overflow) {
			batches.push(current);
			current = [];
			chars = 0;
		}
		current.push(song);
		chars += weight;
	}

	if (current.length) batches.push(current);
	return batches;
}

function requestJson(hostname, requestPath, headers, body, timeoutMs) {
	return new Promise((resolve, reject) => {
		const req = https.request({
			hostname,
			path: requestPath,
			method: 'POST',
			headers: Object.assign({
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(body)
			}, headers)
		}, (res) => {
			const chunks = [];
			res.on('data', (chunk) => chunks.push(chunk));
			res.on('end', () => {
				const text = Buffer.concat(chunks).toString('utf8');
				let parsed = null;
				try {
					parsed = JSON.parse(text);
				} catch (error) {
					parsed = null;
				}
				resolve({ status: res.statusCode, text, parsed });
			});
		});

		req.setTimeout(timeoutMs, () => {
			req.destroy(new Error('Request timed out'));
		});
		req.on('error', reject);
		req.write(body);
		req.end();
	});
}

function markerCount(value) {
	return (String(value).match(/__/g) || []).length;
}

function alignLine(source, translated) {
	if (source === '') return '';
	if (!/\p{L}/u.test(source)) return source;

	let out = String(translated == null ? '' : translated).trim();
	if (!out) return null;

	if (source.startsWith('__') && !out.startsWith('__')) out = `__${out}`;
	if (source.endsWith('__') && !out.endsWith('__')) out = `${out}__`;
	if (!source.startsWith('__') && out.startsWith('__') && markerCount(out) > markerCount(source)) {
		out = out.slice(2);
	}
	if (!source.endsWith('__') && out.endsWith('__') && markerCount(out) > markerCount(source)) {
		out = out.slice(0, -2);
	}
	if (/\*\s*$/.test(source) && !out.endsWith('*')) out = `${out}*`;
	if (/\(bis\)/i.test(source) && !/\(bis\)/i.test(out)) out = `${out} (bis)`;

	if (markerCount(out) !== markerCount(source)) return null;
	return out;
}

function alignSong(song, translatedLines) {
	if (!Array.isArray(translatedLines) || translatedLines.length !== song.lines.length) return null;
	const aligned = [];
	for (let i = 0; i < song.lines.length; i++) {
		const line = alignLine(song.lines[i], translatedLines[i]);
		if (line == null) return null;
		aligned.push(line);
	}
	return aligned.join(song.sep);
}

function extractSongLines(result, expected) {
	if (!result) return null;
	let lines = result.lines;
	if (typeof lines === 'string') lines = lines.split(/\r?\n/);
	if (Array.isArray(lines) && lines.length === 1 && expected > 1 && String(lines[0]).includes('\n')) {
		lines = String(lines[0]).split(/\r?\n/);
	}
	if (!Array.isArray(lines)) return null;
	return lines.map((line) => (line == null ? '' : String(line)));
}

async function translateWithGemini(songs, model) {
	const key = process.env.GEMINI_API_KEY;
	if (!key) throw new Error('GEMINI_API_KEY is not set');

	const payload = {
		songs: songs.map((song) => ({ id: song.file, lines: song.lines }))
	};
	const body = JSON.stringify({
		contents: [{
			role: 'user',
			parts: [{ text: `${INSTRUCTIONS}\n\nInput:\n${JSON.stringify(payload)}` }]
		}],
		generationConfig: {
			temperature: 0.2,
			responseMimeType: 'application/json',
			responseSchema: {
				type: 'OBJECT',
				properties: {
					songs: {
						type: 'ARRAY',
						items: {
							type: 'OBJECT',
							properties: {
								id: { type: 'STRING' },
								lines: { type: 'ARRAY', items: { type: 'STRING' } }
							},
							required: ['id', 'lines']
						}
					}
				},
				required: ['songs']
			}
		}
	});

	const response = await requestJson(
		'generativelanguage.googleapis.com',
		`/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
		{},
		body,
		90000
	);

	if (response.status === 429 || response.status === 503 || response.status === 500) {
		const error = new Error(`Gemini ${model} returned ${response.status}`);
		error.retryable = true;
		throw error;
	}

	if (response.status !== 200) {
		const message = response.parsed && response.parsed.error
			? response.parsed.error.message
			: response.text.slice(0, 300);
		throw new Error(`Gemini ${model} returned ${response.status}: ${message}`);
	}

	const parts = response.parsed
		&& response.parsed.candidates
		&& response.parsed.candidates[0]
		&& response.parsed.candidates[0].content
		&& response.parsed.candidates[0].content.parts;
	const text = (parts || []).map((part) => part.text || '').join('');
	if (!text) {
		const reason = response.parsed && response.parsed.candidates && response.parsed.candidates[0]
			? response.parsed.candidates[0].finishReason
			: 'empty';
		const error = new Error(`Gemini ${model} returned no text (${reason})`);
		error.retryable = true;
		throw error;
	}

	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		const wrapped = new Error(`Gemini ${model} returned invalid JSON`);
		wrapped.retryable = true;
		throw wrapped;
	}

	const byId = new Map();
	const list = parsed.songs || parsed;
	if (!Array.isArray(list)) {
		const wrapped = new Error(`Gemini ${model} returned no songs array`);
		wrapped.retryable = true;
		throw wrapped;
	}
	list.forEach((item, index) => {
		if (item && item.id) byId.set(item.id, item);
		else byId.set(songs[index] && songs[index].file, item);
	});

	const translated = new Map();
	for (const song of songs) {
		const item = byId.get(song.file);
		const lines = extractSongLines(item, song.lines.length);
		const eng = alignSong(song, lines);
		if (eng != null) translated.set(song.file, eng);
	}
	return translated;
}

async function translateWithOpenAI(song) {
	const key = process.env.OPENAI_API_KEY;
	if (!key) return null;

	const body = JSON.stringify({
		model: 'gpt-4o-mini',
		temperature: 0.2,
		response_format: { type: 'json_object' },
		messages: [
			{ role: 'system', content: INSTRUCTIONS },
			{ role: 'user', content: JSON.stringify({ songs: [{ id: song.file, lines: song.lines }] }) }
		]
	});

	const response = await requestJson(
		'api.openai.com',
		'/v1/chat/completions',
		{ Authorization: `Bearer ${key}` },
		body,
		90000
	);
	if (response.status !== 200) return null;

	const content = response.parsed
		&& response.parsed.choices
		&& response.parsed.choices[0]
		&& response.parsed.choices[0].message
		&& response.parsed.choices[0].message.content;
	if (!content) return null;

	let parsed;
	try {
		parsed = JSON.parse(content);
	} catch (error) {
		return null;
	}
	const item = (parsed.songs && parsed.songs[0]) || parsed;
	const lines = extractSongLines(item, song.lines.length);
	return alignSong(song, lines);
}

function writeEngText(song, engText) {
	const before = JSON.parse(song.raw);
	if (before.EngText && String(before.EngText).trim()) {
		throw new Error(`${song.file} already has EngText`);
	}
	if ((song.raw.match(/"EngText":/g) || []).length !== 1) {
		throw new Error(`${song.file} has an unexpected EngText field`);
	}

	const nextRaw = song.raw.replace(
		/"EngText": (?:null|"")/,
		() => `"EngText": ${JSON.stringify(engText)}`
	);
	const after = JSON.parse(nextRaw);
	const keys = Object.keys(before);
	for (const key of keys) {
		if (key === 'EngText') continue;
		if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			throw new Error(`${song.file} changed ${key} while writing EngText`);
		}
	}
	if (after.EngText !== engText) {
		throw new Error(`${song.file} EngText did not round-trip`);
	}

	const tempPath = `${song.filePath}.tmp`;
	fs.writeFileSync(tempPath, nextRaw);
	fs.renameSync(tempPath, song.filePath);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateBatch(songs) {
	let lastError = null;
	for (let attempt = 0; attempt < 4; attempt++) {
		const model = MODELS[Math.min(attempt, MODELS.length - 1)];
		try {
			return await translateWithGemini(songs, model);
		} catch (error) {
			lastError = error;
			const wait = error.retryable ? 1500 * (attempt + 1) : 400;
			await sleep(wait);
			if (!error.retryable && attempt > 0) break;
		}
	}
	if (lastError) {
		console.error(`batch failed: ${lastError.message}`);
	}
	return new Map();
}

async function translateOne(song) {
	const batched = await translateBatch([song]);
	if (batched.has(song.file)) return batched.get(song.file);
	try {
		return await translateWithOpenAI(song);
	} catch (error) {
		console.error(`${song.file} openai fallback failed: ${error.message}`);
		return null;
	}
}

async function mapPool(items, limit, worker) {
	let cursor = 0;
	async function run() {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			await worker(items[index], index);
		}
	}
	const workers = [];
	for (let i = 0; i < Math.min(limit, items.length); i++) workers.push(run());
	await Promise.all(workers);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const state = loadState();
	const songs = listSongs(options, state);
	console.log(`songs to translate: ${songs.length}`);
	if (!songs.length) return;

	const batches = makeBatches(songs);
	let finished = 0;
	const pending = [];

	await mapPool(batches, CONCURRENCY, async (batch) => {
		const translated = await translateBatch(batch);
		for (const song of batch) {
			const eng = translated.get(song.file);
			if (!eng) {
				pending.push(song);
				continue;
			}
			writeEngText(song, eng);
			state.done.add(song.file);
			finished += 1;
		}
		saveState(state);
		console.log(`wrote ${finished}/${songs.length}`);
	});

	if (pending.length) {
		console.log(`retrying ${pending.length} songs one by one`);
	}

	for (const song of pending) {
		const eng = await translateOne(song);
		if (!eng) {
			state.failed.push(song.file);
			console.error(`failed: ${song.file}`);
			continue;
		}
		writeEngText(song, eng);
		state.done.add(song.file);
		finished += 1;
		saveState(state);
		console.log(`wrote ${finished}/${songs.length} (retry ${song.file})`);
	}

	saveState(state);
	console.log(`done. wrote ${finished}. failed ${state.failed.length}.`);
	if (state.failed.length) {
		console.log(`failed files: ${state.failed.join(', ')}`);
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
