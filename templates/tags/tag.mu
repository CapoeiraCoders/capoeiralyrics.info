<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>#{{name}} | Capoeira Lyrics</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="{{#hasDescription}}{{description}}{{/hasDescription}}{{^hasDescription}}Capoeira lyrics tagged {{name}}.{{/hasDescription}}">
	<meta property="og:url" content="http://capoeiralyrics.info/tags/{{slug}}.html">
	<meta property="og:title" content="#{{name}} | Capoeira Lyrics">
	<meta property="og:description" content="{{#hasDescription}}{{description}}{{/hasDescription}}{{^hasDescription}}Capoeira lyrics tagged {{name}}.{{/hasDescription}}">
	<meta property="og:type" content="website">
	<link href="https://fonts.googleapis.com/css?family=Raleway:400,600" rel="stylesheet">
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
	<link rel="stylesheet" href="/css/tags/tag.css">
</head>
<body>
	<a class="skip" href="#main">Skip to songs</a>
	<header class="site">
		<div class="toolbar">
			<a class="brand" href="/" aria-label="Capoeira Lyrics"><img src="/img/logo.webp" alt="Capoeira Lyrics" width="44" height="44" decoding="async"></a>
			<nav class="sections" aria-label="Sections">
				<a href="/">Songs</a>
				<a href="/artists/">Artists</a>
				<a href="/tags/" aria-current="page">Tags</a>
			</nav>
			<form class="find" role="search">
				<label for="find-songs">Find a song</label>
				<input id="find-songs" type="search" data-filter="#songs" placeholder="Name, artist, or tag" autocomplete="off">
			</form>
		</div>
		<div class="pin"></div>
	</header>
	<main id="main">
		<div class="profile">
			<div>
				<h1>#{{name}}</h1>
				{{#hasGroup}}
				<p class="lede"><a href="/tags/#group-{{groupId}}">{{group}}</a></p>
				{{/hasGroup}}
			</div>
		</div>
		{{#hasAbout}}
		<section class="about" aria-label="About">
			{{#hasDescription}}
			<p class="bio">{{description}}</p>
			{{/hasDescription}}
			{{#hasSource}}
			<p class="credit">From <a href="{{sourceUrl}}">{{sourceName}}</a>{{#sourceLicense}}, {{sourceLicense}}{{/sourceLicense}}</p>
			{{/hasSource}}
			{{#hasLinks}}
			<ul class="profile-links">
				{{#links}}
				<li><a href="{{url}}">{{label}}</a></li>
				{{/links}}
			</ul>
			{{/hasLinks}}
		</section>
		{{/hasAbout}}
		<p id="find-status" class="find-status" role="status"></p>
		<ul id="songs" class="songs" data-letters>
			{{#songs}}
			<li class="song">
				<span class="title"><a class="name" href="/songs/{{slug}}.html">{{name}}</a>{{#hasLanguageMarks}}<span class="langs">{{#languageMarks}}<abbr class="lang" title="{{label}}">{{code}}</abbr>{{/languageMarks}}</span>{{/hasLanguageMarks}}</span>
				<a class="artist" href="/artists/{{artistSlug}}.html"><img class="avatar" src="{{avatar}}" alt="" width="18" height="18" decoding="async">{{artistName}}</a>
				<ul class="tags">
					{{#tags}}
					<li><a href="/tags/{{slug}}.html">#{{name}}</a></li>
					{{/tags}}
				</ul>
			</li>
			{{/songs}}
		</ul>
	</main>
	<footer class="site-foot">
		<p>Lyrics stay with their authors. <a href="/rights/">Rights and requests</a></p>
	</footer>
	<script src="/js/list-filter.js"></script>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
