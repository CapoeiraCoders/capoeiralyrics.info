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
			<a class="brand" href="/">Capoeira Lyrics</a>
		</div>
		<div class="pin">
			<nav class="sections" aria-label="Sections">
				<a href="/">All songs</a>
				<a href="/tags/" aria-current="page">Tags</a>
				<a href="/artists/">Artists</a>
			</nav>
			<nav class="crumbs" aria-label="Breadcrumb">
				<ol>
					<li aria-current="page">Axe Capoeira: Volume 1</li>
				</ol>
			</nav>
		</div>
	</header>
	<main id="main">
		<h1>Axe Capoeira: Volume 1</h1>
		<p class="lede">Mestre Barrao</p>
		<img class="cover" src="/img/tags/axe-capoeira-vol-1.jpg" alt="Cover of Axe Capoeira volume 1">
		<ul id="songs" class="songs" data-letters>
			{{#songs}}
			<li class="song">
				<a class="name" href="/songs/{{slug}}.html">{{name}}</a>
				<a class="artist" href="/artists/{{artistSlug}}.html"><img class="avatar" src="/img/artists/placeholder.svg" alt="" width="18" height="18">{{artistName}}</a>
				<ul class="tags">
					{{#tags}}
					<li><a href="/tags/{{slug}}.html">#{{name}}</a></li>
					{{/tags}}
				</ul>
			</li>
			{{/songs}}
		</ul>
	</main>
	<script src="/js/letter-nav.js"></script>
</body>
</html>
