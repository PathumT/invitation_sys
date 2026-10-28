# Secure service dependencies and launch gates

The application remains React/Vite with Firebase Authentication, Firestore and Storage. No Express, NestJS, MongoDB, production deployment or production-data rewrite was introduced. Existing owner UID tenant paths and capability invitation links remain unchanged.

## Features deliberately inactive until trusted services exist

| Feature | Prepared client/data foundation | Required trusted activation |
| --- | --- | --- |
| Team accounts | Owner UI, Owner/Admin/Editor/Event Manager/Viewer permission definitions; reserved members and teamInvitations collections | A Firebase trusted service must issue expiring, one-use, hashed invitations, verify authenticated acceptance and tenant/email binding, assign membership, revoke access, and activate corresponding authorization rules. Browser role writes are denied. A prepared membership currently grants no access to another owner's invitations. |
| Paid plans | Free/Pro/Business/Enterprise definitions and plan UI; checkout disabled; reserved entitlements documents | Verified payment webhooks, idempotent event processing, authoritative usage/entitlements, cancellation/refund handling, invoices and reconciliation. Browser entitlement writes are denied. Existing feature access is grandfathered and is not restricted by unverified plan flags. No prices or paid success states are invented. |
| Aggregate event capacity | Per-response schema, fixed named-person RSVP count and private planned household counts | A trusted transaction must atomically reserve/release global capacity and account for retries, response changes and cancellations. Custom numeric answers are not capacity reservations. No client-only capacity guarantee is claimed. |
| Automated reminders and delivery tracking | Manual schedule preferences, personalized messages, WhatsApp handoff and preparation-only records | A scheduler, verified sending provider, consent/unsubscribe handling, retry/idempotency and signed provider webhooks. Saved planning dates do not trigger background sending. Opening WhatsApp is not proof of sending, delivery or reading. |
| Paid AI | Deterministic writing suggestions and reusable design presets work without AI | Trusted authenticated endpoint, authorization, billing/rate limits, abuse controls and provider credentials stored outside Vite/browser environment variables. No secret provider requests are made from React. |
| Custom domains and white-label activation | Scoped workspace branding and future Enterprise definition | Verified domain ownership, platform-side domain provisioning, TLS, routing and authorization. No browser DNS/API activation or fake connected domain exists. |
| Full account erasure and legal activation | Owner guest exports and privacy-preserving diagnostic export; technical privacy inventory below | Operator-reviewed privacy/terms, real support identity, authenticated deletion workflow with recent sign-in, recursive Firestore/Storage cleanup and any retention requirements. No incomplete deletion is represented as full account erasure. |
| Production monitoring | Bounded local browser diagnostics export with categories and allowlisted paths only | Operator monitoring/alert destinations, Firebase usage/budget monitoring and retention/access policy. Diagnostics are not remotely uploaded and do not contain original error messages, contact details, event IDs or invitation capabilities. |

## Localization gate

English is the sole active locale. Sinhala, Tamil, Spanish and French draft files have matching core navigation/authentication/RSVP keys. Full page-specific prose and validation extraction, native-speaker review, approved locale date/number formats remain required before multilingual production activation. Do not enable an unreviewed locale by changing a flag alone. See src/i18n/README.md.

## Scaling and performance limits

The canvas editor, scanner, QR generator and PDF libraries load on demand. Template thumbnails and gallery photos load lazily. Gallery/background/logo uploads can be optimized to WebP when that reduces size; original editor/template artwork is preserved. Vercel hashed assets receive immutable caching. Version queries are bounded to 30 records.

The inherited workspace listener still loads all owner invitations, private guests and relevant response streams so global counts, search and exports remain complete. This is a documented scaling limit, not server pagination. Replacing it safely requires a paginated repository plus authoritative aggregates and indexed search/reporting; removing records from the listener without that work would silently falsify current statistics. Large-workspace production readiness is not claimed. The Firebase build chunk still exceeds Vite's size warning threshold. Core Web Vitals have not been measured against a deployed production environment.

## Public capability and gallery privacy

Public links intentionally allow their holders to view the invitation and submit a named response. Personal links also identify the intended guest. Treat personal links/QR codes as bearer capabilities. Anonymous visitors cannot list public invitations or response collections, access private guest records, upload files, perform check-in, grant roles or activate billing.

Host-only first/last names, planning counts, category, tags, contact data, reminder preferences and private notes remain in owner paths. Public snapshots exclude private gallery photos and omit gallery/other optional section payloads when hidden. Disabling a site removes its site configuration from publication. Existing guest snapshots must be republished to receive changes. Already disclosed Firebase download-token URLs can remain usable directly; hiding a photo is not Storage-token revocation or physical deletion.

Authenticated organizer check-in reads a current accepted personal response and records a server timestamp, owner UID and attendee count transactionally. Repeated attempts report an existing check-in. Reusable public links cannot identify an arriving guest and are rejected for this operation. Manual lookup normally requires an accepted personal response. The current authenticated owner can explicitly override with a private reason and an arrival count within the guest allowance; the timestamp, owner UID and count are recorded. Multi-organizer access remains inactive until its audited role workflow exists.

## Licensed soundtrack catalog

Permitted owner audio upload, explicit playback, volume and removal are functional. No third-party stock track catalog or license entitlement is invented. A curated catalog requires supplied tracks and verified distribution/use permissions.

## Other verification limits

Camera permission/scanning and native OS file-sharing require physical-device checks; automated tests cover the fallback personal-link path, QR image/PDF downloads, check-in, duplicates and layouts. Authentication browser tests use Firebase emulators, including Google's emulator popup. No live production Google provider, production App Check, production sending, billing or custom domain has been exercised.

The production npm audit reports zero vulnerabilities after the Zod upgrade. Five moderate development-tool dependency findings remain; no force-upgrade was used. Review the dependency graph separately before exposing a development server beyond a trusted environment.

## Deployment sequence

Review and publish the updated Firestore and Storage rules before using new production data paths. Configure VITE_APP_URL to the real public origin and rebuild/redeploy the app through the operator's normal process. Confirm the production Google authorized domain/App Check configuration, existing and new public links, anonymous RSVP, owner-only uploads and check-in. This implementation has not deployed rules, deployed the app, changed .env, migrated production data, accepted payments or activated external services.


## Continued localization handoff

The interface now has 879 matching dictionary keys across five locale files, with extraction/review source context and reviewed-locale formatting. English remains active. Each other locale has 841 English placeholders plus 38 draft core translations; human translation and native-speaker review remain required. Supported static extraction is complete according to `i18n:check`; computed labels and linguistic/pluralization coverage still need manual audit. See [translation handoff](src/i18n/README.md). No production activation or deployment was performed.
