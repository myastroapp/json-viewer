# JSON Viewer extension marketing operating plan

## Positioning

The extension is not marketed as a generic formatter. Its promise is specific:

> Open large JSON responses without freezing, keep the data on-device, and grant access only when you click.

The three proof points are the 100,000-element performance test, no network/analytics code, and the narrow `activeTab` permission model.

## Automated funnel

1. `chrome-store-launch.yml` checks the public Chrome Web Store listing every six hours.
2. While review is pending, `cws-status.json` keeps install prompts hidden so visitors never hit a dead store link.
3. On the first public listing response, the workflow marks the item live and updates the README.
4. Every site page loads `cws-cta.js`; once status is live, it shows a dismissible install prompt pointing to the real listing.
5. `marketing-health.yml` checks the viewer, extension landing page, privacy page, and status feed every Monday. Failed checks surface as failed GitHub Actions runs.

## One-time launch sequence after approval

Use one post per community and answer replies. Do not cross-post the same copy everywhere on the same day.

1. Day 0: confirm the store page, install from the public listing, and exercise toolbar-click, paste, search, and large-file flows.
2. Day 1, US morning: Show HN — `Show HN: A private JSON viewer that stays fast on large files`.
3. Day 3 or the next eligible thread: r/webdev Showoff Saturday, using the shorter copy below.
4. Day 7: publish a GitHub release and add the extension link to the repository description/homepage if it is not already visible.
5. After real users exist: reply to reviews and fix uninstall-causing friction before adding more features. Do not manufacture ratings or ask friends for fake reviews.

### Show HN copy

I built this after large API responses and log exports kept freezing the browser tools I tried. It renders the JSON tree lazily in 200-item chunks, so a 100,000-element document mounts only the nodes you can see. Search still walks the full data and opens the path to each match.

The extension reads the active tab only after you click its toolbar icon. There are no host permissions, background page scraping, analytics, accounts, or uploads. You can also paste or open a local file in the standalone viewer.

Chrome Web Store: `<store URL>`

The web version remains available here: https://myastroapp.github.io/json-viewer/

I would especially value feedback from people who regularly inspect multi-megabyte API responses.

### r/webdev Showoff copy

I made a permission-light Chrome JSON viewer for large API responses and log exports. It renders the tree lazily in chunks, searches collapsed data, and processes everything locally. It only reads the current tab after you click the toolbar icon—no broad host access, analytics, or uploads. Free: `<store URL>`

## Weekly review

Record only verified figures from the Chrome Web Store dashboard:

- listing impressions;
- installs and uninstalls;
- weekly users;
- ratings and review themes;
- landing-page availability and broken links;
- changes shipped in response to actual feedback.

Use install-to-uninstall behavior as the primary quality signal. Delay monetization inside the extension until retention exists and the publisher's trader declaration is corrected for paid functionality.
