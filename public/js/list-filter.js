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

		for (var i = 0; i < items.length; i++) {
			var match = !query || texts[i].indexOf(query) !== -1;
			items[i].hidden = !match;
			if (match) shown += 1;
		}

		if (!status) return;
		var noun = list.getAttribute('data-filter-noun') || 'song';
		status.textContent = query ? shown + ' ' + noun + (shown === 1 ? '' : 's') : '';
	});

	function searchableText(item) {
		var parts = [];
		var nodes = item.querySelectorAll('.name, .artist, .tags');
		for (var i = 0; i < nodes.length; i++) parts.push(nodes[i].textContent);
		return parts.join(' ').toLowerCase();
	}
}());
