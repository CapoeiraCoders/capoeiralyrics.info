(function () {
	var list = document.querySelector('#songs[data-letters]');
	if (!list) return;

	var songs = Array.prototype.slice.call(list.querySelectorAll('.song'));
	if (!songs.length) return;

	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function titleOf(song) {
		var link = song.querySelector('.name');
		return link ? link.textContent.trim() : '';
	}

	function letterOf(title) {
		var folded = String(title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
		var first = folded.replace(/^[^A-Za-z]+/, '').charAt(0).toUpperCase();
		return first >= 'A' && first <= 'Z' ? first : '#';
	}

	songs.sort(function (a, b) {
		return titleOf(a).localeCompare(titleOf(b), 'pt', {
			sensitivity: 'base',
			numeric: true
		});
	});

	var groups = { '#': [] };
	alphabet.forEach(function (letter) {
		groups[letter] = [];
	});
	songs.forEach(function (song) {
		var letter = letterOf(titleOf(song));
		song.dataset.letter = letter;
		groups[letter].push(song);
	});

	var order = alphabet.slice();
	if (groups['#'].length) order.push('#');

	var nav = document.createElement('nav');
	nav.className = 'letters';
	nav.setAttribute('aria-label', 'Songs by letter');

	var links = {};
	order.forEach(function (letter) {
		var id = letter === '#' ? 'letter-other' : 'letter-' + letter;
		var link = document.createElement('a');
		link.href = '#' + id;
		link.dataset.letter = letter;
		link.textContent = letter;
		link.setAttribute('aria-label', 'Jump to ' + (letter === '#' ? 'other' : letter));
		links[letter] = link;
		nav.appendChild(link);
	});

	order.forEach(function (letter) {
		groups[letter].forEach(function (song) {
			list.appendChild(song);
		});
	});

	function anchorId(letter) {
		return letter === '#' ? 'letter-other' : 'letter-' + letter;
	}

	function firstVisible(letter) {
		var items = groups[letter];
		for (var i = 0; i < items.length; i++) {
			if (!items[i].hidden) return items[i];
		}
		return null;
	}

	var pin = document.querySelector('.pin');
	if (pin) pin.appendChild(nav);
	else list.parentNode.insertBefore(nav, list);

	function setEnabled(link, enabled) {
		link.classList.toggle('is-empty', !enabled);
		link.setAttribute('aria-disabled', enabled ? 'false' : 'true');
		if (enabled) link.removeAttribute('tabindex');
		else link.setAttribute('tabindex', '-1');
	}

	function syncOffset() {
		var bar = document.querySelector('.site');
		var barHeight = bar ? bar.offsetHeight : 0;
		if (!nav.parentNode || !nav.parentNode.classList.contains('pin')) {
			nav.style.top = barHeight + 'px';
		}
		var offset = barHeight + 8 + 'px';
		order.forEach(function (letter) {
			var song = document.getElementById(anchorId(letter));
			if (song) song.style.scrollMarginTop = offset;
		});
	}

	function syncGroups() {
		order.forEach(function (letter) {
			var id = anchorId(letter);
			var marked = document.getElementById(id);
			if (marked) marked.removeAttribute('id');
			var song = firstVisible(letter);
			if (song) {
				song.id = id;
				song.style.scrollMarginTop = (document.querySelector('.site') ? document.querySelector('.site').offsetHeight : 0) + 8 + 'px';
			}
			setEnabled(links[letter], !!song);
		});
	}

	function currentLetter() {
		var line = nav.getBoundingClientRect().bottom + 4;
		var active = '';
		order.forEach(function (letter) {
			var song = firstVisible(letter);
			if (!song) return;
			if (song.getBoundingClientRect().top <= line) active = letter;
		});
		return active;
	}

	function markCurrent(letter) {
		order.forEach(function (item) {
			if (item === letter) links[item].setAttribute('aria-current', 'true');
			else links[item].removeAttribute('aria-current');
		});
	}

	var scrollTick = 0;
	function onScroll() {
		if (scrollTick) return;
		scrollTick = window.requestAnimationFrame(function () {
			scrollTick = 0;
			markCurrent(currentLetter());
		});
	}

	nav.addEventListener('click', function (event) {
		var link = event.target.closest('a');
		if (!link || link.getAttribute('aria-disabled') === 'true') {
			event.preventDefault();
			return;
		}
		markCurrent(link.dataset.letter);
	});

	var filter = document.querySelector('[data-filter]');
	if (filter) {
		filter.addEventListener('input', syncGroups);
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', syncOffset);
	syncGroups();
	syncOffset();
	markCurrent(currentLetter() || order.filter(function (letter) {
		return groups[letter].length;
	})[0]);

	if (window.location.hash) {
		var target = document.getElementById(window.location.hash.slice(1));
		if (target) target.scrollIntoView();
	}
}());
