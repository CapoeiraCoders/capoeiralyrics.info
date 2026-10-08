(function () {
	var input = document.querySelector('[data-filter]');
	if (!input) return;

	var list = document.querySelector(input.getAttribute('data-filter'));
	if (!list) return;

	var items = list.querySelectorAll('.song');
	var texts = [];
	var status = document.getElementById('find-status');
	var form = input.form;
	if (form) {
		form.addEventListener('submit', function (event) {
			event.preventDefault();
		});
	}

	for (var n = 0; n < items.length; n++) texts.push(searchableText(items[n]));

	input.addEventListener('input', function () {
		var query = input.value.trim().toLowerCase();
		var shown = 0;

		var kind = activeKind();

		for (var i = 0; i < items.length; i++) {
			var kindOk = !kind || items[i].getAttribute('data-kind') === kind;
			var match = kindOk && (!query || texts[i].indexOf(query) !== -1);
			items[i].hidden = !match;
			if (match) shown += 1;
		}

		hideEmptyGroups(list);

		if (!status) return;
		var noun = list.getAttribute('data-filter-noun') || 'song';
		var filtering = query || kind;
		status.textContent = filtering ? shown + ' ' + noun + (shown === 1 ? '' : 's') : '';
	});

	function activeKind() {
		var bar = document.querySelector('.kinds');
		if (!bar) return '';
		var pressed = bar.querySelector('[aria-pressed="true"]');
		if (!pressed) return '';
		return pressed.getAttribute('data-kind') || '';
	}

	function searchableText(item) {
		var parts = [];
		if (item.getAttribute('data-kind-name')) parts.push(item.getAttribute('data-kind-name'));
		var nodes = item.querySelectorAll('.name, .artist, .tags, .blurb');
		for (var i = 0; i < nodes.length; i++) parts.push(nodes[i].textContent);
		return parts.join(' ').toLowerCase();
	}

	function hideEmptyGroups(list) {
		var heads = list.querySelectorAll('.tag-group');
		if (!heads.length) return;
		var kinds = document.querySelector('.kinds');

		for (var h = 0; h < heads.length; h++) {
			var visible = false;
			var el = heads[h].nextElementSibling;
			while (el && !el.classList.contains('tag-group')) {
				if (el.classList.contains('song') && !el.hidden) visible = true;
				el = el.nextElementSibling;
			}
			heads[h].hidden = !visible;
			if (!kinds || !heads[h].id) continue;
			var link = kinds.querySelector('[data-group="' + heads[h].id + '"]');
			if (link) link.hidden = !visible;
		}
	}
}());
