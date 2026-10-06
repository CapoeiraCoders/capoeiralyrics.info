#!/usr/bin/env node
'use strict';

/**
 * Publish the exported site to GitHub Pages.
 *
 * CapoeiraCoders is on GitHub Free, which only serves Pages from a public
 * repository. This private repo keeps the song JSON. The script copies
 * ./s3-export to the public site repo and never reads ./data.
 *
 * The export lands on a case-insensitive disk as Songs/, while every page
 * links to /songs/. GitHub Pages is case-sensitive, so the copy renames that
 * folder to songs/. Extensionless HTML, such as the old Details URLs, is
 * published as index.html so the original path still renders.
 *
 *   npm run deploy -- --preview   https://capoeiracoders.github.io
 *   npm run deploy                 same site, with the capoeiralyrics.info domain
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(ROOT, 's3-export');
const SONGS_DATA_DIR = path.join(ROOT, 'data', 'songs');
const PAGES_REMOTE = 'git@github.com:CapoeiraCoders/CapoeiraCoders.github.io.git';
const CUSTOM_DOMAIN = 'capoeiralyrics.info';
const SKIP_NAMES = new Set(['.DS_Store', 'README.md']);

const preview = process.argv.includes('--preview');
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
		console.error('s3-export/index.html is missing. Export the site from S3 into s3-export/ before deploy.');
		process.exit(1);
	}

	const songs = countFiles(SONGS_DATA_DIR, '.json');
	const pages = countFiles(songPagesDir(), '.html');
	if (!allowPartial && pages < songs) {
		console.error(`Refusing to publish ${pages} song pages while data/songs has ${songs} files.`);
		console.error('Export a complete site into s3-export/, or pass --allow-partial.');
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
	if (!preview) {
		fs.writeFileSync(path.join(destDir, 'CNAME'), `${CUSTOM_DOMAIN}\n`);
	}

	const readme = [
		'# capoeiralyrics.info',
		'',
		'Published website. Rendered HTML only.',
		'',
		'Song JSON and the generator stay in the private `CapoeiraCoders/capoeiralyrics.info` repository.',
		''
	].join('\n');
	fs.writeFileSync(path.join(destDir, 'README.md'), readme);
}

function clearWorkTree(workDir) {
	for (const entry of fs.readdirSync(workDir)) {
		if (entry === '.git') continue;
		fs.rmSync(path.join(workDir, entry), { recursive: true, force: true });
	}
}

function publish() {
	assertSiteIsReady();

	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'capoeira-pages-'));
	let exitCode = 0;
	try {
		let cloned = false;
		try {
			run(['clone', '--depth', '1', PAGES_REMOTE, workDir], { cwd: ROOT });
			cloned = true;
		} catch (error) {
			console.error(`Could not clone ${PAGES_REMOTE}.`);
			console.error('The public repository CapoeiraCoders/CapoeiraCoders.github.io has to exist.');
			exitCode = 1;
		}

		if (cloned) {
			clearWorkTree(workDir);
			copyPublicSite(workDir);
			run(['add', '-A'], { cwd: workDir });

			const status = execFileSync('git', ['status', '--porcelain'], {
				cwd: workDir,
				encoding: 'utf8'
			});
			if (!status.trim()) {
				console.log('GitHub Pages already matches s3-export/. Nothing to publish.');
			} else {
				const message = preview
					? 'Publish S3 export preview'
					: `Publish S3 export for ${CUSTOM_DOMAIN}`;
				run(['commit', '-m', message], { cwd: workDir });
				run(['push', 'origin', 'HEAD'], { cwd: workDir });

				if (preview) {
					console.log('Preview: https://capoeiracoders.github.io');
				} else {
					console.log(`Published with custom domain ${CUSTOM_DOMAIN}.`);
					console.log('Point DNS at GitHub Pages, then turn on Enforce HTTPS in the site repository.');
				}
			}
		}
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}

	if (exitCode) process.exit(exitCode);
}

publish();
