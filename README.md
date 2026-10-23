# InviteFlow

A React + Firebase invitation workspace. Create an event, edit a card, add guests, share personal links through WhatsApp, and receive live RSVPs. No separate application server, Cloud Functions, Admin SDK, or localStorage database.

## Start

Requires Node.js 22+ and npm. In Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

```sh
npm install
# Fill .env using .env.example
npm run dev
```

Open http://localhost:5173. Missing Firebase settings show an explicit setup screen. There is no simulated dashboard or seeded guest data. `.env` is ignored and initially contains empty Firebase settings. Vite's Firebase web configuration is publicly visible client configuration. Never add service-account credentials or private server keys.

## Connect Firebase

1. Create a Firebase project; register a web app.
2. Enable Authentication → Email/Password and Google (choose the support email when enabling Google). Add local and production domains to Authorized domains, including `localhost` for development. Configure email templates and the password policy. Both login and registration offer **Continue with Google** using Firebase's popup flow; new Google users receive a private workspace and existing users keep their workspace. No Google client secret belongs in `.env`.
3. Create Cloud Firestore in production mode in your chosen region.
4. Create the Storage bucket and verify current billing requirements in Firebase console.
5. Copy the web application's configuration into `.env`:

```env
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-exact-bucket-name
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_APP_NAME=InviteFlow
VITE_APP_URL=http://localhost:5173
VITE_FIREBASE_APPCHECK_SITE_KEY=
VITE_USE_EMULATORS=false
```

6. Optionally register reCAPTCHA v3 with App Check, add its site key, inspect metrics, then enable Firestore/Storage enforcement. Register the correct domains. App Check does not verify guest identity or provide a full application rate limiter.
7. Deploy the supplied rules before storing real guest data:

