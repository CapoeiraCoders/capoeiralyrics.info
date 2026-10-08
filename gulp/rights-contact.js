/* jshint node:true, esversion:6 */
'use strict';

const ISSUES_NEW = 'https://github.com/CapoeiraCoders/CapoeiraCoders.github.io/issues/new';
const RIGHTS_TEMPLATE = 'rights-claim.yml';
const SITE_URL = 'http://capoeiralyrics.info';

const REQUEST_CLAIM = 'Credit me as the author';
const REQUEST_REMOVAL = 'Remove the song';
const REQUEST_CORRECTION = 'Correct the text or attribution';

function rightsIssueLink(request, songUrl) {
	const params = new URLSearchParams({ template: RIGHTS_TEMPLATE });
	if (request) params.set('request', request);
	if (songUrl) params.set('song-url', songUrl);
	return `${ISSUES_NEW}?${params.toString()}`;
}

function songIssueLinks(song) {
	const url = `${SITE_URL}/songs/${song.slug}.html`;

	return {
		issueClaim: rightsIssueLink(REQUEST_CLAIM, url),
		issueRemoval: rightsIssueLink(REQUEST_REMOVAL, url),
		issueCorrection: rightsIssueLink(REQUEST_CORRECTION, url)
	};
}

function rightsIssueLinks() {
	return {
		issueClaim: rightsIssueLink(REQUEST_CLAIM),
		issueRemoval: rightsIssueLink(REQUEST_REMOVAL),
		issueCorrection: rightsIssueLink(REQUEST_CORRECTION)
	};
}

module.exports = {
	SITE_URL,
	songIssueLinks,
	rightsIssueLinks
};
