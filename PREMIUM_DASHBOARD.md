# Evently Invitations: premium workspace dashboard

Implemented and verified 25 October 2026 in the existing React/Firebase application. No production deployment, production data changes, Firestore migrations, or security-rule changes were performed.

## What changed

- Forest green, warm ivory, sage, gold and white visual system; serif headings, sans-serif interface text, rounded panels and compact invitation-card hero artwork built from native HTML/CSS and Lucide icons.
- Responsive fixed desktop sidebar and tablet/mobile drawer, current workspace, profile menu, working quick-create shortcuts, workspace search and real RSVP notifications. Profile settings/sign-out and existing navigation routes are preserved.
- Five actual-data statistics: invitations, guests, accepted, declined, pending. Response rates and event progress use actual records, including the existing legacy Maybe status in the response denominator and legend.
- Recent invitations with thumbnail, date, guest count, status and response progress. Actions use existing edit, owner/public preview, share and guest-management routes/services. Delete requires confirmation and calls the established revocation/deletion service.
- Six working quick actions, an invitation picker for sharing, and template preview/use flows covering Wedding, Birthday, Baby Shower, Engagement, Housewarming and Party Celebrations.
- Recent activity and header notifications use only stored RSVP records, newest first. The notification dot means responses are available; it is not a fabricated unread counter. No subscriptions, payment plans, fake trends, sample totals or popularity metrics were introduced.
- Template inspiration reuses actual existing designs. Housewarming uses the general invitation design; Party Celebrations uses the birthday celebration design when no category-specific custom record exists. The optional `occasion` creation query sets the existing eventType field; old template URLs work unchanged.
- Framer Motion adds small page/banner transitions, respecting reduced-motion preferences. Modal labels and Escape behavior support keyboard use, including search inputs.

## Firebase integration

A WorkspaceProvider shares the existing owner-scoped invitation/guest/response listeners between the header and pages. It clears state on account changes, unsubscribes on cleanup and exposes retry for failures. Initial statistics remain skeletons until the relevant guest/response listeners load, instead of showing temporary false zeros. Shared helpers derive summary counts, search results, and response activity without new Firestore structures or indexes.

The existing detailed Analytics screen remains available and retains its charts, metrics and upcoming events. Public invitation links, authentication, editing, uploads, guest management, validation and RSVP services were preserved.

## Verification

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript/Vite production build | Passed |
| Unit tests | 34 passed |
| Existing Firestore/Storage security tests | 14 passed |
| New dashboard workflow + original Chromium workflows | 6 passed |
| Dashboard + responsive workflows in Chromium, Firefox and WebKit | 7 passed |

The two browser runs overlap the dashboard case: together they cover 12 distinct configured browser cases (five original Chromium workflows, one new dashboard case, and six responsive cases).

The new workflow checks empty statistics and notifications, empty share state, template preview/use with occasion selection, publication, actual guest records, invitation/guest search, share picker and reusable URL, a public accepted RSVP updating dashboard totals/progress/activity/notifications, profile-settings navigation, the slash search shortcut, Escape closing, cancellation and confirmation of deletion, public link revocation, profile sign-out and reduced-motion rendering.

Responsive checks cover 320x800, 390x844, 768x1024, 1024x768, 1440x900, 1920x1080 and 844x390 landscape. Screens include login/registration, empty and populated workspace views, templates, guests, settings, analytics, all invitation wizard steps, editor text/size controls and PNG export, dialogs, navigation and public Accept/Decline flows. Checks assert no unintended page-wide horizontal overflow. Template galleries, tables and compact wizard tabs can scroll internally.

## Review artifacts and commands

Representative new-dashboard screenshots:

- `test-results/premium-responsive/dashboard.e2e.ts-premium-d-46e3f-vity-and-confirmed-deletion-chromium/premium-dashboard-1440.png`
- `test-results/premium-responsive/dashboard.e2e.ts-premium-d-46e3f-vity-and-confirmed-deletion-chromium/premium-dashboard-390.png`

Full-system browser screenshots are under `test-results/premium-responsive/`. The test output and portable test tools are ignored by Git. Logs: `.tools/dashboard-regression.log`, `.tools/premium-responsive.log`, `.tools/dashboard-security.log`.

Install Java 21+ and Playwright browsers, then run `npm run test:dashboard` for the dashboard or `npm run test:responsive` for the three-engine matrix. `npm run test:e2e` includes all configured workflows. Use an unused INVITEFLOW_TEST_PORT if another development server is running.

## Rollout and limits

Push the updated project and redeploy on Vercel. Existing environment variables, Firebase project IDs, collections, rules, route paths and published invitation URLs remain compatible. Physical mobile Safari/Android, live Google consent, actual WhatsApp handoff and production App Check/domain configuration still require production/device checks; WebKit tests are engine-based compatibility checks.

The build retains the existing large Firebase SDK chunk warning. A runtime dependency audit reports one existing high-severity Zod advisory (GHSA-mrhx-c7xc-m3w5); Zod remains at 3.25.76, identical to the version before this work. The suggested fix is a major upgrade to Zod 4 and is not bundled into this UI redesign. Framer Motion 14.6.0 is the sole added direct dependency, explicitly requested in the brief. Dependency audit details are retained in `.tools/dashboard-audit.json`.
