# Capoeira Lyrics

[Capoeira Lyrics](http://capoeiralyrics.info) is a non-commercial collection of capoeira song lyrics, kept for study of the tradition.

The generator, templates, CSS, and JavaScript are licensed under the MIT terms in [LICENSE](LICENSE). Song lyrics, translations, recordings, and artwork stay with their authors. See the [rights page](http://capoeiralyrics.info/rights/) to claim authorship, ask for a correction, or request removal.

If you're interested in contributing, [open a GitHub issue](https://github.com/CapoeiraCoders/capoeiralyrics.info/issues/new/choose). Rights requests go through the [rights page](http://capoeiralyrics.info/rights/).

Concept
===
Project is a static website generated from sources that live in JSON files from `data` folder. `data/songs` folder contains JSON sources, each of them in format:
```
{
    "ID": 554,
    "Name": "A Amizade",
    "Text": "Uma boa amizade",
    "Artist": "Mestre Barrão (Axé Capoeira)",
    "hidden": true
}
```

`Text`, `EngText`, `RusText` fields contain Markdown text (to support coro answers). Set `hidden` to `true` to leave a song out of the next build. Set it to `false` to publish a song that was hidden.

During build process this JSONs will be used as a view to mustache templates, that lives in `templates` folder.


Build
===

- `npm run build` - build the website from local `data/` files into `public/`. Songs with `hidden: true` are skipped.
- `npm run build -- --include-hidden` - same build, including songs marked hidden.
- `npm run preview` - open that build at http://localhost:8080 with caching off, so a refresh shows the latest `public/` files
- `node scripts/mark-hidden-songs.js` - set `hidden` on local song JSON (named artists and commercial albums). Pass `--reset` to overwrite flags set by hand.
- `node scripts/build-artist-profiles.js` - refresh artist descriptions and public profile links in `data/artists.json`. The next build shows them on each artist page.
- Tag pages read short “what is this” copy from `data/tag-profiles.json`.

Commit `public/` and push `master`. GitHub Actions publishes that folder. `data/` stays on this machine.
