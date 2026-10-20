# JSON Viewer improvement worklog

Goal: improve the existing extension and make the product easier to discover and recommend.

## 2026-10-16

- Verified the managed store stream G-C2T7BX56LE receives listing page views. The product retains its no-tracking behavior.
- Added a landing-page share control with a fixed, public store URL and referral labels. Native-share cancellation stays canceled; clipboard failures expose a copyable link.
- Replaced the homepage image with an authentic populated extension-viewer capture. Provenance is in deploy/extension-capture.json.
- Fixed dark-theme button/link contrast and hid canceled sharing feedback correctly.
- Removed the live server's fixed-homepage canonical override, restoring page-specific source tags; added the privacy-page canonical. All 38 checked public pages now match their intended canonical URLs.
- Enabled the existing custom 404 with HTTP 404 and repaired its viewer/icon links.
- Strengthened the existing marketing health check to catch canonical regressions.

## Verification

- Sharing regression checks: 7 passed, 0 failed.
- Local link/image-alt check: 69 targets across 40 HTML pages, 0 errors.
- Live marketing health: 4 passed; live canonical check: 38 passed.
- Desktop 1365x900 and narrow 390x844 layouts inspected; no horizontal overflow. Clipboard fallback exercised in a real browser with native sharing disabled only in the test page. Native share success/cancellation/failure covered by fixture tests; an actual mobile share sheet was not verified.
- Live nested missing URL returns the custom 404 and a working recovery link.

## Current state and next steps

On October 20, the owner approved the reviewed 0.1.1 extension and source synchronization. The existing Chrome item was submitted successfully and is Pending review, with automatic publication enabled. Public 0.1.1 has not yet been verified: retain the numeric limitation notice and web-first sharing until it is. Website improvements are already live. The cumulative source update is verified on the source-sync branch using the existing owner browser session; inspect GitHub main history for merge status. No new PAT, API or SSH credentials were created. Do not repeat the existing launch submission or add in-product tracking.

## 2026-10-16 — protect the path while the store update awaits verification

- Store version 0.1.0 still has the reproduced numeric-copying defect. Added a clear precision limitation before installation and made the corrected web viewer the primary action.
- Sharing now links only to the public web viewer, using shared_link/referral/viewer_sharing labels. Site-wide extension prompts lead through the details page and its limitation note before installation. No document data is shared.
- Updated sharing regressions: 7 pass. Both desktop 1365x900 and narrow 390x844 Camoufox journeys verified the notice, real browser-clipboard content, banner-to-details routing, and no horizontal overflow or failed requests. The live web viewer rejected the large numeric-ID fixture before rendering.
- The first browser harness compared Firefox's clipboard with the operating-system clipboard; corrected it to inspect the browser clipboard. The first live app replay also clicked before module startup; corrected the fixture to await page loading. These were test-harness issues; production app code was unchanged.
- Native share-sheet integration and physical mobile testing remain unverified. The corrected web viewer's default clipboard path was exercised without mocking navigator.share or clipboard methods.
- After 0.1.1 is actually published and verified, reassess the version-specific notice and sharing destination. Until then, retain the disclosure and web-first path. Publisher authentication and owner repository access were restored on October 20.

## 2026-10-20 — prepare cumulative source publication

- Started a clean publication branch at remote main 8365330. Applied the final tracked-tree changes through eb39c88, preserving the six earlier unpublished repairs and the two website improvement commits' resulting behavior.
- Prepared one cumulative publication commit so removed local marketing and papercut notes are not newly exposed through intermediate commit history. Original branches and worktrees remain preserved; this does not rewrite existing public history.
- All tracked files other than this worklog match eb39c88 exactly. Existing verification therefore still applies to identical production bytes; unchanged browser tests were not rerun.
- No push or authentication change was made. Once write access is restored, synchronize without force-pushing and verify the legacy GitHub Pages mirror, which publishes from main. Separately verify public extension 0.1.1 after Google completes review before changing the numeric notice or sharing destination.

## 2026-10-20 — verify cumulative source synchronization

- Used the existing owner browser session to stage all 18 file additions/updates and the two planned tracked-document removals on codex/json-viewer-source-sync-20261020.
- Fetched branch commit 157e0b7 and verified its complete tracked tree, including file modes and the image, equals prepared commit ac27019 (tree c6fa2dafc7198ab8db2ce1143a6886d691393901). All production bytes match the already tested website improvements; this final update only refreshes the worklog.
- Original local refs and unpublished intermediate notes remain preserved. The source update introduces their final code changes without newly publishing the removed intermediate notes. Public main is updated through a reviewed squash merge; check the repository history for its final merge status.
- The separate Chrome update remains Pending review with automatic publication enabled. Verify actual public 0.1.1 before changing its limitation notice or sharing destination.
