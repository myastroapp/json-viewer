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

### Show HN author checklist

Hacker News prohibits generated or AI-edited text. The owner must write the final title, submission,
and comments personally. Use these verified facts as notes, not as copy to paste:

- Start the title with `Show HN:` and link to the directly usable viewer, not a signup or marketing page.
- The tree renders lazily in 200-item chunks.
- Search walks parsed data, including collapsed and not-yet-rendered nodes, expands matching paths,
  highlights matches, and scrolls to the first result.
- The extension uses `activeTab` only after a toolbar click and has no broad host permissions,
  analytics, accounts, or uploads.
- Explain the personal reason for building it and ask for feedback from people who inspect large API
  responses or log exports.
- Stay available to answer questions. Never solicit votes, comments, or coordinated submissions.

### Other community posts

Write each post for the specific community and disclose that the poster built the extension. Do not
cross-post identical text or manufacture engagement. Link to the free Chrome Web Store listing and,
when a no-install demo is useful, https://json-viewer.smolkapps.com/app.html.

## Weekly review

Record only verified figures from the Chrome Web Store dashboard:

- listing impressions;
- installs and uninstalls;
- weekly users;
- ratings and review themes;
- landing-page availability and broken links;
- changes shipped in response to actual feedback.

Use install-to-uninstall behavior as the primary quality signal. Delay monetization inside the extension until retention exists and the publisher's trader declaration is corrected for paid functionality.
