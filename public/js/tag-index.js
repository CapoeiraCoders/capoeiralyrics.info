(function () {
	var list = document.querySelector('#songs[data-filter-noun="tag"]');
	if (!list) return;

	var kinds = document.querySelector('.kinds');
	var views = document.querySelector('.views');
	var input = document.querySelector('[data-filter]');

	if (kinds) {
		kinds.addEventListener('click', function (event) {
			var button = event.target.closest('[data-kind]');
			if (!button || !kinds.contains(button)) return;
			var buttons = kinds.querySelectorAll('[data-kind]');
			for (var i = 0; i < buttons.length; i++) {
				buttons[i].setAttribute('aria-pressed', buttons[i] === button ? 'true' : 'false');
			}
			if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}

	if (!views) return;

	views.addEventListener('click', function (event) {
		var button = event.target.closest('[data-view]');
		if (!button || !views.contains(button)) return;
		var buttons = views.querySelectorAll('[data-view]');
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].setAttribute('aria-pressed', buttons[i] === button ? 'true' : 'false');
		}
		document.body.classList.toggle('is-cloud', button.getAttribute('data-view') === 'cloud');
		window.dispatchEvent(new Event('resize'));
	});
}());
