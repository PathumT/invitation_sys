# Evently Invitations SaaS upgrade status

Updated 2026-10-25. The runtime upgrade is implemented and verified in the existing application. Production launch and external service activation remain gated; this is not a claim that billing, teams, automated sending or multilingual production have been activated.

## Delivered

### Invitation studio
- Preserved Firebase accounts, owner tenant paths, original invitation/design IDs and existing public URLs.
- Nineteen reusable occasion designs, template search, palette/style filters, favorites, private cloning and meaningful custom-template recency sorting.
- Konva multiple selection, grouping, locking, duplication, layer controls, shortcuts, undo/redo, alignment/snapping, zoom, safe guides, crop/rotation, opacity, shadows and gradients.
- Existing autosave plus private saved design checkpoints and restore.
- PNG/JPEG/PDF, mobile/print raster sizes, and a public invitation QR page in PDFs exported after publishing.
- Optional envelope/reveal/fade/slide/confetti/particle/floral/elegant presentation, reduced motion, timezone countdown and explicitly played owner-uploaded permitted audio.
- Local Noto Sinhala/Tamil font faces with license notices, loaded before canvas rendering/export. Built-in writing suggestions are deterministic presets, not paid AI.

### Events and guests
- Optional ordered mini-sites with artwork, introduction, countdown, date/time, venue/map, schedule, dress code, photos, videos, registry, FAQ, contact, RSVP and closing sections; visibility controls and mobile/desktop previews.
- Owner-managed photo uploads/captions, private/public photo controls and grid/flowing layouts. Private or hidden gallery entries are excluded from new public snapshots. Videos load only after Play.
- Private first/last names, categories including custom categories, tags, adult/child planning counts, meals, dietary restrictions, notes and reminder opt-out.
- Advanced guest search/category filters, CSV import/export of optional private fields, duplicate-phone detection, bulk selection/tagging and personal-link preparation.
- Up to six schema-validated RSVP questions: short text, Yes/No, single/multiple choice, number and dietary selection. Required fields apply to acceptance; custom confirmation, deadline and response-change policy are enforced appropriately.
- Firestore-enforced deadline timestamps, answer keys/types/choices/bounds, response-change restrictions and disabled RSVP when the mini-site hides its RSVP section. Legacy four-field responses remain valid.
- Local personal/public QR image and PDF generation, native file-sharing fallback and protected organizer check-in with camera/manual link input, guest lookup, frozen arrival counts and duplicate warning.
- Owner-only manual arrival override with a private reason, server timestamp and allowed-count validation; multi-organizer access stays inactive.

### Workspace and operations
- Manual reminder planning/preferences, five personalized message presets, WhatsApp preparation and truthful preparation-only logs. No automatic sending or delivery/read claims.
- Real-data analytics with event/date/category filters, separate expected/checked-in counts, CSV export and printable view.
- Scoped private workspace logo/name/colors/footer, preserving Evently defaults and selected invitation artwork.
- Five locale resource files and English-only activation gate. Core dictionaries are prepared; full page-specific extraction and native-speaker review remain before non-English activation.
- Owner/Admin/Editor/Event Manager/Viewer permission model and readiness UI. Browser membership/invitation and paid-entitlement writes are denied.
- Future Free/Pro/Business/Enterprise plan UI, disabled checkout and existing-access preservation.
- Versioned offline migration dry run/new-file output/original backup/rollback, tested for ID/response preservation and emulator compatibility.
- Bounded browser diagnostic export with failure categories and sanitized paths only; no remote telemetry or message/contact/token capture.
- Lazy routes/editor/scanner/QR/PDF, lazy preview/gallery images, optional gallery/background/logo compression and immutable hashed-asset caching.

## Verification

- Lint passed.
- TypeScript and production build passed.
- 66 unit tests passed.
- 25 Firestore/Storage emulator tests passed.
- Production npm audit: zero vulnerabilities. Five moderate development-tool findings remain.
- Full 29-case browser matrix passed on a fresh Vite server across Chromium, Firefox and WebKit (15 Chromium, 7 Firefox, 7 WebKit). The final dynamic-binding changes passed four focused checks, and printable analytics passed all three browser checks. Responsive coverage includes 320, 390, 768, 1024, 1440 and 1920px plus phone landscape.
- Offline migration CLI dry run, output backup and byte-for-byte rollback smoke test passed.

Representative screenshots are saved under test-results, including mobile RSVP, mini-site, check-in and the per-browser 320/390/1440px layout captures. Verification uses demo Firebase emulators; no production database, deployment, rules publication or .env modification occurred.

## Remaining launch gates

Read SERVER_DEPENDENCIES.md for trusted capacity transactions, verified team acceptance/authorization, payment verification, automated delivery, confidential AI credentials, custom domain provisioning and complete account erasure. Licensed stock-track curation is not fabricated; permitted owner audio uploads work.

Full localized prose/validation extraction and review remain before activating Sinhala/Tamil/Spanish/French. The inherited complete-workspace listener still needs a paginated/aggregate/search architecture for large tenants. Physical camera/native sharing, deployed Core Web Vitals, live Google/App Check configuration, operator legal/support/retention decisions and production monitoring require operator validation. No large-scale or production-launch readiness is claimed.

After dependency changes, restart the development server. Review/publish updated Firebase rules alongside the application before using the new production data paths. Migration tools never perform a production import.


## Continued localization handoff

The interface now has 853 matching dictionary keys across five locale files, with extraction/review source context and reviewed-locale formatting. English remains active. Each other locale has 815 English placeholders plus 38 draft core translations; human translation and native-speaker review remain required. Supported static extraction is complete according to `i18n:check`; computed labels and linguistic/pluralization coverage still need manual audit. See [translation handoff](src/i18n/README.md). No production activation or deployment was performed.
