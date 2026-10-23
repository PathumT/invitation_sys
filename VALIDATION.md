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
