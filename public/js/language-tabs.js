(function () {
	var lists = document.querySelectorAll('[role="tablist"]');

	for (var i = 0; i < lists.length; i++) {
		bindTabs(lists[i]);
	}

	function bindTabs(tablist) {
		var tabs = tablist.querySelectorAll('[role="tab"]');

		for (var index = 0; index < tabs.length; index++) {
			tabs[index].addEventListener('click', onClick);
			tabs[index].addEventListener('keydown', onKeydown);
		}

		function onClick(event) {
			select(tabs, indexOf(tabs, event.currentTarget));
		}

		function onKeydown(event) {
			var current = indexOf(tabs, event.currentTarget);
			var next = current;

			if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
			else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
			else if (event.key === 'Home') next = 0;
			else if (event.key === 'End') next = tabs.length - 1;
			else return;

			event.preventDefault();
			select(tabs, next);
			tabs[next].focus();
		}
	}

	function select(tabs, selectedIndex) {
		for (var i = 0; i < tabs.length; i++) {
			var selected = i === selectedIndex;
			var panel = document.getElementById(tabs[i].getAttribute('aria-controls'));
			tabs[i].setAttribute('aria-selected', selected ? 'true' : 'false');
			tabs[i].tabIndex = selected ? 0 : -1;
			if (!panel) continue;
			if (selected) panel.removeAttribute('hidden');
			else panel.setAttribute('hidden', '');
		}
	}

	function indexOf(tabs, tab) {
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i] === tab) return i;
		}
		return 0;
	}
}());
