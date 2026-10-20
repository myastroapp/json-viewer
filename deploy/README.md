# Branded host deployment

The canonical site is `https://json-viewer.smolkapps.com/`. Static files are served from
`/var/www/apps/json-viewer` on the apps Hetzner host. The exact nginx vhost in this directory must
remain enabled because the shared `*.smolkapps.com` proxy injects an `apps.smolkin.org` canonical.
The same vhost redirects `json-viewer.apps.smolkin.org` path-for-path to the branded host so the
platform alias cannot become a second indexable copy.

Deploy from the repository root by syncing public site files to a timestamped staging directory,
normalizing ownership and modes, and atomically replacing the live directory. Exclude `.git`,
`.github`, `deploy`, `marketing`, `scripts`, and `README.md`. Before changing nginx, make a
timestamped backup, run `nginx -t`, and reload rather than restart. Verify the rendered canonical,
the Chrome Web Store status feed, and the paid-flow browser test after every deployment.

GitHub Pages remains a working legacy mirror. Its pages link and declare canonicals on the branded
host so old bookmarks keep working without competing as the preferred search result.

Keep the HTML's page-specific canonical and Open Graph URLs intact. Do not inject the homepage URL
into every response: tools and guides have distinct content. `scripts/marketing-health.mjs` checks
the homepage, extension landing page and privacy canonical URLs. Missing paths use `404.html` with
an HTTP 404 response and a working link back to the viewer.
