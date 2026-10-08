<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>Songs | Capoeira Lyrics</title>
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
			<a class="brand" href="/" aria-label="Capoeira Lyrics"><img src="/img/logo.webp" alt="Capoeira Lyrics" width="44" height="44" decoding="async"></a>
			<nav class="sections" aria-label="Sections">
				<a href="/" aria-current="page">Songs</a>
				<a href="/artists/">Artists</a>
				<a href="/tags/">Tags</a>
			</nav>
			<form class="find" role="search">
				<label for="find-songs">Find a song</label>
				<input id="find-songs" type="search" data-filter="#songs" placeholder="Name, artist, or tag" autocomplete="off">
			</form>
		</div>
		<div class="pin"></div>
	</header>
	<main id="main">
		<p id="find-status" class="find-status" role="status"></p>
		<ul id="songs" class="songs" data-letters>
			{{#.}}
			<li class="song">
				<span class="title"><a class="name" href="/songs/{{slug}}.html">{{Name}}</a>{{#hasLanguageMarks}}<span class="langs">{{#languageMarks}}<abbr class="lang" title="{{label}}">{{code}}</abbr>{{/languageMarks}}</span>{{/hasLanguageMarks}}</span>
				<a class="artist" href="/artists/{{artistSlug}}.html"><img class="avatar" src="{{avatar}}" alt="" width="18" height="18" decoding="async">{{artistName}}</a>
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
	<footer class="site-foot">
		<p>Lyrics stay with their authors. <a href="/rights/">Rights and requests</a></p>
	</footer>
	<script src="/js/list-filter.js"></script>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
