# Capoeira Lyrics


[Capoeira Lyrics](http://capoeiralyrics.info) is an open source project. It's non-commercial and targeted on sharing capoeira songs lyrics as a part of world cultural heritage.

If you're interested in contributing, contact:
- [Add content](mailto:reg.yeti@gmail.com)
- [Localize content](mailto:reg.yeti@gmail.com)
- [Fix mistakes](mailto:reg.yeti@gmail.com)
- [...or anything else](mailto:reg.yeti@gmail.com)

Concept
===
Project is a static website generated from sources that live in JSON files from `data` folder. `data/songs` folder contains JSON sources, each of them in format:
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

- `npm run build` - build the website from local `data/` files into `public/`
- `npm run preview` - open that build at http://localhost:8080 with caching off, so a refresh shows the latest `public/` files
- `npm run deploy -- --preview` - publish `s3-export/` to https://capoeiracoders.github.io
- `npm run deploy` - publish `s3-export/` for https://capoeiralyrics.info

`data/` stays on this machine. GitHub Free only serves Pages from a public repository, so deploy copies the S3 export in `s3-export/` to `CapoeiraCoders/CapoeiraCoders.github.io`.



