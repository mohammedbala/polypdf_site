# /plugins

Static files served verbatim from the site root. `public/` is copied into the build unchanged, so
`public/plugins/polypdf-plugin-pack.mjs` is published at
`https://www.polypdf.com/plugins/polypdf-plugin-pack.mjs`.

## polypdf-plugin-pack.mjs

**This file is a copy. The app repository owns it.**

- Source of truth: `polypdf/docs/plugins/tools/polypdf-plugin-pack.mjs` in the `polypdfmac` repo.
- Copied verbatim on 2026-08-10 at sha256
  `bfcea649a48514cd3addb044e4a39abda740714860bf51add93552cdb6703126`.

It lives here because that URL is a published promise: `polypdf/docs/plugins/PLUGIN-AUTHORING.md`
tells plugin authors to run `curl -O https://www.polypdf.com/plugins/polypdf-plugin-pack.mjs`, and
`/build-a-plugin` prints the same line. Until this file existed the request fell through to the
SPA's `try_files … /index.html` fallback, so `curl -O` silently wrote a file of HTML and the
author's next command failed for reasons the error message did not explain.

### Keeping the copy honest

When the packer changes in the app repo, re-copy it and update the checksum above:

```bash
cp ~/Projects/polypdfmac/polypdf/docs/plugins/tools/polypdf-plugin-pack.mjs \
   public/plugins/polypdf-plugin-pack.mjs
shasum -a 256 public/plugins/polypdf-plugin-pack.mjs
```

Do not edit the copy. An author who diffs the served file against the one shipped in the app
should find them identical — that is the point of publishing a checksum at all.

### Serving

`.mjs` is not in nginx's default `mime.types`, so without help it is served as
`application/octet-stream`. That is harmless for `curl -O`, but `nginx.conf.example` adds a
`location = /plugins/polypdf-plugin-pack.mjs` block that sets `text/javascript` — see the note
there before applying config to production.
