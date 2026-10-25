# Evently Invitations 2.0 architecture audit and execution plan

## Existing architecture
React 19/Vite/TypeScript/Tailwind, Zustand/Konva editor, Firebase browser SDK, owner-authenticated tenants/{uid}, private invitations/guests/templates, capability-based publicInvitations/{48-hex-token} snapshots and constrained public RSVP response writes. Existing Evently green/gold logo and tokens supersede the brief's optional indigo suggestion. Google/email authentication, owner-scoped live workspace provider, nine native starter designs, image uploads, CSV guest import/export, WhatsApp handoff, shared links, responsive dashboards and emulator/Playwright tests already work. Production is Vercel; Firebase Hosting config is also present.

## Constraints and risks
No trusted backend or payment/sending/AI service is configured. Authenticated owner check-in is feasible; anonymous check-in is forbidden. Global aggregate capacity, role invitation acceptance, authoritative paid entitlements, automated sending and private paid API credentials must not be simulated in React. Public page activity is not provider delivery/read confirmation. Five locales will be prepared; only reviewed English is active, as requested by the user. Optional additive fields and owner-only subcollections preserve existing IDs, designs, accounts and URLs.

Current security rules restrict public response keys and attendee count. Any new public form fields need matching rules and emulator tests before activation. Existing Storage permits owner image uploads only; audio/video or anonymous uploads cannot be silently enabled. Existing full-workspace listener/search architecture remains a scaling constraint: pagination cannot pretend to preserve global statistics without authoritative aggregates. The pre-existing Zod 3 advisory was resolved by the tested Zod 4 upgrade; the production dependency audit now reports zero vulnerabilities.

## Ordered execution
1. Extend optional design/template metadata; search/favorites/cloning/filtering; Konva selection/layers/snapping/zoom/export/version controls; static/animated playback, reduced motion, timezone countdown. Verify compatibility and phase-one tests before later features.
2. Add mini-site configuration and dynamic fields; private advanced guests, bounded custom RSVP validation/rules, QR exports and owner-only check-in; reviewed-locale activation architecture.
3. Manual message/reminder preferences, truthful analytics/export, host-managed gallery, safe team data/permission design and presets.
4. Dependency-gated pricing/AI/team activation, tenant branding, privacy/terms and operational/error-reporting foundations, safe additive migration/rollback tooling and launch verification.

No production writes, destructive migrations, secret browser credentials, invented delivery statistics or fake payment activation are authorized by this implementation. Track delivered/tested versus pending in SAAS_UPGRADE_STATUS.md.


## Additive check-in data model (v1)
Existing private guest records optionally acquire checkedInAt (server timestamp) and checkedInBy (owner UID). No collections, invitation IDs, guest IDs, public tokens or response documents are renamed or rewritten. Only the authenticated owning organizer may write this metadata. The client transaction reads the current active personal share and accepted response and prevents duplicate writes. Public snapshots never include check-in metadata. Reusable public invitation links deliberately cannot identify a guest for check-in.

Migration is lazy on the first explicit check-in; older records without these keys mean not checked in. Retrying check-in is idempotent. Rollback consists of reverting the new UI/service while retaining optional fields; no destructive backfill or production migration is needed. Any later data cleanup requires a separate reviewed migration plan.


Implementation and verification details are maintained in SAAS_UPGRADE_STATUS.md. Secure activation requirements and known scaling limits are in SERVER_DEPENDENCIES.md. Optional guest profiles/check-in metadata and reminder subcollections do not rename existing records or capability IDs. Bundled Noto font notices are documented in FONT_ASSETS.md.
