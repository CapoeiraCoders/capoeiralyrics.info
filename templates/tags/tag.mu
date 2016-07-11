<html lang="pt" xml:lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="utf-8">
	<title>Tag {{name}} | Capoeira Lyrics</title>

	<meta name="description" content="Capoeira lyrics with tag {{name}}">

	<meta property="og:url" content="http://capoeiralyrics.info/tags/{{slug}}.html"/>
	<meta property="og:title" content="Tag {{name}} | Capoeira Lyrics"/>
	<meta property="og:description" content="Capoeira lyrics with tag {{name}}"/>
	<meta property="og:item_name" content="Capoeira Lyrics | Tag {{name}}"/>
	<meta property="og:type" content="music.song"/>

	<!-- Mobile Specific Metas -->
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<!-- FONT -->
	<link href="//fonts.googleapis.com/css?family=Raleway:400,300,600" rel="stylesheet" type="text/css">

	<!-- CSS -->
	<link rel="stylesheet" href="/css/normalize.css">
	<link rel="stylesheet" href="/css/skeleton.css">
	<link rel="stylesheet" href="/css/common.css">
	<link rel="stylesheet" href="/css/lists.css">
	<link rel="stylesheet" href="/css/tags/tag.css">

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
		  "@id": "http://capoeiralyrics.info/tags",
		  "name": "Tags"
		}
	},{
		"@type": "ListItem",
		"position": 2,
		"item": {
			"@id": "http://capoeiralyrics.info/tags/{{slug}}.html",
			"name": "{{name}}"
		}
	}]
	}
	</script>

	<h1 class="title">#{{name}}</h1>
	<h1 class="subtitle">Songs by tag</h1>
	<div>
		<ul>
			{{#songs}}
				<li class="song">
					<a href='/songs/{{slug}}.html'>{{name}}</a>
					<div class="tags">
					{{#tags}}
						<a class="tag" href='/tags/{{slug}}.html'>#{{name}}</a>
					{{/tags}}
					</div>
				</li>
			{{/songs}}
		</ul>
	</div>
</body>
</html>