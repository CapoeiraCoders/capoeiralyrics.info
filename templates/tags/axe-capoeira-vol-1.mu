<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>Axe Capoeira: Volume 1 | Capoeira Lyrics</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Capoeira lyrics from Axe Capoeira volume 1.">
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
		</div>
		<div class="pin"></div>
	</header>
	<main id="main">
		<div class="profile">
			<div>
				<h1>Axe Capoeira: Volume 1</h1>
				<p class="lede">Mestre Barrao</p>
			</div>
		</div>
		{{#hasAbout}}
		<section class="about" aria-label="About">
			{{#hasDescription}}
			<p class="bio">{{description}}</p>
			{{/hasDescription}}
		</section>
		{{/hasAbout}}
		<ul id="songs" class="songs" data-letters>
			{{#songs}}
			<li class="song">
				<a class="name" href="/songs/{{slug}}.html">{{name}}</a>
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
	<script src="/js/letter-nav.js"></script>
</body>
</html>
