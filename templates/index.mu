<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>Capoeira Lyrics</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Capoeira song lyrics in Portuguese, English, and Russian.">
	<link href="https://fonts.googleapis.com/css?family=Raleway:400,600" rel="stylesheet">
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
</head>
<body>
	<a class="skip" href="#main">Skip to songs</a>
	<header class="site">
		<div class="toolbar">
			<a class="brand" href="/">Capoeira Lyrics</a>
			<form class="find" role="search">
				<label for="find-songs">Find a song</label>
				<input id="find-songs" type="search" data-filter="#songs" placeholder="Name, artist, or tag" autocomplete="off">
			</form>
		</div>
		<div class="pin">
			<nav class="sections" aria-label="Sections">
				<a href="/" aria-current="page">All songs</a>
				<a href="/tags/">Tags</a>
				<a href="/artists/">Artists</a>
			</nav>
		</div>
	</header>
	<main id="main">
		<p id="find-status" class="find-status" role="status"></p>
		<ul id="songs" class="songs" data-letters>
			{{#.}}
			<li class="song">
				<a class="name" href="/songs/{{slug}}.html">{{Name}}</a>
				<a class="artist" href="/artists/{{artistSlug}}.html"><img class="avatar" src="/img/artists/placeholder.svg" alt="" width="18" height="18">{{artistName}}</a>
				{{#hasTags}}
				<ul class="tags">
					{{#tags}}
					<li><a href="/tags/{{slug}}.html">#{{name}}</a></li>
					{{/tags}}
				</ul>
				{{/hasTags}}
			</li>
			{{/.}}
		</ul>
	</main>
	<script src="/js/list-filter.js"></script>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
