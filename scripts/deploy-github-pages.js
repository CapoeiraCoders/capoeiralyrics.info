#!/usr/bin/env node
'use strict';

/**
 * Publish the built site to GitHub Pages on this repository.
 *
 * Pages for a project repository can serve the /docs folder on master.
 * Song JSON stays gitignored. The script copies ./public into ./docs, commits
 * that folder, pushes master, and selects /docs as the Pages source.
 *
 * A case-insensitive disk can store the song folder as Songs/ while every page
 * links to /songs/. GitHub Pages is case-sensitive, so the copy renames that
 * folder to songs/. Extensionless HTML is published as index.html so the
 * original path still renders.
 *
 *   npm run deploy
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'public');
const DOCS_DIR = path.join(ROOT, 'docs');
const SONGS_DATA_DIR = path.join(ROOT, 'data', 'songs');
const PAGES_REPO = 'CapoeiraCoders/capoeiralyrics.info';
const CUSTOM_DOMAIN = 'capoeiralyrics.info';
const SKIP_NAMES = new Set(['.DS_Store', 'README.md']);

const allowPartial = process.argv.includes('--allow-partial');

function run(args, options) {
	execFileSync('git', args, {
		cwd: options.cwd,
		stdio: 'inherit'
	});
}

function countFiles(dir, extension) {
	if (!fs.existsSync(dir)) return 0;
	return fs.readdirSync(dir).filter(name => name.endsWith(extension)).length;
}

function songPagesDir() {
	const lower = path.join(SITE_DIR, 'songs');
	const stored = path.join(SITE_DIR, 'Songs');
	if (fs.existsSync(lower)) return lower;
	return stored;
}

function assertSiteIsReady() {
	if (!fs.existsSync(path.join(SITE_DIR, 'index.html'))) {
		console.error('public/index.html is missing. Run npm run build before deploy.');
		process.exit(1);
	}

	const songs = countFiles(SONGS_DATA_DIR, '.json');
	const pages = countFiles(songPagesDir(), '.html');
	if (!allowPartial && pages < songs) {
		console.error(`Refusing to publish ${pages} song pages while data/songs has ${songs} files.`);
		console.error('Run npm run build for a complete site, or pass --allow-partial.');
		process.exit(1);
	}
}

function isHtmlDocument(filePath) {
	const fd = fs.openSync(filePath, 'r');
	try {
		const buf = Buffer.alloc(64);
		const read = fs.readSync(fd, buf, 0, buf.length, 0);
		const head = buf.slice(0, read).toString('utf8').trim().toLowerCase();
		return head.startsWith('<!doctype html') || head.startsWith('<html');
	} finally {
		fs.closeSync(fd);
	}
}

function publishedPath(relPath, sourcePath) {
	const parts = relPath.split(path.sep);
	if (parts[0] === 'Songs') parts[0] = 'songs';

	let destRel = parts.join(path.sep);
	if (path.extname(sourcePath) === '' && isHtmlDocument(sourcePath)) {
		destRel = path.join(destRel, 'index.html');
	}
	return destRel;
}

function copyFile(sourcePath, destPath) {
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	fs.copyFileSync(sourcePath, destPath);
}

function copyTree(srcDir, destRoot, rel) {
	for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
		if (SKIP_NAMES.has(entry.name)) continue;

		const sourcePath = path.join(srcDir, entry.name);
		const relPath = rel ? path.join(rel, entry.name) : entry.name;
		if (entry.isDirectory()) {
			copyTree(sourcePath, destRoot, relPath);
			continue;
		}
		if (!entry.isFile()) continue;

		copyFile(sourcePath, path.join(destRoot, publishedPath(relPath, sourcePath)));

		const parts = relPath.split(path.sep);
		if (parts[0] === 'Songs' && parts[1] === 'Details' && path.extname(sourcePath) === '' && isHtmlDocument(sourcePath)) {
			const legacy = path.join('Songs', ...parts.slice(1), 'index.html');
			copyFile(sourcePath, path.join(destRoot, legacy));
		}
	}
}

function copyPublicSite(destDir) {
	copyTree(SITE_DIR, destDir, '');

	const errorPage = path.join(destDir, 'error.html');
	const notFoundPage = path.join(destDir, '404.html');
	if (fs.existsSync(errorPage) && !fs.existsSync(notFoundPage)) {
		fs.copyFileSync(errorPage, notFoundPage);
	}

	fs.writeFileSync(path.join(destDir, '.nojekyll'), '');
	fs.writeFileSync(path.join(destDir, 'CNAME'), `${CUSTOM_DOMAIN}\n`);

	const readme = [
		'# capoeiralyrics.info',
		'',
		'Published website. Rendered HTML only.',
		'',
		'Song JSON stays out of git. The generator lives in this repository.',
		''
	].join('\n');
	fs.writeFileSync(path.join(destDir, 'README.md'), readme);
}

function gitOutput(args) {
	return execFileSync('git', args, {
		cwd: ROOT,
		encoding: 'utf8'
	});
}

function assertOnMaster() {
	const branch = gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
	if (branch !== 'master') {
		console.error(`Deploy publishes docs/ on master. Current branch is ${branch}.`);
		process.exit(1);
	}
}

function updateMaster() {
	run(['fetch', 'origin', 'master'], { cwd: ROOT });
	run(['pull', '--rebase', '--autostash', 'origin', 'master'], { cwd: ROOT });
}

function configurePages() {
	const body = JSON.stringify({
		source: {
			branch: 'master',
			path: '/docs'
		}
	});
	execFileSync('gh', [
		'api',
		'--method', 'PUT',
		`repos/${PAGES_REPO}/pages`,
		'--input', '-'
	], {
		cwd: ROOT,
		input: body,
		stdio: ['pipe', 'inherit', 'inherit']
	});
}

function publish() {
	assertSiteIsReady();
	assertOnMaster();
	updateMaster();

	fs.rmSync(DOCS_DIR, { recursive: true, force: true });
	copyPublicSite(DOCS_DIR);
	run(['add', '-A', '--', 'docs'], { cwd: ROOT });

	const status = gitOutput(['status', '--porcelain', '--', 'docs']);
	if (!status.trim()) {
		console.log('docs/ already matches public/. Nothing new to commit.');
	} else {
		run(['commit', '-m', `Publish site for ${CUSTOM_DOMAIN}`], { cwd: ROOT });
		run(['push', 'origin', 'HEAD'], { cwd: ROOT });
	}

	configurePages();
	console.log(`Published ${CUSTOM_DOMAIN} from master /docs.`);
	console.log('GitHub rebuilds Pages after the push. Turn on Enforce HTTPS in the repository settings.');
}

publish();
