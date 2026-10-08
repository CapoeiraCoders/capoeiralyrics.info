/* jshint node:true, esversion:6 */
'use strict';

const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const mustache = require('mustache');
const { rightsIssueLinks } = require('./rights-contact');

gulp.task('rights:cleanup', () => del(['public/rights']));

function writeRightsPage(done) {
	const tpl = fs.readFileSync('./templates/rights.mu', 'utf8');
	const html = mustache.render(tpl, rightsIssueLinks());
	fs.mkdirSync('./public/rights', { recursive: true });
	fs.writeFileSync('./public/rights/index.html', html);
	done();
}

gulp.task('rights:build', gulp.series('rights:cleanup', writeRightsPage));
