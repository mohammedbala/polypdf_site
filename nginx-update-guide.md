# Nginx configuration update guide

The authoritative site configuration is [`nginx.conf.example`](./nginx.conf.example). Production
serves the complete release selected by this symlink:

```text
/var/www/polypdf-site/current
```

Do not point Nginx at the Git checkout root or `/var/www/polypdf-site/build`. The deployment
workflow builds a temporary commit-addressed release, validates it, and atomically moves `current`
only after the candidate is complete.

## Apply an update

1. Back up the active server block.
2. Compare its hostnames, certificate paths, API proxy, download aliases, CSP, cache rules, and
   document root with `nginx.conf.example`. Preserve deployment-specific additions deliberately.
3. Keep the document root on `/var/www/polypdf-site/current`.
4. Keep `/og-image.png` and `/guides/` revalidatable. Their physical filenames are stable; public
   metadata also carries a version query so a new screenshot release gets a fresh cache key.
5. Keep long-lived immutable caching for content-hashed CRA assets and immutable release downloads,
   not for the bare social/guide-image paths.
6. Validate and reload only after the syntax check succeeds:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Then verify the canonical host and the selected release:

```bash
readlink /var/www/polypdf-site/current
curl -fsSI https://www.polypdf.com/
curl -fsSI https://www.polypdf.com/og-image.png
curl -fsSI https://www.polypdf.com/guides/calibrate-pdf-drawing-scale.png
```

The complete deployment and rollback procedure is documented in
[`DEPLOYMENT.md`](./DEPLOYMENT.md). Do not copy an older standalone Nginx example from commit
history; it may restore obsolete domains, non-atomic roots, or year-long caching for stable image
URLs.
