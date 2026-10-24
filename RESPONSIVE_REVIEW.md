# Evently Invitations: signup and responsive review

Verified 25 October 2026 against isolated Firebase Auth, Firestore, and Storage emulators. No production data or deployment was changed.

## Delivered

- Registration-specific botanical artwork, Evently branding, four benefits, gold accent, white form card, and uppercase field labels. Login retains its existing composition.
- Inline name, email, password length, and confirmation validation. Password and confirmation have independent accessible visibility buttons.
- Four-column benefits on wide desktops, two columns on tablets, compact introduction on phones, normal scrolling on short screens.
- Tablet editor controls stack below the proportional canvas. Mobile and coarse-pointer controls use 44px minimum targets and readable 16px form inputs.
- Mobile navigation excludes hidden links from keyboard/screen-reader navigation, focuses the close control on opening, supports Escape, and restores focus on closing.
- Guest tables remain horizontally scrollable in a keyboard-focusable labelled region. Long headings and guest names wrap without widening the page.
- Vite ignores browser results and local emulator/tool binaries to avoid Windows file-watcher locks.

## Verification

| Check | Result |
| --- | --- |
| Production TypeScript/Vite build | Passed |
| ESLint | Passed |
| Unit tests | 29 passed |
| Firestore/Storage security regressions | 14 passed |
| Responsive workflows | 6 passed: two per Chromium, Firefox, and WebKit |
| Original end-to-end workflows | 5 passed in Chromium |
| Registration checks after final label refinement | 3 passed: Chromium, Firefox, WebKit |

Each responsive workflow covers 320x800, 390x844, 768x1024, 1024x768, 1440x900, 1920x1080, and 844x390 landscape. The final registration checks repeat this matrix after the accessible password-label refinement.

Coverage includes login/registration, inline errors, independent visibility controls, Google registration and session persistence, email registration and workspace creation, empty invitation/guest/analytics screens, populated dashboard, invitation list, template library, guest management, settings, analytics, all four invitation steps, editor text editing/resizing through property controls and PNG download, guest dialogs, mobile navigation/focus, generated shared URLs, public invitations and persistent Accept/Decline responses visible to the host. Checks assert no page-wide horizontal overflow, proportional usable canvas widths, reachable dialogs, and 44px primary authentication/RSVP targets.

The original workflows separately cover personalized links, link revocation, isolation between accounts, profile/workspace updates, artwork upload, guest editing/deletion, and Grand Opening template export/mobile RSVP.

Representative desktop/mobile screenshots from the original workflows are in ignored `test-results/`. Final registration screenshots for each browser are retained under `test-results/registration-final/`. Test logs are in ignored `.tools/responsive-all.log`, `.tools/regression-tests.log`, `.tools/auth-final.log`, and `.tools/security-final.log`.

## Run again

Install Java 21+ for Firebase emulators, install dependencies, and run:

```sh
npx playwright install chromium firefox webkit
npm run test:responsive
```

`npm run test:e2e` runs the broader suite. Set `INVITEFLOW_TEST_PORT` to an unused port when the normal development server is running. The test server supplies demo-only Firebase configuration. Local browser binaries and portable Java used for this review are ignored under `.tools/`.

## Limits and rollout

WebKit is an automated compatibility engine, not a physical iPhone Safari session. Physical iOS/Android testing, on-screen keyboard behavior, live Google OAuth consent, production authorized-domain/App Check settings, actual WhatsApp app handoff, and Vercel deployment remain separate production checks. No claim is made for browsers older than the installed Playwright engines. Invitation artwork retains its editable fixed design boxes; unusually long poster text may require adjusting its font or box size in the editor.

Push the changes and redeploy on Vercel to publish. Firebase project IDs, saved invitation URLs, existing RSVP session keys, and security rules were preserved. Generated image provenance and full prompts are in `public/images/ASSETS.md`; the signup asset is `public/images/evently-signup-botanical-v1.png`.
