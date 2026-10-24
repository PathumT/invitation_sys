# Local validation

Verified on Windows with Node.js 24, Java 21, Chromium, and Firebase's actual Authentication, Firestore, and Storage emulators using `demo-inviteflow`. No production Firebase project or data was used.

| Check                                                  | Result                            |
| ------------------------------------------------------ | --------------------------------- |
| TypeScript and Vite production build                   | Passed                            |
| ESLint                                                 | Passed                            |
| Unit tests including authentication and editor history | 14 passed                         |
| Firestore and Storage Rules emulator tests             | 14 passed                         |
| Browser workflows against the emulators                | 4 passed                          |
| Production dependency audit                            | No known vulnerabilities reported |

Browser workflows cover registration, protection of private routes, login/logout, auth persistence after reload, creation and publication, text editing, undo/redo, PNG export, saved-design reload, personalized links, guest mobile rendering, real-time RSVP changes, live counts, link revocation with response preservation, a separate private workspace, custom artwork uploads, guest CRUD, profile/workspace settings, and event deletion. Desktop and mobile screenshots are in ignored `test-results/`.

The security suite separately proves cross-tenant denials, public list denials, ownership immutability, public field restrictions, invalid response/count/timestamp rejection, revocation/archive behavior, and Storage owner/type/size restrictions. New RSVP writes require a nonblank name of up to 160 characters and Accept or Decline; the browser workflow checks name validation, persistence after reload, host visibility, and both response choices. Attendee count is no longer a public input.

The invitation redesign additionally checks all nine template artworks load, Maps and RSVP controls are descendants of a single invitation card, the old two-column guest layout is absent, the mobile page has no horizontal overflow, and the desktop card stays centered at a readable width. Screenshots include `template-gallery.png`, `guest-desktop.png`, and `guest-mobile.png`.

The compact card replaces the repeated full-height poster with a concise themed header, date/time grid, venue, Maps link, and adjacent RSVP buttons. Browser checks cover widths 320, 390, 768, 1280, and 1440 pixels, button heights of at least 44 pixels, and representative card heights below 950 pixels on desktop and 1000 pixels on mobile. Longer messages and expanded optional artwork/notes can naturally exceed those example heights without clipping.

Open-link coverage verifies two unauthenticated browser visitors can use the same public URL, enter different names, submit opposite responses, reload their saved response, and appear as separate records in the owner's guest list. A published full preview redirects to the reusable public link. Rules tests cover open-link response IDs, owner-only response listing, cross-tenant denial, and revocation.

The sharing panel is visible before publication with disabled actions. Publishing opens the panel automatically. Browser coverage verifies the generated read-only URL, clipboard copying, Open invitation and WhatsApp destinations, and native sharing through a simulated browser share API. All four browser workflows passed after this change; lint, production build, and 14 unit tests also passed.

Grand Opening and custom artwork now appear in full at the beginning of the invitation. Notes and contact precede the RSVP section, which is the final content section. The Grand Opening emulator browser workflow passed with explicit artwork visibility and section-order checks, mobile overflow validation, and a saved public RSVP. Lint and production build passed.

Google authentication: lint and production build passed, along with 18 unit tests. New tests verify Google workspace provisioning, preservation of an existing workspace, popup failure, and denied Firestore access. A mobile browser workflow passed against the real Auth and Firestore emulators: both auth pages offer Google, the popup signs in a new Google user, a private workspace is created, reload preserves the session, and logout works through the mobile menu. The emulator widget's optional CDN fonts/styles are blocked in this test to avoid external network delays. Live Google OAuth consent and project/domain configuration still require checking with a real Google account.

Grand Opening template coverage checks category selection, values entered in the existing event form, PNG export, persisted business/host/venue details, mobile overflow, and a real public-link RSVP. The existing three browser workflows passed in the full run; the Grand Opening workflow passed after correcting its test locator to select the Occasion combobox by role. Screenshots and exported poster are in `test-results/grand-opening-*.png`.

The build reports a large Firebase SDK chunk; editor and chart code are split by route. Development-only Firebase CLI dependencies still have moderate npm audit advisories; the runtime dependency audit is clean. Real Firebase credentials, email verification/reset delivery, App Check enforcement, physical-device WhatsApp handoff, production Storage/CORS, and Firebase Hosting deployment must be validated in the user's project. Page-open tracking is deliberately omitted; forwarded links do not verify recipient identity. See README.md for the complete security model and setup instructions.


Evently Invitations rebrand and authentication redesign: all visible product branding, page title, favicon, package name, export filename, and app-name configuration use Evently Invitations. Existing Firebase project IDs and RSVP session keys remain compatible. A new locally stored botanical photograph, native SVG wordmark and responsive CSS match the supplied design direction. Build, ESLint, and 26 unit tests passed. Browser inspection in installed Chrome checked 320, 390, 768, 1024, 1440 and 1783px widths with no horizontal overflow, password visibility toggling, and registration navigation. Desktop/mobile screenshots are in ignored test-results/evently-*.png. Image source prompt and generation provenance are in public/images/ASSETS.md.


Signup redesign and full responsive review (25 October 2026): production build and ESLint passed, 29 unit tests passed, 14 security tests passed, all 6 responsive browser workflows passed across Chromium/Firefox/WebKit, and all 5 original Chromium workflows passed. After the final accessible password-label refinement, all 3 registration browser checks passed again. Viewports cover 320 through 1920 pixels plus landscape. See RESPONSIVE_REVIEW.md for exact coverage, retained screenshots, reproduction commands, and physical-device/live-OAuth limitations.


Premium dashboard (25 October 2026): ESLint and production build passed, 34 unit tests passed, and 14 Firestore/Storage security tests passed. A six-case dashboard/original-workflow run and a seven-case dashboard/responsive run passed; together they cover 12 distinct configured browser cases across Chromium, Firefox and WebKit. The updated sidebar/header, owner-scoped shared data, actual statistics/search/activity, share selection, profile actions, keyboard search/Escape, template flows and confirmed deletion were verified. See PREMIUM_DASHBOARD.md for retained previews and the pre-existing Zod advisory reported by the current runtime audit.


Settings module-load recovery (25 October 2026): the running development server returned HTTP 200 for Settings and its Button dependency, and a fresh browser imported Settings successfully without failed requests. The reported screen is consistent with a stale/interrupted lazy-module request, rather than a currently reproducible Settings compilation failure. UI dependencies are now explicitly pre-bundled. All lazy routes share bounded per-route recovery for recognized module-download errors: one online reload, success clears the marker, persistent/application errors retain the manual error boundary, and blocked session storage never causes a reload loop. Fault-injection browser checks passed for transient recovery, persistent failure, manual recovery, and successful Settings import. Lint, production build, and 39 unit tests passed. No authentication or Settings save logic was changed.


Supplied-logo integration (25 October 2026): replaced the old botanical wordmark with the user's envelope/heart Evently logo via a transparent imagegen derivative at public/brand/evently-logo-v1.png. Shared Brand is used on auth pages, sidebar, setup screen and invitation footer; the envelope/heart favicon and browser theme color were updated. Central green/ivory/gold tokens style application chrome while preserving invitation palettes and semantic error/status colors. The dashboard workflow passed with six viewport screenshots; separate login/registration checks passed at 320, 390, 768, 1024, 1440 and 1783px with no horizontal overflow. Full source prompt, color tokens and provenance are in public/brand/ASSETS.md.
