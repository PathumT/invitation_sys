# Evently upgrade verification ? 2026-10-25

## Final results

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript/Vite production build | Passed; Firebase chunk size warning remains |
| Unit tests | 66 passed across 13 files |
| Firestore/Storage emulator tests | 25 passed |
| Full browser matrix | 29 passed: Chromium 15, Firefox 7, WebKit 7 |
| Final custom binding/editor/public workflow checks | 4 passed after the final rendering fix |
| Final branding/print checks | 3 passed; Chromium printable PDF and three browser print screenshots saved |
| Production dependency audit | 0 vulnerabilities |
| Offline migration/rollback | Dry run, new output/original backup and byte-for-byte rollback passed |

The browser matrix covers registration validation/password visibility/Google emulator login, persistent accounts/workspaces, dashboard search and sharing, template filtering/favorites/cloning, canvas exports/checkpoints/fonts, animated opening/countdown/deadlines, schema-validated and locked RSVP, website ordering/photos/FAQ/video deferral, private guest profiles/bulk tags, QR PNG/PDF, authenticated check-in/duplicates/manual owner override, reminders, analytics export, workspace branding, inactive paid/team states and lazy module recovery.

Responsive review covers 320, 390, 768, 1024, 1440 and 1920px plus 844x390 landscape. It includes dashboard, invitations, templates, guests, analytics, settings, check-in, reminder center, plans, editor, dialogs, sharing and public RSVP. A populated long-name reminder queue is tested in all three engines.

## Representative artifacts

- test-results/upgrade-release-check/ ? final matrix screenshots and per-browser layout captures.
- test-results/upgrade-binding-verified/ ? final dynamic text/editor/public workflow checks.
- test-results/upgrade-print-verified/ ? analytics-print.png in each browser result and Chromium analytics-print.pdf.
- test-results/upgrade-custom-rsvp-mobile.png
- test-results/upgrade-event-website-mobile.png
- test-results/upgrade-check-in-mobile.png

Tool logs and local migration smoke-test files are under .tools and are ignored by Git. Tests use the demo-inviteflow Firebase Auth/Firestore/Storage emulators and a separate Vite server on 5175. The user's existing 5173 server was not stopped or replaced. Temporary test services were stopped after verification.

## Practical limits

Physical-device camera scanning and native OS file sharing, live production Google/App Check, deployed Core Web Vitals and large-tenant read costs are not certified by these emulator/browser tests. The stock audio catalog, secure backend activation and operator launch requirements are described in SERVER_DEPENDENCIES.md. English remains the only active interface locale; other files are draft resources awaiting translation and review.

No production rules, deployment, .env changes, production migration or production data changes were performed. Review and publish the supplied rules together with the app when the operator chooses to deploy. Restart Vite after dependency installation/upgrades.


## Continued localization verification

- Unit tests: 77 passed across 15 files, including formatting, interpolation safety, review gating, extraction idempotence, and preflight failure safety.
- Security rules: 25 passed against demo emulators; localization did not change rules.
- Lint and production build passed. Existing build chunk-size warnings remain.
- Full browser regression: 30 passed; two new locale cases failed on an incorrect Playwright native-option assertion. After correcting the assertion to inspect the disabled DOM property and allowing workspace provisioning to finish, the focused locale suite passed in Chromium, Firefox, and WebKit (3 passed). This verifies all 32 distinct workflow/browser combinations across the full and corrected focused runs; it is not a single clean 32-case run.
- Locale cases verify registration form state survives resource updates, extracted route labels update reactively, and unreviewed languages remain disabled.
- `npm run i18n:check`: zero remaining supported static extractions, 853 keys. Four draft languages retain 815 pending placeholders each.

Logs: `.tools/localization-regression.log`, `.tools/localization-final-check.log`, `.tools/localization-rules.log`, and `.tools/localization-build.log`. Earlier representative layout screenshots remain under the paths listed above. No production Firebase, Google sign-in, physical-device sharing, or native translated layout certification is implied.
