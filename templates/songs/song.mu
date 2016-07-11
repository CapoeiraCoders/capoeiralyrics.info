<html>
<head>
	<meta charset="utf-8">
	<title>{{meta.title}}</title>

	<meta name="description" content="{{meta.description}}">
	<meta name="author" content="{{meta.author}}">

	<meta property="og:url" content="http://capoeiralyrics.info/songs/{{slug}}.html"/>
	<meta property="og:title" content="{{meta.title}}"/>
	<meta property="og:description" content="{{meta.description}}"/>
	<meta property="og:ite_name" content="Capoeira Lyrics"/>
	<meta property="og:type" content="music.song"/>

	<!-- Mobile Specific Metas -->
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<!-- FONT -->
	<link href="//fonts.googleapis.com/css?family=Raleway:400,300,600" rel="stylesheet" type="text/css">

	<!-- CSS -->
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/skeleton.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/songs/song.css">

</head>
<body>
	<!-- Google Tag Manager -->
	<noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-M9LHWZ"
	height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
	<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
	new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
	j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
	'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
	})(window,document,'script','dataLayer','GTM-M9LHWZ');</script>
	<!-- End Google Tag Manager -->


	<script type="application/ld+json">
	{
	"@context": "http://schema.org",
	"@type": "BreadcrumbList",
	"itemListElement": [{
		"@type": "ListItem",
		"position": 1,
		"item": {
		  "@id": "http://capoeiralyrics.info/songs",
		  "name": "Songs"
		}
	},{
		"@type": "ListItem",
		"position": 2,
		"item": {
			"@id": "http://capoeiralyrics.info/songs/{{slug}}.html",
			"name": "{{Name}}"
		}
	}]
	}
	</script>

	<h1 class='title'>{{Name}}</h1>
	<h1 class='subtitle'>{{Artist}}</h1>
	
	{{#youtubeEmbed}}
		<div class='video video-container'>{{{youtubeEmbed}}}</div>
	{{/youtubeEmbed}}

	<a name='text'></a>
	<article>{{{Text}}}</article>
	
	{{#EngText}}
		<a name='en'></a>
		<h3>English</h3>
		<article>{{{EngText}}}</article>
	{{/EngText}}
	
	{{#RusText}}
		<a name='ru'></a>
		<h3>Русский</h3>
		<article>{{{RusText}}}</article>
	{{/RusText}}
</body>
</html>