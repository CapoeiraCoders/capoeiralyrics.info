<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>Artists | Capoeira Lyrics</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Artists with capoeira song lyrics.">
	<link href="https://fonts.googleapis.com/css?family=Raleway:400,600" rel="stylesheet">
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
</head>
<body>
	<a class="skip" href="#main">Skip to artists</a>
	<header class="site">
		<div class="toolbar">
			<a class="brand" href="/">Capoeira Lyrics</a>
			<form class="find" role="search">
				<label for="find-songs">Find an artist</label>
				<input id="find-songs" type="search" data-filter="#songs" placeholder="Artist" autocomplete="off">
			</form>
		</div>
		<div class="pin">
			<nav class="sections" aria-label="Sections">
				<a href="/">All songs</a>
				<a href="/tags/">Tags</a>
				<a href="/artists/" aria-current="page">Artists</a>
			</nav>
		</div>
	</header>
	<main id="main">
		<p id="find-status" class="find-status" role="status"></p>
		<ul id="songs" class="songs" data-letters data-filter-noun="artist">
			{{#artists}}
			<li class="song">
				<a class="name" href="/artists/{{slug}}.html"><img class="avatar" src="/img/artists/placeholder.svg" alt="" width="18" height="18">{{name}}</a>
				<span class="count">{{count}}</span>
			</li>
			{{/artists}}
		</ul>
	</main>
	<script src="/js/list-filter.js"></script>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
