# JSON Viewer telemetry contract

## Purpose

Measure whether honest distribution produces retained installs and paid demand without collecting
the JSON people view, search terms, browsing history, or other in-product behavior.

## Data sources

| Question | Source | Collection |
|---|---|---|
| Did people see the store listing? | Chrome Web Store GA4 property | Managed by Google after publisher opt-in |
| Which labeled direct campaign led to a listing visit or install? | Chrome Web Store GA4 property | `utm_source`, `utm_medium`, and `utm_campaign` on the listing URL |
| How many installs and uninstalls occurred? | Chrome Web Store Developer Dashboard | Automatic; export the Installs & Uninstalls report as CSV |
| How large is the installed base? | Chrome Web Store Developer Dashboard | Automatic Weekly Users report; this counts installations, not verified active use |
| Did anyone buy web Pro? | Stripe | Completed external-customer payments only |
| Is the owned funnel online? | GitHub Actions `marketing-health.yml` | Weekly availability check; not a user metric |

The Chrome Web Store managed stream is `G-C2T7BX56LE`. Do not install this tag in the extension or
on `json-viewer.smolkapps.com`; doing so would mix unrelated surfaces and contradict the product's
no-analytics promise.

## GA4 configuration

1. Keep the Chrome Web Store Developer Dashboard opt-in enabled.
2. In GA4, mark the automatically generated `install` event as a key event after it first appears.
   Do not create a replacement custom event and do not install a Google tag manually.
3. Expect reporting and campaign attribution to take 24–48 hours to finalize. The managed property
   retains data for two months and may withhold low-volume breakdowns.
4. Treat the generic Data Streams warning as non-authoritative for this managed property. Verify the
   integration by observing a listing `page_view` sent to the measurement ID, then wait for reports.

## Campaign naming

Use lowercase snake_case and fixed, non-personal values. A direct listing link should look like:

```text
https://chromewebstore.google.com/detail/iflllkjiplfnggmmjikcgmjmbgchcgob?utm_source=hacker_news&utm_medium=community&utm_campaign=show_hn_launch
```

Reserved sources are `json_viewer_web`, `hacker_news`, `reddit_webdev`, `github`, `smolkapps`, and
`smolkin_addons`. Never forward arbitrary query parameters or user-entered values into campaign
fields.

## Weekly scorecard

Use one fixed seven-day window and record:

- listing page views and install key events from GA4;
- installs, uninstalls, and installed users from the Chrome Web Store dashboard CSV;
- external-customer completed payments from Stripe;
- ratings count and review themes.

Calculate `net installs = installs - uninstalls`. The same-window ratio `uninstalls / installs` is a
directional acquisition-quality indicator, not a cohort uninstall rate, because some uninstalls may
come from earlier installs. Do not label installed users as active users.

## Verification record

On 2026-09-07, a headless-browser visit to the public listing with
`utm_source=telemetry_smoke`, `utm_medium=verification`, and `utm_campaign=initial_setup` returned
HTTP 200 and emitted a `page_view` request to `G-C2T7BX56LE`. No installation was performed. The
GA4 interface may continue to show "No data received" until processing catches up.