```sh
npx firebase login
npx firebase use --add
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

Registration creates `users/{uid}` and `tenants/{uid}`. Private collection helpers derive the tenant exclusively from Auth. If registration loses connectivity after Auth succeeds, login retries workspace provisioning. Settings saves also retry provisioning.

## Workflow

### Share one link with everyone

Publish the event, then choose **Copy public link** in Preview & share or the event's guest management page. Anyone with this `/i/{shareId}` link can enter a name and Accept or Decline, without an account or a pre-added guest. Opening a published event's full preview also opens this reusable public link. Draft previews have disabled RSVP controls until published; published previews save real responses.

Each visitor receives an opaque response token stored in sessionStorage; the response itself lives in Firestore. Reloads in the same browser tab retain the response so it can be changed. **Respond for another person** starts a separate response. Different browsers/tabs or cleared browser storage may create additional records; names are not identity verification or a deduplication key. The host sees public responses in the guest list and live statistics. Public visitors cannot list other responses. Personal guest links continue to use their single current response. Archiving/deleting the source event blocks responses on either link type.

After this update, deploy the updated `firestore.rules` before using public event links. The public document has `mode: "open"`, and its `response/{randomResponseId}` subcollection contains one named response per browser token. The parent and response IDs are separate bearer capabilities; only the owner can list the response collection.

### Login says “Missing or insufficient permissions”

Email/password authentication and Firestore access are separate. An account created in Firebase Authentication still needs permission to create/read its workspace. Local `firestore.rules` does not affect your live project until published.

Run these commands from this repository, replacing `YOUR_PROJECT_ID` with `VITE_FIREBASE_PROJECT_ID` from `.env`:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

On Windows with PowerShell script restrictions, use `npx.cmd`. Alternatively, open Firebase console → your project → Firestore Database → Rules, paste the complete repository `firestore.rules`, and click Publish. Then sign in again. These rules preserve tenant isolation; do not replace them with public read/write access.

`VITE_FIREBASE_APPCHECK_SITE_KEY` is optional only when App Check enforcement is not enabled. If enforcement is enabled for Firestore, configure the registered reCAPTCHA v3 site key and development domain, then restart Vite. See [Firebase's rules deployment guide](https://firebase.google.com/docs/rules/manage-deploy) and [App Check enforcement](https://firebase.google.com/docs/app-check/enable-enforcement).

- Choose **Create invitation**, then one of nine editable designs. The template library also supports private PNG/JPG/WEBP uploads.
- The second design, **Grand Opening · Hardware**, is inspired by the supplied blue/gold construction flyer. Choose it, then use the existing Event details form: Event title supplies the business/store name, Hosted by supplies the company/organizer, and message/date/time/venue/address remain live text. The visual editor supports further customization, image/logo uploads, and PNG export. Public links use the compact matching design and offer an expandable full artwork view. Its generated background and exact prompt are documented in `public/templates/ASSETS.md`.
- The refreshed starters include original botanical, celestial, romantic, geometric, graduation, and baby-shower vector artwork, with linked host, date/time, venue/address, and guest text. The full preview and public link use one continuous invitation card containing the design, message, event details, Maps link, name field, and Accept/Decline controls. Controls inherit the card's palette; dark designs have matching light text. To apply refreshed artwork to an existing event, choose a template in the first editor step, save, then Republish to update existing guest snapshots. Existing custom artwork is retained until you choose a replacement.
- Public invitations now use a compact themed header rather than repeating the full canvas poster above the event details. Date and time share a row where space allows, and RSVP choices appear side by side with touch targets of at least 44 pixels. Optional notes and uploaded artwork expand on demand. The full editable design and PNG export remain available in the editor.
- Enter event details, timezone, venue, Maps link or coordinates, contact number, and guest notes.
- Customize the canvas: select, edit, drag, resize, rotate, align, reorder, or remove elements. Add text, rectangles, images, and backgrounds. Undo/redo keeps up to 50 editing states. PNG export produces a 960 × 1440 image.
- Save once to create a resumable draft. Further edits autosave after 1.2 seconds. The save indicator reports failures. **Republish** updates existing guest snapshots after a published event is edited.
- Publish when title, host, date, time, and venue are ready. Publishing never sends messages automatically.
- Open **Add guests & share**. Add international WhatsApp numbers and allow 1–20 attendees. Import CSV columns in this order: `name,phone,email,allowed attendees`. Quoted fields are supported, up to 500 rows per import. Imports are sequential, not atomic; failures report the number already saved. Exports contain current RSVPs and guard formula prefixes.
- Copy a personal link or open WhatsApp, then manually send the prefilled message. “Sharing initiated” means the app opened WhatsApp, not that the message was sent or delivered.
- Guests use `/i/{shareId}` without login, enter their name, and choose Accept or Decline. They can change their response. The submitted name is saved with the RSVP and displayed in the owner's guest list. There is no attendee-count input; an acceptance represents one attendee. Existing historical Maybe responses remain readable. The owner's dashboard and table subscribe directly to current responses. Repeated clicks replace a response rather than incrementing a public counter.
- Revoke a link to disable it; copy/share again to generate a new token. Guest removal revokes the link. Archiving or deleting an event blocks guest access even if a stale snapshot says active.
- Settings supports display name, workspace name, verified email change, password change with reauthentication, and logout.

Linked text variables: `{{eventTitle}}`, `{{hostName}}`, `{{eventDate}}`, `{{eventTime}}`, `{{venueName}}`, `{{venueAddress}}`, `{{guestName}}`. Retain a variable in canvas text to keep its link to event details. Exported PNGs are static; Maps and RSVP controls appear on the guest webpage.

## Security and practical limits

Private documents are owner-only. Public invitations are separate rendering snapshots without guest phone numbers, emails, or guest lists. Public collection listing is denied, including to authenticated users. Access uses a direct document read with a random 192-bit token. Public records include owner/event/guest identifiers as routing metadata; those identifiers do not authorize private access.

An active invitation link is a **bearer capability**. Anyone with it can view the invitation. Personal guest links allow reading/changing their single current RSVP; open event links use separate random response IDs, and each response ID authorizes reading/changing that response. Public RSVP writes intentionally require no login. Rules enforce exact fields, status, attendee values, document ID, server timestamp, link status, and source event status. Guests cannot modify snapshots, list responses, or access private records. Forwarded links do not verify the intended WhatsApp recipient. Strict recipient identity verification and strong application rate limiting require a trusted verification service.

Page-open tracking is omitted. The app does not claim exact human views or mistake automated previews for guest opens. RSVP tracking works independently.

Storage requires owner authentication, image MIME types, and uploads below 5 MB. Listing is denied. Owners obtain Firebase tokenized download URLs; only URLs used in published designs are disclosed to guests. These are bearer image links and remain usable by anyone already holding them, independently of Firestore link revocation. Private template metadata is protected, but a leaked download token is not confidential. For sensitive artwork, rotate/revoke its download token in Firebase Storage or delete the object. MIME checks do not inspect bytes. Configure bucket CORS for deployed origins if your policy prevents canvas export.

Revoked snapshots and responses are retained so an old capability cannot be reused. Deleting an event revokes links, removes private guests, then removes the event. Uploaded images are retained because another design may reuse them; manage unused artwork and retained responses with a documented retention policy in Firebase console. There is no cleanup worker.

Analytics derive from live documents: one event listener, one guest-list listener per event, and one response listener per active share, all cleaned up on unmount. This is a small-workspace MVP strategy. For large workspaces, scope subscriptions to the active event, paginate private guest lists, and use read-time aggregates for private fields. Secure RSVP aggregates would require owner-side reconciliation or authorized trusted aggregation; never allow public counter updates.

## Tests

```sh
npm run lint
npm test
npm run build
```

Security and browser tests use real Firebase emulators with a `demo-` project, never production data. Install Java 21+ and make ports 8080, 9099, 9199, and 4400 available.

```sh
npm run test:rules
npx playwright install chromium
npm run test:e2e
```

The rules suite checks tenant CRUD/isolation, guest edits, ownership immutability, denied public listing/private writes, response changes, invalid statuses/counts/fields/timestamps, revoked/archived links, and Storage permissions/type/size limits. Browser coverage exercises protected routes, registration, design editing/history/export/reload, publication, guests, a mobile guest page, RSVP changes, live dashboard counts, revocation, and logout. Test artifacts go to ignored `test-results/`.

For manual emulator development, put this in `.env.local`, then run the two commands in separate terminals:

```env
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-inviteflow.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-inviteflow
VITE_FIREBASE_STORAGE_BUCKET=demo-inviteflow.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123
VITE_FIREBASE_APP_ID=demo-app
VITE_USE_EMULATORS=true
VITE_APP_URL=http://localhost:5173
```

```sh
npx firebase emulators:start --project demo-inviteflow
npm run dev
```

Emulator data resets on shutdown unless Firebase export/import is configured. Browser tests start their own Vite server on port 5173; stop any existing server first. In restricted Windows environments, use `FIREBASE_EMULATORS_PATH`, `XDG_CONFIG_HOME`, and `PLAYWRIGHT_BROWSERS_PATH` to put tooling downloads/configuration inside the workspace. Java and browser binaries are development tooling only.

## Deploy to Firebase Hosting

Set `VITE_APP_URL` to the final HTTPS domain, supply production Firebase configuration, and set `VITE_USE_EMULATORS=false`. Remove/override emulator `.env.local` before building; Vite substitutes variables at build time.

```sh
npm run lint
npm test
npm run test:rules
npm run build
npx firebase deploy
```

`firebase.json` deploys rules/indexes, Storage rules, and `dist/` with SPA rewrites so direct `/i/:shareId` links work. Set a Firebase project alias before deploying. Real email delivery, physical-device WhatsApp handoff, domain authorization, App Check enforcement, and production Storage/CORS require verification in your Firebase project. No production project was supplied, so this repository has no production deployment.

## Source

`src/pages` contains routes; `src/components` owns layout, card rendering, editor, and UI primitives; `src/services` owns Firebase operations; `src/firebase` contains initialization and tenant helpers; `src/hooks` owns subscriptions and Zustand history. The stack includes React Router, Tailwind, Radix/shadcn-style primitives, Lucide, React Hook Form/Zod, React Konva, Zustand, Recharts, Sonner, date-fns, and libphonenumber-js.

Eight starter designs use original typography/vector artwork. The Grand Opening design adds a generated raster background inspired by the user's reference; its provenance and exact prompt are in `public/templates/ASSETS.md`. References: [Firebase field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields), [React Konva Transformer](https://konvajs.org/docs/react/Transformer.html).
