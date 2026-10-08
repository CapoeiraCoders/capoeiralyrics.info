<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>Tags | Capoeira Lyrics</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Tags for capoeira song lyrics.">
	<link href="https://fonts.googleapis.com/css?family=Raleway:400,600" rel="stylesheet">
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
</head>
<body>
	<a class="skip" href="#main">Skip to tags</a>
	<header class="site">
		<div class="toolbar">
			<a class="brand" href="/" aria-label="Capoeira Lyrics"><img src="/img/logo.webp" alt="Capoeira Lyrics" width="44" height="44" decoding="async"></a>
			<nav class="sections" aria-label="Sections">
				<a href="/">Songs</a>
				<a href="/artists/">Artists</a>
				<a href="/tags/" aria-current="page">Tags</a>
			</nav>
			<form class="find" role="search">
				<label for="find-songs">Find a tag</label>
				<input id="find-songs" type="search" data-filter="#songs" placeholder="Tag" autocomplete="off">
			</form>
		</div>
		<div class="pin"></div>
	</header>
	<main id="main">
		<p id="find-status" class="find-status" role="status"></p>
		<ul id="songs" class="songs" data-letters data-filter-noun="tag">
			{{#tags}}
			<li class="song">
				<a class="name" href="/tags/{{slug}}.html">#{{name}}</a>
				<span class="count">{{count}}</span>
			</li>
			{{/tags}}
		</ul>
	</main>
	<footer class="site-foot">
		<p>Lyrics stay with their authors. <a href="/rights/">Rights and requests</a></p>
	</footer>
	<script src="/js/list-filter.js"></script>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
