(function () {
	var input = document.querySelector('[data-filter]');
	if (!input) return;

	var list = document.querySelector(input.getAttribute('data-filter'));
	if (!list) return;

	var items = list.querySelectorAll('.song');
	var status = document.getElementById('find-status');
	var form = input.form;
	if (form) {
		form.addEventListener('submit', function (event) {
			event.preventDefault();
		});
	}

	input.addEventListener('input', function () {
		var query = input.value.trim().toLowerCase();
		var shown = 0;

		for (var i = 0; i < items.length; i++) {
			var match = !query || items[i].textContent.toLowerCase().indexOf(query) !== -1;
			items[i].hidden = !match;
			if (match) shown += 1;
		}

		if (!status) return;
		var noun = list.getAttribute('data-filter-noun') || 'song';
		status.textContent = query ? shown + ' ' + noun + (shown === 1 ? '' : 's') : '';
	});
}());
