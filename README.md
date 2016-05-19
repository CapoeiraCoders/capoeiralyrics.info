#Capoeira Lyrics website

Concept
===
Project is a static website generated from sources that lives in JSON files from `data` folder. `data/songs` folder contains JSON sources, each of them in format:
```
{
    "ID": 554,
    "Name": "A Amizade",
    "Text": "Uma boa amizade\r\nSe deve preservar\r\n__Uma boa amizade se deve cultivar__\r\nUma amizade sincera e difícil encontrar\r\n__Uma boa amizade se deve cultivar__\r\nOlhá um um bom amigo e difícil encontrar\r\n__Uma boa amizade se deve cultivar__",
    "EngText": "A good friendship\r\nMust be preserved\r\nAnd not let go\r\nLike many people do\r\nA good friend\r\nIs hard to find\r\n",
    "RusText": "Хорошую дружбу\r\nНужно оберегать\r\nИ не бросаться ею\r\nКак делают многе люди\r\nХорошего друга\r\nСложно найти\r\nКогда находишь редкую вещь\r\nКоторая не имеет двух лиц\r\n",
    "Artist": "Mestre Barrão (Axé Capoeira)",
    "Artist_ID": 1,
    "VideoUrl": "http://www.youtube.com/v/ZFgYFq2aMpU",
    "AudioUrl": "http://soundcloud.com/rafaelmukhetdinov/a-amizade"
}
```

`Text`, `EngText`, `RusText` fields contains Markdown text (to support coro answers).

During build process this JSONs will be used as a view to mustache templates, that lives in `templates` folder.


Build
===

- `npm run build` - to build website from `data` folder sources
- `npm run deploy` - to deploy website


Colophon
===
Build with love.
Style is based on http://getskeleton.com/.


