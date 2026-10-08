<html lang="pt">
<head>
	<meta charset="utf-8">
	<title>{{meta.title}}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="{{meta.description}}">
	<meta name="author" content="{{meta.author}}">
	<meta property="og:url" content="http://capoeiralyrics.info/songs/{{slug}}.html">
	<meta property="og:title" content="{{meta.title}}">
	<meta property="og:description" content="{{meta.description}}">
	<meta property="og:type" content="music.song">
	<link href="https://fonts.googleapis.com/css?family=Raleway:400,600" rel="stylesheet">
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
	<link rel="stylesheet" href="/css/songs/song.css">
</head>
<body>
	<a class="skip" href="#main">Skip to lyrics</a>
	<header class="site">
		<div class="toolbar">
			<a class="brand" href="/" aria-label="Capoeira Lyrics"><img src="/img/logo.webp" alt="Capoeira Lyrics" width="44" height="44" decoding="async"></a>
			<nav class="sections" aria-label="Sections">
				<a href="/" aria-current="page">Songs</a>
				<a href="/artists/">Artists</a>
				<a href="/tags/">Tags</a>
			</nav>
		</div>
	</header>
	<main id="main">
		<h1>{{Name}}{{#hasLanguageMarks}} <span class="langs">{{#languageMarks}}<abbr class="lang" title="{{label}}">{{code}}</abbr>{{/languageMarks}}</span>{{/hasLanguageMarks}}</h1>
		<p class="byline">
			<a class="artist" href="/artists/{{artistSlug}}.html"><img class="avatar" src="{{avatar}}" alt="" width="18" height="18" decoding="async">{{artistName}}</a>
		</p>
		{{#hasTags}}
		<ul class="tags song-tags" aria-label="Tags">
			{{#tags}}
			<li><a href="/tags/{{slug}}.html">#{{name}}</a></li>
			{{/tags}}
		</ul>
		{{/hasTags}}

		{{#noLyrics}}
		<p class="empty">No lyrics for this song yet.</p>
		{{/noLyrics}}

		{{#showLanguageTabs}}
		<div class="lang-tabs" role="tablist" aria-label="Language">
			{{#languages}}
			<button type="button" role="tab" id="tab-{{id}}" aria-controls="panel-{{id}}" aria-selected="{{#active}}true{{/active}}{{^active}}false{{/active}}" tabindex="{{#active}}0{{/active}}{{^active}}-1{{/active}}">{{label}}</button>
			{{/languages}}
		</div>
		{{#languages}}
		<div class="lyrics" role="tabpanel" id="panel-{{id}}" aria-labelledby="tab-{{id}}" lang="{{lang}}" tabindex="0" {{^active}}hidden{{/active}}>
			{{{html}}}
		</div>
		{{/languages}}
		{{/showLanguageTabs}}

		{{^showLanguageTabs}}
		{{#languages}}
		<div class="lyrics" lang="{{lang}}">{{{html}}}</div>
		{{/languages}}
		{{/showLanguageTabs}}

		{{#youtubeEmbed}}
		<div class="video">{{{youtubeEmbed}}}</div>
		{{/youtubeEmbed}}
	</main>
	<footer class="site-foot">
		<p class="rights-hint">This text stays with its author. <a href="{{{issueClaim}}}">Claim authorship</a> · <a href="{{{issueRemoval}}}">Request removal</a> · <a href="{{{issueCorrection}}}">Report a mistake</a></p>
		<p>Lyrics stay with their authors. <a href="/rights/">Rights and requests</a></p>
	</footer>
	{{#showLanguageTabs}}
	<script src="/js/language-tabs.js"></script>
	{{/showLanguageTabs}}
</body>
</html>
